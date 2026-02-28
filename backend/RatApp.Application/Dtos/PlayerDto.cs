using System.Text.Json.Serialization;

namespace RatApp.Application.Dtos
{
    public class PlayerDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Race { get; set; }
        [JsonPropertyName("class")]
        public required string Class { get; set; }
        [JsonPropertyName("active_spec_name")]
        public required string ActiveSpecName { get; set; }
        [JsonPropertyName("active_spec_role")]
        public required string ActiveSpecRole { get; set; }
        public required string Faction { get; set; }
        public required string Region { get; set; }
        public required string Realm { get; set; }
        [JsonPropertyName("thumbnail_url")]
        public required string ThumbnailUrl { get; set; }
        public string ProfileUrl { get; set; } = string.Empty;
        public string GuildName { get; set; } = string.Empty;
        public double MythicPlusScore { get; set; } = 0.0;
        public string Category { get; set; } = string.Empty;
        public string? StreamLink { get; set; }
        public double ItemLevelEquipped { get; set; } = 0.0;

    }
}
