FROM node:16-alpine
WORKDIR /usr/src/app

COPY package.json ./
RUN npm i

COPY . ./

ENTRYPOINT ["npm", "start"]