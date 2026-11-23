# Vector CLI

The official command-line interface for VectorVault.

> Early preview: the CLI command interface is being developed. The VectorVault-hosted Git transport is not yet available, so remote `clone`, `push`, and `pull` are not operational until the Git engine is deployed.

## Requirements

- Node.js 20 or newer
- Git installed and available on your PATH

## Run locally

From this directory:

```bash
node ./bin/vector.js help
node ./bin/vector.js version
```

## Commands

```bash
vector clone owner/repository
vector init [owner/repository]
vector status
vector add .
vector commit -m "Initial commit"
vector push
vector pull
vector branch
vector log
```

The CLI deliberately delegates local repository operations to the installed Git executable. This preserves compatibility with standard Git repositories while giving developers a VectorVault-native command experience.

## Planned next steps

1. OAuth/device login and secure credential management.
2. VectorVault Git Smart HTTP server.
3. Authenticated clone, fetch, push, and pull.
4. Repository and branch management.
5. Vercel and ChatGPT integrations.
