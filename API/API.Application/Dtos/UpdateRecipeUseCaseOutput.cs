using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

/// <summary>
/// Output for the UpdateRecipe use case
/// </summary>
/// <param name="Recipe">The updated recipe entity</param>
/// <param name="IsSuccess">Indicates if the operation was successful</param>
/// <param name="ErrorMessage">Error message if the operation failed</param>
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
