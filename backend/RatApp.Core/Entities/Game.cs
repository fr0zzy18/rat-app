using System;
using System.Collections.Generic;

namespace RatApp.Core.Entities
{
    public class Game
    {
        public Guid Id { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public List<int> Player1SelectedCardIds { get; set; } = new List<int>();
        public List<int> Player1CheckedCardIds { get; set; } = new List<int>();
        public string? Player2UserId { get; set; }
        public List<int>? Player2SelectedCardIds { get; set; }
        public List<int>? Player2CheckedCardIds { get; set; }
        public string Status { get; set; } = "WaitingForPlayer"; // e.g., "WaitingForPlayer", "InProgress", "Player1Won", "Player2Won", "Draw"
        public string? CurrentTurn { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
