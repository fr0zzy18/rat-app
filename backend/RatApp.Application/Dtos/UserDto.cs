using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }
        public string? Username { get; set; } // Made nullable
        public string? Token { get; set; } // Made nullable
        public ICollection<string>? Roles { get; set; } // Made nullable
    }
}
