using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

/// <summary>
/// Output for the GetAllRecipes use case
/// </summary>
/// <param name="Recipes">List of recipe entities</param>
/// <param name="IsSuccess">Indicates if the operation was successful</param>
/// <param name="ErrorMessage">Error message if the operation failed</param>
public record GetAllRecipesUseCaseOutput(List<RecipeEntity> Recipes, bool IsSuccess, string? ErrorMessage = null)
{
    public static GetAllRecipesUseCaseOutput Success(List<RecipeEntity> recipes)
    {
        return new GetAllRecipesUseCaseOutput(recipes, true);
    }

    public static GetAllRecipesUseCaseOutput Failure(string errorMessage)
    {
        return new GetAllRecipesUseCaseOutput(new List<RecipeEntity>(), false, errorMessage);
    }
}
