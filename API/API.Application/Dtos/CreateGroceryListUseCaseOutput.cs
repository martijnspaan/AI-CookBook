using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateGroceryListUseCaseOutput(GroceryListEntity? GroceryList, bool IsSuccess, string? ErrorMessage = null)
{
    public static CreateGroceryListUseCaseOutput Success(GroceryListEntity groceryList)
    {
        return new CreateGroceryListUseCaseOutput(groceryList, true);
    }

    public static CreateGroceryListUseCaseOutput Failure(string errorMessage)
    {
        return new CreateGroceryListUseCaseOutput(null, false, errorMessage);
    }
}
