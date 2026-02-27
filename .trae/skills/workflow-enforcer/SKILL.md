---
name: "workflow-enforcer"
description: "Enforces strict workflow: Plan -> Execute -> Verify -> Chinese Summary. Invoke at the start of every task to ensure compliance."
---

# Workflow Enforcer

This skill enforces a strict development workflow to ensure reliability and clarity.

## Core Rules

1.  **Plan First**: Before executing any complex task, explicitly state the plan.
2.  **Execute & Verify**: After execution, immediately verify the result (e.g., check file existence, run tests, verify API response).
3.  **Chinese Summary**: ALWAYS end the conversation with a clear, concise summary in **Chinese**.

## Usage

Invoke this skill when:
- Starting a new task.
- The user requests a status update or plan.
- You need to ensure a high-quality, verified output.

## Example Output Structure

1.  **Plan**:
    - Step 1: ...
    - Step 2: ...
2.  **Execution**:
    - [Command/Tool Output]
3.  **Verification**:
    - [Verification Result]
4.  **Summary (Chinese)**:
    - 任务已完成...
    - 验证结果...
