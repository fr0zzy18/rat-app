using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Infrastructure.Persistence;
using System.Text.Json;
using System.Text.Json.Serialization;
using RatApp.Application.Models;

namespace RatApp.Application.Services
{
    public class PlayerService
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IServiceScopeFactory _scopeFactory;
        private const string RaiderIoApiBaseUrl = "https://raider.io/api/v1/characters/profile";

        public PlayerService(AppDbContext context, HttpClient httpClient, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _httpClient = httpClient;
            _scopeFactory = scopeFactory;
        }

        private async Task<PlayerDto?> GetPlayerDetailsFromRaiderIO(string region, string realm, string name, HttpClient? client = null)
        {
            try
            {
                var httpClient = client ?? _httpClient;
                var response = await httpClient.GetAsync($"{RaiderIoApiBaseUrl}?region={region}&realm={realm}&name={name}&fields=guild,mythic_plus_scores_by_season:current,gear");
                response.EnsureSuccessStatusCode();

                var raiderIoPlayer = await response.Content.ReadFromJsonAsync<RaiderIoPlayerResponse>();

                if (raiderIoPlayer == null) return null;
                var mythicPlusScoreAll = raiderIoPlayer.MythicPlusScoresBySeason?
                                                        .FirstOrDefault(s => s.season == "season-tww-3")
                                                        ?.scores?.all ?? 0;
                var itemLevelEquipped = raiderIoPlayer.gear?.ItemLevelEquipped ?? 0.0;

                return new PlayerDto
                {
                    Id = 0,
                    Name = raiderIoPlayer.name,
                    Race = raiderIoPlayer.race,
                    Class = raiderIoPlayer.Class, 
                    ActiveSpecName = raiderIoPlayer.active_spec_name,
                    ActiveSpecRole = raiderIoPlayer.active_spec_role,
                    Faction = raiderIoPlayer.faction,
                    Region = raiderIoPlayer.region,
                    Realm = raiderIoPlayer.realm,
                    ThumbnailUrl = raiderIoPlayer.thumbnail_url,
                    ProfileUrl = raiderIoPlayer.profile_url,
                    GuildName = raiderIoPlayer.guild?.name ?? string.Empty,
                    MythicPlusScore = mythicPlusScoreAll,
                    ItemLevelEquipped = itemLevelEquipped
                };
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Error fetching player from Raider.IO: {ex.Message}");
                return null;
            }
        }

        public async Task<PlayerDto?> AddPlayerAsync(AddPlayerRequestDto dto)
        {
            var raiderIoDetails = await GetPlayerDetailsFromRaiderIO(dto.Region, dto.Realm, dto.Name);
            if (raiderIoDetails == null)
            {
                return null;
            }
            var existingPlayer = await _context.Players.FirstOrDefaultAsync(p =>
                p.Name == dto.Name && p.Realm == dto.Realm && p.Region == dto.Region);

            if (existingPlayer != null)
            {
                existingPlayer.Race = raiderIoDetails.Race;
                existingPlayer.Class = raiderIoDetails.Class;
                existingPlayer.ActiveSpecName = raiderIoDetails.ActiveSpecName;
                existingPlayer.ActiveSpecRole = raiderIoDetails.ActiveSpecRole;
                existingPlayer.Faction = raiderIoDetails.Faction;
                existingPlayer.ThumbnailUrl = raiderIoDetails.ThumbnailUrl;
                existingPlayer.LastUpdated = DateTime.UtcNow;
                existingPlayer.ProfileUrl = raiderIoDetails.ProfileUrl;
                existingPlayer.GuildName = raiderIoDetails.GuildName;
                existingPlayer.MythicPlusScore = raiderIoDetails.MythicPlusScore;
                existingPlayer.Category = dto.Category;
                existingPlayer.StreamLink = dto.StreamLink;
                existingPlayer.ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped;
                
                await _context.SaveChangesAsync();
                raiderIoDetails.Id = existingPlayer.Id;
                return raiderIoDetails;
            }

            var playerEntity = new Player
            {
                Name = dto.Name,
                Region = dto.Region,
                Realm = dto.Realm,
                Race = raiderIoDetails.Race,
                Class = raiderIoDetails.Class,
                ActiveSpecName = raiderIoDetails.ActiveSpecName,
                ActiveSpecRole = raiderIoDetails.ActiveSpecRole,
                Faction = raiderIoDetails.Faction,
                ThumbnailUrl = raiderIoDetails.ThumbnailUrl,
                LastUpdated = DateTime.UtcNow,
                ProfileUrl = raiderIoDetails.ProfileUrl,
                GuildName = raiderIoDetails.GuildName,
                MythicPlusScore = raiderIoDetails.MythicPlusScore,
                Category = dto.Category,
                StreamLink = dto.StreamLink,
                ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped
            };

            _context.Players.Add(playerEntity);
            await _context.SaveChangesAsync();
            raiderIoDetails.Id = playerEntity.Id;
            return raiderIoDetails;
        }

        public async Task<IEnumerable<PlayerDto>> GetAllPlayersAsync(string? category = null)
        {
            IQueryable<Player> playersQuery = _context.Players;

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                playersQuery = playersQuery.Where(p => p.Category == category);
            }

            var storedPlayers = await playersQuery.ToListAsync();

            var playersToRefresh = storedPlayers
                .Where(p => (DateTime.UtcNow - p.LastUpdated).TotalHours > 1)
                .Select(p => p.Id)
                .ToList();

            if (playersToRefresh.Any())
            {
                StartBackgroundRefresh(playersToRefresh);
            }

            return storedPlayers.Select(storedPlayer => new PlayerDto
            {
                Id = storedPlayer.Id,
                Name = storedPlayer.Name,
                Race = storedPlayer.Race,
                Class = storedPlayer.Class,
                ActiveSpecName = storedPlayer.ActiveSpecName,
                ActiveSpecRole = storedPlayer.ActiveSpecRole,
                Faction = storedPlayer.Faction,
                Region = storedPlayer.Region,
                Realm = storedPlayer.Realm,
                ThumbnailUrl = storedPlayer.ThumbnailUrl,
                ProfileUrl = storedPlayer.ProfileUrl,
                GuildName = storedPlayer.GuildName,
                MythicPlusScore = storedPlayer.MythicPlusScore,
                Category = storedPlayer.Category,
                StreamLink = storedPlayer.StreamLink,
                ItemLevelEquipped = storedPlayer.ItemLevelEquipped
            }).ToList();
        }

        private void StartBackgroundRefresh(List<int> playerIds)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();

                        foreach (var id in playerIds)
                        {
                            var player = await context.Players.FindAsync(id);
                            if (player == null) continue;

                            if ((DateTime.UtcNow - player.LastUpdated).TotalHours <= 1) continue;

                            Console.WriteLine($"Background refreshing data for player: {player.Name}");
                            var raiderIoDetails = await GetPlayerDetailsFromRaiderIO(player.Region, player.Realm, player.Name, httpClient);
                            if (raiderIoDetails != null)
                            {
                                player.Race = raiderIoDetails.Race ?? player.Race;
                                player.Class = raiderIoDetails.Class ?? player.Class;
                                player.ActiveSpecName = raiderIoDetails.ActiveSpecName ?? string.Empty;
                                player.ActiveSpecRole = raiderIoDetails.ActiveSpecRole ?? string.Empty;
                                player.Faction = raiderIoDetails.Faction ?? player.Faction;
                                player.ThumbnailUrl = raiderIoDetails.ThumbnailUrl ?? string.Empty;
                                player.LastUpdated = DateTime.UtcNow;
                                player.ProfileUrl = raiderIoDetails.ProfileUrl ?? string.Empty;
                                player.GuildName = raiderIoDetails.GuildName ?? string.Empty;
                                player.MythicPlusScore = raiderIoDetails.MythicPlusScore;
                                player.ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped;
                                await context.SaveChangesAsync();
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in background refresh: {ex.Message}");
                }
            });
        }

        public async Task<bool> DeletePlayerAsync(int id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return false;
            }

            _context.Players.Remove(player);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PlayerDto?> UpdatePlayerCategoryAsync(int id, string category)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return null;
            }

            player.Category = category ?? string.Empty;
            await _context.SaveChangesAsync();

            return new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                Race = player.Race,
                Class = player.Class,
                ActiveSpecName = player.ActiveSpecName,
                ActiveSpecRole = player.ActiveSpecRole,
                Faction = player.Faction,
                Region = player.Region,
                Realm = player.Realm,
                ThumbnailUrl = player.ThumbnailUrl,
                ProfileUrl = player.ProfileUrl,
                GuildName = player.GuildName,
                MythicPlusScore = player.MythicPlusScore,
                Category = player.Category,
                StreamLink = player.StreamLink,
                ItemLevelEquipped = player.ItemLevelEquipped
            };
        }
        public async Task<bool> DoesCategoryHavePlayersAsync(string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return false;
            }
            return await _context.Players.AnyAsync(p => p.Category == categoryName);
        }
    }
}