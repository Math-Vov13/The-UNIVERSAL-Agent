FROM node:latest AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build



# STAGE 2
FROM node:slim

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm install --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "npm", "run", "start" ]