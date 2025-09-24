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
/// <param name="Name">The name of the ingredient</param>
/// <param name="Type">The type of the ingredient</param>
/// <param name="Amount">The amount of the ingredient</param>
public record Ingredient(
    [property: JsonPropertyName("name")] string Name = "",
    [property: JsonPropertyName("type")] string Type = "",
    [property: JsonPropertyName("amount")] Amount Amount = null!);

/// <summary>
/// Amount model for ingredients
/// </summary>
/// <param name="Value">The numeric value of the amount</param>
/// <param name="Unit">The unit of measurement</param>
public record Amount(
    [property: JsonPropertyName("value")] double Value = 0,
    [property: JsonPropertyName("unit")] string Unit = "");
