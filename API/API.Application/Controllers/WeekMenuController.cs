using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Controllers;

public static class WeekMenuController
{
    public static void MapWeekMenuEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // POST /api/weekmenus - Create or update a week menu
        endpoints.MapPost("/api/weekmenus", async (CreateOrUpdateWeekMenuUseCaseInput input, CreateOrUpdateWeekMenuUseCase createOrUpdateWeekMenuUseCase) =>
        {
            CreateOrUpdateWeekMenuUseCaseOutput output = await createOrUpdateWeekMenuUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.WeekMenu, statusCode: 201);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 400);
            }
        })
        .WithName("CreateOrUpdateWeekMenu")
        .WithOpenApi();

        // GET /api/weekmenus - Get week menus for current and upcoming two weeks
        endpoints.MapGet("/api/weekmenus", async (GetWeekMenusUseCase getWeekMenusUseCase) =>
        {
            GetWeekMenusUseCaseInput input = new GetWeekMenusUseCaseInput();
            GetWeekMenusUseCaseOutput output = await getWeekMenusUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.WeekMenus);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 500);
            }
        })
        .WithName("GetWeekMenus")
        .WithOpenApi();
    }
}
