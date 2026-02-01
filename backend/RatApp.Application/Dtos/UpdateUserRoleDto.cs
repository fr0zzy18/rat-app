namespace RatApp.Application.Dtos
{
    public class UpdateUserRoleDto
    {
        public int UserId { get; set; }
        public required string RoleName { get; set; }
    }
}
