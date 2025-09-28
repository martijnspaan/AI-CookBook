namespace API.Application.Dtos;

public record UpdateGroceryListUseCaseInput(
    string Id,
    string DayOfGrocery,
    List<GroceryListMealInput> Meals);
