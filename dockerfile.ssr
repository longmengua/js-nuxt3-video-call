# Stage 1: Build Stage
FROM node:16-alpine AS build-stage

# Build time arguments
ARG APP_ENV=""
ARG ENV_FILE_NAME=""
ARG PAT=""

# Add "set -e" to stop execution on error
RUN set -e

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Download .env.prod from github private repo, that's why it needs pat of github
RUN if [ "$APP_ENV" = "prod" ]; then curl -H "Authorization: token $PAT" -LJO https://raw.githubusercontent.com/karwee/karwee-devops/main/wmch/web/.env.prod; fi

# Copy the environment file
RUN cp "$ENV_FILE_NAME" .env

# Build the application
RUN npm run build || { exit 1; }

# Stage 2: Run Stage
FROM node:16-alpine AS run-stage

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build-stage /app/.output ./.output
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json ./package.json

# Expose the port the app runs on
ENV HOST 0.0.0.0
EXPOSE 80

# Command to run the application
ENTRYPOINT ["node", ".output/server/index.mjs"]
