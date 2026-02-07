using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using RatApp.Core.Entities; // Needed for Game entity
using RatApp.Core.Interfaces; // Needed for ITokenService - though not directly used in controller, GameService might need it

namespace RatApp.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        // private readonly ITokenService _tokenService; // Inject if needed to get user ID, but ClaimsPrincipal is often enough

        public GameController(GameService gameService) //, ITokenService tokenService)
        {
            _gameService = gameService;
            // _tokenService = tokenService;
        }

        [HttpPost("create")]
        public async Task<ActionResult<GameResponseDto>> CreateGame([FromBody] CreateGameRequestDto request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var newGame = await _gameService.CreateGameAsync(userId, request.Player1SelectedCardIds);
            return Ok(new GameResponseDto
            {
                Id = newGame.Id,
                CreatedByUserId = newGame.CreatedByUserId,
                Player1SelectedCardIds = newGame.Player1SelectedCardIds,
                Player1CheckedCardIds = newGame.Player1CheckedCardIds,
                Player2UserId = newGame.Player2UserId,
                Player2SelectedCardIds = newGame.Player2SelectedCardIds,
                Player2CheckedCardIds = newGame.Player2CheckedCardIds,
                Player1BoardLayout = newGame.Player1BoardLayout, // New
                Player2BoardLayout = newGame.Player2BoardLayout, // New
                Status = newGame.Status,
                CreatedDate = newGame.CreatedDate
            });
        }

        [HttpPost("join/{gameId}")]
        public async Task<ActionResult<GameResponseDto>> JoinGame(Guid gameId, [FromBody] JoinGameRequestDto request)
        {
            var player2UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(player2UserId))
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
                return Ok(new GameResponseDto
                {
                    Id = updatedGame.Id,
                    CreatedByUserId = updatedGame.CreatedByUserId,
                    Player1SelectedCardIds = updatedGame.Player1SelectedCardIds,
                    Player1CheckedCardIds = updatedGame.Player1CheckedCardIds,
                    Player2UserId = updatedGame.Player2UserId,
                    Player2SelectedCardIds = updatedGame.Player2SelectedCardIds,
                    Player2CheckedCardIds = updatedGame.Player2CheckedCardIds,
                    Player1BoardLayout = updatedGame.Player1BoardLayout, // New
                    Player2BoardLayout = updatedGame.Player2BoardLayout, // New
                    Status = updatedGame.Status,
                    CreatedDate = updatedGame.CreatedDate
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message); // Return 409 Conflict if game already has two players
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

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Only allow players involved in the game or an admin/manager to view the game details
            if (currentUserId != game.CreatedByUserId && currentUserId != game.Player2UserId)
            {
                 // You might want a more sophisticated authorization check here
                return Forbid();
            }

            return Ok(new GameResponseDto
            {
                Id = game.Id,
                CreatedByUserId = game.CreatedByUserId,
                Player1SelectedCardIds = game.Player1SelectedCardIds,
                Player1CheckedCardIds = game.Player1CheckedCardIds,
                Player2UserId = game.Player2UserId,
                Player2SelectedCardIds = game.Player2SelectedCardIds,
                Player2CheckedCardIds = game.Player2CheckedCardIds,
                Player1BoardLayout = game.Player1BoardLayout, // New
                Player2BoardLayout = game.Player2BoardLayout, // New
                Status = game.Status,
                CreatedDate = game.CreatedDate
            });
        }

        [HttpPost("{gameId}/checkCell")]
        public async Task<ActionResult<GameResponseDto>> CheckCell(Guid gameId, [FromBody] CheckCellRequestDto request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
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
                return Ok(new GameResponseDto
                {
                    Id = updatedGame.Id,
                    CreatedByUserId = updatedGame.CreatedByUserId,
                    Player1SelectedCardIds = updatedGame.Player1SelectedCardIds,
                    Player1CheckedCardIds = updatedGame.Player1CheckedCardIds,
                    Player2UserId = updatedGame.Player2UserId,
                    Player2SelectedCardIds = updatedGame.Player2SelectedCardIds,
                    Player2CheckedCardIds = updatedGame.Player2CheckedCardIds,
                    Player1BoardLayout = updatedGame.Player1BoardLayout, // New
                    Player2BoardLayout = updatedGame.Player2BoardLayout, // New
                    Status = updatedGame.Status,
                    CreatedDate = updatedGame.CreatedDate
                });
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
    }
}
