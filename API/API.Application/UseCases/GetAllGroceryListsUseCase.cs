using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class GetAllGroceryListsUseCase(ICosmosDbRepository<GroceryListEntity> repository)
{
    public async Task<GetAllGroceryListsUseCaseOutput> Execute(GetAllGroceryListsUseCaseInput input)
    {
        try
        {
            ICollection<GroceryListEntity> groceryLists = await repository.GetAllAsync();
            return GetAllGroceryListsUseCaseOutput.Success(groceryLists.ToList());
        }
        catch (Exception ex)
        {
            return GetAllGroceryListsUseCaseOutput.Failure(ex.Message);
        }
    }
}
