using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeUserIdsToIntInGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // For Player2UserId (nullable to nullable), using "Player2UserId"::integer handles NULLs fine
            migrationBuilder.Sql(
                @"ALTER TABLE ""Games"" ALTER COLUMN ""Player2UserId"" TYPE integer USING ""Player2UserId""::integer;"
            );

            // For CreatedByUserId (non-nullable to non-nullable), ensure no NULLs in original column.
            // If there were any non-integer strings, this would fail. Assuming valid data.
            migrationBuilder.Sql(
                @"ALTER TABLE ""Games"" ALTER COLUMN ""CreatedByUserId"" TYPE integer USING ""CreatedByUserId""::integer;"
            );
        }

        /// <inheritdoc />
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
