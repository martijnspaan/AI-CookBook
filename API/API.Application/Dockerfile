# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy project files for better layer caching
COPY API.Application/API.Application.csproj API.Application/
COPY API.Infrastructure.CosmosDb/API.Infrastructure.CosmosDb.csproj API.Infrastructure.CosmosDb/

# Restore dependencies (this layer will be cached if project files don't change)
RUN dotnet restore API.Application/API.Application.csproj

# Copy source code
COPY . .

# Build the application
WORKDIR /src/API.Application
RUN dotnet build "API.Application.csproj" -c Release -o /app/build --no-restore

# Publish stage
FROM build AS publish
WORKDIR /src/API.Application
RUN dotnet publish "API.Application.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

COPY --from=publish /app/publish .

# Expose port 4201
EXPOSE 4201

# Set environment variables
ENV ASPNETCORE_URLS=http://+:4201
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4201/health || exit 1

ENTRYPOINT ["dotnet", "API.Application.dll"]
