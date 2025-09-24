using API.Application.Bootstrapping;

// Load environment variables from .env file
DotNetEnv.Env.Load();

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure services using Startup
Startup startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

WebApplication app = builder.Build();

// Configure the application using Startup
startup.Configure(app, app.Environment);

app.Run();

// Make Program class public for testing
public partial class Program { }