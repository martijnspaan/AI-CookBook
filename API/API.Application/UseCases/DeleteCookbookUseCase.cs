using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class DeleteCookbookUseCase(ICosmosDbRepository<CookbookEntity> repository)
{
    public async Task<DeleteCookbookUseCaseOutput> Execute(DeleteCookbookUseCaseInput input)
    {
        try
        {
            ICollection<CookbookEntity> cookbooks = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", input.Id } });
            CookbookEntity? existingCookbook = cookbooks.FirstOrDefault();
            
            if (existingCookbook == null)
            {
                return DeleteCookbookUseCaseOutput.Failure("Cookbook not found");
            }

            await repository.DeleteAsync(existingCookbook.Id);
            return DeleteCookbookUseCaseOutput.Success();
        }
        catch (Exception ex)
        {
            return DeleteCookbookUseCaseOutput.Failure(ex.Message);
        }
    }
}
