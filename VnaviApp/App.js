import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  Image,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import base64 from 'base-64';

class App extends Component {
  state = {
    takingPic: false,
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
        // Alert.alert('Successful', JSON.stringify(data));

        let body = new FormData();
        body.append('file', {
          uri: data.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });
        RNFetchBlob.config({
          fileCache: true,
          appendExt: 'jpg',
        })
          .fetch(
            'POST',
            'http://10.0.2.2:5000/detect-res-img',
            {'Content-Type': 'multipart/form-data'},
            base64.encode(body),
          )
          // .then(res => checkStatus(res))
          // .then(res => res.json())
          .then(res => {
            console.log('The file saved to ', res.path());
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
          });
        // .catch(e => console.log(e))
        // .done();
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

        fetch('http://10.0.2.2:5000/detect-res-json', {
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
});

export default App;

// import React from 'react';
// import Camera from './Camera';
// import {SafeAreaView} from 'react-native';
// const App = () => {
//   return (
//     <>
//       <SafeAreaView styles={{flex: 1}}>
//         <Camera />
//       </SafeAreaView>
//     </>
//   );
// };
// export default App;
