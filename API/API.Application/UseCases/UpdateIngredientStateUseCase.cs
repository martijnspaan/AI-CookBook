using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class UpdateIngredientStateUseCase
{
    private readonly ICosmosDbRepository<GroceryListEntity> _repository;

    public UpdateIngredientStateUseCase(ICosmosDbRepository<GroceryListEntity> repository)
    {
        _repository = repository;
    }

    public async Task<UpdateIngredientStateUseCaseOutput> Execute(UpdateIngredientStateUseCaseInput input)
    {
        try
        {
            // Get the grocery list
            var groceryLists = await _repository.QueryAsync(
                "SELECT * FROM c WHERE c.id = @id", 
                new Dictionary<string, object> { { "id", input.GroceryListId } }
            );
            
            var groceryList = groceryLists.FirstOrDefault();
            if (groceryList == null)
            {
                return new UpdateIngredientStateUseCaseOutput(false, "Grocery list not found");
            }

            // Find existing ingredient state or create new one
            var existingState = groceryList.IngredientsState.FirstOrDefault(
                s => s.IngredientName.Equals(input.IngredientName, StringComparison.OrdinalIgnoreCase)
            );

            if (existingState != null)
            {
                // Update existing state
                existingState.State = input.State;
            }
            else
            {
                // Add new ingredient state
                groceryList.IngredientsState.Add(new IngredientState(
                    input.IngredientName,
                    input.State
                ));
            }

            // Update the grocery list in the database
            await _repository.UpdateAsync(groceryList);

            return new UpdateIngredientStateUseCaseOutput(true, GroceryList: groceryList);
        }
        catch (Exception ex)
        {
            return new UpdateIngredientStateUseCaseOutput(false, ex.Message);
        }
    }
}
