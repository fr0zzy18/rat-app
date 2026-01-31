using System.ComponentModel.DataAnnotations;

namespace RatApp.Application.Dtos
{
    public class AddPlayerDto
    {
        [Required]
        public string Name { get; set; }
        public string Class { get; set; }
        public string Spec { get; set; }
        public string Role { get; set; }
        public string Faction { get; set; }
        public string Guild { get; set; }
        public string Static { get; set; }
    }
}
