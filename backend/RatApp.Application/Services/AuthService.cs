using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using RatApp.Infrastructure.Persistence;
using System.Collections.Generic;

namespace RatApp.Application.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(AppDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto?> Login(LoginDto loginDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles!)
                .ThenInclude(ur => ur.Role!)
                .SingleOrDefaultAsync(u => u.Username == loginDto.Username);

            if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return null;
            }
            if (!user.IsActive)
            {
                return null;
            }

            var accessToken = _tokenService.CreateToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Username = user.Username!
            };
        }

        public async Task<AuthResponseDto?> RefreshToken(RefreshTokenRequestDto refreshTokenRequestDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles!)
                .ThenInclude(ur => ur.Role!)
                .SingleOrDefaultAsync(u => u.RefreshToken == refreshTokenRequestDto.RefreshToken);

            if (user == null || user.RefreshTokenExpiry <= DateTime.UtcNow)
            {
                return null;
            }

            var newAccessToken = _tokenService.CreateToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                Username = user.Username!
            };
        }

        public async Task<bool> RevokeToken(string refreshToken)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.RefreshToken == refreshToken);
            if (user == null) return false;

            user.RefreshToken = null;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UserExists(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<User?> Register(RegisterWithRoleDto registerDto)
        {
            if (await UserExists(registerDto.Username!))
            {
                return null;
            }

            var user = new User
            {
                Username = registerDto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                IsActive = true
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var roleToAssign = await _context.Roles.SingleOrDefaultAsync(r => r.Name == registerDto.RoleName);

            if (roleToAssign == null)
            {
                roleToAssign = await _context.Roles.SingleAsync(r => r.Name == "Player");
            }

            _context.UserRoles!.Add(new UserRole { UserId = user.Id, RoleId = roleToAssign.Id });
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<List<string>> GetRolesAsync()
        {
            return await _context.Roles.Select(r => r.Name!).ToListAsync();
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles!)
                .ThenInclude(ur => ur.Role!)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles!.Select(ur => ur.Role!.Name!).ToList()
                })
                .ToListAsync();
        }

        public async Task<UserDto?> UpdateUserUsernameAsync(UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(updateUserDto.UserId);
            if (user == null)
            {
                return null;
            }

            if (await UserExists(updateUserDto.Username!))
            {
                return null;
            }

            user.Username = updateUserDto.Username;
            await _context.SaveChangesAsync();
            return await _context.Users
                .Include(u => u.UserRoles!)
                .ThenInclude(ur => ur.Role!)
                .Where(u => u.Id == user.Id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles!.Select(ur => ur.Role!.Name!).ToList()
                })
                .SingleOrDefaultAsync();
        }

        public async Task<UserDto?> UpdateUserRoleAsync(UpdateUserRoleDto updateUserRoleDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles!)
                .SingleOrDefaultAsync(u => u.Id == updateUserRoleDto.UserId);
            if (user == null)
            {
                return null;
            }

            var newRole = await _context.Roles.SingleOrDefaultAsync(r => r.Name == updateUserRoleDto.RoleName);
            if (newRole == null)
            {
                return null;
            }
            _context.UserRoles!.RemoveRange(user.UserRoles!);
            user.UserRoles!.Add(new UserRole { UserId = user.Id, RoleId = newRole.Id });
            await _context.SaveChangesAsync();
            return await _context.Users
                .Include(u => u.UserRoles!)
                .ThenInclude(ur => ur.Role!)
                .Where(u => u.Id == user.Id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles!.Select(ur => ur.Role!.Name!).ToList()
                })
                .SingleOrDefaultAsync();
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }
            var userRoles = await _context.UserRoles!.Where(ur => ur.UserId == userId).ToListAsync();
            _context.UserRoles!.RemoveRange(userRoles);
            await _context.SaveChangesAsync();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
