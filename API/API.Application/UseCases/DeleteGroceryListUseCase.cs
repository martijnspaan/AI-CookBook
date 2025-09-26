using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class DeleteGroceryListUseCase(ICosmosDbRepository<GroceryListEntity> repository)
{
    public async Task<DeleteGroceryListUseCaseOutput> Execute(DeleteGroceryListUseCaseInput input)
    {
        try
        {
            ICollection<GroceryListEntity> groceryLists = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", input.Id } });
            GroceryListEntity? existingGroceryList = groceryLists.FirstOrDefault();
            
            if (existingGroceryList == null)
            {
                return DeleteGroceryListUseCaseOutput.Failure("Grocery list not found");
            }

            await repository.DeleteAsync(existingGroceryList.Id);
            return DeleteGroceryListUseCaseOutput.Success();
        }
        catch (Exception ex)
        {
            return DeleteGroceryListUseCaseOutput.Failure(ex.Message);
        }
    }
}
