using System.Collections.Generic;

namespace RatApp.Application.Dtos
{
    public class CreateGameRequestDto
    {
        public List<int> Player1SelectedCardIds { get; set; } = new List<int>();
    }
}
