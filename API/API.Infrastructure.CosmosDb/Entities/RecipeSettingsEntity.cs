using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public class RecipeSettingsEntity : BaseCosmosDbEntity
{
    [JsonProperty("Tags")]
    public List<string> Tags { get; set; } = new();

    [JsonProperty("Ingredients")]
    public List<string> Ingredients { get; set; } = new();

    [JsonProperty("Units")]
    public List<string> Units { get; set; } = new();

    [JsonProperty("Categories")]
    public List<string> Categories { get; set; } = new();

    public RecipeSettingsEntity()
    {
    }
}
