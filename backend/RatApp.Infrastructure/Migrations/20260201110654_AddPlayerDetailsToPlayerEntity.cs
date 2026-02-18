using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerDetailsToPlayerEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActiveSpecName",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ActiveSpecRole",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Class",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Faction",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Race",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActiveSpecName",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "ActiveSpecRole",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Class",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Faction",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "Race",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Players");
        }
    }
}
