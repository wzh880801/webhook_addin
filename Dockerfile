FROM node:18.20.4
RUN mkdir /repos
RUN mkdir /repos/webhook
COPY . /repos/webhook
WORKDIR /repos/webhook
RUN npm i pm2@latest -g
RUN npm i
RUN chmod +x ./start.sh
ENTRYPOINT [ "./start.sh" ]