using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record GetAllGroceryListsUseCaseOutput(List<GroceryListEntity> GroceryLists, bool IsSuccess, string? ErrorMessage = null)
{
    public static GetAllGroceryListsUseCaseOutput Success(List<GroceryListEntity> groceryLists)
    {
        return new GetAllGroceryListsUseCaseOutput(groceryLists, true);
    }

    public static GetAllGroceryListsUseCaseOutput Failure(string errorMessage)
    {
        return new GetAllGroceryListsUseCaseOutput(new List<GroceryListEntity>(), false, errorMessage);
    }
}
