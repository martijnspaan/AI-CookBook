namespace API.Application.Dtos;

/// <summary>
/// Output for the DeleteRecipe use case
/// </summary>
/// <param name="IsSuccess">Indicates if the operation was successful</param>
/// <param name="ErrorMessage">Error message if the operation failed</param>
public record DeleteRecipeUseCaseOutput(bool IsSuccess, string? ErrorMessage = null)
{
    public static DeleteRecipeUseCaseOutput Success()
    {
        return new DeleteRecipeUseCaseOutput(true);
    }

    public static DeleteRecipeUseCaseOutput Failure(string errorMessage)
    {
        return new DeleteRecipeUseCaseOutput(false, errorMessage);
    }
}
