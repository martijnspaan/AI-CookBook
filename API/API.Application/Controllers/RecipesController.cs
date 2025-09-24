using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.Controllers;

public static class RecipesController
{
    public static void MapRecipesEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // GET /api/recipes - Get all recipes
        endpoints.MapGet("/api/recipes", async (GetAllRecipesUseCase getAllRecipesUseCase) =>
        {
            GetAllRecipesUseCaseInput input = new GetAllRecipesUseCaseInput();
            GetAllRecipesUseCaseOutput output = await getAllRecipesUseCase.Execute(input);

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

        // POST /api/recipes - Create a new recipe
        endpoints.MapPost("/api/recipes", async (CreateRecipeUseCaseInput input, CreateRecipeUseCase createRecipeUseCase) =>
        {
            CreateRecipeUseCaseOutput output = await createRecipeUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.Recipe, statusCode: 201);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 400);
            }
        })
        .WithName("CreateRecipe")
        .WithOpenApi();

        // PUT /api/recipes/{id} - Update an existing recipe
        endpoints.MapPut("/api/recipes/{id}", async (string id, UpdateRecipeUseCaseInput input, UpdateRecipeUseCase updateRecipeUseCase) =>
        {
            // Ensure the ID from the route matches the input
            var updateInput = input with { Id = id };
            UpdateRecipeUseCaseOutput output = await updateRecipeUseCase.Execute(updateInput);

            if (output.IsSuccess)
            {
                return Results.Json(output.Recipe);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("UpdateRecipe")
        .WithOpenApi();

        // DELETE /api/recipes/{id} - Delete a recipe
        endpoints.MapDelete("/api/recipes/{id}", async (string id, DeleteRecipeUseCase deleteRecipeUseCase) =>
        {
            DeleteRecipeUseCaseInput input = new DeleteRecipeUseCaseInput(id);
            DeleteRecipeUseCaseOutput output = await deleteRecipeUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.NoContent();
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("DeleteRecipe")
        .WithOpenApi();
    }
}
