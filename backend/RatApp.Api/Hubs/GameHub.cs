using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using RatApp.Application.Services;
using RatApp.Core.Interfaces;
using System.Security.Claims;
using System;
using System.Linq;
using System.Collections.Concurrent;

namespace RatApp.Api.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;
        private readonly IUserRepository _userRepository;
        private static ConcurrentDictionary<string, int> ConnectedUsers = new ConcurrentDictionary<string, int>();
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
            ConnectedGameConnections.TryAdd(Context.ConnectionId, gameId);
            await Clients.Group(gameId).SendAsync("ReceiveMessage", $"{Context.User?.Identity?.Name ?? Context.ConnectionId} has joined game {gameId}.");
        }

        public async Task LeaveGame(string gameId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
            ConnectedGameConnections.TryRemove(Context.ConnectionId, out _);

            int userId;
            ConnectedUsers.TryGetValue(Context.ConnectionId, out userId);
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
                await UpdateGameStatusOnLeave(Guid.Parse(gameIdString), userIdDisconnected);
            }
            await base.OnDisconnectedAsync(exception);
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

