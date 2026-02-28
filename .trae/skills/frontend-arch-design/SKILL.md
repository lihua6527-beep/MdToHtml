---
name: "frontend-arch-design"
description: "Guides frontend architecture planning, requirement clarification, and decision making. Invoke when starting a new project, refactoring, OR when requirements are ambiguous/incomplete and you need to ask precise questions to proceed."
---

# Frontend Architecture & Requirement Clarification

This skill helps you plan a robust frontend architecture and **actively clarify ambiguous requirements** before writing code. It emphasizes the transition from "quick prototype" to "maintainable system" and ensures you have all necessary information to build the right solution.

## When to Invoke
- **Project Initiation**: Starting a new frontend project.
- **Refactoring**: Moving from a "messy" prototype to a layered architecture.
- **Ambiguity Resolution**: **CRITICAL** - Whenever you lack sufficient information, face uncertainty about a feature's scope, or need to choose between multiple technical approaches.

## 1. Architectural Analysis (The "Why")
Understand the context before coding.
- **Messy (Speed)**: Direct `fetch`, local state. Good for prototypes.
- **Structured (Scale)**: Service Layer, SWR/React Query, Global State. Good for production.

## 2. Interactive Requirement Gathering (The "What")
Use the `AskUserQuestion` tool to eliminate uncertainty. **Speed and precision are key.**

### Question Design Principles
- **Be Specific**: Do not ask "How should I implement this?". Ask "Should this feature support offline mode?"
- **Provide Options**: Users answer faster when choosing from a list.
  - *Bad*: "What error handling do you want?"
  - *Good*: "How should API errors be displayed? [Toast Notification | Modal Alert | Inline Message]"
- **Defaults**: Suggest a recommended default (e.g., "(Recommended)") to reduce cognitive load.

### Key Topics to Clarify
- **Data Strategy**: Read-heavy vs. Write-heavy? Real-time sync needed?
- **State Scope**: Local (Component) vs. Global (App-wide) vs. Server (SWR)?
- **User Experience**: Optimistic updates? Skeleton loaders?
- **Edge Cases**: Offline behavior? Permission denied handling?

## 3. Blueprint Generation
Based on the answers, generate a project structure blueprint:
- `src/services/`: API calls and business logic (Separation of Concerns).
- `src/hooks/`: Custom hooks wrapping `useSWR` or `useMutation` (Reusability).
- `src/types/`: Shared TypeScript interfaces (Type Safety).
- `src/constants/`: Query Keys and Configuration (Maintainability).

## 4. Implementation Templates
Provide standard templates for:
- `ApiClient`: A wrapper around `fetch` or `axios` with interceptors.
- `BaseService`: Abstract class for common CRUD operations.
- `useSWR` Hook Pattern: Standardized data fetching hook.

## Usage
Invoke this skill to:
1.  **Stop and Ask**: When you realize you are guessing the user's intent.
2.  **Plan**: Before writing complex code.
3.  **Refactor**: When cleaning up technical debt.
