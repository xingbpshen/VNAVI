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
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';

class App extends Component {
  url = 'http://47.104.176.95/';
  my_path = '';

  state = {
    takingPic: false,
    isVisible: false,
  };

  // showPred = () => {
  //   return (
  //
  //   )
  // }

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
        // Alert.alert('Successful', JSON.stringify(data));

        // let body = new FormData();
        // body.append('file', {
        //   uri: data.uri,
        //   name: 'photo.jpg',
        //   type: 'image/jpeg',
        // });
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
                data: RNFetchBlob.wrap(data.uri),
              },
            ],
          )
          // .then(res => checkStatus(res))
          // .then(res => res.json())
          .then(res => {
            console.log('The file saved to ', res.path());
            this.my_path = res.path();
            this.setState({isVisible: true});
            // Beware that when using a file path as Image source on Android,
            // you must prepend "file://"" before the file path
            // this.imageView = (
            //   <Image
            //     source={{
            //       uri:
            //         Platform.OS === 'android'
            //           ? 'file://' + res.path()
            //           : '' + res.path(),
            //     }}
            //   />
            // );
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
        // Alert.alert('Successful', JSON.stringify(data));

        let body = new FormData();
        body.append('file', {
          uri: data.uri,
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
          <Text style={{alignItems: 'center'}}>Take picture (json)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.button}
          onPress={this.takePicture_img}>
          <Text style={{alignItems: 'center'}}>Take picture (img)</Text>
        </TouchableOpacity>
        <Modal
          animationType={'fade'}
          transparent={false}
          visible={this.state.isVisible}
          onRequestClose={() => {
            console.log('Modal has been closed.');
          }}>
          {/*All views of Modal*/}
          <View style={styles.modal}>
            {/*<Text style={styles.text}>Modal is open!</Text>*/}
            <Image
              style={styles.image}
              source={{
                uri:
                  Platform.OS === 'android'
                    ? 'file://' + this.my_path
                    : '' + this.my_path,
                // 'https://reactnative.dev/img/tiny_logo.png',
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
        {/*<Button*/}
        {/*  title="Open Preview"*/}
        {/*  onPress={() => {*/}
        {/*    this.setState({isVisible: true});*/}
        {/*  }}*/}
        {/*/>*/}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 7,
    flexDirection: 'column',
    backgroundColor: 'black',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#e600ff',
    padding: 10,
    marginBottom: 10,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#00BCD4',
    // height: '85%',
    // width: '85%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 80,
    marginLeft: 40,
  },
  image: {
    width: '85%',
    height: '85%',
  },
});

export default App;
