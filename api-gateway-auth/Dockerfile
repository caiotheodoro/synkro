FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* tsconfig.json nest-cli.json ./

RUN pnpm install

COPY src/ ./src/

RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/main"] 