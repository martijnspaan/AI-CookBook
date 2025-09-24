using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.Controllers;

public static class RecipesController
{
    public static void MapRecipesEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/recipes", async (GetAllRecipesUseCase getAllRecipesUseCase) =>
        {
            var input = new GetAllRecipesUseCaseInput();
            var output = await getAllRecipesUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.Recipes);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 500);
            }
        })
        .WithName("GetRecipes")
        .WithOpenApi();
    }
}
