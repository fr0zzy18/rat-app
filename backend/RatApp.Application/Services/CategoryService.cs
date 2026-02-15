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
        private readonly PlayerService _playerService; // New: PlayerService dependency

        public CategoryService(ICategoryRepository categoryRepository, PlayerService playerService)
        {
            _categoryRepository = categoryRepository;
            _playerService = playerService; // Inject PlayerService
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

        // New method to delete a category, with check for associated players
        public async Task<bool> DeleteCategoryAsync(int categoryId)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(categoryId);
            if (category == null)
            {
                return false; // Category not found
            }

            if (await _playerService.DoesCategoryHavePlayersAsync(category.Name))
            {
                throw new InvalidOperationException("Category must be empty before it can be deleted.");
            }

            await _categoryRepository.DeleteCategoryAsync(categoryId);
            return true;
        }
    }
}
