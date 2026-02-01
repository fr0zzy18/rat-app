using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;

namespace RatApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayersController : ControllerBase
    {
        private readonly PlayerService _playerService;

        public PlayersController(PlayerService playerService)
        {
            _playerService = playerService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Player")] // Allow Player role to read
        public async Task<ActionResult<IEnumerable<PlayerDto>>> GetAllPlayers([FromQuery] string? category)
        {
            var players = await _playerService.GetAllPlayersAsync(category);
            return Ok(players);
        }

        [HttpPost("import")]
        [Authorize(Roles = "Admin,Manager")] // Only Admin or Manager can import
        public async Task<ActionResult<PlayerDto>> ImportPlayer(AddPlayerRequestDto dto)
        {
            var newPlayer = await _playerService.AddPlayerAsync(dto);
            if (newPlayer == null)
            {
                return BadRequest("Player not found on Raider.IO or could not be imported.");
            }
            return CreatedAtAction(nameof(GetAllPlayers), new { id = newPlayer.Id }, newPlayer);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")] // Only Admin or Manager can delete
        public async Task<IActionResult> DeletePlayer(int id)
        {
            var deleted = await _playerService.DeletePlayerAsync(id);
            if (!deleted)
            {
                return NotFound($"Player with ID {id} not found in local storage.");
            }
            return NoContent();
        }
    }
}
