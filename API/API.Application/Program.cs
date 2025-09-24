using API.Application.Bootstrapping;

// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Configure services using Startup
var startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

var app = builder.Build();

// Configure the application using Startup
startup.Configure(app, app.Environment);

app.Run();
