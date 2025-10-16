# Meal Week Planner API

This folder contains the API solution for the Meal Week Planner project, organized using Clean Architecture principles.

## Project Structure

```
API/
├── MealWeekPlanner.sln                    # Solution file
├── API.Application/                   # Application layer (Web API)
│   ├── API.Application.csproj        # Main API project
│   ├── Program.cs                    # Application entry point
│   ├── appsettings.json             # Configuration
│   ├── appsettings.Development.json # Development configuration
│   ├── Properties/
│   │   └── launchSettings.json      # Launch settings
│   ├── recipes/                     # Sample recipe data
│   └── ENVIRONMENT_SETUP.md         # Environment setup guide
└── API.Infrastructure.CosmosDb/     # Infrastructure layer (Data Access)
    ├── API.Infrastructure.CosmosDb.csproj
    ├── Configuration/               # Configuration models
    ├── Entities/                   # Domain entities
    ├── Extensions/                 # Service registration extensions
    ├── Interfaces/                 # Repository and service interfaces
    ├── Repositories/               # Repository implementations
    ├── Services/                   # Infrastructure services
    └── README.md                   # CosmosDb library documentation
```

## Architecture Layers

### API.Application
- **Purpose**: Web API application layer
- **Responsibilities**: 
  - HTTP endpoints and controllers
  - Request/response handling
  - Application configuration
  - Environment setup
- **Dependencies**: References `API.Infrastructure.CosmosDb`

### API.Infrastructure.CosmosDb
- **Purpose**: Data access infrastructure layer
- **Responsibilities**:
  - Azure Cosmos DB integration
  - Repository pattern implementation
  - Entity mapping and serialization
  - Database configuration
- **Dependencies**: None (infrastructure layer)

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Azure Cosmos DB account (for production)

### Development Setup

1. **Navigate to the API folder**:
   ```bash
   cd API
   ```

2. **Restore packages**:
   ```bash
   dotnet restore
   ```

3. **Build the solution**:
   ```bash
   dotnet build
   ```

4. **Run the application**:
   ```bash
   dotnet run --project API.Application
   ```

### Configuration

The application uses environment variables and configuration files:

- **Development**: Uses `.env` file and `appsettings.Development.json`
- **Production**: Uses environment variables and `appsettings.json`

See `API.Application/ENVIRONMENT_SETUP.md` for detailed configuration instructions.

## Features

- **Clean Architecture**: Separation of concerns with distinct layers
- **Environment Configuration**: Flexible configuration management
- **Cosmos DB Integration**: Ready-to-use data access layer
- **Swagger Documentation**: API documentation at `/swagger`
- **CORS Support**: Configurable cross-origin resource sharing
- **Logging**: Comprehensive logging throughout the application

## Development

### Adding New Features

1. **Domain Logic**: Add to appropriate layer based on responsibility
2. **Data Access**: Extend repositories in `API.Infrastructure.CosmosDb`
3. **API Endpoints**: Add to `API.Application/Program.cs` or create controllers
4. **Configuration**: Update configuration models and settings files

### Project Dependencies

- `API.Application` → `API.Infrastructure.CosmosDb`
- Both projects are included in the `MealWeekPlanner.sln` solution

## Deployment

The solution is ready for deployment to:
- Azure App Service
- Docker containers
- On-premises servers

Configuration for different environments can be managed through:
- Environment variables
- Azure Key Vault
- Configuration files
