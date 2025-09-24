namespace API.Infrastructure.CosmosDb.Interfaces;

/// <summary>
/// Base interface for Cosmos DB entities
/// </summary>
public interface ICosmosDbEntity
{
    /// <summary>
    /// The unique identifier for the entity
    /// </summary>
    string Id { get; set; }

    /// <summary>
    /// The partition key for the entity
    /// </summary>
    string PartitionKey { get; set; }

    /// <summary>
    /// The entity type discriminator
    /// </summary>
    string Type { get; set; }

    /// <summary>
    /// The timestamp when the entity was created
    /// </summary>
    DateTime CreatedAt { get; set; }

    /// <summary>
    /// The timestamp when the entity was last updated
    /// </summary>
    DateTime UpdatedAt { get; set; }
}
