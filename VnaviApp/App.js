import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  Modal,
  Button,
} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';

class App extends Component {
  // Change this url to the server's IP:PORT
  url = 'http://132.206.74.92:8002/';
  // url = 'http://10.0.2.2:5000/';
  my_path = '';
  resized_img_path = '';

  state = {
    takingPic: false,
    isVisible: false,
  };

  takePicture_img = async () => {
    if (this.camera && !this.state.takingPic) {
      let options = {
        quality: 0.85,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      this.setState({takingPic: true});

      try {
        const data = await this.camera.takePictureAsync(options);
        // To print alerts, Alert.alert('Successful', JSON.stringify(data));

        // Resizing image to reduce transmission time
        const cropData = {
          offset: {x: 0, y: 0},
          size: {width: data.width, height: data.height},
          displaySize: {width: 480, height: 640},
        };
        await ImageEditor.cropImage(data.uri, cropData).then(url => {
          this.resized_img_path = url;
        });

        RNFetchBlob.config({
          fileCache: true,
          appendExt: 'jpg',
        })
          .fetch(
            'POST',
            this.url + 'detect-res-img',
            {'Content-Type': 'multipart/form-data'},
            [
              {
                name: 'file',
                filename: 'photo.jpg',
                type: 'image/jpeg',
                // data: RNFetchBlob.wrap(data.uri),
                data: RNFetchBlob.wrap(this.resized_img_path),
              },
            ],
          )
          // Optional:
          // .then(res => checkStatus(res))
          // .then(res => res.json())

          .then(res => {
            console.log('The file saved to ', res.path());
            this.my_path = res.path();
            this.setState({isVisible: true});
          })
          .catch(e => console.log(e))
          .done();
      } catch (err) {
        Alert.alert('Error', 'Failed to take picture: ' + (err.message || err));
      } finally {
        this.setState({takingPic: false});
      }
    }
  };

  takePicture = async () => {
    if (this.camera && !this.state.takingPic) {
      let options = {
        quality: 0.85,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      this.setState({takingPic: true});

      try {
        const data = await this.camera.takePictureAsync(options);
        // To print alert, Alert.alert('Successful', JSON.stringify(data));

        // Resizing image to reduce transmission time
        const cropData = {
          offset: {x: 0, y: 0},
          size: {width: data.width, height: data.height},
          displaySize: {width: 480, height: 640},
        };
        await ImageEditor.cropImage(data.uri, cropData).then(url => {
          this.resized_img_path = url;
        });

        let body = new FormData();
        body.append('file', {
          uri: this.resized_img_path,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });

        fetch(this.url + 'detect-res-json', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: body,
        })
          // .then(res => checkStatus(res))
          .then(res => res.json())
          .then(res => {
            console.log('response' + JSON.stringify(res));
            Alert.alert('Results:', JSON.stringify(res));
          })
          .catch(e => console.log(e))
          .done();
      } catch (err) {
        Alert.alert('Error', 'Failed to take picture: ' + (err.message || err));
      } finally {
        this.setState({takingPic: false});
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          style={{flex: 5, alignItems: 'center'}}
          ref={ref => {
            this.camera = ref;
          }}
        />
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.button}
          onPress={this.takePicture}>
          <Text
            style={{
              alignItems: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}>
            ANALYSIS ONCE (JSON)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.button}
          onPress={this.takePicture_img}>
          <Text
            style={{
              alignItems: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}>
            TAKE PICTURE (img)
          </Text>
        </TouchableOpacity>
        <Modal
          animationType={'fade'}
          transparent={false}
          visible={this.state.isVisible}
          onRequestClose={() => {
            console.log('Modal has been closed.');
          }}>
          {/*Modal*/}
          <View style={styles.modal}>
            <Image
              style={styles.image}
              source={{
                uri:
                  Platform.OS === 'android'
                    ? 'file://' + this.my_path
                    : '' + this.my_path,
              }}
            />
            <Button
              title="Back"
              onPress={() => {
                this.setState({isVisible: !this.state.isVisible});
              }}
            />
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 7,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#008ecc',
    padding: 10,
    marginBottom: 10,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  image: {
    width: '85%',
    height: '85%',
  },
});

export default App;
