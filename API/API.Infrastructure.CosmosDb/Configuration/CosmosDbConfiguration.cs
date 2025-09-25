namespace API.Infrastructure.CosmosDb.Configuration;

/// <summary>
/// Configuration settings for Azure Cosmos DB connection
/// </summary>
public class CosmosDbConfiguration
{
    /// <summary>
    /// The connection string for the Cosmos DB account
    /// </summary>
    public string ConnectionString { get; set; } = "";

    /// <summary>
    /// The name of the database
    /// </summary>
    public string DatabaseName { get; set; } = "";

    /// <summary>
    /// The name of the container
    /// </summary>
    public string ContainerName { get; set; } = "";

    /// <summary>
    /// The name of the WeekMenu container
    /// </summary>
    public string WeekMenuContainerName { get; set; } = "WeekMenu";

    /// <summary>
    /// The name of the Cookbooks container
    /// </summary>
    public string CookbookContainerName { get; set; } = "Cookbooks";

    /// <summary>
    /// The name of the GroceryLists container
    /// </summary>
    public string GroceryListContainerName { get; set; } = "GroceryLists";

    /// <summary>
    /// The partition key path for the container
    /// </summary>
    public string PartitionKeyPath { get; set; } = "/id";

    /// <summary>
    /// The throughput for the container (RU/s)
    /// </summary>
    public int? Throughput { get; set; } = null;

    /// <summary>
    /// Whether to create the database and container if they don't exist
    /// </summary>
    public bool CreateIfNotExists { get; set; } = true;
}
