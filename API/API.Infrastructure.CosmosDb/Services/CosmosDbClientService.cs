using API.Infrastructure.CosmosDb.Configuration;
using API.Infrastructure.CosmosDb.Interfaces;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace API.Infrastructure.CosmosDb.Services;

/// <summary>
/// Service implementation for Cosmos DB client operations
/// </summary>
/// <summary>
/// Service implementation for Cosmos DB client operations
/// </summary>
/// <param name="configuration">Cosmos DB configuration</param>
/// <param name="logger">Logger instance</param>
public class CosmosDbClientService(IOptions<CosmosDbConfiguration> configuration, ILogger<CosmosDbClientService> logger) : ICosmosDbClientService, IDisposable
{
    private readonly CosmosDbConfiguration _configuration = configuration.Value;
    private readonly ILogger<CosmosDbClientService> _logger = logger;
    private CosmosClient? _cosmosClient;
    private Database? _database;
    private bool _disposed = false;

    /// <summary>
    /// Gets the Cosmos DB client instance
    /// </summary>
    public CosmosClient Client
    {
        get
        {
            if (_cosmosClient == null)
            {
                throw new InvalidOperationException("Cosmos DB client has not been initialized. Call InitializeAsync first.");
            }
            return _cosmosClient;
        }
    }

    /// <summary>
    /// Gets the database instance
    /// </summary>
    public Database Database
    {
        get
        {
            if (_database == null)
            {
                throw new InvalidOperationException("Database has not been initialized. Call InitializeAsync first.");
            }
            return _database;
        }
    }

    /// <summary>
    /// Gets a container by name
    /// </summary>
    /// <param name="containerName">The container name</param>
    /// <returns>The container instance</returns>
    public Container GetContainer(string containerName)
    {
        return Database.GetContainer(containerName);
    }

    /// <summary>
    /// Initializes the Cosmos DB client and creates database/container if needed
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the initialization</returns>
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Initializing Cosmos DB client...");
            _logger.LogInformation("Connection String: {ConnectionString}", 
                _configuration.ConnectionString?.Substring(0, Math.Min(50, _configuration.ConnectionString?.Length ?? 0)) + "...");

            // Validate connection string format
            if (string.IsNullOrWhiteSpace(_configuration.ConnectionString))
            {
                throw new InvalidOperationException("Cosmos DB connection string is null or empty");
            }

            // Create Cosmos client
            _cosmosClient = new CosmosClient(_configuration.ConnectionString);

            // Test connection
            await _cosmosClient.ReadAccountAsync();

            _logger.LogInformation("Cosmos DB client initialized successfully");

            if (_configuration.CreateIfNotExists)
            {
                await CreateDatabaseIfNotExistsAsync(cancellationToken);
            }
            else
            {
                // Just get the database reference
                _database = _cosmosClient.GetDatabase(_configuration.DatabaseName);
            }

            _logger.LogInformation("Cosmos DB initialization completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Cosmos DB client");
            throw;
        }
    }

    /// <summary>
    /// Creates the database and container if they don't exist
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    private async Task CreateDatabaseIfNotExistsAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Creating database '{DatabaseName}' if it doesn't exist...", _configuration.DatabaseName);

            // Create database (serverless mode - no throughput specified)
            DatabaseResponse databaseResponse = await _cosmosClient!.CreateDatabaseIfNotExistsAsync(
                _configuration.DatabaseName,
                cancellationToken: cancellationToken);

            _database = databaseResponse.Database;

            _logger.LogInformation("Database '{DatabaseName}' created or already exists", _configuration.DatabaseName);

            // Create Recipes container
            _logger.LogInformation("Creating container '{ContainerName}' if it doesn't exist...", _configuration.ContainerName);

            ContainerProperties recipesContainerProperties = new ContainerProperties
            {
                Id = _configuration.ContainerName,
                PartitionKeyPath = _configuration.PartitionKeyPath
            };

            ContainerResponse recipesContainerResponse = await _database.CreateContainerIfNotExistsAsync(
                recipesContainerProperties,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Container '{ContainerName}' created or already exists", _configuration.ContainerName);

            // Create WeekMenu container
            _logger.LogInformation("Creating container '{WeekMenuContainerName}' if it doesn't exist...", _configuration.WeekMenuContainerName);

            ContainerProperties weekMenuContainerProperties = new ContainerProperties
            {
                Id = _configuration.WeekMenuContainerName,
                PartitionKeyPath = _configuration.PartitionKeyPath
            };

            ContainerResponse weekMenuContainerResponse = await _database.CreateContainerIfNotExistsAsync(
                weekMenuContainerProperties,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Container '{WeekMenuContainerName}' created or already exists", _configuration.WeekMenuContainerName);

            // Create Cookbooks container
            _logger.LogInformation("Creating container '{CookbookContainerName}' if it doesn't exist...", _configuration.CookbookContainerName);

            ContainerProperties cookbookContainerProperties = new ContainerProperties
            {
                Id = _configuration.CookbookContainerName,
                PartitionKeyPath = _configuration.PartitionKeyPath
            };

            ContainerResponse cookbookContainerResponse = await _database.CreateContainerIfNotExistsAsync(
                cookbookContainerProperties,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Container '{CookbookContainerName}' created or already exists", _configuration.CookbookContainerName);

            // Create GroceryLists container
            _logger.LogInformation("Creating container '{GroceryListContainerName}' if it doesn't exist...", _configuration.GroceryListContainerName);

            ContainerProperties groceryListContainerProperties = new ContainerProperties
            {
                Id = _configuration.GroceryListContainerName,
                PartitionKeyPath = _configuration.PartitionKeyPath
            };

            ContainerResponse groceryListContainerResponse = await _database.CreateContainerIfNotExistsAsync(
                groceryListContainerProperties,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Container '{GroceryListContainerName}' created or already exists", _configuration.GroceryListContainerName);

            // Create RecipeSettings container
            _logger.LogInformation("Creating container '{RecipeSettingsContainerName}' if it doesn't exist...", _configuration.RecipeSettingsContainerName);

            ContainerProperties recipeSettingsContainerProperties = new ContainerProperties
            {
                Id = _configuration.RecipeSettingsContainerName,
                PartitionKeyPath = _configuration.PartitionKeyPath
            };

            ContainerResponse recipeSettingsContainerResponse = await _database.CreateContainerIfNotExistsAsync(
                recipeSettingsContainerProperties,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Container '{RecipeSettingsContainerName}' created or already exists", _configuration.RecipeSettingsContainerName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create database or container");
            throw;
        }
    }

    /// <summary>
    /// Disposes the Cosmos DB client
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Disposes the Cosmos DB client
    /// </summary>
    /// <param name="disposing">Whether to dispose managed resources</param>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _cosmosClient?.Dispose();
            _disposed = true;
        }
    }
}
