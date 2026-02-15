using RatApp.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RatApp.Core.Interfaces
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllCategoriesAsync();
        Task<Category?> GetCategoryByIdAsync(int id);
        Task<Category?> GetCategoryByNameAsync(string name);
        Task AddCategoryAsync(Category category);
        Task DeleteCategoryAsync(int id); // Added DeleteCategoryAsync
    }
}