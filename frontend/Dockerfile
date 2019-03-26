FROM node

# Add the entry point
WORKDIR /app/
RUN npm install http-server -g
ADD entrypoint.sh /app/entrypoint.sh

# Add app under /app/
ADD src/ /app/src
ADD public /app/public
ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock

# Install dependencies
RUN yarn

EXPOSE 8080
ENV REACT_APP_ZOOAPI=""
VOLUME /app/src/config
CMD [ "/bin/bash", "entrypoint.sh" ]