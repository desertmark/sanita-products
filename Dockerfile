FROM node:16-alpine
WORKDIR /usr/src/app

COPY package.json ./
RUN npm i

COPY . ./

ARG TMDB_KEY
ENV TMDB_KEY=$TMDB_KEY

ENTRYPOINT ["npm", "start"]