using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

/// <summary>
/// Recipe entity for Cosmos DB
/// </summary>
public class RecipeEntity : BaseCosmosDbEntity
{
    [JsonProperty("Title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("Description")]
    public string Description { get; set; } = string.Empty;

    [JsonProperty("Tags")]
    public List<string> Tags { get; set; } = new();

    [JsonProperty("Ingredients")]
    public List<Ingredient> Ingredients { get; set; } = new();

    [JsonProperty("Recipe")]
    public List<string> Recipe { get; set; } = new();

    /// <summary>
    /// Initializes a new instance of the RecipeEntity
    /// </summary>
    public RecipeEntity()
    {
        // Partition key is automatically set to the same value as Id
        // This is handled by the base class
    }
}

/// <summary>
/// Ingredient model for recipes
/// </summary>
/// <param name="Name">The name of the ingredient</param>
/// <param name="Type">The type of the ingredient</param>
/// <param name="Amount">The amount of the ingredient</param>
public record Ingredient(
    [property: JsonProperty("name")] string Name = "",
    [property: JsonProperty("type")] string Type = "",
    [property: JsonProperty("amount")] Amount Amount = null!);

/// <summary>
/// Amount model for ingredients
/// </summary>
/// <param name="Value">The numeric value of the amount</param>
/// <param name="Unit">The unit of measurement</param>
public record Amount(
    [property: JsonProperty("value")] double Value = 0,
    [property: JsonProperty("unit")] string Unit = "");
