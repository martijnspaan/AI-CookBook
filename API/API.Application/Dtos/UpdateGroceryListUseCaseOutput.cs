using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record UpdateGroceryListUseCaseOutput(GroceryListEntity? GroceryList, bool IsSuccess, string? ErrorMessage = null)
{
    public static UpdateGroceryListUseCaseOutput Success(GroceryListEntity groceryList)
    {
        return new UpdateGroceryListUseCaseOutput(groceryList, true);
    }

    public static UpdateGroceryListUseCaseOutput Failure(string errorMessage)
    {
        return new UpdateGroceryListUseCaseOutput(null, false, errorMessage);
    }
}
