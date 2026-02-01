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
    }
}
