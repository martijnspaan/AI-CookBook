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
            RecipeEntity recipe = new RecipeEntity
            {
                Title = input.Title,
                Description = input.Description,
                Tags = input.Tags,
                Ingredients = input.Ingredients,
                Recipe = input.Recipe,
                CookbookId = input.CookbookId,
                Page = input.Page,
                MealTypes = input.MealTypes ?? new List<string>()
            };

            RecipeEntity createdRecipe = await repository.CreateAsync(recipe);
            return CreateRecipeUseCaseOutput.Success(createdRecipe);
        }
        catch (Exception ex)
        {
            return CreateRecipeUseCaseOutput.Failure(ex.Message);
        }
    }
}
