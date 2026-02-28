using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    public partial class AddBoardLayoutsToGame : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<int>>(
                name: "Player1BoardLayout",
                table: "Games",
                type: "integer[]",
                nullable: true);

            migrationBuilder.AddColumn<List<int>>(
                name: "Player2BoardLayout",
                table: "Games",
                type: "integer[]",
                nullable: true);
        }
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Player1BoardLayout",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Player2BoardLayout",
                table: "Games");
        }
    }
}
