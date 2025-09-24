using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

/// <summary>
/// Input for the CreateRecipe use case
/// </summary>
/// <param name="Title">The title of the recipe</param>
/// <param name="Description">The description of the recipe</param>
/// <param name="Tags">List of tags for the recipe</param>
/// <param name="Ingredients">List of ingredients for the recipe</param>
/// <param name="Recipe">List of recipe steps</param>
public record CreateRecipeUseCaseInput(
    string Title,
    string Description,
    List<string> Tags,
    List<Ingredient> Ingredients,
    List<string> Recipe);
