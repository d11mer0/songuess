FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev & npx prisma studio --browser none --port 5555"]