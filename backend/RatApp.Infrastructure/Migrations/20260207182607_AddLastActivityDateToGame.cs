using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLastActivityDateToGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityDate",
                table: "Games",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastActivityDate",
                table: "Games");
        }
    }
}
