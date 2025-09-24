using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;
using Xunit.Sdk;
using API.Infrastructure.CosmosDb.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using API.Application.Dtos;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using DotNetEnv;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;

namespace API.Specs;

/// <summary>
/// Custom test case orderer that enforces sequential execution based on test method names
/// Tests are ordered by their numeric prefix (Test1_, Test2_, etc.)
/// </summary>
public class SequentialTestCaseOrderer : ITestCaseOrderer
{
    public IEnumerable<TTestCase> OrderTestCases<TTestCase>(IEnumerable<TTestCase> testCases)
        where TTestCase : ITestCase
    {
        return testCases.OrderBy(testCase => GetTestOrder(testCase.DisplayName));
    }

    private static int GetTestOrder(string displayName)
    {
        // Extract the test number from method names like "Test1_CreateRecipe_ShouldReturnCreatedRecipe"
        var match = System.Text.RegularExpressions.Regex.Match(displayName, @"Test(\d+)_");
        return match.Success ? int.Parse(match.Groups[1].Value) : int.MaxValue;
    }
}

/// <summary>
/// Integration tests for the AI Cookbook API
/// These tests run synchronously in the specified order to test the complete CRUD workflow
/// </summary>
[TestCaseOrderer("API.Specs.SequentialTestCaseOrderer", "API.Specs")]
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
    public async Task Test0_CleanDatabase_ShouldDeleteAndRecreateCollection()
    {
        // Get CosmosDB service from the factory
        using var scope = _factory.CreateScope();
        var cosmosDbClientService = scope.ServiceProvider.GetRequiredService<API.Infrastructure.CosmosDb.Interfaces.ICosmosDbClientService>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        // Get container name from configuration
        var containerName = configuration.GetSection("CosmosDb:ContainerName").Value ?? 
                           Environment.GetEnvironmentVariable("COSMOSDB_CONTAINER_NAME") ?? 
                           "RecipesTest";
        
        // Get the container and delete it
        var container = cosmosDbClientService.GetContainer(containerName);
        await container.DeleteContainerAsync();
        
        // Recreate the container
        var containerProperties = new Microsoft.Azure.Cosmos.ContainerProperties
        {
            Id = containerName,
            PartitionKeyPath = configuration.GetSection("CosmosDb:PartitionKeyPath").Value ?? "/id"
        };
        
        await cosmosDbClientService.Database.CreateContainerIfNotExistsAsync(containerProperties);
        
        // Verify database is now empty
        var verifyResponse = await _client.GetAsync("/api/recipes");
        verifyResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var remainingRecipes = await verifyResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        remainingRecipes.Should().NotBeNull();
        remainingRecipes.Should().BeEmpty("Database should be empty after collection recreation");
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
public class ApiWebApplicationFactory : WebApplicationFactory<Program>, IDisposable
{
    private bool _disposed = false;

    public ApiWebApplicationFactory()
    {
        // Load environment variables from .env file
        LoadEnvironmentVariables();
    }

    private void LoadEnvironmentVariables()
    {
        // Get the directory where the test project is located
        var testProjectDirectory = Directory.GetCurrentDirectory();
        var envFilePath = Path.Combine(testProjectDirectory, ".env");

        // Load .env file if it exists
        if (File.Exists(envFilePath))
        {
            DotNetEnv.Env.Load(envFilePath);
        }
        else
        {
            // If .env file doesn't exist, provide clear error message
            throw new FileNotFoundException(
                $"Environment file not found at: {envFilePath}\n" +
                "Please create a .env file in the API.Specs directory with the following variables:\n" +
                "ASPNETCORE_ENVIRONMENT=Testing\n" +
                "COSMOSDB_CONNECTION_STRING=your_connection_string_here\n" +
                "COSMOSDB_DATABASE_NAME=CookBookTest\n" +
                "COSMOSDB_CONTAINER_NAME=RecipesTest\n" +
                "COSMOSDB_PARTITION_KEY_PATH=/id\n" +
                "COSMOSDB_CREATE_IF_NOT_EXISTS=true"
            );
        }

        // Verify required environment variables are set
        ValidateRequiredEnvironmentVariables();
    }

    private void ValidateRequiredEnvironmentVariables()
    {
        var requiredVariables = new[]
        {
            "ASPNETCORE_ENVIRONMENT",
            "COSMOSDB_CONNECTION_STRING",
            "COSMOSDB_DATABASE_NAME",
            "COSMOSDB_CONTAINER_NAME",
            "COSMOSDB_PARTITION_KEY_PATH"
        };

        var missingVariables = new List<string>();

        foreach (var variable in requiredVariables)
        {
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(variable)))
            {
                missingVariables.Add(variable);
            }
        }

        if (missingVariables.Any())
        {
            throw new InvalidOperationException(
                $"Missing required environment variables: {string.Join(", ", missingVariables)}\n" +
                "Please ensure all required variables are set in your .env file."
            );
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configure test-specific settings
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Add the appsettings.Testing.json file from the test project directory
            var testConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "appsettings.Testing.json");
            if (File.Exists(testConfigPath))
            {
                config.AddJsonFile(testConfigPath, optional: false, reloadOnChange: true);
            }
        });
    }

    public IServiceScope CreateScope()
    {
        return Services.CreateScope();
    }

    public new void Dispose()
    {
        if (!_disposed)
        {
            base.Dispose();
            _disposed = true;
        }
    }
}
