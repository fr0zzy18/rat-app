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
using System.Text.Json; // For JsonSerializerOptions
using System.Text.Json.Serialization; // Required for JsonPropertyName
using RatApp.Application.Models; // Add this line

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
                response.EnsureSuccessStatusCode(); // Throws an exception if the HTTP response status is an error code

                var raiderIoPlayer = await response.Content.ReadFromJsonAsync<RaiderIoPlayerResponse>();

                if (raiderIoPlayer == null) return null;

                // Extract 'all' score from mythic_plus_scores_by_season:current
                var mythicPlusScoreAll = raiderIoPlayer.MythicPlusScoresBySeason?
                                                        .FirstOrDefault(s => s.season == "season-tww-3") // Assuming "current" resolves to a specific season
                                                        ?.scores?.all ?? 0;

                // Extract ItemLevelEquipped from gear
                var itemLevelEquipped = raiderIoPlayer.gear?.ItemLevelEquipped ?? 0.0;

                return new PlayerDto
                {
                    Id = 0, // Placeholder, will be set after DB operation if adding new player
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
                    ItemLevelEquipped = itemLevelEquipped // Include ItemLevelEquipped
                };
            }
            catch (HttpRequestException ex)
            {
                // Log the exception
                Console.WriteLine($"Error fetching player from Raider.IO: {ex.Message}");
                return null;
            }
        }

        public async Task<PlayerDto?> AddPlayerAsync(AddPlayerRequestDto dto)
        {
            // First, fetch details from Raider.IO to validate and get full data
            var raiderIoDetails = await GetPlayerDetailsFromRaiderIO(dto.Region, dto.Realm, dto.Name);
            if (raiderIoDetails == null)
            {
                return null; // Player not found or error fetching from Raider.IO
            }

            // Check if player already exists in our DB
            var existingPlayer = await _context.Players.FirstOrDefaultAsync(p =>
                p.Name == dto.Name && p.Realm == dto.Realm && p.Region == dto.Region);

            if (existingPlayer != null)
            {
                // If player exists, update its details
                existingPlayer.Race = raiderIoDetails.Race;
                existingPlayer.Class = raiderIoDetails.Class;
                existingPlayer.ActiveSpecName = raiderIoDetails.ActiveSpecName;
                existingPlayer.ActiveSpecRole = raiderIoDetails.ActiveSpecRole;
                existingPlayer.Faction = raiderIoDetails.Faction;
                existingPlayer.ThumbnailUrl = raiderIoDetails.ThumbnailUrl;
                existingPlayer.LastUpdated = DateTime.UtcNow; // Update timestamp
                existingPlayer.ProfileUrl = raiderIoDetails.ProfileUrl; // Update ProfileUrl
                existingPlayer.GuildName = raiderIoDetails.GuildName; // Update GuildName
                existingPlayer.MythicPlusScore = raiderIoDetails.MythicPlusScore; // Update MythicPlusScore
                existingPlayer.Category = dto.Category; // Update Category
                existingPlayer.StreamLink = dto.StreamLink; // Update StreamLink
                existingPlayer.ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped; // Update ItemLevelEquipped
                
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
                LastUpdated = DateTime.UtcNow, // Set timestamp for new player
                ProfileUrl = raiderIoDetails.ProfileUrl,
                GuildName = raiderIoDetails.GuildName,
                MythicPlusScore = raiderIoDetails.MythicPlusScore, // Set MythicPlusScore
                Category = dto.Category, // Set Category
                StreamLink = dto.StreamLink, // Set StreamLink
                ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped // Set ItemLevelEquipped
            };

            _context.Players.Add(playerEntity);
            await _context.SaveChangesAsync();

            // Return the combined DTO with the newly assigned Id from our DB
            raiderIoDetails.Id = playerEntity.Id;
            return raiderIoDetails;
        }

        public async Task<IEnumerable<PlayerDto>> GetAllPlayersAsync(string? category = null) // Optional category parameter
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
                // Check if player data needs to be refreshed
                if ((DateTime.UtcNow - storedPlayer.LastUpdated).TotalHours > 1)
                {
                    Console.WriteLine($"Refreshing data for player: {storedPlayer.Name}");
                    var raiderIoDetails = await GetPlayerDetailsFromRaiderIO(storedPlayer.Region, storedPlayer.Realm, storedPlayer.Name);
                    if (raiderIoDetails != null)
                    {
                        // Update stored player entity with new data
                        storedPlayer.Race = raiderIoDetails.Race ?? storedPlayer.Race; // Coalesce to existing if null
                        storedPlayer.Class = raiderIoDetails.Class ?? storedPlayer.Class; // Coalesce to existing if null
                        storedPlayer.ActiveSpecName = raiderIoDetails.ActiveSpecName ?? string.Empty; // Ensure not null
                        storedPlayer.ActiveSpecRole = raiderIoDetails.ActiveSpecRole ?? string.Empty; // Ensure not null
                        storedPlayer.Faction = raiderIoDetails.Faction ?? storedPlayer.Faction; // Coalesce to existing if null
                        storedPlayer.ThumbnailUrl = raiderIoDetails.ThumbnailUrl ?? string.Empty; // Ensure not null
                        storedPlayer.LastUpdated = DateTime.UtcNow; // Update timestamp
                        storedPlayer.ProfileUrl = raiderIoDetails.ProfileUrl ?? string.Empty; // Ensure not null
                        storedPlayer.GuildName = raiderIoDetails.GuildName ?? string.Empty; // Ensure not null
                        storedPlayer.MythicPlusScore = raiderIoDetails.MythicPlusScore; // Update MythicPlusScore
                        storedPlayer.ItemLevelEquipped = raiderIoDetails.ItemLevelEquipped; // Update ItemLevelEquipped
                        // Category is not refreshed from Raider.IO, it's set during import
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
                    Category = storedPlayer.Category, // Include Category
                    StreamLink = storedPlayer.StreamLink, // Include StreamLink
                    ItemLevelEquipped = storedPlayer.ItemLevelEquipped // Include ItemLevelEquipped
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

        // New method to check if a category has any associated players
        public async Task<bool> DoesCategoryHavePlayersAsync(string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return false; // An empty or whitespace category name doesn't "have players" in a meaningful way for deletion check
            }
            return await _context.Players.AnyAsync(p => p.Category == categoryName);
        }
    }
}