using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

/// <summary>
/// Base implementation for Cosmos DB entities
/// </summary>
public abstract class BaseCosmosDbEntity : ICosmosDbEntity
{
    [JsonProperty("id")]
    public string Id 
    { 
        get => _id; 
        set 
        { 
            _id = value;
            PartitionKey = value; // Partition key is always the same as the ID
        } 
    }
    private string _id = Guid.NewGuid().ToString();

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

    /// <summary>
    /// Initializes a new instance of the BaseCosmosDbEntity
    /// </summary>
    protected BaseCosmosDbEntity()
    {
        Type = GetType().Name;
        PartitionKey = Id; // Initialize partition key to match the ID
    }

    /// <summary>
    /// Updates the UpdatedAt timestamp
    /// </summary>
    public virtual void UpdateTimestamp()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
