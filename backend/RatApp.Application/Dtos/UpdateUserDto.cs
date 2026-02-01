namespace RatApp.Application.Dtos
{
    public class UpdateUserDto
    {
        public int UserId { get; set; }
        public required string Username { get; set; }
    }
}
