using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class DeleteRecipeUseCase(ICosmosDbRepository<RecipeEntity> repository)
{
    public async Task<DeleteRecipeUseCaseOutput> Execute(DeleteRecipeUseCaseInput input)
    {
        try
        {
            // First, check if the recipe exists
            var existingRecipe = await repository.GetByIdAsync(input.Id);
            
            if (existingRecipe == null)
            {
                return DeleteRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }

            // Delete the recipe using just the ID (partition key is automatically set to the ID)
            bool deleted = await repository.DeleteAsync(input.Id);
            
            if (deleted)
            {
                return DeleteRecipeUseCaseOutput.Success();
            }
            else
            {
                return DeleteRecipeUseCaseOutput.Failure($"Failed to delete recipe with ID '{input.Id}'.");
            }
        }
        catch (Exception ex)
        {
            return DeleteRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
