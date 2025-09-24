// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
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
builder.Services.AddCors(options =>
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

var app = builder.Build();

// Configure the HTTP request pipeline.
var swaggerEnabled = Environment.GetEnvironmentVariable("SWAGGER_ENABLED") ?? "true";
if (app.Environment.IsDevelopment() && swaggerEnabled.ToLower() == "true")
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
app.MapGet("/", () => Results.Redirect("/swagger"))
    .ExcludeFromDescription();

// API endpoints
app.MapGet("/api/empty", () => "")
    .WithName("GetEmptyString")
    .WithOpenApi();

app.MapGet("/api/recipes", () =>
{
    try
    {
        var recipesPath = Path.Combine(Directory.GetCurrentDirectory(), 
            Environment.GetEnvironmentVariable("RECIPES_PATH") ?? "recipes");
        if (!Directory.Exists(recipesPath))
        {
            return Results.Json(new { error = "Recipes directory not found" }, statusCode: 404);
        }

        var recipeFiles = Directory.GetFiles(recipesPath, "*.json");
        var recipes = new List<object>();

        foreach (var file in recipeFiles)
        {
            try
            {
                var jsonContent = File.ReadAllText(file);
                var recipe = System.Text.Json.JsonSerializer.Deserialize<object>(jsonContent);
                if (recipe != null)
                {
                    recipes.Add(recipe);
                }
            }
            catch (Exception ex)
            {
                // Log error but continue processing other files
                Console.WriteLine($"Error reading recipe file {file}: {ex.Message}");
            }
        }

        return Results.Json(recipes);
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
})
.WithName("GetRecipes")
.WithOpenApi();

app.Run();
