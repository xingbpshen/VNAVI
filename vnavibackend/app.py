from flask import Flask, request, make_response
from werkzeug.exceptions import BadRequest
from PIL import Image
import torch
import cv2
import io
import json
import pandas as pd

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
    return '<h1>Welcome to VNAVI!</h1>'


@app.route('/detect-res-img', methods=['POST'])
def detect():
    file = extract_image(request)
    image = Image.open(io.BytesIO(file.read()))
    result = model(image, size=1280)
    result.render()
    for img in result.imgs:
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        arr = cv2.imencode('.jpg', rgb_image)[1]
        response = make_response(arr.tobytes())
        response.headers['Content-Type'] = 'image/jpeg'
    return response


def parse_result(result):
    h = result.imgs[0].shape[0]
    w = result.imgs[0].shape[1]
    df = result.pandas().xyxy[0]
    df = df.drop(df[df.name != 'door'].index)
    data_list = []
    for i in range(df.shape[0]):
        est_orientation = 0
        w_mid_pt = (float(df.iloc[i]['xmin']) + float(df.iloc[i]['xmax'])) / 2
        slice_thirty_deg = float(w) / 8.0
        if w_mid_pt <= slice_thirty_deg:
            est_orientation = 10
        elif slice_thirty_deg < w_mid_pt <= 3 * slice_thirty_deg:
            est_orientation = 11
        elif 3 * slice_thirty_deg < w_mid_pt <= 5 * slice_thirty_deg:
            est_orientation = 12
        elif 5 * slice_thirty_deg < w_mid_pt <= 7 * slice_thirty_deg:
            est_orientation = 1
        elif w_mid_pt > 7 * slice_thirty_deg:
            est_orientation = 2
        est_distance = 999
        confidence = float(df.iloc[i]['confidence'])
        if confidence >= 0.75:
            door_height = float(df.iloc[i]['ymax']) - float(df.iloc[i]['ymin'])
            dh_to_h_r = door_height / h
            if dh_to_h_r >= 1:
                est_distance = 0
            else:
                est_distance = 1.5 / dh_to_h_r
        data_list.insert(len(data_list),
                         [est_orientation,
                          float("{:.3f}".format(est_distance)),
                          float("{:.3f}".format(confidence))])
    new_df = pd.DataFrame(data_list, columns=['orientation(clk)', 'distance(m)', 'confidence'])
    df_json = new_df.to_json(orient='split')
    res_json = json.loads(df_json)
    return json.dumps(res_json, indent=4)


@app.route('/detect-res-json', methods=['POST'])
def detect_res_json():
    file = extract_image(request)
    image = Image.open(io.BytesIO(file.read()))
    result = model(image, size=1280)
    res_json = parse_result(result)
    response = make_response(res_json, 200)
    response.headers['Content-type'] = 'application/json'
    return response


if __name__ == '__main__':
    app.run(debug=False)
