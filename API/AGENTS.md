# Backend Instructions

## Code Style

- Always use best practices for .Net Core when writing code
- Never use var for variables so always make the type explicit
- favor ICollection over IEnumerable
- favor records over classes
- each file may only contain a single class

## Architecture

- Follow the SOLID principles when writing code
- Must follow the union architecture
- Follow the usecase pattern, where each functionality is performed by a single class that has a single public method and multiple private methods. For example the use case 'ExampleUseCase' would have the following method:
    `public Task<ExampleUseCaseOutput> Execute(ExampleUseCaseInput input)`