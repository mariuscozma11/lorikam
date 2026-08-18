# syntax=docker/dockerfile:1
# --- Build stage ---
FROM node:20-slim AS builder

# Native deps for some Medusa packages (Debian/glibc — avoids musl hangs)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# `medusa build` peaks around 1.8GB compiling the admin dashboard. Left
# uncapped, V8 sizes its heap against the HOST's memory, ignores the room
# actually available in the container, and gets OOM-killed mid-compile — which
# surfaces as the build dying at "Compiling frontend source..." with no error.
# Capping makes V8 collect instead of grow; measured cost is nil.
# Raise via --build-arg on a larger machine.
ARG NODE_BUILD_MEMORY=1536
ENV NODE_OPTIONS=--max-old-space-size=$NODE_BUILD_MEMORY

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
# Admin order-details requests carry a very long `fields` query string; with
# Node's 16KB default they are rejected with 431 before reaching Medusa.
ENV NODE_OPTIONS=--max-http-header-size=65536

# medusa build outputs a self-contained server (with its own yarn.lock +
# package.json) in .medusa/server
COPY --from=builder /app/.medusa/server ./

# Install deps with Yarn (project uses Yarn 4 / node-modules linker).
# .medusa/server ships no .yarnrc.yml, so set the linker explicitly —
# otherwise Yarn 4 defaults to PnP, which Medusa does not support.
#
# `workspaces focus --production` instead of `install`: medusa build lists
# jest, @swc/core, @types/* and react as devDependencies, none of which the
# server needs at runtime (the admin is already compiled to static assets in
# the builder stage). Saves ~170MB.
#
# The cache clean matters just as much and must stay in this RUN — Yarn 4
# keeps a global cache of every package zip (~450MB here), and it would
# otherwise be committed into the final layer for no reason.
RUN corepack enable \
  && printf 'nodeLinker: node-modules\n' > .yarnrc.yml \
  && yarn workspaces focus --production \
  && yarn cache clean --all

EXPOSE 9000

# Run module + core migrations, then start the server.
# (Single instance: migrating on start is fine. For multiple instances,
#  run `yarn medusa db:migrate` as a separate one-off step instead.)
CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa start"]
