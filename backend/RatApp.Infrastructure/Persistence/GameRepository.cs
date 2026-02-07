using Microsoft.EntityFrameworkCore;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using System;
using System.Threading.Tasks;

namespace RatApp.Infrastructure.Persistence
{
    public class GameRepository : IGameRepository
    {
        private readonly AppDbContext _context;

        public GameRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateGameAsync(Game game)
        {
            await _context.Games.AddAsync(game);
            await _context.SaveChangesAsync();
        }

        public async Task<Game?> GetGameByIdAsync(Guid id)
        {
            return await _context.Games.FirstOrDefaultAsync(g => g.Id == id);
        }

        public async Task UpdateGameAsync(Game game)
        {
            _context.Games.Update(game);
            await _context.SaveChangesAsync();
        }

        public async Task<Game?> GetGameByParticipantIdAsync(int userId)
        {
            return await _context.Games
                .FirstOrDefaultAsync(g => g.CreatedByUserId == userId || g.Player2UserId == userId);
        }
    }
}
