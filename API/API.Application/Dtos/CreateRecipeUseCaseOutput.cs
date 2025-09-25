using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateRecipeUseCaseOutput(RecipeEntity? Recipe, bool IsSuccess, string? ErrorMessage = null)
{
    public static CreateRecipeUseCaseOutput Success(RecipeEntity recipe)
    {
        return new CreateRecipeUseCaseOutput(recipe, true);
    }

    public static CreateRecipeUseCaseOutput Failure(string errorMessage)
    {
        return new CreateRecipeUseCaseOutput(null, false, errorMessage);
    }
}
