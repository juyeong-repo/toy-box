FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/

WORKDIR /app/backend

COPY backend/package.json ./
RUN npm install

COPY backend/ ./

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/backend/src/main"]
