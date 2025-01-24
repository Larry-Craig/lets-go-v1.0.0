# Stage 1: Build
FROM node:14-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm config set cache /tmp/.npm-cache --global
RUN npm install

COPY . .
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
