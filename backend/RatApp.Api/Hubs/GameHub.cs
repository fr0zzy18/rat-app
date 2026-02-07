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

            // Get all connection IDs that are still in this game group
            var activeConnectionIdsForThisGame = ConnectedGameConnections
                                                    .Where(x => x.Value == gameIdString)
                                                    .Select(x => x.Key)
                                                    .ToList();

            // Get the unique user IDs corresponding to these active connections
            // (Only for users who are actual participants of *this* game)
            var currentlyConnectedParticipantUserIds = activeConnectionIdsForThisGame
                                                    .Select(connId => {
                                                        ConnectedUsers.TryGetValue(connId, out int user);
                                                        return user;
                                                    })
                                                    .Where(uId => uId != 0 && (uId == game.CreatedByUserId || (game.Player2UserId.HasValue && uId == game.Player2UserId.Value)))
                                                    .Distinct()
                                                    .ToList();

            // --- Game State Transition Logic ---
            if (game.Status == "InProgress" || game.Status == "Paused")
            {
                if (currentlyConnectedParticipantUserIds.Count == 0)
                {
                    // No participants left for an InProgress or Paused game, abandon it.
                    await _gameService.AbandonGameAsync(gameId);
                    await Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                }
                else if (currentlyConnectedParticipantUserIds.Count == 1 && game.Status == "InProgress")
                {
                    // One participant left and game was InProgress, pause it.
                    game.Status = "Paused";
                    game.LastActivityDate = DateTime.UtcNow;
                    await _gameService.UpdateGameAsync(game);
                    await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                }
                // If count is 1 and game was already Paused, or count is 2 (both connected), no status change.
            }
            else if (game.Status == "WaitingForPlayer")
            {
                // In a WaitingForPlayer game, if the creator (Player1) disconnects AND has no other active connections
                // (i.e., their userId is no longer found in ConnectedUsers at all), then abandon the game.
                if (!ConnectedUsers.Any(cu => cu.Value == game.CreatedByUserId))
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

