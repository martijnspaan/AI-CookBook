namespace API.Application.Dtos;

public record DeleteGroceryListUseCaseOutput(bool IsSuccess, string? ErrorMessage = null)
{
    public static DeleteGroceryListUseCaseOutput Success()
    {
        return new DeleteGroceryListUseCaseOutput(true);
    }

    public static DeleteGroceryListUseCaseOutput Failure(string errorMessage)
    {
        return new DeleteGroceryListUseCaseOutput(false, errorMessage);
    }
}
