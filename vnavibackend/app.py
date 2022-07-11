from flask import Flask, request, make_response
from werkzeug.exceptions import BadRequest
from PIL import Image
import torch
import cv2
import io
import json
import base64

app = Flask(__name__)

model = torch.hub.load("ultralytics/yolov5", "custom", path="yolov5_models/door_detect/best.pt")


def extract_image(request_in):
    if 'file' not in request_in.files:
        raise BadRequest("Missing file (image/jpeg).")
    file = request_in.files['file']
    if file.filename == '':
        raise BadRequest("File name is invalid.")
    return file


def extract_image_b64(request_in):
    if 'file' not in request_in.files:
        raise BadRequest("Missing file (image/jpeg).")
    file = request_in.files['file']
    if file.filename == '':
        raise BadRequest("File name is invalid.")
    return file


@app.route('/')
def hello_world():
    return '<h1>Hello World!</h1>'


@app.route('/detect-res-img', methods=['POST'])
def detect():
    file = extract_image_b64(request)
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


def parse_result(result):
    df = result.pandas().xyxy[0]
    # df.set_index('name', inplace=True)
    df = df.drop(df[df.name != 'door'].index)
    # doors_count = 0
    # for i in df.index.values:
    #     if i == 'door':
    #         doors_count = doors_count + 1
    # res_json = json.dumps({'detected': str(doors_count)})
    # print(res_json)
    df_json = df.to_json(orient="split")
    res_json = json.loads(df_json)
    return json.dumps(res_json, indent=4)


@app.route('/detect-res-json', methods=['POST'])
def detect_res_json():
    file = extract_image(request)
    image = Image.open(io.BytesIO(file.read()))
    result = model(image, size=1280)
    res_json = parse_result(result)
    # df = result.pandas().xyxy[0]
    # df.set_index('name', inplace=True)
    # if 'door' not in df.index.values:
    #     response = make_response(json.dumps({'detected': 'OK2'}), 200)
    #     response.headers['Content-type'] = 'application/json'
    #     return response
    # doors = df.loc['door']
    # if type(doors) == pd.Series:
    #     doors = doors.to_frame()
    # print(type(doors))
    # print(doors)
    response = make_response(res_json, 200)
    response.headers['Content-type'] = 'application/json'
    return response


if __name__ == '__main__':
    app.run(debug=True)
