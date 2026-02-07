using System;
using System.Collections.Generic;

namespace RatApp.Core.Entities
{
    public class Game
    {
        public Guid Id { get; set; }
        public int CreatedByUserId { get; set; } // Changed from string to int
        public List<int> Player1SelectedCardIds { get; set; } = new List<int>();
        public List<int> Player1CheckedCardIds { get; set; } = new List<int>();
        public int? Player2UserId { get; set; } // Changed from string? to int?
        public List<int>? Player2SelectedCardIds { get; set; }
        public List<int>? Player2CheckedCardIds { get; set; }
        public List<int>? Player1BoardLayout { get; set; }
        public List<int>? Player2BoardLayout { get; set; }
        public string Status { get; set; } = "WaitingForPlayer";
        public DateTime CreatedDate { get; set; }
        public DateTime? GameStartedDate { get; set; }
        public DateTime? LastActivityDate { get; set; } // New property for tracking activity
    }
}