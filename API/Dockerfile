# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 4201

# Use the official .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["API.Application/API.Application.csproj", "API.Application/"]
COPY ["API.Infrastructure.CosmosDb/API.Infrastructure.CosmosDb.csproj", "API.Infrastructure.CosmosDb/"]
RUN dotnet restore "API.Application/API.Application.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
WORKDIR "/src/API.Application"
RUN dotnet build "API.Application.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "API.Application.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create the final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create shared data directory
RUN mkdir -p /shared-data

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:4201

ENTRYPOINT ["dotnet", "API.Application.dll"]

