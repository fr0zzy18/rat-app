using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces; // Added for IUserRepository
using Microsoft.AspNetCore.SignalR;
using RatApp.Api.Hubs;

namespace RatApp.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        private readonly IHubContext<GameHub> _hubContext;
        private readonly IUserRepository _userRepository;

        public GameController(GameService gameService, IHubContext<GameHub> hubContext, IUserRepository userRepository)
        {
            _gameService = gameService;
            _hubContext = hubContext;
            _userRepository = userRepository;
        }

        private async Task<GameResponseDto> MapGameToGameResponseDto(Game game)
        {
            var createdByUser = await _userRepository.GetUserByIdAsync(game.CreatedByUserId);
            var player2User = game.Player2UserId.HasValue ? await _userRepository.GetUserByIdAsync(game.Player2UserId.Value) : null;

            return new GameResponseDto
            {
                Id = game.Id,
                CreatedByUserId = game.CreatedByUserId,
                CreatedByUsername = createdByUser?.Username ?? "Unknown Player",
                Player1SelectedCardIds = game.Player1SelectedCardIds,
                Player1CheckedCardIds = game.Player1CheckedCardIds,
                Player2UserId = game.Player2UserId,
                Player2Username = player2User?.Username,
                Player2SelectedCardIds = game.Player2SelectedCardIds,
                Player2CheckedCardIds = game.Player2CheckedCardIds,
                Player1BoardLayout = game.Player1BoardLayout,
                Player2BoardLayout = game.Player2BoardLayout,
                Status = game.Status,
                CreatedDate = game.CreatedDate,
                GameStartedDate = game.GameStartedDate,
                LastActivityDate = game.LastActivityDate // New: Map LastActivityDate
            };
        }

        [HttpPost("create")]
        public async Task<ActionResult<GameResponseDto>> CreateGame([FromBody] CreateGameRequestDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var newGame = await _gameService.CreateGameAsync(userId, request.Player1SelectedCardIds);
            var gameResponse = await MapGameToGameResponseDto(newGame);
            await _hubContext.Clients.All.SendAsync("WaitingGameAdded", gameResponse); // Notify all clients about the new waiting game
            return Ok(gameResponse);
        }

        [HttpPost("join/{gameId}")]
        public async Task<ActionResult<GameResponseDto>> JoinGame(Guid gameId, [FromBody] JoinGameRequestDto request)
        {
            var player2UserIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(player2UserIdString) || !int.TryParse(player2UserIdString, out int player2UserId))
            {
                return Unauthorized();
            }

            try
            {
                var updatedGame = await _gameService.JoinGameAsync(gameId, player2UserId, request.Player2SelectedCardIds);
                if (updatedGame == null)
                {
                    return NotFound($"Game with ID {gameId} not found.");
                }

                var gameResponse = await MapGameToGameResponseDto(updatedGame);
                await _hubContext.Clients.Group(updatedGame.Id.ToString()).SendAsync("GameUpdated", gameResponse);
                return Ok(gameResponse);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpGet("{gameId}")]
        public async Task<ActionResult<GameResponseDto>> GetGame(Guid gameId)
        {
            var game = await _gameService.GetGameByIdAsync(gameId);
            if (game == null)
            {
                return NotFound($"Game with ID {gameId} not found.");
            }

            var currentUserIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserIdString) || !int.TryParse(currentUserIdString, out int currentUserId))
            {
                return Unauthorized(); // Should not happen if [Authorize] is effective
            }

            if (currentUserId != game.CreatedByUserId && currentUserId != game.Player2UserId)
            {
                return Forbid();
            }

            var gameResponse = await MapGameToGameResponseDto(game);
            return Ok(gameResponse);
        }

        [HttpPost("{gameId}/checkCell")]
        public async Task<ActionResult<GameResponseDto>> CheckCell(Guid gameId, [FromBody] CheckCellRequestDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var updatedGame = await _gameService.CheckCellAsync(gameId, userId, request.CardId);
                if (updatedGame == null)
                {
                    return NotFound($"Game with ID {gameId} not found.");
                }
                
                var gameResponse = await MapGameToGameResponseDto(updatedGame);
                await _hubContext.Clients.Group(updatedGame.Id.ToString()).SendAsync("GameUpdated", gameResponse);
                return Ok(gameResponse);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("my-active-game")] // Moved to here
        public async Task<ActionResult<GameResponseDto>> GetMyActiveGame()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var game = await _gameService.GetGameByParticipantIdAsync(userId);

            if (game == null)
            {
                return NotFound("No active game found for this user.");
            }
            
            var gameResponse = await MapGameToGameResponseDto(game);
            return Ok(gameResponse);
        }

        [HttpPost("{gameId}/resume")] // New endpoint for resuming game
        public async Task<ActionResult<GameResponseDto>> ResumeGame(Guid gameId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var resumedGame = await _gameService.ResumeGameAsync(gameId, userId);
                if (resumedGame == null)
                {
                    return NotFound($"Game with ID {gameId} not found.");
                }

                var gameResponse = await MapGameToGameResponseDto(resumedGame);
                await _hubContext.Clients.Group(resumedGame.Id.ToString()).SendAsync("GameUpdated", gameResponse);
                return Ok(gameResponse);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("waiting-games")] // New endpoint to get games waiting for a second player
        public async Task<ActionResult<IEnumerable<GameResponseDto>>> GetWaitingGames()
        {
            var waitingGames = await _gameService.GetWaitingGamesAsync();
            var gameResponses = new List<GameResponseDto>();
            foreach (var game in waitingGames)
            {
                gameResponses.Add(await MapGameToGameResponseDto(game));
            }
            return Ok(gameResponses);
        }
    }
}