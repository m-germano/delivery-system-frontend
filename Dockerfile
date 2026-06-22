FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_APP_NAME=DishDash
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_WS_URL=ws://localhost:8000

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm run build

FROM nginx:1.29-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
