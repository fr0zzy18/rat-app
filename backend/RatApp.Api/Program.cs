using Microsoft.EntityFrameworkCore;
using RatApp.Infrastructure.Persistence;
using RatApp.Core.Interfaces;
using RatApp.Infrastructure.Services;
using RatApp.Application.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using RatApp.Core.Entities;
using System.Text.Json.Serialization;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using System.Security.Claims;
using RatApp.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

const string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:4200", 
                                             "http://130.61.245.147",
                                             "https://130.61.245.147",
                                             "http://130.61.245.147:4200")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                      });
});


builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<PlayerService>();
builder.Services.AddScoped<BingoService>();
builder.Services.AddScoped<IGameRepository, GameRepository>();
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddHttpClient();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false,
            RoleClaimType = ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/gamehub")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gamehub");
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
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
