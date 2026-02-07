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
        // private readonly ITokenService _tokenService; // Uncomment and inject if needed to get user ID from token elsewhere

        public GameService(IGameRepository gameRepository) //, ITokenService tokenService)
        {
            _gameRepository = gameRepository;
            // _tokenService = tokenService;
        }

        public async Task<Game> CreateGameAsync(string userId, List<int> player1SelectedCardIds)
        {
            var newGame = new Game
            {
                Id = Guid.NewGuid(),
                CreatedByUserId = userId,
                Player1SelectedCardIds = player1SelectedCardIds,
                Player1CheckedCardIds = new List<int>(),
                Status = "WaitingForPlayer",
                CreatedDate = DateTime.UtcNow,
                // CurrentTurn = userId // Player 1 starts
            };

            await _gameRepository.CreateGameAsync(newGame);
            return newGame;
        }

        public async Task<Game?> JoinGameAsync(Guid gameId, string player2UserId, List<int> player2SelectedCardIds)
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);

            if (game == null)
            {
                return null; // Game not found
            }

            if (game.Player2UserId != null)
            {
                throw new InvalidOperationException("Game already has two players.");
            }

            game.Player2UserId = player2UserId;
            game.Player2SelectedCardIds = player2SelectedCardIds;
            game.Player2CheckedCardIds = new List<int>();
            game.Status = "InProgress"; // Game can start once second player joins
            game.CurrentTurn = game.CreatedByUserId; // Player 1 starts

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        public async Task<Game?> GetGameByIdAsync(Guid gameId)
        {
            return await _gameRepository.GetGameByIdAsync(gameId);
        }

        public async Task<Game?> CheckCellAsync(Guid gameId, string userId, int cardId)
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);

            if (game == null)
            {
                return null; // Game not found
            }

            if (game.Status != "InProgress")
            {
                throw new InvalidOperationException("Game is not in progress.");
            }

            if (game.CurrentTurn != userId)
            {
                throw new InvalidOperationException("It's not your turn.");
            }

            // Determine which player is making the move
            List<int> playerCheckedCards;
            List<int> playerSelectedCards;
            string opponentUserId;

            if (game.CreatedByUserId == userId)
            {
                playerCheckedCards = game.Player1CheckedCardIds;
                playerSelectedCards = game.Player1SelectedCardIds;
                opponentUserId = game.Player2UserId ?? throw new InvalidOperationException("Opponent not found.");
            }
            else if (game.Player2UserId == userId)
            {
                playerCheckedCards = game.Player2CheckedCardIds ?? new List<int>();
                playerSelectedCards = game.Player2SelectedCardIds ?? new List<int>();
                opponentUserId = game.CreatedByUserId;
            }
            else
            {
                throw new UnauthorizedAccessException("User is not a participant in this game.");
            }

            // Ensure the card being checked is one of the player's selected cards
            if (!playerSelectedCards.Contains(cardId))
            {
                throw new InvalidOperationException($"Card ID {cardId} is not part of this player's selected cards.");
            }

            // Toggle the checked status of the card
            if (playerCheckedCards.Contains(cardId))
            {
                playerCheckedCards.Remove(cardId);
            }
            else
            {
                playerCheckedCards.Add(cardId);
            }

            // Check for Bingo
            // TODO: Implement actual Bingo win condition logic here
            if (CheckForBingo(playerSelectedCards, playerCheckedCards))
            {
                game.Status = (game.CreatedByUserId == userId) ? "Player1Won" : "Player2Won";
            } else {
                // Switch turn
                game.CurrentTurn = opponentUserId;
            }

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        private bool CheckForBingo(List<int> selectedCards, List<int> checkedCards)
        {
            // This is a placeholder. Real Bingo logic would be complex.
            // For now, let's say a player wins if they check 5 cards.
            // In a real scenario, you'd need the 5x5 board structure,
            // and logic to check rows, columns, and diagonals.
            return checkedCards.Count >= 5; // Simplified win condition for testing
        }
    }
}
