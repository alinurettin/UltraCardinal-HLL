FROM node:18-alpine
WORKDIR /app
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 6050
ENV PORT=6050 NODE_ENV=production
CMD ["node", "src/index.js"]
