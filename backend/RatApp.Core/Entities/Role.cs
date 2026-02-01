using System.Collections.Generic;

namespace RatApp.Core.Entities
{
    public class Role
    {
        public int Id { get; set; }
        public string? Name { get; set; } // Made nullable
        public ICollection<UserRole>? UserRoles { get; set; } = new List<UserRole>(); // Made nullable and initialized
    }
}
