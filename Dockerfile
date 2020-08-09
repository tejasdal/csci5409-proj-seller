FROM node:12
WORKDIR /app  
COPY package.json /app
RUN npm install -g sails
COPY  .  /app
ENTRYPOINT ["sails"]
CMD sails lift
EXPOSE 1337