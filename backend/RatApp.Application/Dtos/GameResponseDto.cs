using System;
using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class GameResponseDto
    {
        public Guid Id { get; set; }
        public int CreatedByUserId { get; set; }
        public List<int> Player1SelectedCardIds { get; set; } = new List<int>();
        public List<int> Player1CheckedCardIds { get; set; } = new List<int>();
        public int? Player2UserId { get; set; }
        public List<int>? Player2SelectedCardIds { get; set; }
        public List<int>? Player2CheckedCardIds { get; set; }
        public List<int>? Player1BoardLayout { get; set; } // New
        public List<int>? Player2BoardLayout { get; set; } // New
        public string CreatedByUsername { get; set; } = string.Empty; // New
        public string? Player2Username { get; set; } // New
        public string Status { get; set; } = "WaitingForPlayer";
        public DateTime CreatedDate { get; set; }
        public DateTime? GameStartedDate { get; set; } // New property
    }
}
