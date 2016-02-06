FROM node:5.5
MAINTAINER Richard Sommerville <Kaiser.mehow@gmail.com>
RUN apt-get update
RUN apt-get install -y npm
RUN apt-get install -y git
RUN cd /srv; npm install git://github.com/Rthe1st/slime_volley.git
EXPOSE 80
CMD node /srv/slime_volley/server/server/startUp.js
