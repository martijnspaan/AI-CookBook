namespace API.Infrastructure.CosmosDb.Configuration;

/// <summary>
/// Configuration settings for Azure Cosmos DB connection
/// </summary>
public class CosmosDbConfiguration
{
    /// <summary>
    /// The connection string for the Cosmos DB account
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// The name of the database
    /// </summary>
    public string DatabaseName { get; set; } = string.Empty;

    /// <summary>
    /// The name of the container
    /// </summary>
    public string ContainerName { get; set; } = string.Empty;

    /// <summary>
    /// The partition key path for the container
    /// </summary>
    public string PartitionKeyPath { get; set; } = "/id";

    /// <summary>
    /// The throughput for the container (RU/s)
    /// </summary>
    public int? Throughput { get; set; }

    /// <summary>
    /// Whether to create the database and container if they don't exist
    /// </summary>
    public bool CreateIfNotExists { get; set; } = true;
}
