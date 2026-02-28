using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;

namespace RatApp.Infrastructure.Persistence
{
    public class SuggestionRepository : ISuggestionRepository
    {
        private readonly AppDbContext _context;

        public SuggestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Suggestion> AddSuggestionAsync(Suggestion suggestion)
        {
            _context.Suggestions.Add(suggestion);
            await _context.SaveChangesAsync();
            return suggestion;
        }

        public async Task<Suggestion?> GetSuggestionByIdAsync(int id)
        {
            return await _context.Suggestions
                                 .Include(s => s.SuggestedByUser)
                                 .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<Suggestion>> GetAllSuggestionsAsync()
        {
            return await _context.Suggestions
                                 .Include(s => s.SuggestedByUser)
                                 .OrderByDescending(s => s.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<Suggestion>> GetSuggestionsByStatusAsync(SuggestionStatus status)
        {
            return await _context.Suggestions
                                 .Include(s => s.SuggestedByUser)
                                 .Where(s => s.Status == status)
                                 .OrderByDescending(s => s.CreatedAt)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<Suggestion>> GetUserSuggestionsAsync(int userId)
        {
            return await _context.Suggestions
                                 .Include(s => s.SuggestedByUser)
                                 .Where(s => s.SuggestedByUserId == userId)
                                 .OrderByDescending(s => s.CreatedAt)
                                 .ToListAsync();
        }

        public async Task UpdateSuggestionAsync(Suggestion suggestion)
        {
            _context.Entry(suggestion).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteSuggestionAsync(int id)
        {
            var suggestion = await _context.Suggestions.FindAsync(id);
            if (suggestion != null)
            {
                _context.Suggestions.Remove(suggestion);
                await _context.SaveChangesAsync();
            }
        }
    }
}
