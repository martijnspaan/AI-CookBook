using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class CreateGroceryListUseCase(ICosmosDbRepository<GroceryListEntity> repository)
{
    public async Task<CreateGroceryListUseCaseOutput> Execute(CreateGroceryListUseCaseInput input)
    {
        try
        {
            // Convert string to DateTime
            if (!DateTime.TryParse(input.DayOfGrocery, out DateTime dayOfGrocery))
            {
                return CreateGroceryListUseCaseOutput.Failure("Invalid dayOfGrocery format. Expected ISO 8601 format.");
            }

            // Convert GroceryListMealInput to Meal entities
            List<Meal> meals = input.Meals.Select(mealInput => new Meal(
                ParseDateTime(mealInput.DayOfMeal),
                mealInput.MealType,
                mealInput.RecipeId,
                mealInput.ServingCount
            )).ToList();

            GroceryListEntity groceryList = new GroceryListEntity
            {
                DayOfGrocery = dayOfGrocery,
                Meals = meals
            };

            GroceryListEntity createdGroceryList = await repository.CreateAsync(groceryList);
            return CreateGroceryListUseCaseOutput.Success(createdGroceryList);
        }
        catch (Exception ex)
        {
            return CreateGroceryListUseCaseOutput.Failure(ex.Message);
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
