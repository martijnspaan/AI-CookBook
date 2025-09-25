namespace API.Application.Dtos;

public record CreateGroceryListUseCaseInput(
    string DayOfShopping,
    List<GroceryListMealInput> Meals);

public record GroceryListMealInput(
    string DayOfMeal,
    string MealType,
    string? RecipeId = null);
