# Sanita Products

Is the core of sanita microservices that is in charge of managing products and categories for the retail business of Sanitarios Alberdi.

## RUN

First run keycloak (auth server): `docker-compose up keycloak`
Then just:

1. Rename .env.example to .env and replace the missing values.
2. `npm install`
3. `npm start`

## BUILD IMAGE

`docker-compose build sanita-products`
