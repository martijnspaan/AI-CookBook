using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record GetAllCookbooksUseCaseOutput(ICollection<CookbookEntity> Cookbooks, bool IsSuccess, string? ErrorMessage = null)
{
    public static GetAllCookbooksUseCaseOutput Success(ICollection<CookbookEntity> cookbooks)
    {
        return new GetAllCookbooksUseCaseOutput(cookbooks, true);
    }

    public static GetAllCookbooksUseCaseOutput Failure(string errorMessage)
    {
        return new GetAllCookbooksUseCaseOutput(new List<CookbookEntity>(), false, errorMessage);
    }
}
