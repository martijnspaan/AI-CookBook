using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class GetAllRecipesUseCase
{
    private readonly ICosmosDbRepository<RecipeEntity> _repository;

    public GetAllRecipesUseCase(ICosmosDbRepository<RecipeEntity> repository)
    {
        _repository = repository;
    }

    public async Task<GetAllRecipesUseCaseOutput> Execute(GetAllRecipesUseCaseInput input)
    {
        try
        {
            var recipes = await _repository.GetAllAsync();
            return GetAllRecipesUseCaseOutput.Success(recipes);
        }
        catch (Exception ex)
        {
            return GetAllRecipesUseCaseOutput.Failure(ex.Message);
        }
    }
}
