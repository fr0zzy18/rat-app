using System;
using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class GameResponseDto
    {
        public Guid Id { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public List<int> Player1SelectedCardIds { get; set; } = new List<int>();
        public List<int> Player1CheckedCardIds { get; set; } = new List<int>();
        public string? Player2UserId { get; set; }
        public List<int>? Player2SelectedCardIds { get; set; }
        public List<int>? Player2CheckedCardIds { get; set; }
        public List<int>? Player1BoardLayout { get; set; } // New
        public List<int>? Player2BoardLayout { get; set; } // New
        public string Status { get; set; } = "WaitingForPlayer";
        public DateTime CreatedDate { get; set; }
    }
}
