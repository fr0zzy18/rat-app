using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using RatApp.Application.Dtos;

namespace RatApp.Application.Services
{
    public class GameService
    {
        private readonly IGameRepository _gameRepository;

        public GameService(IGameRepository gameRepository)
        {
            _gameRepository = gameRepository;
        }

        public async Task<Game> CreateGameAsync(int userId, List<int> player1SelectedCardIds)
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

        public async Task<Game?> JoinGameAsync(Guid gameId, int player2UserId, List<int> player2SelectedCardIds)
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
            game.GameStartedDate = DateTime.UtcNow; // Set game start time when game status changes to InProgress

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        public async Task<Game?> GetGameByIdAsync(Guid gameId)
        {
            return await _gameRepository.GetGameByIdAsync(gameId);
        }

        public async Task<Game?> CheckCellAsync(Guid gameId, int userId, int cardId)
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

            List<int> playerCheckedCards;
            List<int> playerSelectedCards;
            List<int>? playerBoardLayout; // Declare playerBoardLayout here

            if (game.CreatedByUserId == userId)
            {
                playerCheckedCards = game.Player1CheckedCardIds;
                playerSelectedCards = game.Player1SelectedCardIds;
                playerBoardLayout = game.Player1BoardLayout; // Get Player1's layout
            }
            else if (game.Player2UserId == userId)
            {
                playerCheckedCards = game.Player2CheckedCardIds ?? new List<int>();
                playerSelectedCards = game.Player2SelectedCardIds ?? new List<int>();
                playerBoardLayout = game.Player2BoardLayout; // Get Player2's layout
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

            if (playerBoardLayout == null)
            {
                throw new InvalidOperationException("Player board layout is missing.");
            }

            if (CheckForBingo(playerCheckedCards, playerBoardLayout)) // Pass playerCheckedCards and playerBoardLayout
            {
                game.Status = (game.CreatedByUserId == userId) ? "Player1Won" : "Player2Won";
            }

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        // Updated signature: now accepts playerCheckedCards and playerBoardLayout
        private bool CheckForBingo(List<int> playerCheckedCards, List<int> playerBoardLayout)
        {
            const int boardSize = 5;
            bool[,] boardState = new bool[boardSize, boardSize];

            // 1. Populate boardState based on playerBoardLayout and playerCheckedCards
            int layoutIndex = 0;
            for (int r = 0; r < boardSize; r++)
            {
                for (int c = 0; c < boardSize; c++)
                {
                    if (r == 2 && c == 2) // Center cell is free space, always marked
                    {
                        boardState[r, c] = true;
                    }
                    else
                    {
                        // Map layoutIndex to grid, skipping the center
                        // The order in playerBoardLayout corresponds to a sequential fill, skipping the center
                        int cardId = playerBoardLayout[layoutIndex]; // Assuming layoutIndex won't exceed bounds
                        boardState[r, c] = playerCheckedCards.Contains(cardId);
                        layoutIndex++;
                    }
                }
            }

            // 2. Check Rows
            for (int r = 0; r < boardSize; r++)
            {
                bool rowBingo = true;
                for (int c = 0; c < boardSize; c++)
                {
                    if (!boardState[r, c])
                    {
                        rowBingo = false;
                        break;
                    }
                }
                if (rowBingo) return true;
            }

            // 3. Check Columns
            for (int c = 0; c < boardSize; c++)
            {
                bool colBingo = true;
                for (int r = 0; r < boardSize; r++)
                {
                    if (!boardState[r, c])
                    {
                        colBingo = false;
                        break;
                    }
                }
                if (colBingo) return true;
            }

            // 4. Check Diagonals
            // Main Diagonal (top-left to bottom-right)
            bool mainDiagBingo = true;
            for (int i = 0; i < boardSize; i++)
            {
                if (!boardState[i, i])
                {
                    mainDiagBingo = false;
                    break;
                }
            }
            if (mainDiagBingo) return true;

            // Anti-Diagonal (top-right to bottom-left)
            bool antiDiagBingo = true;
            for (int i = 0; i < boardSize; i++)
            {
                if (!boardState[i, (boardSize - 1) - i])
                {
                    antiDiagBingo = false;
                    break;
                }
            }
            if (antiDiagBingo) return true;

            return false; // No Bingo found
        }

        private List<int> ShuffleCards(List<int> cards)
        {
            var rng = new Random();
            var shuffledCards = cards.OrderBy(a => rng.Next()).ToList();
            return shuffledCards;
        }
    }
}
