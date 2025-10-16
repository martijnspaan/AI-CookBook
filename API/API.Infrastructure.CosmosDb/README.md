# API.Infrastructure.CosmosDb

This library provides infrastructure services for connecting to and working with Azure Cosmos DB in the Meal Week Planner API.

## Features

- **Generic Repository Pattern**: Easy-to-use repository interface for CRUD operations
- **Base Entity Support**: Base classes for Cosmos DB entities with common properties
- **Configuration Management**: Flexible configuration options for Cosmos DB settings
- **Dependency Injection**: Built-in support for .NET Core dependency injection
- **Logging Integration**: Comprehensive logging throughout the library
- **Async/Await Support**: Full async support for all operations

## Packages Included

- `Microsoft.Azure.Cosmos` (3.53.1) - Official Azure Cosmos DB SDK
- `Newtonsoft.Json` (13.0.3) - JSON serialization support
- `Microsoft.Extensions.Logging.Abstractions` (8.0.0) - Logging abstractions
- `Microsoft.Extensions.Options` (8.0.0) - Configuration options
- `Microsoft.Extensions.Configuration.Abstractions` (8.0.0) - Configuration abstractions
- `Microsoft.Extensions.DependencyInjection.Abstractions` (8.0.0) - DI abstractions

## Quick Start

### 1. Register Services

```csharp
// In Program.cs or Startup.cs
services.AddCosmosDb(configuration);
```

### 2. Configure Settings

```json
{
  "CosmosDb": {
    "ConnectionString": "your-connection-string",
    "DatabaseName": "MealWeekPlanner",
    "ContainerName": "Recipes",
    "PartitionKeyPath": "/id",
    "Throughput": 400,
    "CreateIfNotExists": true
  }
}
```

### 3. Use Repository

```csharp
public class RecipeService
{
    private readonly ICosmosDbRepository<RecipeEntity> _repository;

    public RecipeService(ICosmosDbRepository<RecipeEntity> repository)
    {
        _repository = repository;
    }

    public async Task<RecipeEntity> GetRecipeAsync(string id)
    {
        return await _repository.GetByIdAsync(id, id);
    }

    public async Task<IEnumerable<RecipeEntity>> GetAllRecipesAsync()
    {
        return await _repository.GetAllAsync();
    }
}
```

## Architecture

### Interfaces

- `ICosmosDbRepository<T>` - Generic repository interface
- `ICosmosDbClientService` - Cosmos DB client service
- `ICosmosDbEntity` - Base entity interface

### Services

- `CosmosDbClientService` - Manages Cosmos DB client and database operations
- `CosmosDbRepository<T>` - Generic repository implementation

### Entities

- `BaseCosmosDbEntity` - Base implementation for Cosmos DB entities
- `RecipeEntity` - Sample recipe entity

### Configuration

- `CosmosDbConfiguration` - Configuration model for Cosmos DB settings

## Configuration Options

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| ConnectionString | string | Cosmos DB connection string | Required |
| DatabaseName | string | Database name | Required |
| ContainerName | string | Container name | Required |
| PartitionKeyPath | string | Partition key path | "/id" |
| Throughput | int? | Container throughput (RU/s) | null |
| CreateIfNotExists | bool | Create database/container if not exists | true |

## Usage Examples

### Custom Queries

```csharp
var query = "SELECT * FROM c WHERE c.type = 'Recipe' AND c.difficulty = @difficulty";
var parameters = new Dictionary<string, object> { { "difficulty", "Easy" } };
var recipes = await _repository.QueryAsync(query, parameters);
```

### Entity Creation

```csharp
public class RecipeEntity : BaseCosmosDbEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Ingredients { get; set; } = new();
    // ... other properties
}
```

## Future Enhancements

- Bulk operations support
- Change feed processing
- Custom serialization options
- Retry policies configuration
- Performance monitoring
