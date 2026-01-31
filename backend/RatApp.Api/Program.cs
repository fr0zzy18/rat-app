using Microsoft.EntityFrameworkCore;
using RatApp.Infrastructure.Persistence;
using RatApp.Core.Interfaces;
using RatApp.Infrastructure.Services;
using RatApp.Application.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.DependencyInjection; // For CreateScope and GetRequiredService
using Microsoft.Extensions.Logging; // For ILogger
using System; // For Exception and Console
using System.Linq; // For Any
using System.Threading.Tasks; // For async/await
using RatApp.Core.Entities; // Added for User, Role, UserRole
using System.Text.Json.Serialization; // Added for ReferenceHandler

var builder = WebApplication.CreateBuilder(args);



// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

const string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:4200", "http://localhost:5211") // Angular app URL and API URL
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials(); // Allow credentials for JWT
                      });
});


builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<PlayerService>(); // Register PlayerService

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false // For now, we are not validating audience
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins); // Enable CORS middleware

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Ensure the database is created and migrations are applied (optional, but good for dev)
        context.Database.Migrate();

        // Seed roles if they don't exist
        var adminRole = await context.Roles.SingleOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole == null)
        {
            adminRole = new Role { Name = "Admin" };
            context.Roles.Add(adminRole);
        }

        var managerRole = await context.Roles.SingleOrDefaultAsync(r => r.Name == "Manager");
        if (managerRole == null)
        {
            managerRole = new Role { Name = "Manager" };
            context.Roles.Add(managerRole);
        }

        var playerRole = await context.Roles.SingleOrDefaultAsync(r => r.Name == "Player");
        if (playerRole == null)
        {
            playerRole = new Role { Name = "Player" };
            context.Roles.Add(playerRole);
        }
        await context.SaveChangesAsync();

        // Seed Admin user if not exists
        if (!context.Users.Any(u => u.Username == "admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(""), // Default password for testing (should be handled securely)
                IsActive = true
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = managerRole.Id });
            await context.SaveChangesAsync();

            Console.WriteLine("Seeded Admin user with Admin and Manager roles.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
