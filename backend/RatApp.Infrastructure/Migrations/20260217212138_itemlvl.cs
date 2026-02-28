using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    public partial class itemlvl : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ItemLevelEquipped",
                table: "Players",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemLevelEquipped",
                table: "Players");
        }
    }
}
