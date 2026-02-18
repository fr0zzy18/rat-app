using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStreamLinkToPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StreamLink",
                table: "Players",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StreamLink",
                table: "Players");
        }
    }
}
