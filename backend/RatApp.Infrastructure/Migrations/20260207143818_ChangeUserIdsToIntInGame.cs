using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    public partial class ChangeUserIdsToIntInGame : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE ""Games"" ALTER COLUMN ""Player2UserId"" TYPE integer USING ""Player2UserId""::integer;"
            );
            migrationBuilder.Sql(
                @"ALTER TABLE ""Games"" ALTER COLUMN ""CreatedByUserId"" TYPE integer USING ""CreatedByUserId""::integer;"
            );
        }
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Player2UserId",
                table: "Games",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedByUserId",
                table: "Games",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
