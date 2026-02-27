---
name: "feature-dev-flow"
description: "Manages full feature lifecycle (Plan -> Branch -> Execute -> Archive -> Merge). Invoke when user starts a new feature or completes a task."
---

# Feature Development Workflow Manager

This skill enforces a disciplined, plan-driven development process to ensure code quality, atomicity, and proper documentation archiving.

## Phase 1: Initialization & Planning
**Trigger**: User requests a new feature or describes a requirement.

**Steps**:
1.  **Understand Intent**: Clarify requirements and technical path.
2.  **Create Branch**:
    -   Command: `git checkout -b feature/<descriptive-name>`
    -   *Example*: `git checkout -b feature/scoring-system-v2`
3.  **Generate Plan**:
    -   Create file: `docs/计划书/YYYY-MM-DD_[FeatureName]_Plan.md` (Filename MUST use Chinese)
    -   **Content Requirements**:
        -   **Objectives**: Clear statement of what will be achieved.
        -   **Atomic Implementation Steps**: Detailed code changes, file-by-file.
        -   **Verification Strategy**: Specific unit tests or manual checks.
        -   **Rollback Plan**: How to revert if things go wrong.
4.  **User Confirmation**: Ask user to review and approve the plan before coding.

## Phase 2: Execution & Verification
**Trigger**: Plan approved by user.

**Steps**:
1.  **Execute Plan**: Implement changes step-by-step according to the plan.
    -   *Constraint*: Keep changes atomic.
2.  **Test**:
    -   Write/Run Unit Tests (`*.test.ts`).
    -   Run Integration Tests if applicable.
    -   *Self-Correction*: Fix any bugs found during testing.

## Phase 3: Completion & Archiving
**Trigger**: User accepts the feature ("done", "looks good", "merge it").

**Steps**:
1.  **Log Development**:
    -   Invoke `dev-log-manager` to save the final development record.
    -   *Note*: Ensure the log contains the final outcome and any deviations from the plan.
2.  **Archive Documents**:
    -   Move the Plan file to `docs/归档/`.
    -   *Command*: `mv docs/计划书/..._Plan.md docs/归档/`
3.  **Update Task Lists**:
    -   **Remove** from `docs/计划书/待扩展功能池.md`.
    -   **Add** to `docs/计划书/已完成功能清单.md` (include date and brief note).
4.  **Merge & Cleanup**:
    -   Stage changes: `git add .`
    -   Commit: `git commit -m "feat: complete <feature-name>"`
    -   Switch to master: `git checkout master`
    -   Merge: `git merge feature/<feature-name>`
    -   *Optional*: Delete branch `git branch -d feature/<feature-name>` (ask user first).

## Critical Rules
-   **Plan First**: Never start coding complex features without a written plan.
-   **Test Driven**: Always verify before asking for acceptance.
-   **Clean History**: Ensure the final merge represents a complete, working feature.
