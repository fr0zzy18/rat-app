using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Infrastructure.Persistence;

namespace RatApp.Application.Services
{
    public class BingoService
    {
        private readonly AppDbContext _context;

        public BingoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<BingoCardDto> CreateBingoCardAsync(CreateBingoCardDto createBingoCardDto)
        {
            var bingoCard = new BingoCard
            {
                Phrase = createBingoCardDto.Phrase
            };

            _context.BingoCards.Add(bingoCard);
            await _context.SaveChangesAsync();

            return new BingoCardDto
            {
                Id = bingoCard.Id,
                Phrase = bingoCard.Phrase
            };
        }

        public async Task<List<BingoCardDto>> GetAllBingoCardsAsync()
        {
            return await _context.BingoCards
                .Select(bc => new BingoCardDto
                {
                    Id = bc.Id,
                    Phrase = bc.Phrase
                })
                .ToListAsync();
        }

        public async Task<bool> DeleteBingoCardAsync(int id)
        {
            var bingoCard = await _context.BingoCards.FindAsync(id);
            if (bingoCard == null)
            {
                return false; // Card not found
            }

            _context.BingoCards.Remove(bingoCard);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BingoCardDto?> UpdateBingoCardAsync(int id, UpdateBingoCardDto updateBingoCardDto)
        {
            var bingoCard = await _context.BingoCards.FindAsync(id);
            if (bingoCard == null)
            {
                return null; // Card not found
            }

            bingoCard.Phrase = updateBingoCardDto.Phrase;
            await _context.SaveChangesAsync();

            return new BingoCardDto
            {
                Id = bingoCard.Id,
                Phrase = bingoCard.Phrase
            };
        }
    }
}
