using System;
using System.Linq;
using Xunit.Abstractions;
using Xunit.Sdk;

namespace API.Specs;

/// <summary>
/// Custom test case orderer that enforces sequential execution based on TestOrderAttribute
/// Tests are ordered by the Order property of the TestOrderAttribute
/// </summary>
public class AttributeBasedTestCaseOrderer : ITestCaseOrderer
{
    public IEnumerable<TTestCase> OrderTestCases<TTestCase>(IEnumerable<TTestCase> testCases)
        where TTestCase : ITestCase
    {
        return testCases.OrderBy(testCase => GetTestOrder(testCase));
    }

    private static int GetTestOrder(ITestCase testCase)
    {
        var method = testCase.TestMethod.Method;
        var testOrderAttribute = method.GetCustomAttributes(typeof(TestOrderAttribute)).FirstOrDefault();
        
        if (testOrderAttribute is TestOrderAttribute orderAttribute)
        {
            return orderAttribute.Order;
        }
        
        // If no TestOrderAttribute is found, put the test at the end
        return int.MaxValue;
    }
}
