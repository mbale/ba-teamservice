FROM node:latest

# Create app directory
WORKDIR /team_service
COPY package.json /team_service
RUN npm install
COPY . /team_service

# Set up environment

ENV NODE_ENV=development
ENV PORT=3100

# Run
CMD npm run build && npm start
EXPOSE 3100
