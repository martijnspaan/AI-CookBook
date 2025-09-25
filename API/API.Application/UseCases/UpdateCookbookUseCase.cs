using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class UpdateCookbookUseCase(ICosmosDbRepository<CookbookEntity> repository)
{
    public async Task<UpdateCookbookUseCaseOutput> Execute(UpdateCookbookUseCaseInput input)
    {
        try
        {
            ICollection<CookbookEntity> cookbooks = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", input.Id } });
            CookbookEntity? existingCookbook = cookbooks.FirstOrDefault();
            
            if (existingCookbook == null)
            {
                return UpdateCookbookUseCaseOutput.Failure("Cookbook not found");
            }

            existingCookbook.Title = input.Title;
            existingCookbook.Author = input.Author;
            existingCookbook.UpdateTimestamp();

            CookbookEntity updatedCookbook = await repository.UpdateAsync(existingCookbook);
            return UpdateCookbookUseCaseOutput.Success(updatedCookbook);
        }
        catch (Exception ex)
        {
            return UpdateCookbookUseCaseOutput.Failure(ex.Message);
        }
    }
}
