# Stage 1
FROM node:10 as build-step
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN npm run build
# Stage 2
FROM nginx:latest
COPY ./default.conf /etc/nginx/conf.d/
COPY --from=build-step /app/dist/test-app /usr/share/nginx/html
EXPOSE 8080