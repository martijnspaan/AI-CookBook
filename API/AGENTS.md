# Backend Development Guidelines

## 🏗️ Architecture Principles

### Clean Architecture Implementation
- **SOLID Principles**: Apply all five SOLID principles rigorously throughout the codebase
- **Union Architecture**: Maintain strict adherence to the established union architecture pattern
- **Separation of Concerns**: Keep business logic, data access, and presentation layers distinct
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

### Use Case Pattern Implementation
Each business functionality must be encapsulated in a dedicated use case class following this pattern:

```csharp
public class ExampleUseCase
{
    public async Task<ExampleUseCaseOutput> Execute(ExampleUseCaseInput input)
    {
        // Single public method entry point
        // Multiple private helper methods for complex logic
        // Clear separation of concerns within the use case
    }
}
```

**Use Case Requirements**:
- One use case per file
- Single public method: `Execute(input)`
- Multiple private methods for internal logic
- Clear input/output contracts via DTOs
- Comprehensive error handling and validation

## 💻 Code Quality Standards

### Type Safety & Explicit Declarations
- **Explicit Types**: Never use `var` - always declare explicit types for variables
- **Strong Typing**: Leverage C#'s type system for compile-time safety
- **Generic Constraints**: Use appropriate generic constraints for type safety

### Collection Management
- **Prefer ICollection**: Use `ICollection<T>` over `IEnumerable<T>` for better performance and functionality
- **Immutable Collections**: Consider using immutable collections where appropriate
- **Async Enumerables**: Use `IAsyncEnumerable<T>` for async data streaming

### Modern C# Features
- **Records First**: Prioritize records over classes for data transfer objects and value types
- **Pattern Matching**: Utilize modern C# pattern matching capabilities
- **Nullable Reference Types**: Enable and enforce nullable reference types for better null safety

### File Organization
- **Single Responsibility**: Each file contains exactly one class or record
- **Logical Grouping**: Organize files by feature and responsibility
- **Namespace Alignment**: Keep namespaces aligned with folder structure

## 🔧 .NET Core Best Practices

### Performance Optimization
- **Async/Await**: Use async/await consistently for I/O operations
- **Memory Management**: Implement proper disposal patterns and avoid memory leaks
- **Caching Strategies**: Implement appropriate caching for frequently accessed data

### Security Implementation
- **Input Validation**: Validate all inputs at API boundaries
- **Authentication & Authorization**: Implement proper security measures
- **Data Protection**: Encrypt sensitive data and use secure communication protocols

### Error Handling
- **Exception Management**: Implement comprehensive exception handling strategies
- **Logging**: Use structured logging with appropriate log levels
- **Graceful Degradation**: Handle failures gracefully with meaningful error responses

### Testing Strategy
- **Unit Testing**: Achieve high code coverage with meaningful unit tests
- **Integration Testing**: Test component interactions thoroughly
- **Performance Testing**: Validate performance characteristics under load