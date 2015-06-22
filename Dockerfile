FROM ubuntu:14.04
MAINTAINER Richard Sommerville <Kaiser.mehow@gmail.com>
RUN apt-get update && apt-get install -y nodejs npm && apt-get install -y git
#node changed its name to nodejs on package manager, gulp looks for node
RUN ln -s /usr/bin/nodejs /usr/local/bin/node
RUN cd /srv; npm install git://github.com/Rthe1st/slime_volley.git
EXPOSE 80
#for dev, link this volume to the local project folder
VOLUME /srv/slime_volley
CMD nodejs /srv/slime_volley/server/app.js