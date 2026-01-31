namespace RatApp.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<UserRole> UserRoles { get; set; }
    }
}
