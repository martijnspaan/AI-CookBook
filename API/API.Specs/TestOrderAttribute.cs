using System;

namespace API.Specs;

/// <summary>
/// Attribute to specify the execution order of test methods
/// Lower numbers execute first
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class TestOrderAttribute : Attribute
{
    public int Order { get; }

    public TestOrderAttribute(int order)
    {
        Order = order;
    }
}
