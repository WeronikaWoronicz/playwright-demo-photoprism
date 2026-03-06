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

## Environment configuration

The test suite reads environment variables from `env/local.env` (loaded automatically by `playwright.config.ts` via `dotenv`).

To set up your environment, copy the template and fill in your credentials:

```
cp env/example_local.env env/local.env
```

Then edit `env/local.env` with your actual values:

| Variable              | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `BASE_URL`            | PhotoPrism instance URL (default: `http://127.0.0.1:2342`) |
| `PHOTOPRISM_USERNAME` | Admin username configured in your PhotoPrism instance      |
| `PHOTOPRISM_PASSWORD` | Admin password configured in your PhotoPrism instance      |

Default credentials for a local PhotoPrism instance can be found in the [PhotoPrism configuration documentation](https://docs.photoprism.app/getting-started/config-options/#authentication).

> **Note:** `env/local.env` is gitignored and will not be committed. Only `env/example_local.env` is tracked.

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
