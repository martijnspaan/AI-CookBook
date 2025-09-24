using API.Infrastructure.CosmosDb.Interfaces;
using System.Text.Json.Serialization;

namespace API.Infrastructure.CosmosDb.Entities;

/// <summary>
/// Recipe entity for Cosmos DB
/// </summary>
public class RecipeEntity : BaseCosmosDbEntity
{
    [JsonPropertyName("Title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("Description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("Tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("Ingredients")]
    public List<Ingredient> Ingredients { get; set; } = new();

    [JsonPropertyName("Recipe")]
    public List<string> Recipe { get; set; } = new();

    /// <summary>
    /// Initializes a new instance of the RecipeEntity
    /// </summary>
    public RecipeEntity()
    {
        // Set the partition key to the recipe title for better distribution
        PartitionKey = Title;
    }

    /// <summary>
    /// Updates the partition key when the title changes
    /// </summary>
    public void UpdatePartitionKey()
    {
        PartitionKey = Title;
    }
}

/// <summary>
/// Ingredient model for recipes
/// </summary>
public class Ingredient
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public Amount Amount { get; set; } = new();
}

/// <summary>
/// Amount model for ingredients
/// </summary>
public class Amount
{
    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
}
