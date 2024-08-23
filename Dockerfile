FROM node:21-alpine

WORKDIR /app

COPY . .
RUN npm install
RUN npx vite build
RUN npx vite optimize

EXPOSE 4173

CMD [ "npx", "vite", "preview" ]
