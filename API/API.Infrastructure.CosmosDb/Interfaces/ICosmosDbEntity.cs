namespace API.Infrastructure.CosmosDb.Interfaces;

public interface ICosmosDbEntity
{
    string Id { get; set; }
    string PartitionKey { get; set; }
    string Type { get; set; }
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}
