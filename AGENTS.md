# Project Description
This project is an AI powered application that works with cooking recipes and grocery lists. A week schedule can be made by selecting recipes per day and grocery lists for that week can be generated from the recipes.

# Project Instructions

## Folder structure

- The frontend application must be managed in the 'Web' folder
- The backend application and API must be managed in the 'API' folder
- Kubernetes templates and pipeline templates must be managed in the 'k8s' folder
- The example recipes must be managed in the folder 'API/API.Application/recipes'
- Any Azure related scripts must be managed in the folder 'azure'

## Project rules

- When running scripts, never use ampersands (&&) to concatenate commands, instead run each command separately.
- When running scripts always check in the current folder.

## Coding style

- Don't write comments but make the code itself readible with descriptive names
- Don't abbreviate variable names

## Azure test environment

- Any commands and actions performed on Azure are only allowed in the subscription 'Playground - masp' and resource group 'AI-CookBook'