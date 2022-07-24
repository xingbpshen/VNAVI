FROM pytorch/pytorch:1.11.0-cuda11.3-cudnn8-runtime

RUN apt update && apt -y upgrade

RUN apt-get update

RUN apt-get install ffmpeg libsm6 libxext6  -y

WORKDIR /vnavibackend

ENV PORT 80

COPY requirements.txt /vnavibackend/requirements.txt

RUN conda install --yes --file /vnavibackend/requirements.txt

RUN apt install tmux

RUN apt install nginx

RUN rm /etc/nginx/sites-enabled/default

COPY ./vnavibackend /etc/nginx/sites-enabled/

COPY . /vnavibackend
