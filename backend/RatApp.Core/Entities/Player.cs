namespace RatApp.Core.Entities
{
    public class Player
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Region { get; set; }
        public required string Realm { get; set; }
        public string Race { get; set; } = string.Empty;
        public string Class { get; set; } = string.Empty;
        public string ActiveSpecName { get; set; } = string.Empty;
        public string ActiveSpecRole { get; set; } = string.Empty;
        public string Faction { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public string ProfileUrl { get; set; } = string.Empty;
        public string GuildName { get; set; } = string.Empty;
        public double MythicPlusScore { get; set; } = 0.0;
        public string Category { get; set; } = string.Empty;
        public string? StreamLink { get; set; }
    }
}
