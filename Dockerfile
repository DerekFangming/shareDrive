# Stage build UI
FROM node:22-alpine3.19 AS builder-ui

WORKDIR /app
COPY ./drive-ui/. .

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm install
RUN npm run build

# Stage build service
FROM golang:1.23-alpine AS builder-service

WORKDIR /app
COPY ./drive-server-go/. .
COPY --from=builder-ui /app/build/ui ./static

RUN go build -o /drive ./cmd/drive

# Stage run
FROM alpine:3.20

WORKDIR /app
COPY --from=builder-service /drive /usr/local/bin/drive
COPY --from=builder-service /app/static ./static

ENV PRODUCTION=true
ENV DRIVE_STATIC_DIR=/app/static

EXPOSE 9102
CMD ["drive"]
