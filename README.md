# Playwright demo photoprism

## Technology Stack

-   Playwright **latest**
-   Node.js **16.latest**
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
yarn install 
yarn playwright install 
```

## Code linting and formatting :

To format and lint the code use:

```
yarn format
```

To validate the code use:

```
yarn validate
```