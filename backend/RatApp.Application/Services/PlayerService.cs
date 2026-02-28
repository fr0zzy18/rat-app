using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
        private const string RaiderIoApiBaseUrl = "https://raider.io/api/v1/characters/profile";

        public PlayerService(AppDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        private async Task<PlayerDto?> GetPlayerDetailsFromRaiderIO(string region, string realm, string name)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{RaiderIoApiBaseUrl}?region={region}&realm={realm}&name={name}&fields=guild,mythic_plus_scores_by_season:current,gear");
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
            var playerDtos = new List<PlayerDto>();

            foreach (var storedPlayer in storedPlayers)
            {
                if ((DateTime.UtcNow - storedPlayer.LastUpdated).TotalHours > 1)
                {
                    Console.WriteLine($"Refreshing data for player: {storedPlayer.Name}");
                    var raiderIoDetails = await GetPlayerDetailsFromRaiderIO(storedPlayer.Region, storedPlayer.Realm, storedPlayer.Name);
                    if (raiderIoDetails != null)
                    {
                        storedPlayer.Race = raiderIoDetails.Race ?? storedPlayer.Race;
                        storedPlayer.Class = raiderIoDetails.Class ?? storedPlayer.Class;
                        storedPlayer.ActiveSpecName = raiderIoDetails.ActiveSpecName ?? string.Empty;
                        storedPlayer.ActiveSpecRole = raiderIoDetails.ActiveSpecRole ?? string.Empty;
                        storedPlayer.Faction = raiderIoDetails.Faction ?? storedPlayer.Faction;
                        storedPlayer.ThumbnailUrl = raiderIoDetails.ThumbnailUrl ?? string.Empty;
                        storedPlayer.LastUpdated = DateTime.UtcNow;
                        storedPlayer.ProfileUrl = raiderIoDetails.ProfileUrl ?? string.Empty;
                        storedPlayer.GuildName = raiderIoDetails.GuildName ?? string.Empty;
                        storedPlayer.MythicPlusScore = raiderIoDetails.MythicPlusScore;
                        storedPlayer.ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped;
                        await _context.SaveChangesAsync();
                    }
                }

                playerDtos.Add(new PlayerDto
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
                });
            }
            return playerDtos;
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