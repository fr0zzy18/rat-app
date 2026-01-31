using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Token { get; set; }
        public ICollection<string> Roles { get; set; }
    }
}
