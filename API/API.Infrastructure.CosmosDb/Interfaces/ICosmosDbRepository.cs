using Microsoft.Azure.Cosmos;

namespace API.Infrastructure.CosmosDb.Interfaces;

/// <summary>
/// Generic repository interface for Cosmos DB operations
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
public interface ICosmosDbRepository<T> where T : class
{
    /// <summary>
    /// Gets an item by its ID and partition key
    /// </summary>
    /// <param name="id">The item ID</param>
    /// <param name="partitionKey">The partition key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The item if found, null otherwise</returns>
    Task<T?> GetByIdAsync(string id, string partitionKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all items with optional query parameters
    /// </summary>
    /// <param name="query">Optional SQL query</param>
    /// <param name="queryParameters">Optional query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of items</returns>
    Task<ICollection<T>> GetAllAsync(string? query = null, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new item
    /// </summary>
    /// <param name="item">The item to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created item</returns>
    Task<T> CreateAsync(T item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing item
    /// </summary>
    /// <param name="item">The item to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The updated item</returns>
    Task<T> UpdateAsync(T item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upserts an item (creates if not exists, updates if exists)
    /// </summary>
    /// <param name="item">The item to upsert</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The upserted item</returns>
    Task<T> UpsertAsync(T item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an item by its ID and partition key
    /// </summary>
    /// <param name="id">The item ID</param>
    /// <param name="partitionKey">The partition key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(string id, string partitionKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a custom query
    /// </summary>
    /// <param name="query">The SQL query</param>
    /// <param name="queryParameters">Query parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Query results</returns>
    Task<ICollection<T>> QueryAsync(string query, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default);
}
