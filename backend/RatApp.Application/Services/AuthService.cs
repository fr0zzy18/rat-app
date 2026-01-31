using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using RatApp.Application.Dtos;
using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using RatApp.Infrastructure.Persistence; // Assuming AppDbContext is in Infrastructure.Persistence
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

        public async Task<UserDto> Login(LoginDto loginDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .SingleOrDefaultAsync(u => u.Username == loginDto.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return null; // Invalid credentials
            }

            // User is active check (optional, but good practice)
            if (!user.IsActive)
            {
                return null; // User is not active
            }

            var token = _tokenService.CreateToken(user);

            return new UserDto
            {
                Id = user.Id, // Added Id
                Username = user.Username,
                Token = token,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
            };
        }

        public async Task<bool> UserExists(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<User> Register(RegisterWithRoleDto registerDto)
        {
            if (await UserExists(registerDto.Username))
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
                // Default to Player role if specified role not found or not provided
                roleToAssign = await _context.Roles.SingleAsync(r => r.Name == "Player");
            }

            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleToAssign.Id });
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<List<string>> GetRolesAsync()
        {
            return await _context.Roles.Select(r => r.Name).ToListAsync();
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
                })
                .ToListAsync();
        }

        public async Task<UserDto> UpdateUserUsernameAsync(UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(updateUserDto.UserId);
            if (user == null)
            {
                return null; // User not found
            }

            if (await UserExists(updateUserDto.Username))
            {
                return null; // New username already exists
            }

            user.Username = updateUserDto.Username;
            await _context.SaveChangesAsync();

            // Return updated UserDto
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.Id == user.Id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
                })
                .SingleOrDefaultAsync();
        }

        public async Task<UserDto> UpdateUserRoleAsync(UpdateUserRoleDto updateUserRoleDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .SingleOrDefaultAsync(u => u.Id == updateUserRoleDto.UserId);
            if (user == null)
            {
                return null; // User not found
            }

            var newRole = await _context.Roles.SingleOrDefaultAsync(r => r.Name == updateUserRoleDto.RoleName);
            if (newRole == null)
            {
                return null; // Role not found
            }

            // Remove existing roles
            _context.UserRoles.RemoveRange(user.UserRoles);
            
            // Add new role
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = newRole.Id });
            await _context.SaveChangesAsync();

            // Return updated UserDto
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.Id == user.Id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
                })
                .SingleOrDefaultAsync();
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false; // User not found
            }

            // Delete associated UserRoles first
            var userRoles = await _context.UserRoles.Where(ur => ur.UserId == userId).ToListAsync();
            _context.UserRoles.RemoveRange(userRoles);
            await _context.SaveChangesAsync();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
