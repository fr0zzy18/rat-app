using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBingoGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BingoPhrases");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "BingoGames");

            migrationBuilder.DropColumn(
                name: "CurrentTurnPlayerId",
                table: "BingoGames");

            migrationBuilder.DropColumn(
                name: "LastUpdatedAt",
                table: "BingoGames");

            migrationBuilder.DropColumn(
                name: "WinnerPlayerId",
                table: "BingoGames");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "BingoGames",
                newName: "Player2Card");

            migrationBuilder.RenameColumn(
                name: "Player2BoardState",
                table: "BingoGames",
                newName: "Player1Card");

            migrationBuilder.RenameColumn(
                name: "Player1BoardState",
                table: "BingoGames",
                newName: "GameState");

            migrationBuilder.AddColumn<string>(
                name: "CalledPhrases",
                table: "BingoGames",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GameId",
                table: "BingoGames",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CalledPhrases",
                table: "BingoGames");

            migrationBuilder.DropColumn(
                name: "GameId",
                table: "BingoGames");

            migrationBuilder.RenameColumn(
                name: "Player2Card",
                table: "BingoGames",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "Player1Card",
                table: "BingoGames",
                newName: "Player2BoardState");

            migrationBuilder.RenameColumn(
                name: "GameState",
                table: "BingoGames",
                newName: "Player1BoardState");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "BingoGames",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CurrentTurnPlayerId",
                table: "BingoGames",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdatedAt",
                table: "BingoGames",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "WinnerPlayerId",
                table: "BingoGames",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BingoPhrases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Phrase = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BingoPhrases", x => x.Id);
                });
        }
    }
}
