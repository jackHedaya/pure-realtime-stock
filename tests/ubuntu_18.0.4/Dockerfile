FROM ubuntu:bionic


RUN apt-get update
RUN apt-get install sudo

RUN adduser --disabled-password --gecos '' docker
RUN adduser docker sudo
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER docker

COPY . /src/app/
WORKDIR /src/app

RUN sudo apt install curl -y


RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
RUN sudo apt install nodejs -y

RUN sudo npm install --unsafe-perm=true

CMD ["npm", "start"]