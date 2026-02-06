using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using System.Collections.Generic;
using System.Security.Claims; // Required for User.FindFirstValue

namespace RatApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto) // Changed return type
        {
            var token = await _authService.Login(loginDto); // Changed variable name and expected return

            if (token == null)
            {
                return Unauthorized("Invalid credentials or inactive user.");
            }

            return Ok(token); // Return the raw token
        }

        [HttpPost("register")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult> Register(RegisterWithRoleDto registerDto)
        {
            var user = await _authService.Register(registerDto);
            if (user == null)
            {
                return BadRequest("Username is already taken or role is invalid.");
            }

            return CreatedAtAction(nameof(Register), new { id = user.Id }, user);
        }

        [HttpGet("roles")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<List<string>>> GetRoles()
        {
            var roles = await _authService.GetRolesAsync();
            return Ok(roles);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPut("users/username")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<UserDto>> UpdateUsername(UpdateUserDto updateUserDto)
        {
            var updatedUser = await _authService.UpdateUserUsernameAsync(updateUserDto);
            if (updatedUser == null)
            {
                return BadRequest("User not found or username already taken.");
            }
            return Ok(updatedUser);
        }

        [HttpPut("users/role")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<UserDto>> UpdateRole(UpdateUserRoleDto updateUserRoleDto)
        {
            var updatedUser = await _authService.UpdateUserRoleAsync(updateUserRoleDto);
            if (updatedUser == null)
            {
                return BadRequest("User not found or role not found.");
            }
            return Ok(updatedUser);
        }

        [HttpDelete("users/{userId}")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            var result = await _authService.DeleteUserAsync(userId);
            if (!result)
            {
                return NotFound("User not found.");
            }
            return NoContent();
        }

        [HttpPut("change-password")]
        [Authorize(Roles = "Admin,Manager,Player")] // Allow users to change their own password
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var authenticatedUserRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

            bool isAdminOrManager = authenticatedUserRoles.Contains("Admin") || authenticatedUserRoles.Contains("Manager");

            // If not Admin/Manager, ensure the user can only change their own password
            if (!isAdminOrManager && (authenticatedUserId == null || dto.UserId.ToString() != authenticatedUserId))
            {
                return Forbid("You are not authorized to change this user's password.");
            }
            // If Admin/Manager, they can change any user's password, so no further ID check needed here for them.
            // If a player, the check above covers it.

            var result = await _authService.ChangePasswordAsync(dto.UserId, dto.NewPassword);
            if (!result)
            {
                return BadRequest("Failed to change password. User might not exist.");
            }
            return Ok();
        }
    }
}
