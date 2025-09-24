using Microsoft.Azure.Cosmos;

namespace API.Infrastructure.CosmosDb.Interfaces;

/// <summary>
/// Service interface for Cosmos DB client operations
/// </summary>
public interface ICosmosDbClientService
{
    /// <summary>
    /// Gets the Cosmos DB client instance
    /// </summary>
    CosmosClient Client { get; }

    /// <summary>
    /// Gets the database instance
    /// </summary>
    Database Database { get; }

    /// <summary>
    /// Gets a container by name
    /// </summary>
    /// <param name="containerName">The container name</param>
    /// <returns>The container instance</returns>
    Container GetContainer(string containerName);

    /// <summary>
    /// Initializes the Cosmos DB client and creates database/container if needed
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the initialization</returns>
    Task InitializeAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Disposes the Cosmos DB client
    /// </summary>
    void Dispose();
}
