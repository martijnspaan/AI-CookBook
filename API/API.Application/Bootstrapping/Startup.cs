using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Extensions;
using API.Infrastructure.CosmosDb.Repositories;
using API.Application.Controllers;
using API.Application.UseCases;

namespace API.Application.Bootstrapping;

public class Startup(IConfiguration configuration)
{
    public IConfiguration Configuration { get; } = configuration;

    public void ConfigureServices(IServiceCollection services)
    {
        // Add services to the container.
        services.AddEndpointsApiExplorer();

        // Add CosmosDB services
        services.AddCosmosDb(Configuration);
        
        // Register repository with configured container name
        services.AddScoped<ICosmosDbRepository<RecipeEntity>>(provider =>
        {
            ICosmosDbClientService cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            ILogger<CosmosDbRepository<RecipeEntity>> logger = provider.GetRequiredService<ILogger<CosmosDbRepository<RecipeEntity>>>();
            IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
            
            string containerName = configuration.GetSection("CosmosDb:ContainerName").Value ?? 
                               Environment.GetEnvironmentVariable("COSMOSDB_CONTAINER_NAME") ?? 
                               "Recipes";
            
            return new CosmosDbRepository<RecipeEntity>(cosmosDbClientService, logger, containerName);
        });

        // Register WeekMenu repository
        services.AddScoped<ICosmosDbRepository<WeekMenuEntity>>(provider =>
        {
            ICosmosDbClientService cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            ILogger<CosmosDbRepository<WeekMenuEntity>> logger = provider.GetRequiredService<ILogger<CosmosDbRepository<WeekMenuEntity>>>();
            IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
            
            string containerName = configuration.GetSection("CosmosDb:WeekMenuContainerName").Value ?? 
                               Environment.GetEnvironmentVariable("COSMOSDB_WEEKMENU_CONTAINER_NAME") ?? 
                               "WeekMenu";
            
            return new CosmosDbRepository<WeekMenuEntity>(cosmosDbClientService, logger, containerName);
        });

        // Register Cookbook repository
        services.AddScoped<ICosmosDbRepository<CookbookEntity>>(provider =>
        {
            ICosmosDbClientService cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            ILogger<CosmosDbRepository<CookbookEntity>> logger = provider.GetRequiredService<ILogger<CosmosDbRepository<CookbookEntity>>>();
            IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
            
            string containerName = configuration.GetSection("CosmosDb:CookbookContainerName").Value ?? 
                               Environment.GetEnvironmentVariable("COSMOSDB_COOKBOOK_CONTAINER_NAME") ?? 
                               "Cookbooks";
            
            return new CosmosDbRepository<CookbookEntity>(cosmosDbClientService, logger, containerName);
        });

        // Register GroceryList repository
        services.AddScoped<ICosmosDbRepository<GroceryListEntity>>(provider =>
        {
            ICosmosDbClientService cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            ILogger<CosmosDbRepository<GroceryListEntity>> logger = provider.GetRequiredService<ILogger<CosmosDbRepository<GroceryListEntity>>>();
            IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
            
            string containerName = configuration.GetSection("CosmosDb:GroceryListContainerName").Value ?? 
                               Environment.GetEnvironmentVariable("COSMOSDB_GROCERYLIST_CONTAINER_NAME") ?? 
                               "GroceryLists";
            
            return new CosmosDbRepository<GroceryListEntity>(cosmosDbClientService, logger, containerName);
        });

        // Register RecipeSettings repository
        services.AddScoped<ICosmosDbRepository<RecipeSettingsEntity>>(provider =>
        {
            ICosmosDbClientService cosmosDbClientService = provider.GetRequiredService<ICosmosDbClientService>();
            ILogger<CosmosDbRepository<RecipeSettingsEntity>> logger = provider.GetRequiredService<ILogger<CosmosDbRepository<RecipeSettingsEntity>>>();
            IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
            
            string containerName = configuration.GetSection("CosmosDb:RecipeSettingsContainerName").Value ?? 
                               Environment.GetEnvironmentVariable("COSMOSDB_RECIPESETTINGS_CONTAINER_NAME") ?? 
                               "RecipeSettings";
            
            return new CosmosDbRepository<RecipeSettingsEntity>(cosmosDbClientService, logger, containerName);
        });

        // Register use cases
        services.AddScoped<GetAllRecipesUseCase>();
        services.AddScoped<CreateRecipeUseCase>();
        services.AddScoped<UpdateRecipeUseCase>();
        services.AddScoped<DeleteRecipeUseCase>();
        services.AddScoped<CreateOrUpdateWeekMenuUseCase>();
        services.AddScoped<GetWeekMenusUseCase>();
        services.AddScoped<GetAllCookbooksUseCase>();
        services.AddScoped<CreateCookbookUseCase>();
        services.AddScoped<UpdateCookbookUseCase>();
        services.AddScoped<DeleteCookbookUseCase>();
        services.AddScoped<CreateGroceryListUseCase>();
        services.AddScoped<UpdateGroceryListUseCase>();
        services.AddScoped<GetAllGroceryListsUseCase>();
        services.AddScoped<DeleteGroceryListUseCase>();
        services.AddScoped<UpdateIngredientStateUseCase>();
        services.AddScoped<RecalculateGroceryListUseCase>();
        services.AddScoped<GetRecipeSettingsUseCase>();
        services.AddScoped<UpdateRecipeSettingsUseCase>();

        // Configure Swagger
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = Environment.GetEnvironmentVariable("API_TITLE") ?? "Meal Week Planner API",
                Version = Environment.GetEnvironmentVariable("API_VERSION") ?? "v1",
                Description = Environment.GetEnvironmentVariable("API_DESCRIPTION") ?? "A minimal API for the Meal Week Planner project",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = Environment.GetEnvironmentVariable("API_CONTACT_NAME") ?? "Meal Week Planner Team",
                    Email = Environment.GetEnvironmentVariable("API_CONTACT_EMAIL") ?? "contact@mealweekplanner.com"
                }
            });
        });

        // Add health checks
        services.AddHealthChecks()
            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), new[] { "ready" });

        // Add CORS services
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                string? allowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
                string? allowedMethods = Environment.GetEnvironmentVariable("CORS_ALLOWED_METHODS");
                string? allowedHeaders = Environment.GetEnvironmentVariable("CORS_ALLOWED_HEADERS");

                if (!string.IsNullOrEmpty(allowedOrigins))
                {
                    policy.WithOrigins(allowedOrigins.Split(','));
                }
                else
                {
                    policy.AllowAnyOrigin();
                }

                if (!string.IsNullOrEmpty(allowedMethods))
                {
                    policy.WithMethods(allowedMethods.Split(','));
                }
                else
                {
                    policy.AllowAnyMethod();
                }

                if (!string.IsNullOrEmpty(allowedHeaders))
                {
                    policy.WithHeaders(allowedHeaders.Split(','));
                }
                else
                {
                    policy.AllowAnyHeader();
                }
            });
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        // Initialize Cosmos DB
        using (IServiceScope scope = app.ApplicationServices.CreateScope())
        {
            ICosmosDbClientService cosmosDbClientService = scope.ServiceProvider.GetRequiredService<ICosmosDbClientService>();
            cosmosDbClientService.InitializeAsync().Wait();
        }

        // Configure the HTTP request pipeline.
        string swaggerEnabled = Environment.GetEnvironmentVariable("SWAGGER_ENABLED") ?? "true";
        if (env.IsDevelopment() && swaggerEnabled.ToLower() == "true")
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Meal Week Planner API v1");
                c.RoutePrefix = Environment.GetEnvironmentVariable("SWAGGER_ROUTE_PREFIX") ?? ""; // Set Swagger UI at the root URL
                c.DocumentTitle = Environment.GetEnvironmentVariable("SWAGGER_DOCUMENT_TITLE") ?? "Meal Week Planner API Documentation";
                c.DefaultModelsExpandDepth(-1); // Hide models section by default
            });
        }

        // Conditionally enable HTTPS redirection based on configuration
        bool httpsRedirectionEnabled = Configuration.GetValue<bool>("HttpsRedirection:Enabled", true);
        if (httpsRedirectionEnabled)
        {
            app.UseHttpsRedirection();
        }

        // Use CORS
        app.UseCors("AllowAll");

        // Add a welcome endpoint
        app.UseRouting();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapGet("/", () => Results.Redirect("/swagger"))
                .ExcludeFromDescription();
            
            // Add health check endpoints
            endpoints.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions()
            {
                Predicate = _ => true
            });
            endpoints.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions()
            {
                Predicate = check => check.Tags.Contains("ready")
            });
            
            // Map recipes endpoints
            endpoints.MapRecipesEndpoints();
            
            // Map week menu endpoints
            endpoints.MapWeekMenuEndpoints();
            
            // Map cookbooks endpoints
            endpoints.MapCookbooksEndpoints();
            
            // Map grocery list endpoints
            endpoints.MapGroceryListEndpoints();
            
            // Map recipe settings endpoints
            endpoints.MapRecipeSettingsEndpoints();
        });
    }
}
