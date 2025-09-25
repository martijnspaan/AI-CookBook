using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class GetAllCookbooksUseCase(ICosmosDbRepository<CookbookEntity> repository)
{
    public async Task<GetAllCookbooksUseCaseOutput> Execute(GetAllCookbooksUseCaseInput input)
    {
        try
        {
            ICollection<CookbookEntity> cookbooks = await repository.QueryAsync("SELECT * FROM c WHERE c.type = 'CookbookEntity'");
            return GetAllCookbooksUseCaseOutput.Success(cookbooks);
        }
        catch (Exception ex)
        {
            return GetAllCookbooksUseCaseOutput.Failure(ex.Message);
        }
    }
}
