namespace API.Application.Dtos;

/// <summary>
/// Input for the DeleteRecipe use case
/// </summary>
/// <param name="Id">The ID of the recipe to delete</param>
public record DeleteRecipeUseCaseInput(string Id);
