FROM node:20-alpine
WORKDIR /app
COPY server.js i18n.js ./
EXPOSE 3000
CMD ["node", "server.js"]
