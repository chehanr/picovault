# PicoVault

⚠️ **Under Active Development** - This project is currently under active development. Features may be incomplete and breaking changes are expected.

Self-hostable secrets management for small development teams. Securely store, manage, and inject secrets into your applications.

## Overview

⚠️ **Not recommended for production use** - PicoVault is designed for development teams and small-scale deployments, not production environments requiring enterprise-grade security.

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

## Development

### Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Docker](https://docker.com/) and Docker Compose

### Quick Start

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd picovault
   bun install
   ```

2. **Start database**

   ```bash
   bun db:start
   ```

3. **Run migrations**

   ```bash
   bun db:migrate
   ```

4. **Start development servers**

   ```bash
   bun dev
   ```

Access the application:

- Web UI: <http://localhost:3001>
- API Server: <http://localhost:3000>

### Available Commands

```bash
bun dev              # Start all applications
bun build            # Build all applications
bun check-types      # TypeScript check
bun lint             # Format and lint code
bun db:studio        # Open Drizzle Studio
```

## TODO

- [ ] Implement RBAC (Role-Based Access Control) checks
- [ ] API documentation
- [ ] Add audit logging and compliance features
- [ ] ?
