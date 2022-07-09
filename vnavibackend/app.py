from flask import Flask, request, make_response
from werkzeug.exceptions import BadRequest
from PIL import Image
import torch
import cv2
import io

app = Flask(__name__)

model = torch.hub.load("ultralytics/yolov5", "custom", path="yolov5_models/door_detect/best.pt")


def extract_image(request_in):
    if 'file' not in request_in.files:
        raise BadRequest("Missing file (image/jpeg).")
    file = request_in.files['file']
    if file.filename == '':
        raise BadRequest("File name is invalid.")
    return file


@app.route('/')
def hello_world():
    return '<h1>Hello World!</h1>'


@app.route('/detect', methods=['POST'])
def detect():
    file = extract_image(request)
    image = Image.open(io.BytesIO(file.read()))
    result = model(image, size=1280)
    print(result)
    result.show()
    result.render()
    for img in result.imgs:
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        arr = cv2.imencode('.jpg', rgb_image)[1]
        response = make_response(arr.tobytes())
        response.headers['Content-Type'] = 'image/jpeg'
    return response


if __name__ == '__main__':
    app.run(debug=True)
