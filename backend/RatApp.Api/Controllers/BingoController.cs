using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using System.Threading.Tasks;

namespace RatApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BingoController : ControllerBase
    {
        private readonly BingoService _bingoService;

        public BingoController(BingoService bingoService)
        {
            _bingoService = bingoService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateBingoCard([FromBody] CreateBingoCardDto createBingoCardDto)
        {
            var bingoCard = await _bingoService.CreateBingoCardAsync(createBingoCardDto);
            return Ok(bingoCard);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBingoCards()
        {
            var bingoCards = await _bingoService.GetAllBingoCardsAsync();
            return Ok(bingoCards);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteBingoCard(int id)
        {
            var deleted = await _bingoService.DeleteBingoCardAsync(id);
            if (!deleted)
            {
                return NotFound($"Bingo card with ID {id} not found.");
            }
            return NoContent();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateBingoCard(int id, [FromBody] UpdateBingoCardDto updateBingoCardDto)
        {
            var updatedBingoCard = await _bingoService.UpdateBingoCardAsync(id, updateBingoCardDto);
            if (updatedBingoCard == null)
            {
                return NotFound($"Bingo card with ID {id} not found.");
            }
            return Ok(updatedBingoCard);
        }
    }
}
