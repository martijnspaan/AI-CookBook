using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class UpdateRecipeUseCase(ICosmosDbRepository<RecipeEntity> repository)
{
    public async Task<UpdateRecipeUseCaseOutput> Execute(UpdateRecipeUseCaseInput input)
    {
        try
        {
            // First, get the existing recipe by ID
            var existingRecipe = await repository.GetByIdAsync(input.Id);
            
            if (existingRecipe == null)
            {
                return UpdateRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }
            
            // Update the existing recipe with new data while preserving metadata
            existingRecipe.Title = input.Title;
            existingRecipe.Description = input.Description;
            existingRecipe.Tags = input.Tags;
            existingRecipe.Ingredients = input.Ingredients;
            existingRecipe.Recipe = input.Recipe;
            existingRecipe.UpdateTimestamp();
            
            // Use UpdateAsync which will use the ID as the partition key
            var updatedRecipe = await repository.UpdateAsync(existingRecipe);
            
            return UpdateRecipeUseCaseOutput.Success(updatedRecipe);
        }
        catch (Exception ex)
        {
            return UpdateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
