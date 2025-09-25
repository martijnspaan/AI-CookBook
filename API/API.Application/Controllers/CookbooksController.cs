using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Entities;

namespace API.Application.Controllers;

public static class CookbooksController
{
    public static void MapCookbooksEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // GET /api/cookbooks - Get all cookbooks
        endpoints.MapGet("/api/cookbooks", async (GetAllCookbooksUseCase getAllCookbooksUseCase) =>
        {
            GetAllCookbooksUseCaseInput input = new GetAllCookbooksUseCaseInput();
            GetAllCookbooksUseCaseOutput output = await getAllCookbooksUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.Cookbooks);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 500);
            }
        })
        .WithName("GetCookbooks")
        .WithOpenApi();

        // GET /api/cookbooks/{id} - Get a specific cookbook
        endpoints.MapGet("/api/cookbooks/{id}", async (string id, ICosmosDbRepository<CookbookEntity> repository) =>
        {
            try
            {
                ICollection<CookbookEntity> cookbooks = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", id } });
                CookbookEntity? cookbook = cookbooks.FirstOrDefault();
                if (cookbook == null)
                {
                    return Results.Json(new { error = "Cookbook not found" }, statusCode: 404);
                }
                return Results.Json(cookbook);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("GetCookbook")
        .WithOpenApi();

        // POST /api/cookbooks - Create a new cookbook
        endpoints.MapPost("/api/cookbooks", async (CreateCookbookUseCaseInput input, CreateCookbookUseCase createCookbookUseCase) =>
        {
            CreateCookbookUseCaseOutput output = await createCookbookUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.Cookbook, statusCode: 201);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 400);
            }
        })
        .WithName("CreateCookbook")
        .WithOpenApi();

        // PUT /api/cookbooks/{id} - Update an existing cookbook
        endpoints.MapPut("/api/cookbooks/{id}", async (string id, UpdateCookbookUseCaseInput input, UpdateCookbookUseCase updateCookbookUseCase) =>
        {
            UpdateCookbookUseCaseInput updateInput = input with { Id = id };
            UpdateCookbookUseCaseOutput output = await updateCookbookUseCase.Execute(updateInput);

            if (output.IsSuccess)
            {
                return Results.Json(output.Cookbook);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("UpdateCookbook")
        .WithOpenApi();

        // DELETE /api/cookbooks/{id} - Delete a cookbook
        endpoints.MapDelete("/api/cookbooks/{id}", async (string id, DeleteCookbookUseCase deleteCookbookUseCase) =>
        {
            DeleteCookbookUseCaseInput input = new DeleteCookbookUseCaseInput(id);
            DeleteCookbookUseCaseOutput output = await deleteCookbookUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.NoContent();
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("DeleteCookbook")
        .WithOpenApi();
    }
}
