using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateRecipeUseCaseInput(
    string Title,
    string Description,
    List<string> Tags,
    List<Ingredient> Ingredients,
    List<string> Recipe,
    string? CookbookId = null,
    int? Page = null,
    List<string>? MealTypes = null,
    int ServingSize = 2);
