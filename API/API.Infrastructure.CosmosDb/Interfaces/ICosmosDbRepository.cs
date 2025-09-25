using Microsoft.Azure.Cosmos;

namespace API.Infrastructure.CosmosDb.Interfaces;

public interface ICosmosDbRepository<T> where T : class
{
    Task<T?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ICollection<T>> GetAllAsync(string? query = null, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default);
    Task<T> CreateAsync(T item, CancellationToken cancellationToken = default);
    Task<T> UpdateAsync(T item, CancellationToken cancellationToken = default);
    Task<T> UpsertAsync(T item, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<ICollection<T>> QueryAsync(string query, Dictionary<string, object>? queryParameters = null, CancellationToken cancellationToken = default);
}
