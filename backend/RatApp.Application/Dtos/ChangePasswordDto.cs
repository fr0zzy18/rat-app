namespace RatApp.Application.Dtos
{
    public class ChangePasswordDto
    {
        public int UserId { get; set; }
        public required string NewPassword { get; set; }
    }
}
