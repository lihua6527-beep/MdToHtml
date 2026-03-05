---
name: "project-structure-monitor"
description: "Monitors file operations (add, delete, modify), reads document structure and functionality, ensures correct file operations, and updates the project structure index when modifications occur."
---

# Project Structure Monitor

## Purpose
This skill monitors file operations in the project and ensures that:
1. File operations are implemented correctly
2. The project structure index is updated when modifications occur
3. Document structure and functionality are properly maintained

## When to Invoke
- When adding, deleting, or modifying files in the project
- When creating new directories or moving files between directories
- When making changes that affect the project structure
- When the user explicitly asks to update the project structure index

## How It Works
1. **Monitor File Operations**: Tracks any file system changes in the project
2. **Validate Operations**: Ensures that file operations are implemented correctly
3. **Update Index**: Automatically updates the PROJECT_STRUCTURE.md file when modifications occur
4. **Verify Structure**: Checks that the project structure remains consistent and organized

## Usage Guidelines

### When Adding Files
1. Determine the appropriate directory for the new file based on its purpose
2. Update the PROJECT_STRUCTURE.md file to include the new file
3. Ensure the file follows the project's naming conventions and structure

### When Deleting Files
1. Remove the file from the PROJECT_STRUCTURE.md file
2. Ensure that deleting the file doesn't break any dependencies
3. Verify that the project structure remains clean and organized

### When Modifying Files
1. If the modification affects the file's purpose or location, update the PROJECT_STRUCTURE.md file
2. Ensure that the modification is consistent with the project's architecture

## Project Structure Index
The PROJECT_STRUCTURE.md file should be maintained in the project root directory and should include:
- A complete list of all directories and files in the project
- A description of each directory's purpose and contents
- Guidelines for maintaining the project structure

## Example Workflow
1. User adds a new component to the `src/components/CHD/` directory
2. The skill detects the new file
3. The skill updates the PROJECT_STRUCTURE.md file to include the new component
4. The skill verifies that the component is placed in the correct directory

## Best Practices
- Keep the project structure organized and consistent
- Update the PROJECT_STRUCTURE.md file whenever changes are made
- Follow the project's naming conventions and directory structure
- Regularly review the project structure to ensure it remains clean and maintainable

## Troubleshooting
- If the PROJECT_STRUCTURE.md file is not updating, check that the skill is properly invoked
- If file operations are not being validated, ensure that the skill is monitoring the correct directory
- If the project structure becomes inconsistent, use the skill to re-generate the PROJECT_STRUCTURE.md file