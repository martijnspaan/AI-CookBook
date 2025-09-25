using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

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

    public RecipeEntity()
    {
    }
}

public record Ingredient(
    [property: JsonProperty("name")] string Name = "",
    [property: JsonProperty("type")] string Type = "",
    [property: JsonProperty("amount")] Amount Amount = null!);

public record Amount(
    [property: JsonProperty("value")] double Value = 0,
    [property: JsonProperty("unit")] string Unit = "");
