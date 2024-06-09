FROM node:20 as builder

# Create app directory
WORKDIR /app

# COPY package*.json ./
COPY . .

# Install app dependencies
RUN npm install
RUN npx prisma generate
RUN npm run swagger-autogen
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

# Bundle app source
COPY --from=builder /app/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY .env ./.env
COPY google-cloud-key.json ./google-cloud-key.json

EXPOSE 3000
CMD [ "app.js" ]