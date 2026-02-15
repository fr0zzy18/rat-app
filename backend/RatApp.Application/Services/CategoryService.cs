using RatApp.Core.Entities;
using RatApp.Core.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System; // For InvalidOperationException

namespace RatApp.Application.Services
{
    public class CategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
        {
            return await _categoryRepository.GetAllCategoriesAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            return await _categoryRepository.GetCategoryByIdAsync(id);
        }

        public async Task<Category> AddCategoryAsync(string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                throw new ArgumentException("Category name cannot be empty or whitespace.", nameof(categoryName));
            }

            var existingCategory = await _categoryRepository.GetCategoryByNameAsync(categoryName);
            if (existingCategory != null)
            {
                throw new InvalidOperationException($"Category '{categoryName}' already exists.");
            }

            var category = new Category { Name = categoryName };
            await _categoryRepository.AddCategoryAsync(category);
            return category;
        }
    }
}
