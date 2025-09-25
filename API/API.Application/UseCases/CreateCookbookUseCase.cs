using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class CreateCookbookUseCase(ICosmosDbRepository<CookbookEntity> repository)
{
    public async Task<CreateCookbookUseCaseOutput> Execute(CreateCookbookUseCaseInput input)
    {
        try
        {
            CookbookEntity cookbook = new CookbookEntity
            {
                Title = input.Title
            };

            CookbookEntity createdCookbook = await repository.CreateAsync(cookbook);
            return CreateCookbookUseCaseOutput.Success(createdCookbook);
        }
        catch (Exception ex)
        {
            return CreateCookbookUseCaseOutput.Failure(ex.Message);
        }
    }
}
