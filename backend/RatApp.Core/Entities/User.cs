using System.Collections.Generic;

namespace RatApp.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string? Username { get; set; } // Made nullable
        public string? PasswordHash { get; set; } // Made nullable
        public bool IsActive { get; set; } = true;
        public ICollection<UserRole>? UserRoles { get; set; } = new List<UserRole>(); // Made nullable and initialized
    }
}
