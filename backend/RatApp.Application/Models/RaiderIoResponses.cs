using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RatApp.Application.Models
{
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
        public GuildInfo? guild { get; set; } // New property for guild information
        
        [JsonPropertyName("mythic_plus_scores_by_season")]
        public List<MythicPlusScoresBySeasonEntry>? MythicPlusScoresBySeason { get; set; }

        public GearInfo? gear { get; set; } // New property for gear information
    }

    public class GearInfo
    {
        [JsonPropertyName("item_level_equipped")]
        public double ItemLevelEquipped { get; set; }
    }

    public class GuildInfo
    {
        public string name { get; set; } = string.Empty;
        public string realm { get; set; } = string.Empty;
    }

    public class MythicPlusScoresBySeasonEntry
    {
        [JsonPropertyName("season")]
        public string season { get; set; } = string.Empty;
        [JsonPropertyName("scores")]
        public MythicPlusScores? scores { get; set; }
        // Segments are not needed as per requirement, so not adding
    }

    public class MythicPlusScores
    {
        [JsonPropertyName("all")]
        public double all { get; set; }
        // Other scores (dps, healer, tank, spec_0 etc.) are not needed, so not adding
    }
}
