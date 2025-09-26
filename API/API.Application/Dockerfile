# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy project files
COPY API.Application/API.Application.csproj API.Application/
COPY API.Infrastructure.CosmosDb/API.Infrastructure.CosmosDb.csproj API.Infrastructure.CosmosDb/

# Restore dependencies
RUN dotnet restore API.Application/API.Application.csproj

# Copy source code
COPY . .

# Build the application
WORKDIR /src/API.Application
RUN dotnet build "API.Application.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
WORKDIR /src/API.Application
RUN dotnet publish "API.Application.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=publish /app/publish .

# Expose port 4201
EXPOSE 4201

# Set environment variables
ENV ASPNETCORE_URLS=http://+:4201
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "API.Application.dll"]
