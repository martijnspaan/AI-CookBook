using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public class GroceryListEntity : BaseCosmosDbEntity
{
    [JsonProperty("DayOfGrocery")]
    public DateTime DayOfGrocery { get; set; }

    [JsonProperty("Meals")]
    public List<Meal> Meals { get; set; } = new();

    [JsonProperty("IngredientsState")]
    public List<IngredientState> IngredientsState { get; set; } = new();

    public GroceryListEntity()
    {
    }
}

public class Meal
{
    [JsonProperty("DayOfMeal")]
    public DateTime DayOfMeal { get; set; }

    [JsonProperty("MealType")]
    public string MealType { get; set; } = "";

    [JsonProperty("RecipeId")]
    public string? RecipeId { get; set; }

    public Meal() { }

    public Meal(DateTime dayOfMeal, string mealType = "", string? recipeId = null)
    {
        DayOfMeal = dayOfMeal;
        MealType = mealType;
        RecipeId = recipeId;
    }

    [JsonConstructor]
    public Meal(object dayOfMeal, string mealType = "", string? recipeId = null)
    {
        // Handle backward compatibility - dayOfMeal can be either DateTime or DayOfWeek enum (int)
        if (dayOfMeal is DateTime dateTime)
        {
            DayOfMeal = dateTime;
        }
        else if (dayOfMeal is int dayOfWeekInt)
        {
            // Convert old DayOfWeek enum to a default date (today + day offset)
            DayOfWeek dayOfWeek = (DayOfWeek)dayOfWeekInt;
            DateTime today = DateTime.Today;
            int daysUntilTargetDay = ((int)dayOfWeek - (int)today.DayOfWeek + 7) % 7;
            DayOfMeal = today.AddDays(daysUntilTargetDay);
        }
        else if (dayOfMeal is string dayString && DateTime.TryParse(dayString, out DateTime parsedDate))
        {
            DayOfMeal = parsedDate;
        }
        else
        {
            // Default to today if we can't parse
            DayOfMeal = DateTime.Today;
        }

        MealType = mealType;
        RecipeId = recipeId;
    }
}

public class IngredientState
{
    [JsonProperty("IngredientName")]
    public string IngredientName { get; set; } = string.Empty;

    [JsonProperty("State")]
    public string State { get; set; } = string.Empty;

    public IngredientState()
    {
    }

    public IngredientState(string ingredientName, string state)
    {
        IngredientName = ingredientName;
        State = state;
    }
}
