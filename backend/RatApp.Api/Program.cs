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
using Npgsql.EntityFrameworkCore.PostgreSQL; // Added for UseNpgsql
using System.Security.Claims; // Required for ClaimTypes
using RatApp.Api.Hubs; // Added for GameHub

var builder = WebApplication.CreateBuilder(args);



// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString); // Changed from UseSqlServer to UseNpgsql
});

builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSignalR(); // Add SignalR services

const string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5211", 
                                             "http://130.61.245.147",
                                             "https://130.61.245.147",
                                             "http://130.61.245.147:5211")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials(); // Allow credentials for JWT
                      });
});


builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<PlayerService>(); // Re-register PlayerService
builder.Services.AddScoped<BingoService>();
builder.Services.AddScoped<IGameRepository, GameRepository>(); // New: Register GameRepository
builder.Services.AddScoped<GameService>(); // New: Register GameService
builder.Services.AddScoped<IUserRepository, UserRepository>(); // New: Register UserRepository
builder.Services.AddHttpClient(); // Add HttpClient for PlayerService

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false, // For now, we are not validating audience
            RoleClaimType = ClaimTypes.Role // Explicitly set the role claim type
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                // If the request is for our hub...
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/gamehub")))
                {
                    // Read the token out of the query string
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
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
app.MapHub<GameHub>("/gamehub"); // Map SignalR GameHub

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Ensure the database is created and migrations are applied (optional, but good for dev)
        // context.Database.Migrate();

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

    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
