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
            // First, we need to find the existing recipe by querying since we only have the ID
            // We'll use a query to find the recipe by ID
            var query = "SELECT * FROM c WHERE c.id = @id";
            var queryParameters = new Dictionary<string, object> { { "id", input.Id } };
            
            var recipes = await repository.QueryAsync(query, queryParameters);
            var existingRecipe = recipes.FirstOrDefault();
            
            if (existingRecipe == null)
            {
                return UpdateRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }

            var recipe = new RecipeEntity
            {
                Id = input.Id,
                Title = input.Title,
                Description = input.Description,
                Tags = input.Tags,
                Ingredients = input.Ingredients,
                Recipe = input.Recipe
            };

            recipe.UpdatePartitionKey();

            var updatedRecipe = await repository.UpdateAsync(recipe);
            return UpdateRecipeUseCaseOutput.Success(updatedRecipe);
        }
        catch (Exception ex)
        {
            return UpdateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
