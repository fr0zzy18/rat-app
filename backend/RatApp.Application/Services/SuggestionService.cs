using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using RatApp.Application.Services; // For BingoService

namespace RatApp.Application.Services
{
    public class SuggestionService
    {
        private readonly ISuggestionRepository _suggestionRepository;
        private readonly IUserRepository _userRepository;
        private readonly BingoService _bingoService; // To create BingoCard on approval

        public SuggestionService(ISuggestionRepository suggestionRepository, IUserRepository userRepository, BingoService bingoService)
        {
            _suggestionRepository = suggestionRepository;
            _userRepository = userRepository;
            _bingoService = bingoService;
        }

        public async Task<SuggestionResponseDto> AddSuggestionAsync(int userId, AddSuggestionRequestDto dto)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new ApplicationException("User not found.");
            }

            var suggestion = new Suggestion
            {
                Phrase = dto.Phrase,
                SuggestedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                Status = SuggestionStatus.Pending
            };

            var addedSuggestion = await _suggestionRepository.AddSuggestionAsync(suggestion);
            return await MapToSuggestionResponseDto(addedSuggestion);
        }

        public async Task<IEnumerable<SuggestionResponseDto>> GetAllSuggestionsAsync()
        {
            var suggestions = await _suggestionRepository.GetAllSuggestionsAsync();
            var dtos = new List<SuggestionResponseDto>();
            foreach (var suggestion in suggestions)
            {
                dtos.Add(await MapToSuggestionResponseDto(suggestion));
            }
            return dtos;
        }

        public async Task<IEnumerable<SuggestionResponseDto>> GetPendingSuggestionsAsync()
        {
            var suggestions = await _suggestionRepository.GetSuggestionsByStatusAsync(SuggestionStatus.Pending);
            var dtos = new List<SuggestionResponseDto>();
            foreach (var suggestion in suggestions)
            {
                dtos.Add(await MapToSuggestionResponseDto(suggestion));
            }
            return dtos;
        }

        public async Task<SuggestionResponseDto?> GetSuggestionByIdAsync(int id)
        {
            var suggestion = await _suggestionRepository.GetSuggestionByIdAsync(id);
            if (suggestion == null)
            {
                return null;
            }
            return await MapToSuggestionResponseDto(suggestion);
        }

        public async Task<SuggestionResponseDto> ApproveSuggestionAsync(int suggestionId)
        {
            var suggestion = await _suggestionRepository.GetSuggestionByIdAsync(suggestionId);
            if (suggestion == null)
            {
                throw new ApplicationException($"Suggestion with ID {suggestionId} not found.");
            }
            if (suggestion.Status != SuggestionStatus.Pending)
            {
                throw new ApplicationException("Only pending suggestions can be approved.");
            }

            // Create a new BingoCard from the approved suggestion
            await _bingoService.CreateBingoCardAsync(new CreateBingoCardDto { Phrase = suggestion.Phrase });

            suggestion.Status = SuggestionStatus.Approved;
            await _suggestionRepository.UpdateSuggestionAsync(suggestion);

            return await MapToSuggestionResponseDto(suggestion);
        }

        public async Task<SuggestionResponseDto> RejectSuggestionAsync(int suggestionId)
        {
            var suggestion = await _suggestionRepository.GetSuggestionByIdAsync(suggestionId);
            if (suggestion == null)
            {
                throw new ApplicationException($"Suggestion with ID {suggestionId} not found.");
            }
            if (suggestion.Status != SuggestionStatus.Pending)
            {
                throw new ApplicationException("Only pending suggestions can be rejected.");
            }

            suggestion.Status = SuggestionStatus.Rejected;
            await _suggestionRepository.UpdateSuggestionAsync(suggestion);
            return await MapToSuggestionResponseDto(suggestion);
        }

        public async Task<SuggestionResponseDto> UpdateSuggestionPhraseAsync(int suggestionId, string newPhrase)
        {
            var suggestion = await _suggestionRepository.GetSuggestionByIdAsync(suggestionId);
            if (suggestion == null)
            {
                throw new ApplicationException($"Suggestion with ID {suggestionId} not found.");
            }
            if (suggestion.Status != SuggestionStatus.Pending)
            {
                throw new ApplicationException("Only pending suggestions can be updated.");
            }
            if (string.IsNullOrWhiteSpace(newPhrase))
            {
                throw new ArgumentException("New phrase cannot be empty.", nameof(newPhrase));
            }

            suggestion.Phrase = newPhrase;
            await _suggestionRepository.UpdateSuggestionAsync(suggestion);
            return await MapToSuggestionResponseDto(suggestion);
        }

        // Helper to map Suggestion entity to SuggestionResponseDto
        private async Task<SuggestionResponseDto> MapToSuggestionResponseDto(Suggestion suggestion)
        {
            string suggestedByUserName = "Unknown";
            if (suggestion.SuggestedByUserId > 0)
            {
                var user = await _userRepository.GetUserByIdAsync(suggestion.SuggestedByUserId);
                suggestedByUserName = user?.Username ?? "Unknown";
            }

            return new SuggestionResponseDto
            {
                Id = suggestion.Id,
                Phrase = suggestion.Phrase,
                SuggestedByUserName = suggestedByUserName,
                CreatedAt = suggestion.CreatedAt,
                Status = suggestion.Status
            };
        }
    }
}
