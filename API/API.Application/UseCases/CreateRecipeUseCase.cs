using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class CreateRecipeUseCase(ICosmosDbRepository<RecipeEntity> repository)
{
    public async Task<CreateRecipeUseCaseOutput> Execute(CreateRecipeUseCaseInput input)
    {
        try
        {
            var recipe = new RecipeEntity
            {
                Title = input.Title,
                Description = input.Description,
                Tags = input.Tags,
                Ingredients = input.Ingredients,
                Recipe = input.Recipe
            };

            recipe.UpdatePartitionKey();
            
            // Debug: Log the ID before sending to repository
            Console.WriteLine($"DEBUG: Recipe ID before create: '{recipe.Id}'");
            Console.WriteLine($"DEBUG: Recipe PartitionKey: '{recipe.PartitionKey}'");
            
            // Debug: Serialize the entity to see what's being sent
            var json = System.Text.Json.JsonSerializer.Serialize(recipe, new System.Text.Json.JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            Console.WriteLine($"DEBUG: Serialized entity: {json}");

            var createdRecipe = await repository.CreateAsync(recipe);
            return CreateRecipeUseCaseOutput.Success(createdRecipe);
        }
        catch (Exception ex)
        {
            return CreateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
