# MCP Configuration & Security Guidelines

This document defines the rules for managing Model Context Protocol (MCP) servers, specifically regarding scope (Global vs. Project) and security (API Keys).

## 1. Global vs. Project Scope

### 🌍 Global Scope

**File**: `/Users/ignata/Library/Application Support/Trae/User/mcp.json`
**Usage**: Tools that are project-agnostic and use a single identity.

- **Examples**: `brave-search`, `sequential-thinking`, `memory`.
- **Rule**: Do NOT put project-specific paths (CWD) in global config.

### 📂 Project Scope

**File**: `.mcp.json` (Project Root)
**Usage**: Tools that require specific project context or unique credentials.

- **Examples**:
  - `command-execution`: Requires `cwd` to be the project root.
  - `github`: Requires a specific repository token (if different from personal).
  - `postgres`: Requires project-specific DB credentials.
- **Rule**: Project config **overrides** Global config if the server name is the same.

## 2. Security & API Keys

**Severity: Critical**

- **🚫 NEVER Commit Keys**:
  - Never commit `.mcp.json` if it contains hardcoded API keys.
  - Add `.mcp.json` to `.gitignore` if it contains secrets.
- **✅ Best Practice**:
  - Use Environment Variables (`REPLACE_WITH_VALUE_FROM_ENV`) where supported.
  - Or maintain a `config.example.json` and a gitignored `config.json`.

## 3. Specific Server Configuration

### GitHub (`github`)

- **Recommended Scope**: **Project** (if working with multiple orgs) or **Global** (if using one personal account).
- **Setup**:
  ```json
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
    }
  }
  ```
