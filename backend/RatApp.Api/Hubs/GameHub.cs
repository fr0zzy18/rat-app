using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using RatApp.Application.Services; // Added
using RatApp.Core.Interfaces; // Added
using System.Security.Claims; // Added
using System; // Added
using System.Linq; // Added
using System.Collections.Concurrent; // Added

namespace RatApp.Api.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;
        private readonly IUserRepository _userRepository;

        // Static dictionary to store connected users (ConnectionId -> UserId)
        private static ConcurrentDictionary<string, int> ConnectedUsers = new ConcurrentDictionary<string, int>();
        // Static dictionary to store which game a connection is in (ConnectionId -> GameId)
        private static ConcurrentDictionary<string, string> ConnectedGameConnections = new ConcurrentDictionary<string, string>();

        public GameHub(GameService gameService, IUserRepository userRepository)
        {
            _gameService = gameService;
            _userRepository = userRepository;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            int userId;
            if (!string.IsNullOrEmpty(Context.UserIdentifier) && int.TryParse(Context.UserIdentifier, out userId))
            {
                ConnectedUsers.TryAdd(Context.ConnectionId, userId);
            }
            else if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out userId))
            {
                ConnectedUsers.TryAdd(Context.ConnectionId, userId);
            }
            await base.OnConnectedAsync();
        }

        public async Task JoinGame(string gameId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
            ConnectedGameConnections.TryAdd(Context.ConnectionId, gameId); // Store gameId for this connection
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.User?.Identity?.Name ?? Context.ConnectionId} has joined game {gameId}.");
        }

        public async Task LeaveGame(string gameId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
            ConnectedGameConnections.TryRemove(Context.ConnectionId, out _); // Remove gameId for this connection
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.User?.Identity?.Name ?? Context.ConnectionId} has left game {gameId}.");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            int userId;
            ConnectedUsers.TryRemove(Context.ConnectionId, out userId); // Remove user from ConnectedUsers

            string gameId;
            if (ConnectedGameConnections.TryRemove(Context.ConnectionId, out gameId))
            {
                var game = await _gameService.GetGameByIdAsync(Guid.Parse(gameId));

                if (game != null && game.Status == "InProgress")
                {
                    game.Status = "Paused";
                    game.LastActivityDate = DateTime.UtcNow;
                    await _gameService.UpdateGameAsync(game);

                    await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}

