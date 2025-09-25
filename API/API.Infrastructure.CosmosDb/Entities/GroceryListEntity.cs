using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public class GroceryListEntity : BaseCosmosDbEntity
{
    [JsonProperty("DayOfShopping")]
    public DateTime DayOfShopping { get; set; }

    [JsonProperty("Meals")]
    public List<Meal> Meals { get; set; } = new();

    public GroceryListEntity()
    {
    }
}

public record Meal(
    [property: JsonProperty("DayOfMeal")] DayOfWeek DayOfMeal = DayOfWeek.Monday,
    [property: JsonProperty("MealType")] string MealType = "",
    [property: JsonProperty("RecipeId")] string? RecipeId = null);
