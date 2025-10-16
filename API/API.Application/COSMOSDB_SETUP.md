# CosmosDB Configuration

The API has been configured to use Azure CosmosDB with the following settings:

- **Endpoint**: `https://meal-week-planner-db.documents.azure.com:443/`
- **Database - test environment**: `MealWeekPlanner`
- **Database - localhost environment**: `MealWeekPlannerLocal`

The application will now automatically initialize the CosmosDB connection on startup and create the database/container if they don't exist.