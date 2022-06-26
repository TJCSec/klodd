FROM node:16.15.1-bullseye AS build

WORKDIR /app
COPY package.json lerna.json ./
RUN yarn install

COPY packages/client/package.json packages/client/yarn.lock ./packages/client/
COPY packages/server/package.json packages/server/yarn.lock ./packages/server/
RUN yarn bootstrap --ci

COPY packages/client packages/client
RUN yarn build

FROM node:16.15.1-bullseye-slim AS run

WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/server/node_modules/ ./packages/server/node_modules/
COPY --from=build /app/packages/client/build/ ./packages/client/build/
COPY packages/server/ ./packages/server/

CMD ["node", "--unhandled-rejections=strict", "/app/packages/server/src/index.js"]
