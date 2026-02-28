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
                LastActivityDate = DateTime.UtcNow,
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
            game.GameStartedDate = DateTime.UtcNow;
            game.LastActivityDate = DateTime.UtcNow;

            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        public async Task<Game?> GetGameByIdAsync(Guid gameId)
        {
            return await _gameRepository.GetGameByIdAsync(gameId);
        }
        public async Task<Game?> GetGameByParticipantIdAsync(int userId)
        {
            return await _gameRepository.GetGameByParticipantIdAsync(userId);
        }

        public async Task<List<Game>> GetWaitingGamesAsync()
        {
            return await _gameRepository.GetWaitingGamesAsync();
        }
        public async Task UpdateGameAsync(Game game)
        {
            await _gameRepository.UpdateGameAsync(game);
        }

        public async Task AbandonGameAsync(Guid gameId)
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);
            if (game != null)
            {
                game.Status = "Abandoned";
                game.LastActivityDate = DateTime.UtcNow;
                await _gameRepository.UpdateGameAsync(game);
            }
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
                throw new InvalidOperationException($"Game is not in progress. Current status: {game.Status}");
            }

            List<int> playerCheckedCards;
            List<int> playerSelectedCards;
            List<int>? playerBoardLayout;

            if (game.CreatedByUserId == userId)
            {
                playerCheckedCards = game.Player1CheckedCardIds;
                playerSelectedCards = game.Player1SelectedCardIds;
                playerBoardLayout = game.Player1BoardLayout;
            }
            else if (game.Player2UserId == userId)
            {
                playerCheckedCards = game.Player2CheckedCardIds ?? new List<int>();
                playerSelectedCards = game.Player2SelectedCardIds ?? new List<int>();
                playerBoardLayout = game.Player2BoardLayout;
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

            if (CheckForBingo(playerCheckedCards, playerBoardLayout))
            {
                game.Status = (game.CreatedByUserId == userId) ? "Player1Won" : "Player2Won";
            }

            game.LastActivityDate = DateTime.UtcNow;
            await _gameRepository.UpdateGameAsync(game);
            return game;
        }

        public async Task<Game?> ResumeGameAsync(Guid gameId, int userId)
        {
            var game = await _gameRepository.GetGameByIdAsync(gameId);

            if (game == null)
            {
                return null;
            }

            if (game.CreatedByUserId != userId && game.Player2UserId != userId)
            {
                throw new UnauthorizedAccessException("User is not a participant in this game.");
            }

            if (game.Status == "Paused")
            {
                game.Status = "InProgress";
                game.LastActivityDate = DateTime.UtcNow;

                await _gameRepository.UpdateGameAsync(game);
                return game;
            }
            else
            {
                throw new InvalidOperationException($"Game is not paused. Current status: {game.Status}");
            }
        }
        private bool CheckForBingo(List<int> playerCheckedCards, List<int> playerBoardLayout)
        {
            const int boardSize = 5;
            bool[,] boardState = new bool[boardSize, boardSize];
            int layoutIndex = 0;
            for (int r = 0; r < boardSize; r++)
            {
                for (int c = 0; c < boardSize; c++)
                {
                    if (r == 2 && c == 2)
                    {
                        boardState[r, c] = true;
                    }
                    else
                    {
                        int cardId = playerBoardLayout[layoutIndex];
                        boardState[r, c] = playerCheckedCards.Contains(cardId);
                        layoutIndex++;
                    }
                }
            }
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

            return false;
        }

        private List<int> ShuffleCards(List<int> cards)
        {
            var rng = new Random();
            var shuffledCards = cards.OrderBy(a => rng.Next()).ToList();
            return shuffledCards;
        }
    }
}
