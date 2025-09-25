using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateOrUpdateWeekMenuUseCaseOutput(WeekMenuEntity? WeekMenu, bool IsSuccess, string? ErrorMessage = null)
{
    public static CreateOrUpdateWeekMenuUseCaseOutput Success(WeekMenuEntity weekMenu)
    {
        return new CreateOrUpdateWeekMenuUseCaseOutput(weekMenu, true);
    }

    public static CreateOrUpdateWeekMenuUseCaseOutput Failure(string errorMessage)
    {
        return new CreateOrUpdateWeekMenuUseCaseOutput(null, false, errorMessage);
    }
}
