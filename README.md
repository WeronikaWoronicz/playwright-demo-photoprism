# Playwright demo photoprism

End-to-end test suite for [PhotoPrism](https://www.photoprism.app/) using Playwright.

## Technology Stack

- [Playwright](https://playwright.dev/) + TypeScript
- Node.js, pnpm
- ESLint + Prettier
- Docker + Docker Compose + MariaDB
- [OpenCode](https://github.com/nicepkg/opencode) + [Oh-My-OpenCode](https://github.com/anthropics/oh-my-opencode) (agentic development)
- [axe-core](https://github.com/dequelabs/axe-core) for accessibility testing

## About PhotoPrism

[PhotoPrism](https://github.com/photoprism/photoprism) is an AI-powered, self-hosted photos app built with Go and Vue.js. This project tests the Community Edition via a custom Docker build that includes an accessibility patch.

### Accessibility patch

PhotoPrism's Vue frontend uses many custom components that lack accessible roles and labels, making reliable test automation difficult. As part of this project, we created `patches/navigation-accessibility.patch` which adds `role="button"` and `aria-label` attributes to the sidebar navigation, upload link, photo tiles, and other interactive elements. It is applied at Docker build time against a pinned PhotoPrism commit (`f6d2026`).

The `sut/` directory contains two Dockerfile variants:

- **`Dockerfile`** — full source build (`photoprism/develop:jammy`), compiles both Go backend and webpack frontend with the patch applied.
- **`photoprism.Dockerfile`** — lighter approach that rebuilds only the frontend on top of an official release image (`photoprism/photoprism:251130`).

## Run local app

Install Docker, then build and start the patched PhotoPrism instance:

```bash
cd sut
docker compose up -d
```

The app will be available at `http://127.0.0.1:2342`.

## Environment setup

Copy the example env file and adjust if needed:

```bash
cp env/local.env env/local.env
```

Required variables: `BASE_URL`, `PHOTOPRISM_USERNAME`, `PHOTOPRISM_PASSWORD`.

## Install dependencies

```bash
pnpm install
pnpm exec playwright install
```

## Generating test assets

```bash
pnpm run generate:test-assets
```

## Test execution

Run all tests:

```bash
pnpm exec playwright test
```

Run headed:

```bash
pnpm exec playwright test --headed
```

## Code linting and formatting

Format and lint:

```bash
pnpm format
```

Validate (types + format + lint):

```bash
pnpm validate
```

## Agentic development

Test cases in this project were authored using an agentic workspace powered by [OpenCode](https://github.com/nicepkg/opencode) with the [Oh-My-OpenCode](https://github.com/anthropics/oh-my-opencode) harness. The combination provides structured task orchestration, specialist delegation, and iterative verification — all driven from the terminal.

The workspace configuration (`.opencode/` and skill definitions) that shaped how the agents write and review tests will be published separately. Stay tuned.

## Project structure

```
tests/
  api/              API endpoint tests
  ui/
    admin/          Album CRUD, admin features
    auth/           Login, RBAC, session expiry
    library/        Browse, filter, sort, search, deep links
    photos/         Metadata edit, image ops, delete/undo
    sharing/        Share links, concurrent edits
    upload/         Single, multiple, large, invalid uploads
    accessibility/  a11y smoke tests
pages/              Page Object Models
fixtures/           Playwright fixtures and test data
lib/                API helpers, auth, accessibility utils
env/                Environment config files
```
