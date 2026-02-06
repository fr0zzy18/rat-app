namespace RatApp.Application.Dtos
{
    public class BingoCardDto
    {
        public int Id { get; set; }
        public string Phrase { get; set; } = string.Empty;
    }

    public class CreateBingoCardDto
    {
        public string Phrase { get; set; } = string.Empty;
    }
}
