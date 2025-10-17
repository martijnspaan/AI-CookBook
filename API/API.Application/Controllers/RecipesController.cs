using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Entities;

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

        // GET /api/recipes/{id} - Get a specific recipe
        endpoints.MapGet("/api/recipes/{id}", async (string id, ICosmosDbRepository<RecipeEntity> repository) =>
        {
            try
            {
                ICollection<RecipeEntity> recipes = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", id } });
                RecipeEntity? recipe = recipes.FirstOrDefault();
                if (recipe == null)
                {
                    return Results.Json(new { error = "Recipe not found" }, statusCode: 404);
                }
                return Results.Json(recipe);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("GetRecipe")
        .WithOpenApi();

        // POST /api/recipes - Create a new recipe
        endpoints.MapPost("/api/recipes", async (CreateRecipeUseCaseInput input, CreateRecipeUseCase createRecipeUseCase) =>
        {
            try
            {
                CreateRecipeUseCaseOutput output = await createRecipeUseCase.Execute(input);

                if (output.IsSuccess && output.Recipe != null)
                {
                    return Results.Json(output.Recipe, statusCode: 201);
                }
                else
                {
                    return Results.Json(new { error = output.ErrorMessage ?? "Failed to create recipe" }, statusCode: 400);
                }
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("CreateRecipe")
        .WithOpenApi();

        // PUT /api/recipes/{id} - Update an existing recipe
        endpoints.MapPut("/api/recipes/{id}", async (string id, UpdateRecipeUseCaseInput input, UpdateRecipeUseCase updateRecipeUseCase) =>
        {
            UpdateRecipeUseCaseInput updateInput = input with { Id = id };
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

        // POST /api/recipes/upload - Upload a recipe directly as JSON
        endpoints.MapPost("/api/recipes/upload", async (RecipeEntity recipe, ICosmosDbRepository<RecipeEntity> repository) =>
        {
            try
            {
                RecipeEntity createdRecipe = await repository.CreateAsync(recipe);
                return Results.Json(createdRecipe, statusCode: 201);
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UploadRecipe")
        .WithOpenApi();
    }
}
