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
            RecipeEntity? existingRecipe = await repository.GetByIdAsync(input.Id);
            
            if (existingRecipe == null)
            {
                return DeleteRecipeUseCaseOutput.Failure($"Recipe with ID '{input.Id}' not found.");
            }

            bool deleted = await repository.DeleteAsync(input.Id);
            
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
