using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record UpdateRecipeUseCaseInput(
    string Id,
    string Title,
    string Description,
    List<string> Tags,
    List<Ingredient> Ingredients,
    List<string> Recipe,
    string? CookbookId = null);
