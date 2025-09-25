using API.Infrastructure.CosmosDb.Interfaces;
using Newtonsoft.Json;

namespace API.Infrastructure.CosmosDb.Entities;

public class WeekMenuEntity : BaseCosmosDbEntity
{
    [JsonProperty("WeekNumber")]
    public int WeekNumber { get; set; }

    [JsonProperty("Year")]
    public int Year { get; set; }

    [JsonProperty("WeekDays")]
    public List<WeekDay> WeekDays { get; set; } = new();

    public WeekMenuEntity()
    {
    }
}

public record WeekDay(
    [property: JsonProperty("dayOfWeek")] DayOfWeek DayOfWeek = DayOfWeek.Monday,
    [property: JsonProperty("breakfastRecipeId")] string? BreakfastRecipeId = null,
    [property: JsonProperty("lunchRecipeId")] string? LunchRecipeId = null,
    [property: JsonProperty("dinnerRecipeId")] string? DinnerRecipeId = null);
