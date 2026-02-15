using RatApp.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RatApp.Core.Interfaces
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllCategoriesAsync();
        Task<Category?> GetCategoryByIdAsync(int id); // Included for potential future use, though not strictly needed for this task
        Task<Category?> GetCategoryByNameAsync(string name);
        Task AddCategoryAsync(Category category);
        // DeleteCategoryAsync is omitted as per the current specific request
    }
}
