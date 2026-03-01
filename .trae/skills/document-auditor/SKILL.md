---
name: "document-auditor"
description: "Audits project documents for consistency with actual code implementation, moves outdated documents to archive, and updates partially completed documents. Invoke when user mentions 'audit', 'document check', or needs to analyze document-code consistency."
---

# Document Auditor

## 1. Overview

This skill audits project documents to ensure they align with the current codebase implementation. It identifies outdated documents, moves them to the archive directory, and updates partially completed documents to reflect the current project state.

## 2. When to Invoke

Invoke this skill when:
- User mentions "audit" or "document check"
- Need to analyze document-code consistency
- Project has evolved and documents need updating
- Preparing for release or major changes
- Cleaning up documentation

## 3. Audit Process

### 3.1 Initial Analysis

1. **Read target documents** to understand their content and purpose
2. **Analyze codebase** to determine current implementation status
3. **Identify discrepancies** between documents and actual code

### 3.2 Document Classification

Classify documents into three categories:
- **Fully outdated**: No longer relevant, should be moved to archive
- **Partially outdated**: Some content still valid, needs updates
- **Current**: Aligns with code implementation, no changes needed

### 3.3 Action Execution

#### For Fully Outdated Documents
1. Move to `docs/归档` directory
2. Add timestamp to filename if needed
3. Update archive inventory if applicable

#### For Partially Outdated Documents
1. Remove sections describing completed features
2. Update content to reflect current implementation
3. Maintain sections describing planned features
4. Ensure consistency with project roadmap

## 4. Implementation Steps

### 4.1 File System Operations

- **Reading documents**: Use `Read` tool to analyze document content
- **Analyzing code**: Use `SearchCodebase` and `Glob` tools to find relevant code
- **Moving files**: Use `RunCommand` with appropriate file system commands
- **Updating files**: Use `Edit` tool to modify document content

### 4.2 Decision Making Criteria

A document is considered outdated if:
- It describes features that have been fully implemented
- It contains deprecated approaches or technologies
- It conflicts with current codebase architecture
- It refers to files or components that no longer exist

### 4.3 Best Practices

- **Preserve historical context**: Keep archived documents for reference
- **Maintain consistency**: Ensure updated documents align with codebase
- **Focus on relevance**: Remove outdated content but preserve valuable insights
- **Update incrementally**: Make targeted changes rather than full rewrites
- **Document changes**: Note modifications made during audit

## 5. Example Workflow

1. **Identify target documents** (e.g., `docs/计划书/缓存系统优化`)
2. **Read and analyze** each document's content
3. **Search codebase** for related implementations
4. **Classify documents** based on implementation status
5. **Move outdated documents** to `docs/归档`
6. **Update partially completed documents** to reflect current state
7. **Verify changes** and ensure consistency

## 6. Output Format

When completing an audit, provide:
- Summary of documents processed
- List of documents moved to archive
- Description of changes made to updated documents
- Recommendations for future documentation maintenance

## 7. Limitations

- Requires manual code analysis to determine implementation status
- May not catch all edge cases or recent code changes
- Dependent on clear documentation structure
- Should be used as part of regular maintenance, not just one-time audit