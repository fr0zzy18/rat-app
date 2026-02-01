namespace RatApp.Application.Dtos
{
    public class AddPlayerRequestDto
    {
        public required string Region { get; set; }
        public required string Realm { get; set; }
        public required string Name { get; set; }
    }
}
