using API.Infrastructure.CosmosDb.Interfaces;
using System.Text.Json.Serialization;

namespace API.Infrastructure.CosmosDb.Entities;

/// <summary>
/// Base implementation for Cosmos DB entities
/// </summary>
public abstract class BaseCosmosDbEntity : ICosmosDbEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("partitionKey")]
    public string PartitionKey { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("_etag")]
    public string? ETag { get; set; }

    [JsonPropertyName("_ts")]
    public long Timestamp { get; set; }

    /// <summary>
    /// Initializes a new instance of the BaseCosmosDbEntity
    /// </summary>
    protected BaseCosmosDbEntity()
    {
        Type = GetType().Name;
    }

    /// <summary>
    /// Updates the UpdatedAt timestamp
    /// </summary>
    public virtual void UpdateTimestamp()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
