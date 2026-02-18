using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryToPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Players");
        }
    }
}
