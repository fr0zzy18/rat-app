namespace RatApp.Core.Entities
{
    public class UserRole
    {
        public int UserId { get; set; }
        public User? User { get; set; } // Made nullable
        public int RoleId { get; set; }
        public Role? Role { get; set; } // Made nullable
    }
}
