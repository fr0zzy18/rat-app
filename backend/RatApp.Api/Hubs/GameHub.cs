using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RatApp.Api.Hubs
{
    public class GameHub : Hub
    {
        // Clients can call this method to join a game group
        public async Task JoinGame(string gameId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.ConnectionId} has joined game {gameId}.");
        }

        // Clients can call this method to leave a game group
        public async Task LeaveGame(string gameId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.ConnectionId} has left game {gameId}.");
        }

        // Methods to send game updates (will be called from GameService)
        // For example:
        // public async Task SendGameUpdate(string gameId, object gameState)
        // {
        //     await Clients.Group(gameId).SendAsync("GameUpdated", gameState);
        // }
    }
}
