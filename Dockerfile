FROM ubuntu:14.04
MAINTAINER Richard Sommerville <Kaiser.mehow@gmail.com>
RUN apt-get update && apt-get install -y nodejs npm
RUN npm install express
EXPOSE 80
VOLUME /srv/slime_volley
CMD nodejs /srv/slime_volley/server/app.js