using System;
using RatApp.Core.Entities;

namespace RatApp.Core.Entities
{
    public enum SuggestionStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class Suggestion
    {
        public int Id { get; set; }
        public string Phrase { get; set; } = string.Empty;
        public int SuggestedByUserId { get; set; }
        public User SuggestedByUser { get; set; } = null!; // Navigation property
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public SuggestionStatus Status { get; set; } = SuggestionStatus.Pending;
    }
}
