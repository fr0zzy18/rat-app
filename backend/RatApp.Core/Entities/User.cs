using System.Collections.Generic;

namespace RatApp.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? PasswordHash { get; set; }
        public bool IsActive { get; set; } = true;
        public string? RefreshToken { get; set; }
        public DateTime RefreshTokenExpiry { get; set; }
        public ICollection<UserRole>? UserRoles { get; set; } = new List<UserRole>();
    }
}
