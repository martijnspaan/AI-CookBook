using API.Infrastructure.CosmosDb.Interfaces;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace API.Infrastructure.CosmosDb.Repositories;

/// <summary>
/// Generic repository implementation for Cosmos DB operations
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
public class CosmosDbRepository<T> : ICosmosDbRepository<T> where T : class
{
    private readonly ICosmosDbClientService _cosmosDbClientService;
    private readonly ILogger<CosmosDbRepository<T>> _logger;
    private readonly string _containerName;

    /// <summary>
    /// Initializes a new instance of the CosmosDbRepository
    /// </summary>
    /// <param name="cosmosDbClientService">Cosmos DB client service</param>
    /// <param name="logger">Logger instance</param>
    /// <param name="containerName">Container name</param>
    public CosmosDbRepository(
        ICosmosDbClientService cosmosDbClientService,
        ILogger<CosmosDbRepository<T>> logger,
        string containerName)
    {
        _cosmosDbClientService = cosmosDbClientService;
        _logger = logger;
        _containerName = containerName;
    }

    /// <summary>
    /// Gets the container instance
    /// </summary>
    private Container Container => _cosmosDbClientService.GetContainer(_containerName);

    /// <summary>
    /// Gets an item by its ID and partition key
    /// </summary>
    /// <param name="id">The item ID</param>
    /// <param name="partitionKey">The partition key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The item if found, null otherwise</returns>
    public async Task<T?> GetByIdAsync(string id, string partitionKey, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting item with ID '{Id}' and partition key '{PartitionKey}' from container '{ContainerName}'", 
                id, partitionKey, _containerName);

            var response = await Container.ReadItemAsync<T>(
                id,
                new PartitionKey(partitionKey),
                cancellationToken: cancellationToken);

            _logger.LogDebug("Successfully retrieved item with ID '{Id}'", id);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogDebug("Item with ID '{Id}' and partition key '{PartitionKey}' not found", id, partitionKey);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting item with ID '{Id}' and partition key '{PartitionKey}'", id, partitionKey);
            throw;
        }
    }

    /// <summary>
    /// Gets all items with optional query parameters
    /// </summary>
    /// <param name="query">Optional SQL query</param>
    /// <param name="queryParameters">Optional query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of items</returns>
    public async Task<IEnumerable<T>> GetAllAsync(string? query = null, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting all items from container '{ContainerName}' with query '{Query}'", 
                _containerName, query ?? "SELECT * FROM c");

            var sqlQuery = query ?? "SELECT * FROM c";
            var queryDefinition = new QueryDefinition(sqlQuery);

            if (queryParameters != null)
            {
                foreach (var parameter in queryParameters)
                {
                    queryDefinition.WithParameter($"@{parameter.Key}", parameter.Value);
                }
            }

            var items = new List<T>();
            var iterator = Container.GetItemQueryIterator<T>(queryDefinition);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                items.AddRange(response.ToList());
            }

            _logger.LogDebug("Successfully retrieved {Count} items from container '{ContainerName}'", items.Count, _containerName);
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all items from container '{ContainerName}'", _containerName);
            throw;
        }
    }

    /// <summary>
    /// Creates a new item
    /// </summary>
    /// <param name="item">The item to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created item</returns>
    public async Task<T> CreateAsync(T item, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Creating new item in container '{ContainerName}'", _containerName);

            var response = await Container.CreateItemAsync(
                item,
                cancellationToken: cancellationToken);

            _logger.LogDebug("Successfully created item with ID '{Id}'", GetItemId(item));
            return response.Resource;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item in container '{ContainerName}'", _containerName);
            throw;
        }
    }

    /// <summary>
    /// Updates an existing item
    /// </summary>
    /// <param name="item">The item to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The updated item</returns>
    public async Task<T> UpdateAsync(T item, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Updating item with ID '{Id}' in container '{ContainerName}'", GetItemId(item), _containerName);

            var response = await Container.UpsertItemAsync(
                item,
                cancellationToken: cancellationToken);

            _logger.LogDebug("Successfully updated item with ID '{Id}'", GetItemId(item));
            return response.Resource;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item with ID '{Id}' in container '{ContainerName}'", GetItemId(item), _containerName);
            throw;
        }
    }

    /// <summary>
    /// Deletes an item by its ID and partition key
    /// </summary>
    /// <param name="id">The item ID</param>
    /// <param name="partitionKey">The partition key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    public async Task<bool> DeleteAsync(string id, string partitionKey, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Deleting item with ID '{Id}' and partition key '{PartitionKey}' from container '{ContainerName}'", 
                id, partitionKey, _containerName);

            await Container.DeleteItemAsync<T>(
                id,
                new PartitionKey(partitionKey),
                cancellationToken: cancellationToken);

            _logger.LogDebug("Successfully deleted item with ID '{Id}'", id);
            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogDebug("Item with ID '{Id}' and partition key '{PartitionKey}' not found for deletion", id, partitionKey);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item with ID '{Id}' and partition key '{PartitionKey}'", id, partitionKey);
            throw;
        }
    }

    /// <summary>
    /// Executes a custom query
    /// </summary>
    /// <param name="query">The SQL query</param>
    /// <param name="queryParameters">Query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Query results</returns>
    public async Task<IEnumerable<T>> QueryAsync(string query, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Executing query '{Query}' on container '{ContainerName}'", query, _containerName);

            var queryDefinition = new QueryDefinition(query);

            if (queryParameters != null)
            {
                foreach (var parameter in queryParameters)
                {
                    queryDefinition.WithParameter($"@{parameter.Key}", parameter.Value);
                }
            }

            var items = new List<T>();
            var iterator = Container.GetItemQueryIterator<T>(queryDefinition);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                items.AddRange(response.ToList());
            }

            _logger.LogDebug("Query executed successfully, returned {Count} items", items.Count);
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing query '{Query}' on container '{ContainerName}'", query, _containerName);
            throw;
        }
    }

    /// <summary>
    /// Gets the item ID from the entity
    /// </summary>
    /// <param name="item">The item</param>
    /// <returns>The item ID</returns>
    private static string GetItemId(T item)
    {
        if (item is ICosmosDbEntity entity)
        {
            return entity.Id;
        }

        // Try to get ID using reflection as fallback
        var idProperty = typeof(T).GetProperty("Id");
        if (idProperty != null)
        {
            return idProperty.GetValue(item)?.ToString() ?? "unknown";
        }

        return "unknown";
    }
}
