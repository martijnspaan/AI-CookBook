using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class GetAllRecipesUseCase(ICosmosDbRepository<RecipeEntity> repository)
{

    public async Task<GetAllRecipesUseCaseOutput> Execute(GetAllRecipesUseCaseInput input)
    {
        try
        {
            ICollection<RecipeEntity> recipes = await repository.GetAllAsync();
            return GetAllRecipesUseCaseOutput.Success(recipes.ToList());
        }
        catch (Exception ex)
        {
            return GetAllRecipesUseCaseOutput.Failure(ex.Message);
        }
    }
}
