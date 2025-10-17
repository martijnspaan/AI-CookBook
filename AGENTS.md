# Meal Week Planner - Agent Guidelines

## 🍳 Project Overview

The Meal Week Planner is an intelligent culinary application that revolutionizes meal planning and grocery management. The system enables users to create weekly meal schedules by selecting recipes, and automatically generates comprehensive grocery lists based on the chosen recipes.

## 🤖 Agent Protocol

### Decision Making Authority
- **CRITICAL**: Before implementing any alternative approaches or major architectural changes during issue investigation, you MUST consult with the user first
- Always explain your reasoning and present options when proposing solutions
- Maintain transparency in your decision-making process

### Communication Standards
- Provide clear, actionable explanations for all recommendations
- Break down complex tasks into manageable steps
- Report progress regularly during long-running operations

## 📁 Project Architecture

### Directory Structure & Responsibilities
```
├── Web/                    # Angular frontend application
├── API/                    # .NET Core backend services & APIs
├── deploy/                 # Kubernetes manifests & deployment configs
├── azure/                  # Azure infrastructure scripts & templates
```

### Development Environment Standards
- **Frontend**: Angular application with responsive design supporting both tablets and mobile devices
- **Backend**: .NET Core API following clean architecture principles
- **Infrastructure**: Kubernetes orchestration with Azure cloud integration using Azure Container Instances for hosting containers
- **Testing**: Comprehensive unit and integration testing suite

## 🛠️ Development Workflow

### Script Execution Guidelines
- **NEVER** use command chaining operators (`&&`, `;`) in PowerShell or Bash scripts
- Execute each command individually for better error handling and debugging
- Always verify current working directory before running scripts
- Implement proper error checking and logging for all script operations
- **NO EMOTICONS IN LOG OUTPUT**: Never use emoticons (🍳, ✓, ✗, etc.) in script log output as they can cause display issues and are not suitable for automated environments
- **CURL COMMAND**: In PowerShell environments, always use `curl.exe` instead of `curl` to avoid PowerShell's Invoke-WebRequest alias

### Code Quality Standards
- **Self-Documenting Code**: Write code that tells a story through descriptive names
- **No Comments Policy**: Eliminate the need for comments through clear, expressive code
- **Full Variable Names**: Avoid abbreviations; use complete, meaningful names
- **Consistent Naming**: Follow established naming conventions throughout the project

## ☁️ Azure Environment Management

### Security & Scope
- **Restricted Environment**: All Azure operations limited to:
  - Subscription: `Playground - masp`
  - Resource Group: `MealWeekPlanner`
- **Resource Naming**: Implement descriptive, standardized naming conventions
- **Best Practices**: Follow Azure Well-Architected Framework principles

### Infrastructure Standards
- Use Infrastructure as Code (IaC) for all resource provisioning
- Implement proper tagging strategies for cost management and governance
- Follow least-privilege access principles

## 🧪 Testing & Validation

### Local Development Testing
- **Primary Environment**: Always test on localhost Kubernetes cluster
- **Port Configuration**:
  - Web Application (via Ingress): `http://localhost:8080` (requires port-forward)
  - API Service (Direct): `http://localhost:4201` (requires port-forward)
  - API Service (via Ingress): `http://localhost:8080/api/*` (requires port-forward)
- **Port Forwarding Required**: Use `kubectl port-forward` to access services
- **Deployment Verification**: Confirm successful pod deployment before testing
- **End-to-End Validation**: Test complete user workflows, not just individual components

### Quality Assurance
- Implement automated testing at multiple levels (unit, integration, e2e)
- Validate responsive design across different device sizes
- Test error handling and edge cases thoroughly