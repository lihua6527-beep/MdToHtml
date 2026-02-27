---
name: "dev-log-manager"
description: "Manages atomic development logs (create, append, merge). Invoke when user mentions 'write dev log', 'update log', or 'merge logs'."
---

# Development Log Manager

This skill enforces a standardized, atomic workflow for maintaining development logs, preventing data loss and ensuring clear history.

## Workflow Rules

1.  **Atomicity**: Each day/feature gets a unique file. NEVER overwrite existing content; ALWAYS append.
2.  **Structure**:
    -   Root: `docs/开发记录/`
    -   Daily Logs: `docs/开发记录/历史记录/YYYY-MM-DD_[FeatureName].md`
    -   Index: `docs/开发记录/开发记录索引.md`
3.  **Safety**:
    -   Today's log is **mutable (append-only)**.
    -   Past logs are **immutable** (merged only into archives, never modified directly).

## Operations

### 1. Create/Update Daily Log
**Trigger**: User asks to "write today's log", "add dev record", or "update log".

**Steps**:
1.  **Determine Filename**: `docs/开发记录/历史记录/YYYY-MM-DD_[FeatureName].md`.
    -   Use current date.
    -   If `[FeatureName]` is not provided, use `开发记录` or ask user.
    -   *Example*: `2026-02-27_开发记录.md` or `2026-02-27_评分系统重构.md`.
2.  **Check Existence**:
    -   **If File Exists**: Read content -> **APPEND** new section using `SearchReplace` (match end of file or specific section marker). **NEVER use `Write` tool to overwrite.**
    -   **If New File**: Create with `Write` tool. Include header: `# YYYY-MM-DD [Feature] 开发记录`.
3.  **Update Index**:
    -   Read `docs/开发记录/开发记录索引.md`.
    -   Add link to the new file if not present: `- [YYYY-MM-DD [Feature]](./历史记录/YYYY-MM-DD_[FeatureName].md)`.

### 2. Merge Logs (Archiving)
**Trigger**: User asks to "merge logs", "archive logs", or "consolidate records".

**Steps**:
1.  **Identify Targets**: List all files in `docs/开发记录/历史记录/`.
2.  **Filter**: Exclude **Today's** log. (Today's log is still active and should not be archived yet).
3.  **Merge Strategy**:
    -   Create/Update a monthly/weekly summary if requested (e.g., `docs/开发记录/归档/2026-02_汇总.md`).
    -   Or keep them as individual files (default behavior is usually just ensuring they are indexed).
    -   *Note*: Unless explicitly asked to delete, **keep original files**.

## Critical Safety Instructions for AI

-   **NO OVERWRITE**: When updating a log, **NEVER** use the `Write` tool with the full content unless you have read the *entire* file immediately before and are sure you aren't truncating it. Prefer `SearchReplace` to append.
-   **APPEND ONLY**: When adding a new entry to an existing day's log, append it as a new Level 2 (`##`) or Level 3 (`###`) heading.
-   **VERIFY**: After writing, read the file to ensure previous content still exists.
