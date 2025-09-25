using System.Net.Http.Json;
using FluentAssertions;
using Xunit;
using API.Infrastructure.CosmosDb.Entities;
using API.Application.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace API.Specs;

/// <summary>
/// Integration tests for the AI Cookbook API
/// These tests run synchronously in the specified order to test the complete CRUD workflow
/// </summary>
[TestCaseOrderer("API.Specs.SequentialTestCaseOrderer", "API.Specs")]
public class IntegrationSpecs : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _httpClient;
    private readonly ApiWebApplicationFactory _webApplicationFactory;
    private string? _createdRecipeId;

    public IntegrationSpecs(ApiWebApplicationFactory webApplicationFactory)
    {
        _webApplicationFactory = webApplicationFactory;
        _httpClient = webApplicationFactory.CreateClient();
    }

    [Fact]
    public async Task Test0_CleanDatabase_ShouldDeleteAndRecreateCollection()
    {
        // Arrange
        using var serviceScope = _webApplicationFactory.CreateScope();
        var cosmosDbClientService = serviceScope.ServiceProvider.GetRequiredService<API.Infrastructure.CosmosDb.Interfaces.ICosmosDbClientService>();
        var configuration = serviceScope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        var containerName = configuration.GetSection("CosmosDb:ContainerName").Value ?? 
                           Environment.GetEnvironmentVariable("COSMOSDB_CONTAINER_NAME") ?? 
                           "RecipesTest";
        
        var partitionKeyPath = configuration.GetSection("CosmosDb:PartitionKeyPath").Value ?? "/id";
        
        // Act
        var cosmosContainer = cosmosDbClientService.GetContainer(containerName);
        await cosmosContainer.DeleteContainerAsync();
        
        var containerProperties = new Microsoft.Azure.Cosmos.ContainerProperties
        {
            Id = containerName,
            PartitionKeyPath = partitionKeyPath
        };
        
        await cosmosDbClientService.Database.CreateContainerIfNotExistsAsync(containerProperties);
        
        var verificationResponse = await _httpClient.GetAsync("/api/recipes");
        
        // Assert
        verificationResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var remainingRecipes = await verificationResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        remainingRecipes.Should().NotBeNull();
        remainingRecipes.Should().BeEmpty("Database should be empty after collection recreation");
    }

    [Fact]
    public async Task Test1_CreateRecipe_ShouldReturnCreatedRecipe()
    {
        // Arrange
        var newRecipeInput = new CreateRecipeUseCaseInput(
            Title: "TestRecipe",
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
        var createRecipeResponse = await _httpClient.PostAsJsonAsync("/api/recipes", newRecipeInput);

        // Assert
        createRecipeResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        
        var createdRecipe = await createRecipeResponse.Content.ReadFromJsonAsync<RecipeEntity>();
        createdRecipe.Should().NotBeNull();
        createdRecipe!.Title.Should().Be("TestRecipe");
        createdRecipe.Description.Should().Be("A test recipe for integration testing");
        createdRecipe.Tags.Should().Contain("test");
        createdRecipe.Tags.Should().Contain("integration");
        createdRecipe.Ingredients.Should().HaveCount(2);
        createdRecipe.Recipe.Should().HaveCount(2);
        
        _createdRecipeId = createdRecipe.Id;
    }

    [Fact]
    public async Task Test2_GetAllRecipes_ShouldContainCreatedRecipe()
    {
        // Arrange
        // No specific arrangement needed for this test

        // Act
        var getAllRecipesResponse = await _httpClient.GetAsync("/api/recipes");

        // Assert
        getAllRecipesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var allRecipes = await getAllRecipesResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        allRecipes.Should().NotBeNull();
        allRecipes.Should().NotBeEmpty();
        
        var createdRecipe = allRecipes!.FirstOrDefault(recipe => recipe.Title == "TestRecipe");
        createdRecipe.Should().NotBeNull();
        createdRecipe!.Title.Should().Be("TestRecipe");
        
        if (_createdRecipeId != null)
        {
            createdRecipe.Id.Should().Be(_createdRecipeId);
        }
    }

    [Fact]
    public async Task Test3_UpdateRecipe_ShouldReturnUpdatedRecipe()
    {
        // Arrange
        await EnsureRecipeIdIsAvailable();
        
        var updateRecipeInput = new UpdateRecipeUseCaseInput(
            Id: _createdRecipeId!,
            Title: "UpdatedTestRecipe",
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
        var updateRecipeResponse = await _httpClient.PutAsJsonAsync($"/api/recipes/{_createdRecipeId}", updateRecipeInput);

        // Assert
        updateRecipeResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var updatedRecipe = await updateRecipeResponse.Content.ReadFromJsonAsync<RecipeEntity>();
        updatedRecipe.Should().NotBeNull();
        updatedRecipe!.Title.Should().Be("UpdatedTestRecipe");
        updatedRecipe.Description.Should().Be("An updated test recipe for integration testing");
        updatedRecipe.Tags.Should().Contain("updated");
        updatedRecipe.Ingredients.Should().HaveCount(3);
        updatedRecipe.Recipe.Should().HaveCount(3);
    }

    [Fact]
    public async Task Test4_GetRecipeById_ShouldReturnUpdatedRecipe()
    {
        // Arrange
        await EnsureRecipeIdIsAvailable();

        // Act
        var getRecipeByIdResponse = await _httpClient.GetAsync($"/api/recipes/{_createdRecipeId}");

        // Assert
        getRecipeByIdResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var retrievedRecipe = await getRecipeByIdResponse.Content.ReadFromJsonAsync<RecipeEntity>();
        retrievedRecipe.Should().NotBeNull();
        retrievedRecipe!.Title.Should().Be("UpdatedTestRecipe");
        retrievedRecipe.Description.Should().Be("An updated test recipe for integration testing");
        retrievedRecipe.Tags.Should().Contain("updated");
        retrievedRecipe.Ingredients.Should().HaveCount(3);
        retrievedRecipe.Recipe.Should().HaveCount(3);
    }

    [Fact]
    public async Task Test5_DeleteRecipe_ShouldReturnNoContent()
    {
        // Arrange
        await EnsureRecipeIdIsAvailable();

        // Act
        var deleteRecipeResponse = await _httpClient.DeleteAsync($"/api/recipes/{_createdRecipeId}");

        // Assert
        deleteRecipeResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Test6_GetAllRecipes_ShouldNotContainDeletedRecipe()
    {
        // Arrange
        // No specific arrangement needed for this test

        // Act
        var getAllRecipesAfterDeletionResponse = await _httpClient.GetAsync("/api/recipes");

        // Assert
        getAllRecipesAfterDeletionResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        
        var remainingRecipes = await getAllRecipesAfterDeletionResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
        remainingRecipes.Should().NotBeNull();
        
        var deletedRecipe = remainingRecipes?.FirstOrDefault(recipe => 
            recipe.Title == "UpdatedTestRecipe" || recipe.Title == "TestRecipe");
        deletedRecipe.Should().BeNull("The deleted recipe should not be present in the results");
    }

    private async Task EnsureRecipeIdIsAvailable()
    {
        if (_createdRecipeId == null)
        {
            var getAllRecipesResponse = await _httpClient.GetAsync("/api/recipes");
            var allRecipes = await getAllRecipesResponse.Content.ReadFromJsonAsync<List<RecipeEntity>>();
            var existingRecipe = allRecipes?.FirstOrDefault(recipe => 
                recipe.Title == "UpdatedTestRecipe" || recipe.Title == "TestRecipe");
            
            if (existingRecipe == null)
            {
                throw new InvalidOperationException("No recipe found. Previous test may have failed.");
            }
            
            _createdRecipeId = existingRecipe.Id;
        }
    }
}
