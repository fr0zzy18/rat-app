using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;

namespace RatApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All endpoints require authentication by default
    public class PlayersController : ControllerBase
    {
        private readonly PlayerService _playerService;

        public PlayersController(PlayerService playerService)
        {
            _playerService = playerService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlayerDto>>> GetPlayers()
        {
            var players = await _playerService.GetAllPlayers();
            return Ok(players);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")] // Admin and Manager can add players
        public async Task<ActionResult<PlayerDto>> AddPlayer(AddPlayerDto dto)
        {
            var newPlayer = await _playerService.AddPlayer(dto);
            return CreatedAtAction(nameof(GetPlayers), new { id = newPlayer.Id }, newPlayer);
        }

        [HttpPut]
        [Authorize(Roles = "Admin,Manager")] // Admin and Manager can update players
        public async Task<ActionResult<PlayerDto>> UpdatePlayer(PlayerDto dto)
        {
            var updatedPlayer = await _playerService.UpdatePlayer(dto);
            if (updatedPlayer == null)
            {
                return NotFound($"Player with ID {dto.Id} not found.");
            }
            return Ok(updatedPlayer);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")] // Admin and Manager can delete players
        public async Task<IActionResult> DeletePlayer(int id)
        {
            var deleted = await _playerService.DeletePlayer(id);
            if (!deleted)
            {
                return NotFound($"Player with ID {id} not found.");
            }
            return NoContent();
        }
    }
}
