# Playwright demo photoprism

## Technology Stack

-   Playwright **latest**
-   Node.js **16.latest**
-   pnpm
-   Docker

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

## Code linting and formatting :

To format and lint the code use:

```
pnpm format
```

To validate the code use:

```
pnpm validate
```