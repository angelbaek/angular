# 단계 1: Angular 앱 빌드
# 버전을 18.18.1로 변경
FROM node:18.18.1 AS builder  

WORKDIR /app

COPY ./my-angular-app/package*.json ./
RUN npm install
# Angular CLI 설치 추가
RUN npm install -g @angular/cli  

COPY ./my-angular-app .
RUN ng build --configuration production  

# 단계 2: Nginx를 이용하여 앱 서빙
FROM nginx:1.21.1-alpine

COPY --from=builder /app/dist/my-angular-app /usr/share/nginx/html
COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf