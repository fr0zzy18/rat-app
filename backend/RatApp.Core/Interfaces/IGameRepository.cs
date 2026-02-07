using RatApp.Core.Entities;
using System;
using System.Threading.Tasks;

namespace RatApp.Core.Interfaces
{
    public interface IGameRepository
    {
        Task CreateGameAsync(Game game);
        Task<Game?> GetGameByIdAsync(Guid id);
        Task UpdateGameAsync(Game game);
        Task<Game?> GetGameByParticipantIdAsync(int userId); // New method
    }
}
