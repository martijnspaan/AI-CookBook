using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

/// <summary>
/// Output for the CreateRecipe use case
/// </summary>
/// <param name="Recipe">The created recipe entity</param>
/// <param name="IsSuccess">Indicates if the operation was successful</param>
/// <param name="ErrorMessage">Error message if the operation failed</param>
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
