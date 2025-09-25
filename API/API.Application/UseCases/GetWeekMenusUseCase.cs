using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class GetWeekMenusUseCase(ICosmosDbRepository<WeekMenuEntity> repository)
{
    public async Task<GetWeekMenusUseCaseOutput> Execute(GetWeekMenusUseCaseInput input)
    {
        try
        {
            DateTime currentDate = DateTime.Now;
            int currentWeek = GetWeekOfYear(currentDate);
            int currentYear = currentDate.Year;

            // Get current week and next 2 weeks
            List<WeekMenuEntity> weekMenus = new List<WeekMenuEntity>();
            
            for (int i = 0; i < 3; i++)
            {
                int targetWeek = currentWeek + i;
                int targetYear = currentYear;
                
                // Handle year rollover
                if (targetWeek > 52)
                {
                    targetWeek = targetWeek - 52;
                    targetYear = currentYear + 1;
                }

                ICollection<WeekMenuEntity> weekMenusForWeek = await repository.QueryAsync(
                    "SELECT * FROM c WHERE c.WeekNumber = @weekNumber AND c.Year = @year",
                    new Dictionary<string, object> { { "weekNumber", targetWeek }, { "year", targetYear } });

                weekMenus.AddRange(weekMenusForWeek);
            }

            return GetWeekMenusUseCaseOutput.Success(weekMenus);
        }
        catch (Exception ex)
        {
            return GetWeekMenusUseCaseOutput.Failure(ex.Message);
        }
    }

    private static int GetWeekOfYear(DateTime date)
    {
        System.Globalization.CultureInfo culture = System.Globalization.CultureInfo.CurrentCulture;
        return culture.Calendar.GetWeekOfYear(date, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday);
    }
}
