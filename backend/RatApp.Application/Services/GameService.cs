using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using RatApp.Application.Dtos; // Assuming DTOs might be used for input/output

namespace RatApp.Application.Services
{
    public class GameService
    {
        private readonly IGameRepository _gameRepository;

        public GameService(IGameRepository gameRepository)
        {
            _gameRepository = gameRepository;
        }

        public async Task<Game> CreateGameAsync(int userId, List<int> player1SelectedCardIds) // userId is now int
        {
            var newGame = new Game
            {
                Id = Guid.NewGuid(),
                CreatedByUserId = userId,
                Player1SelectedCardIds = player1SelectedCardIds,
                Player1CheckedCardIds = new List<int>(),
                Status = "WaitingForPlayer",
                CreatedDate = DateTime.UtcNow,
                Player1BoardLayout = ShuffleCards(player1SelectedCardIds)
            };

            await _gameRepository.CreateGameAsync(newGame);
            return newGame;
        }

        public async Task<Game?> JoinGameAsync(Guid gameId, int player2UserId, List<int> player2SelectedCardIds) // player2UserId is now int
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);

            if (game == null)
            {
                return null;
            }

            if (game.Player2UserId != null)
            {
                throw new InvalidOperationException("Game already has two players.");
            }

            game.Player2UserId = player2UserId;
            game.Player2SelectedCardIds = player2SelectedCardIds;
            game.Player2CheckedCardIds = new List<int>();
            game.Player2BoardLayout = ShuffleCards(player2SelectedCardIds);
            game.Status = "InProgress";

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        public async Task<Game?> GetGameByIdAsync(Guid gameId)
        {
            return await _gameRepository.GetGameByIdAsync(gameId);
        }

        public async Task<Game?> CheckCellAsync(Guid gameId, int userId, int cardId) // userId is now int
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);

            if (game == null)
            {
                return null;
            }

            if (game.Status != "InProgress")
            {
                throw new InvalidOperationException("Game is not in progress.");
            }

            // Determine which player is making the move
            List<int> playerCheckedCards;
            List<int> playerSelectedCards;
            
            if (game.CreatedByUserId == userId) // Comparison is now int to int
            {
                playerCheckedCards = game.Player1CheckedCardIds;
                playerSelectedCards = game.Player1SelectedCardIds;
            }
            else if (game.Player2UserId == userId) // Comparison is now int? to int
            {
                playerCheckedCards = game.Player2CheckedCardIds ?? new List<int>();
                playerSelectedCards = game.Player2SelectedCardIds ?? new List<int>();
            }
            else
            {
                throw new UnauthorizedAccessException("User is not a participant in this game.");
            }

            if (!playerSelectedCards.Contains(cardId))
            {
                throw new InvalidOperationException($"Card ID {cardId} is not part of this player's selected cards.");
            }

            if (playerCheckedCards.Contains(cardId))
            {
                playerCheckedCards.Remove(cardId);
            }
            else
            {
                playerCheckedCards.Add(cardId);
            }

            if (CheckForBingo(playerSelectedCards, playerCheckedCards))
            {
                game.Status = (game.CreatedByUserId == userId) ? "Player1Won" : "Player2Won";
            }

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        private bool CheckForBingo(List<int> selectedCards, List<int> checkedCards)
        {
            return checkedCards.Count >= 5;
        }

        private List<int> ShuffleCards(List<int> cards)
        {
            var rng = new Random();
            var shuffledCards = cards.OrderBy(a => rng.Next()).ToList();
            return shuffledCards;
        }
    }
}