using RatApp.Core.Entities;

namespace RatApp.Core.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
