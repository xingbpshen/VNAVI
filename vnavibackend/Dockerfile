FROM pytorch/pytorch:1.11.0-cuda11.3-cudnn8-runtime

RUN apt update && apt -y upgrade

RUN apt-get update

RUN apt-get install ffmpeg libsm6 libxext6  -y

WORKDIR /vnavibackend

ENV PORT 80

ENV PORT 8000

COPY requirements.txt /vnavibackend/requirements.txt

RUN pip install -r /vnavibackend/requirements.txt

RUN apt -y install nginx

RUN rm /etc/nginx/sites-enabled/default

RUN rm /etc/nginx/nginx.conf

COPY ./vnavibackend /etc/nginx/sites-enabled/

COPY ./nginx.conf /etc/nginx/

RUN /etc/init.d/nginx restart

COPY . /vnavibackend
