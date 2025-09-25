using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record UpdateCookbookUseCaseOutput(CookbookEntity? Cookbook, bool IsSuccess, string? ErrorMessage = null)
{
    public static UpdateCookbookUseCaseOutput Success(CookbookEntity cookbook)
    {
        return new UpdateCookbookUseCaseOutput(cookbook, true);
    }

    public static UpdateCookbookUseCaseOutput Failure(string errorMessage)
    {
        return new UpdateCookbookUseCaseOutput(null, false, errorMessage);
    }
}
