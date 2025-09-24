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

            var createdRecipe = await repository.CreateAsync(recipe);
            return CreateRecipeUseCaseOutput.Success(createdRecipe);
        }
        catch (Exception ex)
        {
            return CreateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
