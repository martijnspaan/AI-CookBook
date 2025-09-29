using API.Application.Dtos;
using API.Application.UseCases;

namespace API.Application.Controllers;

public static class RecipeSettingsController
{
    public static void MapRecipeSettingsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // GET /api/recipesettings - Get recipe settings
        endpoints.MapGet("/api/recipesettings", async (GetRecipeSettingsUseCase getRecipeSettingsUseCase) =>
        {
            try
            {
                var settings = await getRecipeSettingsUseCase.ExecuteAsync();
                return Results.Json(settings);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("GetRecipeSettings")
        .WithOpenApi();

        // PUT /api/recipesettings - Update recipe settings
        endpoints.MapPut("/api/recipesettings", async (UpdateRecipeSettingsDto updateDto, UpdateRecipeSettingsUseCase updateRecipeSettingsUseCase) =>
        {
            try
            {
                if (updateDto == null)
                {
                    return Results.Json(new { error = "Update data is required" }, statusCode: 400);
                }

                var settings = await updateRecipeSettingsUseCase.ExecuteAsync(updateDto);
                return Results.Json(settings);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("UpdateRecipeSettings")
        .WithOpenApi();
    }
}
