# PicoVault

Self-hostable secrets management for small development teams. Securely store, manage, and inject secrets into your applications.

## Overview

PicoVault provides a simple, secure way to manage application secrets with:

- Web interface for team collaboration
- CLI for developer workflows
- OAuth2/OIDC authentication
- Organisation-based access control
- Secret versioning and audit trails

## CLI Commands

```bash
# Authentication
picovault login                        # Authenticate with PicoVault instance
picovault login --instance <url>       # Login to specific instance
picovault logout                        # Logout from current session
picovault logout --all                  # Logout from all sessions

# Secret Injection
picovault run -- <command>             # Run command with injected secrets
picovault run -- npm start              # Example: Start Node.js app with secrets
picovault run -- ./deploy.sh            # Example: Run script with secrets
```

## Configuration

Create `picovault.json` in your project:

```json
{
  "defaultInstance": "https://vault.example.com",
  "organisationSlug": "my-org",
  "projectId": "project-uuid"
}
```
