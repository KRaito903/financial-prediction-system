FROM node:22-alpine as dev

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run generate

RUN npx prisma generate

EXPOSE 4001

CMD ["npm", "run", "dev"]