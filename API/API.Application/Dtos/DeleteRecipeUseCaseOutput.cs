namespace API.Application.Dtos;

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
