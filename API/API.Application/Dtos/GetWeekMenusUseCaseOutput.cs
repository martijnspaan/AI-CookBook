using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record GetWeekMenusUseCaseOutput(ICollection<WeekMenuEntity> WeekMenus, bool IsSuccess, string? ErrorMessage = null)
{
    public static GetWeekMenusUseCaseOutput Success(ICollection<WeekMenuEntity> weekMenus)
    {
        return new GetWeekMenusUseCaseOutput(weekMenus, true);
    }

    public static GetWeekMenusUseCaseOutput Failure(string errorMessage)
    {
        return new GetWeekMenusUseCaseOutput(new List<WeekMenuEntity>(), false, errorMessage);
    }
}
