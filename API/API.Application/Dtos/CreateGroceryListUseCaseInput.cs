namespace API.Application.Dtos;

public record CreateGroceryListUseCaseInput(
    string DayOfShopping,
    List<GroceryListMealInput> Meals);

public record GroceryListMealInput(
    string DayOfMeal, // This will be an ISO 8601 date string
    string MealType,
    string? RecipeId = null);
