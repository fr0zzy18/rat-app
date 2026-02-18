using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGameEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false),
                    Player1SelectedCardIds = table.Column<List<int>>(type: "integer[]", nullable: false),
                    Player1CheckedCardIds = table.Column<List<int>>(type: "integer[]", nullable: false),
                    Player2UserId = table.Column<string>(type: "text", nullable: true),
                    Player2SelectedCardIds = table.Column<List<int>>(type: "integer[]", nullable: true),
                    Player2CheckedCardIds = table.Column<List<int>>(type: "integer[]", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentTurn = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Games", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Games");
        }
    }
}
