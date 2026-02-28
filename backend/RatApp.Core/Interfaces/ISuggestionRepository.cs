using System.Collections.Generic;
using System.Threading.Tasks;
using RatApp.Core.Entities;

namespace RatApp.Core.Interfaces
{
    public interface ISuggestionRepository
    {
        Task<Suggestion> AddSuggestionAsync(Suggestion suggestion);
        Task<Suggestion?> GetSuggestionByIdAsync(int id);
        Task<IEnumerable<Suggestion>> GetAllSuggestionsAsync();
        Task<IEnumerable<Suggestion>> GetSuggestionsByStatusAsync(SuggestionStatus status);
        Task<IEnumerable<Suggestion>> GetUserSuggestionsAsync(int userId);
        Task UpdateSuggestionAsync(Suggestion suggestion);
        Task DeleteSuggestionAsync(int id);
    }
}
