using API.Application.Dtos;
using API.Application.UseCases;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Application.Controllers;

public static class GroceryListController
{
    public static void MapGroceryListEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // GET /api/grocerylists - Get all grocery lists
        endpoints.MapGet("/api/grocerylists", async (GetAllGroceryListsUseCase getAllGroceryListsUseCase) =>
        {
            GetAllGroceryListsUseCaseInput input = new GetAllGroceryListsUseCaseInput();
            GetAllGroceryListsUseCaseOutput output = await getAllGroceryListsUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.GroceryLists);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 500);
            }
        })
        .WithName("GetGroceryLists")
        .WithOpenApi();

        // GET /api/grocerylists/{id} - Get a specific grocery list
        endpoints.MapGet("/api/grocerylists/{id}", async (string id, ICosmosDbRepository<GroceryListEntity> repository) =>
        {
            try
            {
                ICollection<GroceryListEntity> groceryLists = await repository.QueryAsync("SELECT * FROM c WHERE c.id = @id", new Dictionary<string, object> { { "id", id } });
                GroceryListEntity? groceryList = groceryLists.FirstOrDefault();
                if (groceryList == null)
                {
                    return Results.Json(new { error = "Grocery list not found" }, statusCode: 404);
                }
                return Results.Json(groceryList);
            }
            catch (Exception ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        })
        .WithName("GetGroceryList")
        .WithOpenApi();

        // POST /api/grocerylists - Create a new grocery list
        endpoints.MapPost("/api/grocerylists", async (CreateGroceryListUseCaseInput input, CreateGroceryListUseCase createGroceryListUseCase) =>
        {
            CreateGroceryListUseCaseOutput output = await createGroceryListUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.Json(output.GroceryList, statusCode: 201);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 400);
            }
        })
        .WithName("CreateGroceryList")
        .WithOpenApi();

        // PUT /api/grocerylists/{id} - Update an existing grocery list
        endpoints.MapPut("/api/grocerylists/{id}", async (string id, UpdateGroceryListUseCaseInput input, UpdateGroceryListUseCase updateGroceryListUseCase) =>
        {
            UpdateGroceryListUseCaseInput updateInput = input with { Id = id };
            UpdateGroceryListUseCaseOutput output = await updateGroceryListUseCase.Execute(updateInput);

            if (output.IsSuccess)
            {
                return Results.Json(output.GroceryList);
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("UpdateGroceryList")
        .WithOpenApi();

        // DELETE /api/grocerylists/{id} - Delete a grocery list
        endpoints.MapDelete("/api/grocerylists/{id}", async (string id, [FromServices] DeleteGroceryListUseCase deleteGroceryListUseCase) =>
        {
            DeleteGroceryListUseCaseInput input = new DeleteGroceryListUseCaseInput(id);
            DeleteGroceryListUseCaseOutput output = await deleteGroceryListUseCase.Execute(input);

            if (output.IsSuccess)
            {
                return Results.NoContent();
            }
            else
            {
                return Results.Json(new { error = output.ErrorMessage }, statusCode: 404);
            }
        })
        .WithName("DeleteGroceryList")
        .WithOpenApi();
    }
}
