using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.ComponentModel.DataAnnotations;

namespace RatApp.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SuggestionsController : ControllerBase
    {
        private readonly SuggestionService _suggestionService;

        public SuggestionsController(SuggestionService suggestionService)
        {
            _suggestionService = suggestionService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new InvalidOperationException("User ID not found in claims.");
            }
            return userId;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Player")]
        public async Task<IActionResult> AddSuggestion([FromBody] AddSuggestionRequestDto dto)
        {
            try
            {
                var userId = GetUserId();
                var suggestion = await _suggestionService.AddSuggestionAsync(userId, dto);
                return CreatedAtAction(nameof(GetSuggestionById), new { id = suggestion.Id }, suggestion);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while adding the suggestion.", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetSuggestionById(int id)
        {
            try
            {
                var suggestion = await _suggestionService.GetSuggestionByIdAsync(id);
                if (suggestion == null)
                {
                    return NotFound(new { message = $"Suggestion with ID {id} not found." });
                }
                return Ok(suggestion);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while fetching the suggestion.", details = ex.Message });
            }
        }


        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAllSuggestions()
        {
            try
            {
                var suggestions = await _suggestionService.GetAllSuggestionsAsync();
                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while fetching all suggestions.", details = ex.Message });
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetPendingSuggestions()
        {
            try
            {
                var suggestions = await _suggestionService.GetPendingSuggestionsAsync();
                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while fetching pending suggestions.", details = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ApproveSuggestion(int id)
        {
            try
            {
                var approvedSuggestion = await _suggestionService.ApproveSuggestionAsync(id);
                return Ok(approvedSuggestion);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while approving the suggestion.", details = ex.Message });
            }
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RejectSuggestion(int id)
        {
            try
            {
                var rejectedSuggestion = await _suggestionService.RejectSuggestionAsync(id);
                return Ok(rejectedSuggestion);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while rejecting the suggestion.", details = ex.Message });
            }
        }

        [HttpPut("{id}/phrase")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateSuggestionPhrase(int id, [FromBody] UpdateSuggestionPhraseRequestDto dto)
        {
            try
            {
                var updatedSuggestion = await _suggestionService.UpdateSuggestionPhraseAsync(id, dto.NewPhrase);
                return Ok(updatedSuggestion);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while updating the suggestion phrase.", details = ex.Message });
            }
        }
    }

    public class UpdateSuggestionPhraseRequestDto // Define DTO for phrase update
    {
        [Required]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "New phrase cannot be empty.")]
        public string NewPhrase { get; set; } = string.Empty;
    }
}
