using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public class CookbookEntity : BaseCosmosDbEntity
{
    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    public CookbookEntity()
    {
    }
}
