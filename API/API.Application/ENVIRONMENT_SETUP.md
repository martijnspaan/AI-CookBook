# Environment Configuration Setup

This document explains how to configure the Meal Week Planner API using environment variables.

## Development Environment File (.env)

Create a `.env` file in the API directory with the following configuration:

```env
# Development Environment Configuration
# This file contains environment variables for local development
# DO NOT commit this file to version control

# API Configuration
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=https://localhost:7149;http://localhost:5000

# Database Configuration (if needed in future)
# DB_CONNECTION_STRING=Server=localhost;Database=AI_Cookbook_Dev;Trusted_Connection=true;TrustServerCertificate=true

# API Settings
API_TITLE=Meal Week Planner API
API_VERSION=v1
API_DESCRIPTION=A minimal API for the Meal Week Planner project
API_CONTACT_NAME=Meal Week Planner Team
API_CONTACT_EMAIL=contact@mealweekplanner.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8080
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=*

# Logging Configuration
LOG_LEVEL_DEFAULT=Information
LOG_LEVEL_MICROSOFT_ASPNETCORE=Warning

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_ROUTE_PREFIX=
SWAGGER_DOCUMENT_TITLE=Meal Week Planner API Documentation

# Recipes Configuration
RECIPES_PATH=recipes

# CosmosDB Configuration
COSMOSDB_CONNECTION_STRING=AccountEndpoint=https://cosmos-meal-week-planner.documents.azure.com:443/;AccountKey=YOUR_ACTUAL_KEY_HERE
COSMOSDB_DATABASE_NAME=CookBook
COSMOSDB_CONTAINER_NAME=Recipes
COSMOSDB_PARTITION_KEY_PATH=/id
COSMOSDB_THROUGHPUT=400
COSMOSDB_CREATE_IF_NOT_EXISTS=true
```

## Environment Variables

### API Configuration
- `API_TITLE`: The title of the API (default: "Meal Week Planner API")
- `API_VERSION`: The version of the API (default: "v1")
- `API_DESCRIPTION`: Description of the API
- `API_CONTACT_NAME`: Contact name for the API
- `API_CONTACT_EMAIL`: Contact email for the API

### CORS Configuration
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `CORS_ALLOWED_METHODS`: Comma-separated list of allowed HTTP methods
- `CORS_ALLOWED_HEADERS`: Comma-separated list of allowed headers

### Swagger Configuration
- `SWAGGER_ENABLED`: Enable/disable Swagger UI (default: "true")
- `SWAGGER_ROUTE_PREFIX`: Route prefix for Swagger UI (default: "")
- `SWAGGER_DOCUMENT_TITLE`: Title for the Swagger documentation

### Recipes Configuration
- `RECIPES_PATH`: Path to the recipes directory (default: "recipes")

### CosmosDB Configuration
- `COSMOSDB_CONNECTION_STRING`: Azure CosmosDB connection string
- `COSMOSDB_DATABASE_NAME`: Name of the CosmosDB database (default: "CookBook")
- `COSMOSDB_CONTAINER_NAME`: Name of the CosmosDB container (default: "Recipes")
- `COSMOSDB_PARTITION_KEY_PATH`: Partition key path for the container (default: "/id")
- `COSMOSDB_THROUGHPUT`: Request units per second (default: "400")
- `COSMOSDB_CREATE_IF_NOT_EXISTS`: Whether to create database/container if they don't exist (default: "true")

## Setup Instructions

1. Copy the environment configuration above into a `.env` file in the API directory
2. Customize the values according to your local development needs
3. The `.env` file is automatically excluded from version control via `.gitignore`
4. Run the application - environment variables will be loaded automatically

## Security Notes

- Never commit the `.env` file to version control
- The `.env` file contains sensitive configuration and should remain local
- Use different environment files for different environments (development, staging, production)
