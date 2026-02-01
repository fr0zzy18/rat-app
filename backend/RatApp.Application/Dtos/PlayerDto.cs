using System.Text.Json.Serialization;

namespace RatApp.Application.Dtos
{
    public class PlayerDto
    {
        public int Id { get; set; } // From our DB
        public required string Name { get; set; } // From Raider.IO
        public required string Race { get; set; } // From Raider.IO
        [JsonPropertyName("player_class")] // Map to player_class from Raider.IO
        public required string Class { get; set; } // From Raider.IO
        [JsonPropertyName("active_spec_name")] // Map to active_spec_name from Raider.IO
        public required string ActiveSpecName { get; set; } // From Raider.IO
        [JsonPropertyName("active_spec_role")] // Map to active_spec_role
        public required string ActiveSpecRole { get; set; } // From Raider.IO
        public required string Faction { get; set; } // From Raider.IO
        public required string Region { get; set; } // From Raider.IO (and our DB)
        public required string Realm { get; set; } // From Raider.IO (and our DB)
        [JsonPropertyName("thumbnail_url")] // Map to thumbnail_url from Raider.IO
        public required string ThumbnailUrl { get; set; } // From Raider.IO
    }
}
