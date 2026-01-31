using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Infrastructure.Persistence;

namespace RatApp.Application.Services
{
    public class PlayerService
    {
        private readonly AppDbContext _context;

        public PlayerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlayerDto>> GetAllPlayers()
        {
            return await _context.Players
                .Select(p => new PlayerDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Class = p.Class,
                    Spec = p.Spec,
                    Role = p.Role,
                    Faction = p.Faction,
                    Guild = p.Guild,
                    Static = p.Static
                })
                .ToListAsync();
        }

        public async Task<PlayerDto> AddPlayer(AddPlayerDto dto)
        {
            var player = new Player
            {
                Name = dto.Name,
                Class = dto.Class,
                Spec = dto.Spec,
                Role = dto.Role,
                Faction = dto.Faction,
                Guild = dto.Guild,
                Static = dto.Static
            };

            _context.Players.Add(player);
            await _context.SaveChangesAsync();

            return new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                Class = player.Class,
                Spec = player.Spec,
                Role = player.Role,
                Faction = player.Faction,
                Guild = player.Guild,
                Static = player.Static
            };
        }

        public async Task<PlayerDto> UpdatePlayer(PlayerDto dto)
        {
            var player = await _context.Players.FindAsync(dto.Id);
            if (player == null)
            {
                return null;
            }

            player.Name = dto.Name;
            player.Class = dto.Class;
            player.Spec = dto.Spec;
            player.Role = dto.Role;
            player.Faction = dto.Faction;
            player.Guild = dto.Guild;
            player.Static = dto.Static;

            await _context.SaveChangesAsync();

            return new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                Class = player.Class,
                Spec = player.Spec,
                Role = player.Role,
                Faction = player.Faction,
                Guild = player.Guild,
                Static = player.Static
            };
        }

        public async Task<bool> DeletePlayer(int id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return false;
            }

            _context.Players.Remove(player);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
