# VNAVI
The repository for Vision-guided Navigation Assistance for the Visually Impaired project [1].  
  
_<sup>Key words: React Native, Nginx, Gunicorn, Python, YOLOv5, PyTorch, Docker, Linux</sup>_

## 1 &nbsp;&nbsp; Introduction
This application helps visually impaired people to reach objects of interest by performing camera captured image analysis and giving audio navigation on mobile phones. We expect the application is capable to run on multiple mobile platforms, e.g. Android and iOS. And the analysis should carry out locally or on cloud.
  
## 2 &nbsp;&nbsp; Functioning Senarios
To achieve this goal, we decompose it into several senarios. For example, navigation to doorways. In each senario, the application performs object detection, distance measurement, results rendering and audio feedback.

### 2.1 &nbsp;&nbsp; Doorways Navigation
This is the senario that we are working on. Ideally, the application gives audio guidance and inform the user the location of the nearby doorways. However, due to the absence of doorways dataset, we change to focus on doors and handles specifically.

## 3 &nbsp;&nbsp; Architecture and Implementation
This section berifly presents some of key points of the whole system, including basic architecture, frameworks and workflows.

### 3.1 &nbsp;&nbsp; Client Side
As the rising demand of application capabilities, it is hard and time-consuming for developers to transform the source code to different platforms. To solve this issue, we use a cross-platform framework React Native when developing the client app. The app starts the built-in camera in the mobile phone, and captures pictures that will be sent to the server for analysis. In addition, the client app gives feedback after it retrieving the analysis result from the server.

### 3.2 &nbsp;&nbsp; Server Side
The Flask server is responsible for receiving and processing requests from clients and making responses to them. Nginx and gunicorn help to listen requests and run python scripts. We use a customized YOLOv5 (You Only Look Once v5) [2] model to detect and locate doors in the image.

## 4 &nbsp;&nbsp; The Deep Learning Model

The most important task is creating a robust object detection workflow. After comparing a varity of deep learning CV approaches, we choose to take advantage of YOLOv5 as it is highly customizable and has a strong capability of detecting multiple objects.

The Door-detect dataset [3] serves training and testing purposes. The training set includes 1092 randomly picked images and labels, the remaining 121 images and labels are used for testing. A YOLOv5m with 1280 inputs is trained with the Door-detect dataset, the following figure shows the training and validation results.  

<p align="center">
  <img width="1200" src="https://github.com/AntonioShen/VNAVI/blob/wip-1-flask-development/Resources/media_images_Results_50.png" alt="Metrics">
  Figure 1: Metrics.
</p>

<p align="center">
  <img width="1200" src="https://github.com/AntonioShen/VNAVI/blob/wip-1-flask-development/Resources/media_images_Validation_50.jpg" alt="Validation">
  Figure 2: Validation.
</p>

## 5 &nbsp;&nbsp; Docker and Docker Compose

## 6 &nbsp;&nbsp; References
