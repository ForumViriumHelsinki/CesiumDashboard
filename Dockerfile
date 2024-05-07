FROM --platform=linux/amd64 node:21-alpine

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

EXPOSE 8080

CMD [ "npm", "run", "preview" ]
