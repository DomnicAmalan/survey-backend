FROM node:latest

WORKDIR /usr/src/app

COPY . .

RUN npm install -g nodemon

RUN npm install

CMD [ "node", "server.js" ]