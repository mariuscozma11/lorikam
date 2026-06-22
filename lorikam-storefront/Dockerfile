# syntax=docker/dockerfile:1
# --- Build stage ---
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .

# Build-time public env (inlined into the bundle) + backend URL used by SSG.
# NOTE: the backend must be deployed and reachable at MEDUSA_BACKEND_URL
# during this build, because some pages are prerendered with its data.
ARG MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=ro
ARG NEXT_PUBLIC_STRIPE_KEY

ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
  && yarn install --immutable \
  && yarn build

# --- Run stage ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8000 \
    HOSTNAME=0.0.0.0

# Next standalone output ships its own minimal node_modules + server.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8000

CMD ["node", "server.js"]
