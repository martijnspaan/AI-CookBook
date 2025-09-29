namespace API.Application.Dtos;

public record UpdateIngredientStateUseCaseInput(
    string GroceryListId,
    string IngredientName,
    string State
);
