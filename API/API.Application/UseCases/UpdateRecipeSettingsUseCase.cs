using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;
using Microsoft.Extensions.Logging;

namespace API.Application.UseCases;

public class UpdateRecipeSettingsUseCase
{
    private readonly ICosmosDbRepository<RecipeSettingsEntity> _repository;
    private readonly ILogger<UpdateRecipeSettingsUseCase> _logger;

    public UpdateRecipeSettingsUseCase(
        ICosmosDbRepository<RecipeSettingsEntity> repository,
        ILogger<UpdateRecipeSettingsUseCase> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<RecipeSettingsDto> ExecuteAsync(UpdateRecipeSettingsDto updateDto)
    {
        try
        {
            _logger.LogInformation("Updating recipe settings");

            // Get existing settings or create new ones
            var settingsEntities = await _repository.GetAllAsync();
            var settingsEntity = settingsEntities.FirstOrDefault();

            if (settingsEntity == null)
            {
                _logger.LogInformation("No existing recipe settings found, creating new ones");
                settingsEntity = new RecipeSettingsEntity();
            }

            // Update the settings
            settingsEntity.Tags = updateDto.Tags;
            settingsEntity.Ingredients = updateDto.Ingredients;
            settingsEntity.Units = updateDto.Units;
            settingsEntity.Categories = updateDto.Categories;
            settingsEntity.UpdateTimestamp();

            // Save the settings
            var savedEntity = await _repository.UpsertAsync(settingsEntity);

            var dto = new RecipeSettingsDto
            {
                Id = savedEntity.Id,
                Tags = savedEntity.Tags,
                Ingredients = savedEntity.Ingredients,
                Units = savedEntity.Units,
                Categories = savedEntity.Categories,
                CreatedAt = savedEntity.CreatedAt,
                UpdatedAt = savedEntity.UpdatedAt
            };

            _logger.LogInformation("Successfully updated recipe settings");
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating recipe settings");
            throw;
        }
    }
}
