using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using RatApp.Application.Services;
using RatApp.Core.Interfaces;
using System.Security.Claims;
using System;
using System.Linq;
using System.Collections.Concurrent;
using System.Threading;

namespace RatApp.Api.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;
        private readonly IUserRepository _userRepository;
        private readonly IHubContext<GameHub> _hubContext;
        private readonly IServiceScopeFactory _scopeFactory;
        private static ConcurrentDictionary<string, int> ConnectedUsers = new ConcurrentDictionary<string, int>();
        private static ConcurrentDictionary<string, string> ConnectedGameConnections = new ConcurrentDictionary<string, string>();
        private static ConcurrentDictionary<string, Timer> PendingDisconnectTimers = new ConcurrentDictionary<string, Timer>();

        private const int DisconnectGracePeriodMs = 3000;

        public GameHub(GameService gameService, IUserRepository userRepository, IHubContext<GameHub> hubContext, IServiceScopeFactory scopeFactory)
        {
            _gameService = gameService;
            _userRepository = userRepository;
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
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
            CancelPendingDisconnect(gameId);
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
            ConnectedGameConnections.TryAdd(Context.ConnectionId, gameId);
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.User?.Identity?.Name ?? Context.ConnectionId} has joined game {gameId}.");
        }

        public async Task LeaveGame(string gameId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
            ConnectedGameConnections.TryRemove(Context.ConnectionId, out _);

            int userId;
            ConnectedUsers.TryGetValue(Context.ConnectionId, out userId);
            CancelPendingDisconnect(gameId);
            await UpdateGameStatusOnLeave(Guid.Parse(gameId), userId);
            
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.User?.Identity?.Name ?? Context.ConnectionId} has left game {gameId}.");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            int userIdDisconnected;
            ConnectedUsers.TryRemove(Context.ConnectionId, out userIdDisconnected);

            string? gameIdString;
            if (ConnectedGameConnections.TryRemove(Context.ConnectionId, out gameIdString))
            {
                var gameId = Guid.Parse(gameIdString);
                var key = $"{gameIdString}_{userIdDisconnected}";
                var hubContext = _hubContext;
                var scopeFactory = _scopeFactory;

                var timer = new Timer(async _ =>
                {
                    PendingDisconnectTimers.TryRemove(key, out var discarded);
                    using var scope = scopeFactory.CreateScope();
                    var gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                    await UpdateGameStatusOnLeaveFromTimer(gameId, hubContext, gameService);
                }, null, DisconnectGracePeriodMs, Timeout.Infinite);

                PendingDisconnectTimers.TryAdd(key, timer);
            }
            await base.OnDisconnectedAsync(exception);
        }

        private void CancelPendingDisconnect(string gameId)
        {
            int userId;
            if (ConnectedUsers.TryGetValue(Context.ConnectionId, out userId))
            {
                var key = $"{gameId}_{userId}";
                if (PendingDisconnectTimers.TryRemove(key, out var timer))
                {
                    timer.Dispose();
                }
            }
        }

        private static async Task UpdateGameStatusOnLeaveFromTimer(Guid gameId, IHubContext<GameHub> hubContext, GameService gameService)
        {
            var game = await gameService.GetGameByIdAsync(gameId);
            if (game == null) return;

            var activeConnectionIdsForThisGame = ConnectedGameConnections
                .Where(x => x.Value == gameId.ToString())
                .Select(x => x.Key)
                .ToList();
            var currentlyConnectedParticipantUserIds = activeConnectionIdsForThisGame
                .Select(connId =>
                {
                    ConnectedUsers.TryGetValue(connId, out int user);
                    return user;
                })
                .Where(uId => uId != 0 && (uId == game.CreatedByUserId || (game.Player2UserId.HasValue && uId == game.Player2UserId.Value)))
                .Distinct()
                .ToList();

            if (game.Status == "InProgress" || game.Status == "Paused")
            {
                if (currentlyConnectedParticipantUserIds.Count == 0)
                {
                    await gameService.AbandonGameAsync(gameId);
                    await hubContext.Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                }
                else if (currentlyConnectedParticipantUserIds.Count == 1 && game.Status == "InProgress")
                {
                    game.Status = "Paused";
                    game.LastActivityDate = DateTime.UtcNow;
                    await gameService.UpdateGameAsync(game);
                    await hubContext.Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                }
            }
        }
        private async Task UpdateGameStatusOnLeave(Guid gameId, int leavingUserId)
        {
            var game = await _gameService.GetGameByIdAsync(gameId);

            if (game != null)
            {
                var activeConnectionIdsForThisGame = ConnectedGameConnections
                                                        .Where(x => x.Value == gameId.ToString())
                                                        .Select(x => x.Key)
                                                        .ToList();
                var currentlyConnectedParticipantUserIds = activeConnectionIdsForThisGame
                                                        .Select(connId => {
                                                            ConnectedUsers.TryGetValue(connId, out int user);
                                                            return user;
                                                        })
                                                        .Where(uId => uId != 0 && (uId == game.CreatedByUserId || (game.Player2UserId.HasValue && uId == game.Player2UserId.Value)))
                                                        .Distinct()
                                                        .ToList();
                if (game.Status == "InProgress" || game.Status == "Paused")
                {
                    if (currentlyConnectedParticipantUserIds.Count == 0)
                    {
                        await _gameService.AbandonGameAsync(gameId);
                        await Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                    }
                    else if (currentlyConnectedParticipantUserIds.Count == 1 && game.Status == "InProgress")
                    {
                        game.Status = "Paused";
                        game.LastActivityDate = DateTime.UtcNow;
                        await _gameService.UpdateGameAsync(game);
                        await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                    }
                }
                else if (game.Status == "WaitingForPlayer")
                {
                    if (!ConnectedUsers.Any(cu => cu.Value == game.CreatedByUserId))
                    {
                        await _gameService.AbandonGameAsync(gameId);
                        await Clients.Group(gameId.ToString()).SendAsync("GameAbandoned", gameId.ToString());
                    }
                }
            }
        }
    }
}

