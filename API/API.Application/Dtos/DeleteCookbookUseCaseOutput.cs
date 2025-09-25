namespace API.Application.Dtos;

public record DeleteCookbookUseCaseOutput(bool IsSuccess, string? ErrorMessage = null)
{
    public static DeleteCookbookUseCaseOutput Success()
    {
        return new DeleteCookbookUseCaseOutput(true);
    }

    public static DeleteCookbookUseCaseOutput Failure(string errorMessage)
    {
        return new DeleteCookbookUseCaseOutput(false, errorMessage);
    }
}
