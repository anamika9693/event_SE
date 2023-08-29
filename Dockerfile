FROM node:lts-alpine

WORKDIR /app

COPY . .


RUN npm install --omit=dev

USER node

CMD [ "npm", "run", "deploy" ]

EXPOSE 3000