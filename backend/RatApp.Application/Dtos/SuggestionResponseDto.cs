using System;
using RatApp.Core.Entities;

namespace RatApp.Application.Dtos
{
    public class SuggestionResponseDto
    {
        public int Id { get; set; }
        public string Phrase { get; set; } = string.Empty;
        public string SuggestedByUserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public SuggestionStatus Status { get; set; }
    }
}
