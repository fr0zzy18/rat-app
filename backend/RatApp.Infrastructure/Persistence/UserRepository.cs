using Microsoft.EntityFrameworkCore;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using System.Threading.Tasks;

namespace RatApp.Infrastructure.Persistence
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }
    }
}
