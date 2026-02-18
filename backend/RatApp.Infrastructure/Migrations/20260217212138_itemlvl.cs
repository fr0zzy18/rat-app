using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class itemlvl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ItemLevelEquipped",
                table: "Players",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemLevelEquipped",
                table: "Players");
        }
    }
}
