using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class CreateOrUpdateWeekMenuUseCase(ICosmosDbRepository<WeekMenuEntity> repository)
{
    public async Task<CreateOrUpdateWeekMenuUseCaseOutput> Execute(CreateOrUpdateWeekMenuUseCaseInput input)
    {
        try
        {
            // Check if a week menu already exists for this week and year
            ICollection<WeekMenuEntity> existingWeekMenus = await repository.QueryAsync(
                "SELECT * FROM c WHERE c.WeekNumber = @weekNumber AND c.Year = @year",
                new Dictionary<string, object> { { "weekNumber", input.WeekNumber }, { "year", input.Year } });

            WeekMenuEntity weekMenuEntity = existingWeekMenus.FirstOrDefault() ?? new WeekMenuEntity
            {
                WeekNumber = input.WeekNumber,
                Year = input.Year,
                WeekDays = input.WeekDays
            };

            // If updating existing, update the WeekDays
            if (existingWeekMenus.Any())
            {
                weekMenuEntity.WeekDays = input.WeekDays;
                WeekMenuEntity updatedWeekMenu = await repository.UpdateAsync(weekMenuEntity);
                return CreateOrUpdateWeekMenuUseCaseOutput.Success(updatedWeekMenu);
            }
            else
            {
                // Create new week menu
                WeekMenuEntity createdWeekMenu = await repository.CreateAsync(weekMenuEntity);
                return CreateOrUpdateWeekMenuUseCaseOutput.Success(createdWeekMenu);
            }
        }
        catch (Exception ex)
        {
            return CreateOrUpdateWeekMenuUseCaseOutput.Failure(ex.Message);
        }
    }
}
