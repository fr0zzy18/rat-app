using System.ComponentModel.DataAnnotations;

namespace RatApp.Application.Dtos
{
    public class AddSuggestionRequestDto
    {
        [Required]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Phrase cannot be empty.")]
        public string Phrase { get; set; } = string.Empty;
    }
}
