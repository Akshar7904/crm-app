FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
ARG API_URL
ENV API_URL=${API_URL}
RUN node src/environments/set-env.js && npx ng build --configuration production

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/payroll-orion ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
