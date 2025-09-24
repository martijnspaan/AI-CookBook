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
            Console.WriteLine($"DEBUG: Looking for recipe with ID '{input.Id}'");
            
            // First, we need to find the existing recipe by querying since we only have the ID
            // We'll use a query to find the recipe by ID
            var query = "SELECT * FROM c WHERE c.id = @id";
            var queryParameters = new Dictionary<string, object> { { "id", input.Id } };
            
            var recipes = await repository.QueryAsync(query, queryParameters);
            Console.WriteLine($"DEBUG: Query returned {recipes.Count} recipes");
            
            var existingRecipe = recipes.FirstOrDefault();
            
            if (existingRecipe == null)
            {
                Console.WriteLine($"DEBUG: No recipe found with ID '{input.Id}'");
                return UpdateRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }
            
            Console.WriteLine($"DEBUG: Found recipe with ID '{existingRecipe.Id}', PartitionKey '{existingRecipe.PartitionKey}', Title '{existingRecipe.Title}'");

            // Store the original partition key to use for the update
            var originalPartitionKey = existingRecipe.PartitionKey;
            
            // Update the existing recipe with new data while preserving metadata
            existingRecipe.Title = input.Title;
            existingRecipe.Description = input.Description;
            existingRecipe.Tags = input.Tags;
            existingRecipe.Ingredients = input.Ingredients;
            existingRecipe.Recipe = input.Recipe;
            existingRecipe.UpdateTimestamp();
            
            // Use the new fixed partition key for all updates going forward
            // This will handle both existing recipes (by updating their partition key) and new ones
            existingRecipe.PartitionKey = "recipes";
            
            Console.WriteLine($"DEBUG: About to upsert recipe with ID '{existingRecipe.Id}' and PartitionKey '{existingRecipe.PartitionKey}'");
            
            // Use UpsertAsync which is more forgiving and can handle partition key changes
            var updatedRecipe = await repository.UpsertAsync(existingRecipe);
            
            Console.WriteLine($"DEBUG: Successfully upserted recipe with ID '{updatedRecipe.Id}'");
            return UpdateRecipeUseCaseOutput.Success(updatedRecipe);
        }
        catch (Exception ex)
        {
            return UpdateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
