using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public abstract class BaseCosmosDbEntity : ICosmosDbEntity
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("partitionKey")]
    public string PartitionKey { get; set; } = string.Empty;

    [JsonProperty("type")]
    public string Type { get; set; } = string.Empty;

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonProperty("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonProperty("_etag")]
    public string? ETag { get; set; }

    [JsonProperty("_ts")]
    public long Timestamp { get; set; }

    protected BaseCosmosDbEntity()
    {
        Type = GetType().Name;
        PartitionKey = Id;
    }
    
    public void SetId(string id)
    {
        Id = id;
        PartitionKey = id;
    }

    public virtual void UpdateTimestamp()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
