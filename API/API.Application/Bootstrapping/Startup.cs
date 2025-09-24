using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;
using API.Infrastructure.CosmosDb.Extensions;
using API.Application.Controllers;
using API.Application.UseCases;

namespace API.Application.Bootstrapping;

public class Startup
{
    public IConfiguration Configuration { get; }

    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        // Add services to the container.
        services.AddEndpointsApiExplorer();

        // Add CosmosDB services
        services.AddCosmosDb(Configuration);
        services.AddCosmosDbRepository<RecipeEntity>("Recipes");

        // Register use cases
        services.AddScoped<GetAllRecipesUseCase>();

        // Configure Swagger
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = Environment.GetEnvironmentVariable("API_TITLE") ?? "AI Cookbook API",
                Version = Environment.GetEnvironmentVariable("API_VERSION") ?? "v1",
                Description = Environment.GetEnvironmentVariable("API_DESCRIPTION") ?? "A minimal API for the AI Cookbook project",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = Environment.GetEnvironmentVariable("API_CONTACT_NAME") ?? "AI Cookbook Team",
                    Email = Environment.GetEnvironmentVariable("API_CONTACT_EMAIL") ?? "contact@aicookbook.com"
                }
            });
        });

        // Add CORS services
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                var allowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
                var allowedMethods = Environment.GetEnvironmentVariable("CORS_ALLOWED_METHODS");
                var allowedHeaders = Environment.GetEnvironmentVariable("CORS_ALLOWED_HEADERS");

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
        using (var scope = app.ApplicationServices.CreateScope())
        {
            var cosmosDbClientService = scope.ServiceProvider.GetRequiredService<ICosmosDbClientService>();
            cosmosDbClientService.InitializeAsync().Wait();
        }

        // Configure the HTTP request pipeline.
        var swaggerEnabled = Environment.GetEnvironmentVariable("SWAGGER_ENABLED") ?? "true";
        if (env.IsDevelopment() && swaggerEnabled.ToLower() == "true")
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Cookbook API v1");
                c.RoutePrefix = Environment.GetEnvironmentVariable("SWAGGER_ROUTE_PREFIX") ?? ""; // Set Swagger UI at the root URL
                c.DocumentTitle = Environment.GetEnvironmentVariable("SWAGGER_DOCUMENT_TITLE") ?? "AI Cookbook API Documentation";
                c.DefaultModelsExpandDepth(-1); // Hide models section by default
            });
        }

        app.UseHttpsRedirection();

        // Use CORS
        app.UseCors("AllowAll");

        // Add a welcome endpoint
        app.UseRouting();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapGet("/", () => Results.Redirect("/swagger"))
                .ExcludeFromDescription();
            
            // Map recipes endpoints
            endpoints.MapRecipesEndpoints();
        });
    }
}
