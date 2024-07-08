# Stage build UI
FROM node:22-alpine3.19 AS builder-ui

WORKDIR /app
COPY ./drive-ui/. .

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm install
RUN npm run buildProd

# Stage build service
FROM openjdk:17-alpine AS builder-service

WORKDIR /app
COPY . .
COPY --from=builder-ui /app/build/ui drive-server/src/main/resources/static/.

RUN ./gradlew bootJar

# Stage run
FROM openjdk:17-alpine

WORKDIR /app
COPY --from=builder-service /app/drive-server/build/libs .

ENV PRODUCTION=true

CMD ["java", "-jar", "drive.jar"]