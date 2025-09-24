var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "AI Cookbook API",
        Version = "v1",
        Description = "A minimal API for the AI Cookbook project",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "AI Cookbook Team",
            Email = "contact@aicookbook.com"
        }
    });
});

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Cookbook API v1");
        c.RoutePrefix = ""; // Set Swagger UI at the root URL
        c.DocumentTitle = "AI Cookbook API Documentation";
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
        var recipesPath = Path.Combine(Directory.GetCurrentDirectory(), "recipes");
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
