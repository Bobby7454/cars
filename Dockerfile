FROM node:20-alpine As dependencies
WORKDIR /myapp
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine As prod
WORKDIR /myapp
COPY --from=dependencies /myapp/node_modules ./node_modules
COPY . .
EXPOSE 3000
RUN mkdir -p  /myapp/data && chown -R node:node /myapp
USER node
CMD ["node","server.js"]

