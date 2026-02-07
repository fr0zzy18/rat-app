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
            int userIdDisconnected;
            // Try to remove the disconnected user from the general ConnectedUsers
            ConnectedUsers.TryRemove(Context.ConnectionId, out userIdDisconnected);

            string? gameIdString;
            // Try to remove the disconnected connection from the game-specific connections
            if (ConnectedGameConnections.TryRemove(Context.ConnectionId, out gameIdString))
            {
                Guid gameId = Guid.Parse(gameIdString);
                var game = await _gameService.GetGameByIdAsync(gameId);

                if (game != null)
                {
                    // Determine if the game has a second player (i.e., it's not "WaitingForPlayer" or has been joined)
                    bool isTwoPlayerGame = game.Player2UserId.HasValue;

                    // Check if game creator is still connected (by userId)
                    bool player1StillConnected = ConnectedUsers.Any(cu => cu.Value == game.CreatedByUserId);

                    // Check if player 2 is still connected (by userId)
                    bool player2StillConnected = isTwoPlayerGame && ConnectedUsers.Any(cu => cu.Value == game.Player2UserId!.Value);

                    if (game.Status == "InProgress")
                    {
                        if (!player1StillConnected && (!isTwoPlayerGame || !player2StillConnected))
                        {
                            // If InProgress game, and either only player1 was there and disconnected,
                            // or both players were there and both disconnected.
                            // This scenario means no players are left for an InProgress game.
                            await _gameService.AbandonGameAsync(gameId);
                            await Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                        }
                        else if (!player1StillConnected || !player2StillConnected)
                        {
                            // If InProgress game, and one player disconnected, but the other is still connected,
                            // This means one player is still in the game, so pause it.
                            game.Status = "Paused";
                            game.LastActivityDate = DateTime.UtcNow;
                            await _gameService.UpdateGameAsync(game);
                            await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                        }
                    }
                    else if (game.Status == "WaitingForPlayer")
                    {
                        // If the game was waiting for player and the creator disconnected, abandon it.
                        // This assumes `game.CreatedByUserId` is the only "active" participant at this stage.
                        if (!player1StillConnected)
                        {
                            await _gameService.AbandonGameAsync(gameId);
                            await Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                        }
                    }
                    // Other statuses (Player1Won, Player2Won, Abandoned) remain unchanged.
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}

