using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;
using Microsoft.Extensions.Logging;

namespace API.Application.UseCases;

public class GetRecipeSettingsUseCase
{
    private readonly ICosmosDbRepository<RecipeSettingsEntity> _repository;
    private readonly ILogger<GetRecipeSettingsUseCase> _logger;

    public GetRecipeSettingsUseCase(
        ICosmosDbRepository<RecipeSettingsEntity> repository,
        ILogger<GetRecipeSettingsUseCase> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<RecipeSettingsDto?> ExecuteAsync()
    {
        try
        {
            _logger.LogInformation("Getting recipe settings");

            // Get the first (and should be only) recipe settings entity
            var settingsEntities = await _repository.GetAllAsync();
            var settingsEntity = settingsEntities.FirstOrDefault();

            if (settingsEntity == null)
            {
                _logger.LogInformation("No recipe settings found, returning null");
                return null;
            }

            var dto = new RecipeSettingsDto
            {
                Id = settingsEntity.Id,
                Tags = settingsEntity.Tags,
                Ingredients = settingsEntity.Ingredients,
                Units = settingsEntity.Units,
                Categories = settingsEntity.Categories,
                CreatedAt = settingsEntity.CreatedAt,
                UpdatedAt = settingsEntity.UpdatedAt
            };

            _logger.LogInformation("Successfully retrieved recipe settings");
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting recipe settings");
            throw;
        }
    }
}
