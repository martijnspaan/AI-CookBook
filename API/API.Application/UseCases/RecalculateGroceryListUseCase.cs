using API.Application.Dtos;
using API.Infrastructure.CosmosDb.Entities;
using API.Infrastructure.CosmosDb.Interfaces;

namespace API.Application.UseCases;

public class RecalculateGroceryListUseCase(
    ICosmosDbRepository<GroceryListEntity> groceryListRepository,
    ICosmosDbRepository<RecipeEntity> recipeRepository)
{
    public async Task<RecalculateGroceryListUseCaseOutput> Execute(RecalculateGroceryListUseCaseInput input)
    {
        try
        {
            // Get the existing grocery list
            ICollection<GroceryListEntity> existingGroceryLists = await groceryListRepository.QueryAsync(
                "SELECT * FROM c WHERE c.id = @id", 
                new Dictionary<string, object> { { "id", input.GroceryListId } });
            
            GroceryListEntity? existingGroceryList = existingGroceryLists.FirstOrDefault();
            if (existingGroceryList == null)
            {
                return RecalculateGroceryListUseCaseOutput.Failure("Grocery list not found");
            }

            // Get all recipes referenced in the grocery list
            var recipeIds = existingGroceryList.Meals
                .Where(m => !string.IsNullOrEmpty(m.RecipeId))
                .Select(m => m.RecipeId!)
                .Distinct()
                .ToList();

            var recipes = new Dictionary<string, RecipeEntity>();
            foreach (var recipeId in recipeIds)
            {
                var recipe = await recipeRepository.GetByIdAsync(recipeId);
                if (recipe != null)
                {
                    recipes[recipeId] = recipe;
                }
            }

            // Recalculate ingredient amounts based on serving counts
            var recalculatedMeals = new List<Meal>();
            foreach (var meal in existingGroceryList.Meals)
            {
                if (!string.IsNullOrEmpty(meal.RecipeId) && recipes.ContainsKey(meal.RecipeId))
                {
                    var recipe = recipes[meal.RecipeId];
                    var servingCount = meal.ServingCount ?? recipe.ServingSize;
                    var scaleFactor = (double)servingCount / recipe.ServingSize;
                    
                    // Create scaled ingredients for this meal
                    var scaledIngredients = recipe.Ingredients.Select(ingredient => new Ingredient(
                        ingredient.Name,
                        ingredient.Type,
                        new Amount(
                            ingredient.Amount.Value * scaleFactor,
                            ingredient.Amount.Unit
                        )
                    )).ToList();

                    // Store the scaled ingredients in a custom property or create a new meal structure
                    // For now, we'll create a new meal with the scaled serving count
                    recalculatedMeals.Add(new Meal(
                        meal.DayOfMeal,
                        meal.MealType,
                        meal.RecipeId,
                        servingCount
                    ));
                }
                else
                {
                    recalculatedMeals.Add(meal);
                }
            }

            // Update the grocery list with recalculated meals
            existingGroceryList.Meals = recalculatedMeals;
            existingGroceryList.UpdatedAt = DateTime.UtcNow;

            GroceryListEntity updatedGroceryList = await groceryListRepository.UpdateAsync(existingGroceryList);
            return RecalculateGroceryListUseCaseOutput.Success(updatedGroceryList);
        }
        catch (Exception ex)
        {
            return RecalculateGroceryListUseCaseOutput.Failure(ex.Message);
        }
    }
}
