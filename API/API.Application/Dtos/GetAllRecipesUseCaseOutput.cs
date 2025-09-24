using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public class GetAllRecipesUseCaseOutput
{
    public List<RecipeEntity> Recipes { get; set; } = new();
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }

    public static GetAllRecipesUseCaseOutput Success(List<RecipeEntity> recipes)
    {
        return new GetAllRecipesUseCaseOutput
        {
            Recipes = recipes,
            IsSuccess = true
        };
    }

    public static GetAllRecipesUseCaseOutput Failure(string errorMessage)
    {
        return new GetAllRecipesUseCaseOutput
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}
