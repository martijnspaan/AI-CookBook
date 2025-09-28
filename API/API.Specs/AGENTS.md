# Testing Framework Guidelines

## 🧪 Test Structure & Organization

### AAA Pattern Implementation
All unit tests must follow the **Arrange, Act, Assert** (AAA) pattern for maximum clarity and maintainability:

```csharp
[Test]
public async Task Execute_WithValidInput_ReturnsExpectedResult()
{
    // Arrange
    var input = new ExampleUseCaseInput { /* setup data */ };
    var expectedOutput = new ExampleUseCaseOutput { /* expected result */ };
    var useCase = new ExampleUseCase(/* dependencies */);

    // Act
    var actualOutput = await useCase.Execute(input);

    // Assert
    actualOutput.Should().BeEquivalentTo(expectedOutput);
}
```

**AAA Pattern Requirements**:
- **Arrange**: Set up test data, mocks, and dependencies
- **Act**: Execute the method under test
- **Assert**: Verify the expected outcome
- **Comments**: These section comments are the ONLY exception to the no-comments rule

## 🎯 Testing Best Practices

### Test Naming Conventions
- **Descriptive Names**: Test names should clearly describe the scenario and expected outcome
- **Method_Scenario_ExpectedResult**: Follow consistent naming pattern
- **Readable Intent**: Test names should serve as documentation

### Test Data Management
- **Test Builders**: Use builder pattern for complex test data creation
- **Data Factories**: Create reusable factories for common test scenarios
- **Isolation**: Each test should be independent and not rely on external state

### Mocking & Dependencies
- **Mock External Dependencies**: Use appropriate mocking frameworks (Moq, NSubstitute)
- **Verify Interactions**: Assert that dependencies were called with correct parameters
- **Minimal Mocking**: Only mock what's necessary for the test to run

### Assertion Strategies
- **Specific Assertions**: Use specific assertion methods over generic ones
- **Meaningful Messages**: Provide clear failure messages for better debugging
- **Multiple Assertions**: Group related assertions logically

## 🔍 Test Coverage & Quality

### Coverage Requirements
- **High Coverage**: Aim for comprehensive code coverage across all business logic
- **Meaningful Coverage**: Focus on testing behavior, not just achieving percentage targets
- **Edge Cases**: Test boundary conditions and error scenarios

### Test Categories
- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: Test component interactions and data flow
- **Contract Tests**: Verify API contracts and data transformations

### Performance Testing
- **Response Times**: Validate that operations complete within acceptable timeframes
- **Resource Usage**: Monitor memory and CPU usage during test execution
- **Load Testing**: Test system behavior under various load conditions

## 🛠️ Testing Tools & Frameworks

### Recommended Stack
- **xUnit**: Primary testing framework for .NET
- **FluentAssertions**: Expressive assertion library
- **AutoFixture**: Automatic test data generation
- **Moq**: Mocking framework for dependencies

### Test Organization
- **Feature-Based**: Group tests by feature or use case
- **Parallel Execution**: Design tests to run in parallel safely
- **Test Categories**: Use categories to organize different types of tests

### Continuous Integration
- **Automated Testing**: Integrate tests into CI/CD pipeline
- **Test Reports**: Generate comprehensive test reports and coverage metrics
- **Quality Gates**: Fail builds on test failures or coverage thresholds