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
            RecipeEntity? existingRecipe = await repository.GetByIdAsync(input.Id);
            
            if (existingRecipe == null)
            {
                return UpdateRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }
            
            existingRecipe.Title = input.Title;
            existingRecipe.Description = input.Description;
            existingRecipe.Tags = input.Tags;
            existingRecipe.Ingredients = input.Ingredients;
            existingRecipe.Recipe = input.Recipe;
            existingRecipe.CookbookId = input.CookbookId;
            existingRecipe.Page = input.Page;
            existingRecipe.MealTypes = input.MealTypes ?? new List<string>();
            if (input.ServingSize.HasValue)
            {
                existingRecipe.ServingSize = input.ServingSize.Value;
            }
            existingRecipe.UpdateTimestamp();
            
            RecipeEntity updatedRecipe = await repository.UpdateAsync(existingRecipe);
            
            return UpdateRecipeUseCaseOutput.Success(updatedRecipe);
        }
        catch (Exception ex)
        {
            return UpdateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
