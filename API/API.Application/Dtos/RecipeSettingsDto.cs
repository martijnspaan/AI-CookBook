using Newtonsoft.Json;

namespace API.Application.Dtos;

public class RecipeSettingsDto
{
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonProperty("ingredients")]
    public List<string> Ingredients { get; set; } = new();

    [JsonProperty("units")]
    public List<string> Units { get; set; } = new();

    [JsonProperty("categories")]
    public List<string> Categories { get; set; } = new();

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

public class UpdateRecipeSettingsDto
{
    [JsonProperty("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonProperty("ingredients")]
    public List<string> Ingredients { get; set; } = new();

    [JsonProperty("units")]
    public List<string> Units { get; set; } = new();

    [JsonProperty("categories")]
    public List<string> Categories { get; set; } = new();
}
