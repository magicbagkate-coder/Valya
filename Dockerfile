FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11 && npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 14000
CMD ["node", "dist/main.js"]
