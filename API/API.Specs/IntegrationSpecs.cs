using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;
using API.Infrastructure.CosmosDb.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using API.Application.Dtos;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;

namespace API.Specs;

/// <summary>
/// Integration tests for the AI Cookbook API
/// These tests run synchronously in the specified order to test the complete CRUD workflow
/// </summary>
public class IntegrationSpecs : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ApiWebApplicationFactory _factory;
    private string? _createdRecipeId;

    public IntegrationSpecs(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Test1_CreateRecipe_ShouldReturnCreatedRecipe()
    {
        // Arrange
        var newRecipe = new CreateRecipeUseCaseInput(
            Title: "SomeRecipe",
            Description: "A test recipe for integration testing",
            Tags: new List<string> { "test", "integration" },
            Ingredients: new List<Ingredient>
            {
                new("Flour", "dry", new Amount(2, "cups")),
                new("Eggs", "protein", new Amount(2, "pieces"))
            },
            Recipe: new List<string> { "Mix ingredients", "Bake at 350°F for 30 minutes" }
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/recipes", newRecipe);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        
        var createdRecipe = await response.Content.ReadFromJsonAsync<RecipeEntity>();
        createdRecipe.Should().NotBeNull();
        createdRecipe!.Title.Should().Be("SomeRecipe");
        createdRecipe.Description.Should().Be("A test recipe for integration testing");
        createdRecipe.Tags.Should().Contain("test");
        createdRecipe.Tags.Should().Contain("integration");
        createdRecipe.Ingredients.Should().HaveCount(2);
        createdRecipe.Recipe.Should().HaveCount(2);
        
        // Store the ID for subsequent tests
        _createdRecipeId = createdRecipe.Id;
    }

    [Fact]
    public async Task Test2_GetAllRecipes_ShouldContainCreatedRecipe()
    {
        // Act
        var response = await _client.GetAsync("/api/recipes");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var recipes = await response.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        recipes.Should().NotBeNull();
        recipes.Should().NotBeEmpty();
        
        var createdRecipe = recipes!.FirstOrDefault(r => r.Title == "SomeRecipe");
        createdRecipe.Should().NotBeNull();
        createdRecipe!.Title.Should().Be("SomeRecipe");
        
        // Verify the ID matches what we stored
        if (_createdRecipeId != null)
        {
            createdRecipe.Id.Should().Be(_createdRecipeId);
        }
    }

    [Fact]
    public async Task Test3_UpdateRecipe_ShouldReturnUpdatedRecipe()
    {
        // Skip if no recipe was created in previous test
        if (_createdRecipeId == null)
        {
            // Try to find the recipe by title as fallback
            var getAllResponse = await _client.GetAsync("/api/recipes");
            var allRecipes = await getAllResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
            var existingRecipe = allRecipes?.FirstOrDefault(r => r.Title == "SomeRecipe");
            
            if (existingRecipe == null)
            {
                throw new InvalidOperationException("No recipe found to update. Previous test may have failed.");
            }
            
            _createdRecipeId = existingRecipe.Id;
        }

        // Arrange
        var updateRecipe = new UpdateRecipeUseCaseInput(
            Id: _createdRecipeId,
            Title: "UpdatedRecipe",
            Description: "An updated test recipe for integration testing",
            Tags: new List<string> { "test", "integration", "updated" },
            Ingredients: new List<Ingredient>
            {
                new("Flour", "dry", new Amount(3, "cups")),
                new("Eggs", "protein", new Amount(3, "pieces")),
                new("Sugar", "sweetener", new Amount(1, "cup"))
            },
            Recipe: new List<string> { "Mix all ingredients", "Bake at 375°F for 35 minutes", "Let cool before serving" }
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/recipes/{_createdRecipeId}", updateRecipe);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var updatedRecipe = await response.Content.ReadFromJsonAsync<RecipeEntity>();
        updatedRecipe.Should().NotBeNull();
        updatedRecipe!.Title.Should().Be("UpdatedRecipe");
        updatedRecipe.Description.Should().Be("An updated test recipe for integration testing");
        updatedRecipe.Tags.Should().Contain("updated");
        updatedRecipe.Ingredients.Should().HaveCount(3);
        updatedRecipe.Recipe.Should().HaveCount(3);
    }

    [Fact]
    public async Task Test4_GetRecipeById_ShouldReturnUpdatedRecipe()
    {
        // Skip if no recipe ID available
        if (_createdRecipeId == null)
        {
            // Try to find the recipe by title as fallback
            var getAllResponse = await _client.GetAsync("/api/recipes");
            var allRecipes = await getAllResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
            var existingRecipe = allRecipes?.FirstOrDefault(r => r.Title == "UpdatedRecipe");
            
            if (existingRecipe == null)
            {
                throw new InvalidOperationException("No updated recipe found. Previous test may have failed.");
            }
            
            _createdRecipeId = existingRecipe.Id;
        }

        // Act
        var response = await _client.GetAsync($"/api/recipes/{_createdRecipeId}");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var recipe = await response.Content.ReadFromJsonAsync<RecipeEntity>();
        recipe.Should().NotBeNull();
        recipe!.Title.Should().Be("UpdatedRecipe");
        recipe.Description.Should().Be("An updated test recipe for integration testing");
        recipe.Tags.Should().Contain("updated");
        recipe.Ingredients.Should().HaveCount(3);
        recipe.Recipe.Should().HaveCount(3);
    }

    [Fact]
    public async Task Test5_DeleteRecipe_ShouldReturnNoContent()
    {
        // Skip if no recipe ID available
        if (_createdRecipeId == null)
        {
            // Try to find the recipe by title as fallback
            var getAllResponse = await _client.GetAsync("/api/recipes");
            var allRecipes = await getAllResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
            var existingRecipe = allRecipes?.FirstOrDefault(r => r.Title == "UpdatedRecipe");
            
            if (existingRecipe == null)
            {
                throw new InvalidOperationException("No recipe found to delete. Previous test may have failed.");
            }
            
            _createdRecipeId = existingRecipe.Id;
        }

        // Act
        var response = await _client.DeleteAsync($"/api/recipes/{_createdRecipeId}");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Test6_GetAllRecipes_ShouldNotContainDeletedRecipe()
    {
        // Act
        var response = await _client.GetAsync("/api/recipes");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var recipes = await response.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        recipes.Should().NotBeNull();
        
        // Verify the deleted recipe is no longer present
        var deletedRecipe = recipes?.FirstOrDefault(r => r.Title == "UpdatedRecipe" || r.Title == "SomeRecipe");
        deletedRecipe.Should().BeNull("The deleted recipe should not be present in the results");
    }
}

/// <summary>
/// Web application factory for integration testing
/// </summary>
public class ApiWebApplicationFactory : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private bool _disposed = false;

    public ApiWebApplicationFactory()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                // Set environment variable for Cosmos DB connection
                Environment.SetEnvironmentVariable("COSMOSDB_CONNECTION_STRING", 
                    "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==");
                
                // Configure test-specific settings
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddJsonFile("appsettings.Testing.json", optional: false, reloadOnChange: true);
                });
            });
    }

    public HttpClient CreateClient()
    {
        return _factory.CreateClient();
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _factory?.Dispose();
            _disposed = true;
        }
    }
}
