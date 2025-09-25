using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

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
