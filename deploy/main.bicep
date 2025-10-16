// Main Bicep template for Meal Week Planner deployment
// This template manages the deployment infrastructure and configuration

targetScope = 'resourceGroup'

// Parameters
@description('Name of the application')
param appName string = 'meal-week-planner'

@description('Environment name')
param environment string = 'local'

@description('Location for resources')
param location string = 'West Europe'

@description('Web application port')
param webPort int = 4200

@description('API application port')
param apiPort int = 4201

@description('API image tag')
param apiImageTag string = 'latest'

@description('Web image tag')
param webImageTag string = 'latest'

// Variables
var resourcePrefix = '${appName}-${environment}'
var apiImageName = '${appName}-api'
var webImageName = '${appName}-web'
var kindClusterName = 'meal-week-planner'

// Outputs for deployment script
output clusterName string = kindClusterName
output apiImageName string = apiImageName
output webImageName string = webImageName
output apiPort int = apiPort
output webPort int = webPort
output apiImageTag string = apiImageTag
output webImageTag string = webImageTag
output deploymentConfig object = {
  clusterName: kindClusterName
  apiImage: '${apiImageName}:${apiImageTag}'
  webImage: '${webImageName}:${webImageTag}'
  apiPort: apiPort
  webPort: webPort
  environment: environment
}
