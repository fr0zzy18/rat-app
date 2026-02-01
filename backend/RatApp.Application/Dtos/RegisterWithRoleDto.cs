namespace RatApp.Application.Dtos
{
    public class RegisterWithRoleDto : RegisterDto
    {
        public string? RoleName { get; set; } // Made nullable
    }
}
