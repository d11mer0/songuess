FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build           # <-- додали

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]