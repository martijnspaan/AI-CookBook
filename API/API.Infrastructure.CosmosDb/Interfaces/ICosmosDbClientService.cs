using Microsoft.Azure.Cosmos;

namespace API.Infrastructure.CosmosDb.Interfaces;

public interface ICosmosDbClientService
{
    CosmosClient Client { get; }
    Database Database { get; }
    Container GetContainer(string containerName);
    Task InitializeAsync(CancellationToken cancellationToken = default);
    void Dispose();
}
