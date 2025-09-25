using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DotNetEnv;

namespace API.Specs;

/// <summary>
/// Web application factory for integration testing
/// </summary>
public class ApiWebApplicationFactory : WebApplicationFactory<Program>, IDisposable
{
    private bool _disposed = false;

    public ApiWebApplicationFactory()
    {
        LoadEnvironmentVariables();
    }

    private void LoadEnvironmentVariables()
    {
        // Get the directory where the test project is located
        var testProjectDirectory = Directory.GetCurrentDirectory();
        var environmentFilePath = Path.Combine(testProjectDirectory, ".env");

        // Load .env file if it exists
        if (File.Exists(environmentFilePath))
        {
            DotNetEnv.Env.Load(environmentFilePath);
        }
        else
        {
            // If .env file doesn't exist, provide clear error message
            throw new FileNotFoundException(
                $"Environment file not found at: {environmentFilePath}\n" +
                "Please create a .env file in the API.Specs directory with the following variables:\n" +
                "ASPNETCORE_ENVIRONMENT=Testing\n" +
                "COSMOSDB_CONNECTION_STRING=your_connection_string_here\n" +
                "COSMOSDB_DATABASE_NAME=CookBookTest\n" +
                "COSMOSDB_CONTAINER_NAME=RecipesTest\n" +
                "COSMOSDB_PARTITION_KEY_PATH=/id\n" +
                "COSMOSDB_CREATE_IF_NOT_EXISTS=true"
            );
        }

        // Verify required environment variables are set
        ValidateRequiredEnvironmentVariables();
    }

    private void ValidateRequiredEnvironmentVariables()
    {
        var requiredEnvironmentVariables = new[]
        {
            "ASPNETCORE_ENVIRONMENT",
            "COSMOSDB_CONNECTION_STRING",
            "COSMOSDB_DATABASE_NAME",
            "COSMOSDB_CONTAINER_NAME",
            "COSMOSDB_PARTITION_KEY_PATH"
        };

        var missingEnvironmentVariables = new List<string>();

        foreach (var environmentVariable in requiredEnvironmentVariables)
        {
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(environmentVariable)))
            {
                missingEnvironmentVariables.Add(environmentVariable);
            }
        }

        if (missingEnvironmentVariables.Any())
        {
            throw new InvalidOperationException(
                $"Missing required environment variables: {string.Join(", ", missingEnvironmentVariables)}\n" +
                "Please ensure all required variables are set in your .env file."
            );
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configure test-specific settings
        builder.ConfigureAppConfiguration((context, configurationBuilder) =>
        {
            // Add the appsettings.Testing.json file from the test project directory
            var testConfigurationPath = Path.Combine(Directory.GetCurrentDirectory(), "appsettings.Testing.json");
            if (File.Exists(testConfigurationPath))
            {
                configurationBuilder.AddJsonFile(testConfigurationPath, optional: false, reloadOnChange: true);
            }
        });
    }

    public IServiceScope CreateScope()
    {
        return Services.CreateScope();
    }

    public new void Dispose()
    {
        if (!_disposed)
        {
            base.Dispose();
            _disposed = true;
        }
    }
}
