using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBingoGameEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BingoGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Player1Id = table.Column<int>(type: "integer", nullable: false),
                    Player2Id = table.Column<int>(type: "integer", nullable: true),
                    Player1BoardState = table.Column<string>(type: "text", nullable: false),
                    Player2BoardState = table.Column<string>(type: "text", nullable: false),
                    CurrentTurnPlayerId = table.Column<int>(type: "integer", nullable: true),
                    WinnerPlayerId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BingoGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BingoGames_Users_Player1Id",
                        column: x => x.Player1Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BingoGames_Users_Player2Id",
                        column: x => x.Player2Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BingoGames_Player1Id",
                table: "BingoGames",
                column: "Player1Id");

            migrationBuilder.CreateIndex(
                name: "IX_BingoGames_Player2Id",
                table: "BingoGames",
                column: "Player2Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BingoGames");
        }
    }
}
