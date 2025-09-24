# CosmosDB Setup Instructions

## Configuration

The API has been configured to use Azure CosmosDB with the following settings:

- **Endpoint**: `https://cosmos-ai-cookbook.documents.azure.com:443/`
- **Database**: `CookBook`
- **Container**: `Recipes`
- **Partition Key**: `/id`

## Required Steps

1. **Setup Environment Configuration**: 
   - Copy `env.example` to `.env` in the API.Application directory
   - Update the `COSMOSDB_CONNECTION_STRING` with your actual CosmosDB account key
   - The connection string should look like:
     ```
     COSMOSDB_CONNECTION_STRING=AccountEndpoint=https://cosmos-ai-cookbook.documents.azure.com:443/;AccountKey=YOUR_ACTUAL_KEY_HERE
     ```
   - All other CosmosDB settings are pre-configured in the environment file

2. **Data Migration** (Optional):
   - The existing JSON recipe files in the `recipes/` folder can be imported into CosmosDB
   - The RecipeEntity structure matches the JSON structure exactly
   - Use the CosmosDB Data Migration Tool or Azure Portal to import the data

## API Endpoints

- **GET /api/recipes**: Retrieves all recipes from CosmosDB
- The endpoint now uses the CosmosDB repository instead of reading from local JSON files

## Entity Structure

The `RecipeEntity` matches the JSON structure:
- `Title`: Recipe title
- `Description`: Recipe description  
- `Tags`: List of tags
- `Ingredients`: List of ingredient objects with name, type, and amount
- `Recipe`: List of instruction steps

## Testing

After setting up the environment configuration, you can test the API by:
1. Creating a `.env` file from `env.example` with your actual CosmosDB connection string
2. Running the application: `dotnet run`
3. Navigating to the Swagger UI
4. Testing the `/api/recipes` endpoint

The application will now automatically initialize the CosmosDB connection on startup and create the database/container if they don't exist.
