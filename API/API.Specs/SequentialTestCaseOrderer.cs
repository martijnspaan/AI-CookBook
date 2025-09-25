using Xunit.Abstractions;
using Xunit.Sdk;

namespace API.Specs;

/// <summary>
/// Custom test case orderer that enforces sequential execution based on test method names
/// Tests are ordered by their numeric prefix (Test1_, Test2_, etc.)
/// </summary>
public class SequentialTestCaseOrderer : ITestCaseOrderer
{
    public IEnumerable<TTestCase> OrderTestCases<TTestCase>(IEnumerable<TTestCase> testCases)
        where TTestCase : ITestCase
    {
        return testCases.OrderBy(testCase => GetTestOrder(testCase.DisplayName));
    }

    private static int GetTestOrder(string displayName)
    {
        // Extract the test number from method names like "Test1_CreateRecipe_ShouldReturnCreatedRecipe"
        var match = System.Text.RegularExpressions.Regex.Match(displayName, @"Test(\d+)_");
        return match.Success ? int.Parse(match.Groups[1].Value) : int.MaxValue;
    }
}
