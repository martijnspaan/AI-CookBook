using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateCookbookUseCaseOutput(CookbookEntity? Cookbook, bool IsSuccess, string? ErrorMessage = null)
{
    public static CreateCookbookUseCaseOutput Success(CookbookEntity cookbook)
    {
        return new CreateCookbookUseCaseOutput(cookbook, true);
    }

    public static CreateCookbookUseCaseOutput Failure(string errorMessage)
    {
        return new CreateCookbookUseCaseOutput(null, false, errorMessage);
    }
}
