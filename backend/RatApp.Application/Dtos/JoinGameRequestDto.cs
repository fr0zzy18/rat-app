using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class JoinGameRequestDto
    {
        public List<int> Player2SelectedCardIds { get; set; } = new List<int>();
    }
}
