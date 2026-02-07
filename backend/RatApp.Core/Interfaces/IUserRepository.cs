using RatApp.Core.Entities;
using System.Threading.Tasks;

namespace RatApp.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByIdAsync(int id);
    }
}
