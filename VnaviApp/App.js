import React, {Component} from 'react';
import {StyleSheet, View, Alert, TouchableOpacity, Text} from 'react-native';
import {RNCamera} from 'react-native-camera';
import axios from 'axios';

class App extends Component {
  state = {
    takingPic: false,
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
        Alert.alert('Successful', JSON.stringify(data));

        let body = new FormData();
        body.append('file', {
          uri: data.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });

        fetch('http://10.0.2.2:5000/detect', {
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
          <Text style={{alignItems: 'center'}}>Take picture</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 6,
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
