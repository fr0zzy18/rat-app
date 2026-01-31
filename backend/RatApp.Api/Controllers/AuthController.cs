using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RatApp.Application.Dtos;
using RatApp.Application.Services;
using System.Collections.Generic;

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
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var userDto = await _authService.Login(loginDto);

            if (userDto == null)
            {
                return Unauthorized("Invalid credentials or inactive user.");
            }

            return Ok(userDto);
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
    }
}
