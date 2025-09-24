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
            // First, we need to find the recipe by querying since we only have the ID
            // We'll use a query to find the recipe by ID
            var query = "SELECT * FROM c WHERE c.id = @id";
            var queryParameters = new Dictionary<string, object> { { "id", input.Id } };
            
            var recipes = await repository.QueryAsync(query, queryParameters);
            var existingRecipe = recipes.FirstOrDefault();
            
            if (existingRecipe == null)
            {
                return DeleteRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }

            // Debug: Log the actual partition key from the database
            Console.WriteLine($"DEBUG: Found recipe with ID '{existingRecipe.Id}', Title '{existingRecipe.Title}', PartitionKey '{existingRecipe.PartitionKey}'");

            // Use the actual partition key from the database (could be title for old recipes or "recipes" for new ones)
            bool deleted = await repository.DeleteAsync(input.Id, existingRecipe.PartitionKey);
            
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
