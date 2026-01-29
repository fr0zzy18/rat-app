using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RatApp.Data;
using RatApp.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RatApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string jwtKey = "supersecret_jwt_key_12345_supersecure!"; // той самий ключ

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

[HttpPost("login")]
public IActionResult Login([FromBody] LoginRequest request)
{
    var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);
    if (user == null || user.PasswordHash != request.Password)
        return Unauthorized("Невірний логін або пароль");

    var key = Encoding.UTF8.GetBytes("this_is_a_very_long_super_secure_jwt_key_12345!");
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        }),
        Expires = DateTime.UtcNow.AddHours(2),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);
    var jwt = tokenHandler.WriteToken(token);

    return Ok(new { token = jwt }); // повертаємо рядок, а не об’єкт
}
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
