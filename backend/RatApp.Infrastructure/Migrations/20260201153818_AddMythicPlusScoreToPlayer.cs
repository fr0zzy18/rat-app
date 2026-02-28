using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    public partial class AddMythicPlusScoreToPlayer : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "MythicPlusScore",
                table: "Players",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MythicPlusScore",
                table: "Players");
        }
    }
}
