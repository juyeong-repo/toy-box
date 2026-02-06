FROM node:20-alpine AS build

WORKDIR /app

# shared 타입 복사 (프론트엔드/백엔드 공통 타입)
COPY shared/ ./shared/

# 프론트엔드 의존성 설치
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install

# 프론트엔드 소스 복사
COPY frontend/ ./frontend/

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 프론트엔드 빌드
RUN cd frontend && npm run build

# Nginx로 정적 파일 서빙
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
