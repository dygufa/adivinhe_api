FROM node:argon
MAINTAINER Rodrigo Araujo <hello@dygufa.com>

# app directory
RUN mkdir - /usr/src/app
WORKDIR /usr/src/app

# npm
COPY package.json /usr/src/app
RUN npm install

# copy app
COPY . /usr/src/app

EXPOSE 8034
CMD [ "npm", "start" ]
