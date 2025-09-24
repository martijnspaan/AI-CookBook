using API.Infrastructure.CosmosDb.Configuration;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Repositories;
using API.Infrastructure.CosmosDb.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace API.Infrastructure.CosmosDb.Extensions;

/// <summary>
/// Extension methods for registering Cosmos DB services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds Cosmos DB services to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The configuration</param>
    /// <returns>The service collection</returns>
    public static IServiceCollection AddCosmosDb(this IServiceCollection services, IConfiguration configuration)
    {
        // Register configuration with environment variable binding
        services.Configure<CosmosDbConfiguration>(options =>
        {
            configuration.GetSection("CosmosDb").Bind(options);
            
            // Handle environment variable overrides
            var connectionString = Environment.GetEnvironmentVariable("COSMOSDB_CONNECTION_STRING");
            if (!string.IsNullOrEmpty(connectionString))
            {
                options.ConnectionString = connectionString;
            }
            
            var databaseName = Environment.GetEnvironmentVariable("COSMOSDB_DATABASE_NAME");
            if (!string.IsNullOrEmpty(databaseName))
            {
                options.DatabaseName = databaseName;
            }
            
            var containerName = Environment.GetEnvironmentVariable("COSMOSDB_CONTAINER_NAME");
            if (!string.IsNullOrEmpty(containerName))
            {
                options.ContainerName = containerName;
            }
            
            var partitionKeyPath = Environment.GetEnvironmentVariable("COSMOSDB_PARTITION_KEY_PATH");
            if (!string.IsNullOrEmpty(partitionKeyPath))
            {
                options.PartitionKeyPath = partitionKeyPath;
            }
            
            var throughputStr = Environment.GetEnvironmentVariable("COSMOSDB_THROUGHPUT");
            if (!string.IsNullOrEmpty(throughputStr) && int.TryParse(throughputStr, out var throughput))
            {
                options.Throughput = throughput;
            }
            
            var createIfNotExistsStr = Environment.GetEnvironmentVariable("COSMOSDB_CREATE_IF_NOT_EXISTS");
            if (!string.IsNullOrEmpty(createIfNotExistsStr) && bool.TryParse(createIfNotExistsStr, out var createIfNotExists))
            {
                options.CreateIfNotExists = createIfNotExists;
            }
        });

        // Register client service
        services.AddSingleton<ICosmosDbClientService, CosmosDbClientService>();

        return services;
    }

    /// <summary>
    /// Adds Cosmos DB services to the service collection with custom configuration
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configureOptions">Action to configure the options</param>
    /// <returns>The service collection</returns>
    public static IServiceCollection AddCosmosDb(this IServiceCollection services, Action<CosmosDbConfiguration> configureOptions)
    {
        // Register configuration
        services.Configure<CosmosDbConfiguration>(configureOptions);

        // Register client service
        services.AddSingleton<ICosmosDbClientService, CosmosDbClientService>();

        return services;
    }

    /// <summary>
    /// Adds a Cosmos DB repository for a specific entity type
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <param name="services">The service collection</param>
    /// <param name="containerName">The container name</param>
    /// <returns>The service collection</returns>
    public static IServiceCollection AddCosmosDbRepository<T>(this IServiceCollection services, string containerName) 
        where T : class
    {
        services.AddScoped<ICosmosDbRepository<T>>(provider =>
        {
            var cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            var logger = provider.GetRequiredService<ILogger<CosmosDbRepository<T>>>();
            return new CosmosDbRepository<T>(cosmosDbClientService, logger, containerName);
        });

        return services;
    }
}