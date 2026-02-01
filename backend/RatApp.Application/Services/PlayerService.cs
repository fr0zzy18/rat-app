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
                var response = await _httpClient.GetAsync($"{RaiderIoApiBaseUrl}?region={region}&realm={realm}&name={name}");
                response.EnsureSuccessStatusCode(); // Throws an exception if the HTTP response status is an error code

                var raiderIoPlayer = await response.Content.ReadFromJsonAsync<RaiderIoPlayerResponse>();

                if (raiderIoPlayer == null) return null;

                return new PlayerDto
                {
                    Name = raiderIoPlayer.name,
                    Race = raiderIoPlayer.race,
                    Class = raiderIoPlayer.Class, // Changed from raiderIoPlayer.player_class
                    ActiveSpecName = raiderIoPlayer.active_spec_name,
                    ActiveSpecRole = raiderIoPlayer.active_spec_role,
                    Faction = raiderIoPlayer.faction,
                    Region = raiderIoPlayer.region,
                    Realm = raiderIoPlayer.realm,
                    ThumbnailUrl = raiderIoPlayer.thumbnail_url
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
                ThumbnailUrl = raiderIoDetails.ThumbnailUrl
            };

            _context.Players.Add(playerEntity);
            await _context.SaveChangesAsync();

            // Return the combined DTO with the newly assigned Id from our DB
            raiderIoDetails.Id = playerEntity.Id;
            return raiderIoDetails;
        }

        public async Task<IEnumerable<PlayerDto>> GetAllPlayersAsync()
        {
            var storedPlayers = await _context.Players.ToListAsync();
            var playerDtos = new List<PlayerDto>();

            foreach (var storedPlayer in storedPlayers)
            {
                // Now retrieve details from the stored player entity instead of re-fetching from Raider.IO
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
                    ThumbnailUrl = storedPlayer.ThumbnailUrl
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
    }

    // Helper class to map Raider.IO API response
    public class RaiderIoPlayerResponse
    {
        public string name { get; set; } = string.Empty;
        public string race { get; set; } = string.Empty;
        [JsonPropertyName("class")] // Corrected JsonProperty Name
        public string Class { get; set; } = string.Empty; // Corrected property name
        public string active_spec_name { get; set; } = string.Empty;
        public string active_spec_role { get; set; } = string.Empty;
        public string gender { get; set; } = string.Empty;
        public string faction { get; set; } = string.Empty;
        public string region { get; set; } = string.Empty;
        public string realm { get; set; } = string.Empty;
        public string thumbnail_url { get; set; } = string.Empty;
        public int achievement_points { get; set; }
        public string last_crawled_at { get; set; } = string.Empty;
        public string profile_url { get; set; } = string.Empty;
        public string profile_banner { get; set; } = string.Empty;
    }
}
