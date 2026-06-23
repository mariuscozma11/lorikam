# syntax=docker/dockerfile:1
# --- Build stage ---
FROM node:20-slim AS builder

# Native deps for some Medusa packages (Debian/glibc — avoids musl hangs)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN corepack enable \
  && yarn install --immutable \
  && yarn build

# --- Run stage ---
FROM node:20-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production

# medusa build outputs a self-contained server (with its own yarn.lock +
# package.json) in .medusa/server
COPY --from=builder /app/.medusa/server ./

# Install deps with Yarn (project uses Yarn 4 / node-modules linker).
# .medusa/server ships no .yarnrc.yml, so set the linker explicitly —
# otherwise Yarn 4 defaults to PnP, which Medusa does not support.
RUN corepack enable \
  && printf 'nodeLinker: node-modules\n' > .yarnrc.yml \
  && yarn install --immutable

EXPOSE 9000

# Run module + core migrations, then start the server.
# (Single instance: migrating on start is fine. For multiple instances,
#  run `yarn medusa db:migrate` as a separate one-off step instead.)
CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa start"]
