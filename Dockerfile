FROM node:21-alpine

ARG VITE_TILE_BASE_URL="https://dl2sa.blob.core.windows.net/public3d/katukuntotieto"

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

EXPOSE 4173

CMD [ "npm", "run", "preview" ]
