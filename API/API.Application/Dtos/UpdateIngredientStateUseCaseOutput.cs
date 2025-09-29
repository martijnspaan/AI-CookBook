using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record UpdateIngredientStateUseCaseOutput(
    bool IsSuccess,
    string? ErrorMessage = null,
    GroceryListEntity? GroceryList = null
);
