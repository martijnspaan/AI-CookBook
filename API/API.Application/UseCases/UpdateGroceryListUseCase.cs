using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class UpdateGroceryListUseCase(ICosmosDbRepository<GroceryListEntity> repository)
{
    public async Task<UpdateGroceryListUseCaseOutput> Execute(UpdateGroceryListUseCaseInput input)
    {
        try
        {
            // First, get the existing grocery list
            ICollection<GroceryListEntity> existingGroceryLists = await repository.QueryAsync(
                "SELECT * FROM c WHERE c.id = @id", 
                new Dictionary<string, object> { { "id", input.Id } });
            
            GroceryListEntity? existingGroceryList = existingGroceryLists.FirstOrDefault();
            if (existingGroceryList == null)
            {
                return UpdateGroceryListUseCaseOutput.Failure("Grocery list not found");
            }

            // Convert string to DateTime
            if (!DateTime.TryParse(input.DayOfGrocery, out DateTime dayOfGrocery))
            {
                return UpdateGroceryListUseCaseOutput.Failure("Invalid dayOfGrocery format. Expected ISO 8601 format.");
            }

            // Convert GroceryListMealInput to Meal entities
            List<Meal> meals = input.Meals.Select(mealInput => new Meal(
                ParseDateTime(mealInput.DayOfMeal),
                mealInput.MealType,
                mealInput.RecipeId,
                mealInput.ServingCount
            )).ToList();

            // Update the existing grocery list
            existingGroceryList.DayOfGrocery = dayOfGrocery;
            existingGroceryList.Meals = meals;
            existingGroceryList.UpdatedAt = DateTime.UtcNow;

            GroceryListEntity updatedGroceryList = await repository.UpdateAsync(existingGroceryList);
            return UpdateGroceryListUseCaseOutput.Success(updatedGroceryList);
        }
        catch (Exception ex)
        {
            return UpdateGroceryListUseCaseOutput.Failure(ex.Message);
        }
    }

    private static DateTime ParseDateTime(string dateString)
    {
        if (!DateTime.TryParse(dateString, out DateTime date))
        {
            throw new ArgumentException($"Invalid date format: {dateString}. Expected ISO 8601 format.");
        }
        return date;
    }
}
