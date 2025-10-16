# Secrets Management

This document explains how to manage secrets for the Meal Week Planner application.

## Overview

Sensitive configuration values (like database connection strings and API keys) have been extracted from the deployment files into a `secrets.env` file that is ignored by git.

## Files

- `secrets.env` - Contains the actual secret values (ignored by git)
- `scripts/setup-secrets.ps1` - Script to create Kubernetes secrets from secrets.env
- `deploy/k8s/secrets.yaml` - Kubernetes secret manifest template
- `deploy/k8s/api-deployment.yaml` - Updated to reference secrets instead of hardcoded values

## Setup

### 1. Create secrets.env

Create a `secrets.env` file in the project root with your actual secret values:

```bash
# Meal Week Planner Secrets
# This file contains sensitive configuration values and should NOT be committed to git

# CosmosDB Configuration
COSMOSDB_CONNECTION_STRING=AccountEndpoint=https://your-cosmosdb.documents.azure.com:443/;AccountKey=YOUR_ACTUAL_KEY_HERE;
COSMOSDB_DATABASE_NAME=MealWeekPlannerLocal
COSMOSDB_PARTITION_KEY_PATH=/id
```

### 2. Apply Secrets to Kubernetes

The secrets are automatically applied when you run the deployment script:

```bash
.\Update.ps1 -Image all
```

Or manually:

```bash
.\scripts\setup-secrets.ps1
```

### 3. Verify Secrets

Check that secrets were created:

```bash
kubectl get secret meal-week-planner-secrets
kubectl describe secret meal-week-planner-secrets
```

## Security Notes

- The `secrets.env` file is ignored by git and should never be committed
- Kubernetes secrets are base64 encoded (not encrypted) - suitable for local development
- For production environments, consider using Azure Key Vault or other secure secret management solutions
- The actual secret values are only stored in the `secrets.env` file on your local machine

## Troubleshooting

### Secrets not found

If you see errors about missing secrets:

1. Ensure `secrets.env` exists in the project root
2. Run `.\scripts\setup-secrets.ps1` manually
3. Check that the Kubernetes secret exists: `kubectl get secret meal-week-planner-secrets`

### Deployment fails

If the API deployment fails due to missing secrets:

1. Verify the secret keys match between `secrets.env` and the deployment file
2. Check that the secret was created successfully
3. Restart the deployment after fixing secrets

## File Structure

```
├── secrets.env                    # Your actual secrets (ignored by git)
├── scripts/
│   └── setup-secrets.ps1         # Script to create Kubernetes secrets
├── deploy/k8s/
│   ├── secrets.yaml              # Kubernetes secret manifest template
│   └── api-deployment.yaml       # Updated to use secret references
└── SECRETS.md                    # This documentation
```
