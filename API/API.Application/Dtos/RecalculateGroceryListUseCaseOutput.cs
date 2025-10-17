using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record RecalculateGroceryListUseCaseOutput
{
    public bool IsSuccess { get; init; }
    public string? ErrorMessage { get; init; }
    public GroceryListEntity? GroceryList { get; init; }

    public static RecalculateGroceryListUseCaseOutput Success(GroceryListEntity groceryList)
    {
        return new RecalculateGroceryListUseCaseOutput
        {
            IsSuccess = true,
            GroceryList = groceryList
        };
    }

    public static RecalculateGroceryListUseCaseOutput Failure(string errorMessage)
    {
        return new RecalculateGroceryListUseCaseOutput
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}
