using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record UpdateRecipeUseCaseOutput(RecipeEntity? Recipe, bool IsSuccess, string? ErrorMessage = null)
{
    public static UpdateRecipeUseCaseOutput Success(RecipeEntity recipe)
    {
        return new UpdateRecipeUseCaseOutput(recipe, true);
    }

    public static UpdateRecipeUseCaseOutput Failure(string errorMessage)
    {
        return new UpdateRecipeUseCaseOutput(null, false, errorMessage);
    }
}
