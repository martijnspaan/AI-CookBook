using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Dtos;

public record CreateOrUpdateWeekMenuUseCaseInput(
    int WeekNumber,
    int Year,
    List<WeekDay> WeekDays);
