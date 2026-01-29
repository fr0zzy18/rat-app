namespace RatApp.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } // "User" або "Admin"
        public bool IsActive { get; set; } = true;
    }
}