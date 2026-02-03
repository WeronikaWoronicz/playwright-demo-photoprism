# Playwright demo photoprism

## Technology Stack

- Playwright **latest**
- Node.js **16.latest**
- pnpm
- Docker

## Run local app :

Install docker on your local machine. Then to run app you need to execute commands below:

```
cd .\photoprism
docker compose up -d
```

Now your app is available on your localhost.

## Install dependencies :

```
pnpm install
pnpm playwright install
```

## Generating test assets

```
npx ts-node .\scripts\generate-test-assets-picsum.ts
```

## Test execution:

To run all tests headed

```
pnpm exec playwright test --headed
```

## Code linting and formatting :

To format and lint the code use:

```
pnpm format
```

To validate the code use:

```
pnpm validate
```

## Claude Code Integration

This project includes Claude Code configuration for AI-assisted Playwright test development.

### Available Skills

The `.claude/SKILL.md` file provides Claude with Playwright testing best practices including:

- Page Object Model patterns
- Locator strategies (priority order)
- Authentication handling with storage state
- File upload/download handling
- Network mocking
- CI/CD integration
- Flaky test debugging

### Custom Agents (VS Code Chat Modes)

Located in `.vscode/chatmodes/`:

| Agent | Description |
|-------|-------------|
| **Generator** | Creates new Playwright tests following project conventions |
| **Healer** | Fixes broken selectors and flaky tests |
| **Planner** | Designs test strategies and creates test plans |

### Usage

Ask Claude about Playwright topics and it will use the skill automatically:
- "Write a test for user login"
- "Fix this flaky test"
- "How should I handle file uploads?"
