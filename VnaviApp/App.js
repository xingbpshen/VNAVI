import React, { Component } from 'react';
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
import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import Tts from 'react-native-tts';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Sound from 'react-native-sound';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const androidParams = {
  KEY_PARAM_PAN: -1,
  KEY_PARAM_VOLUME: 0.5,
  KEY_PARAM_STREAM: 'STREAM_MUSIC'
}

const iosParams = {
  iosVoiceId: 'com.apple.ttsbundle.Moira-compact'
}

const MAX_APPROACHING_READINGS = 15; // change depending on number of readings per time unit

const sounds = ['opening_turning_door_handle.mp3', 'beep_1_center.mp3', 'beep_1_left.mp3',
  'beep_1_right.mp3', 'beep_2_center.mp3', 'beep_2_left.mp3', 'beep_2_right.mp3',
  'beep_3_center.mp3', 'beep_3_left.mp3', 'beep_3_right.mp3']

const map_sounds = {
  'door_opening': 'opening_turning_door_handle.mp3',
  'beep_1_center': 'beep_1_center.mp3',
  'beep_1_left': 'beep_1_left.mp3',
  'beep_1_right': 'beep_1_right.mp3',
  'beep_2_center': 'beep_2_center.mp3',
  'beep_2_left': 'beep_2_left.mp3',
  'beep_2_right': 'beep_2_right.mp3',
  'beep_3_center': 'beep_3_center.mp3',
  'beep_3_left': 'beep_3_left.mp3',
  'beep_3_right': 'beep_3_right.mp3'
}

const instructions = "Welcome to the Vision-guided Navigation Assistance for the Visually Impaired Application. "
+ "This application will help you traverse through doorways by performing camera captured image analysis and giving audio navigation. "
+ "To begin, choose the mode of feedback you would like to receive using the TOGGLE MODE button below. "
+ "Two modes are proposed: Voice mode and Beep mode. In voice mode, my voice will indicate where the locations "
+ "of doors are and how close you are to them. In beep mode, spatialized beeps will be heard around you once doors are detected. "
+ "A single beep indicates a door found more than 3 meters away, 2 beeps indicate the door is closer between 2 and 3 meters away, "
+ "and 3 beeps indicate than the door is less than 1 meter away. When you hear a door shutting sound, you have reached the door! "
+ "The beeps are also spatialized relatively to the direction of the door, so a door slightly to the left will produce a beep "
+ "panned to the left. Press the TAKE STREAM AND PRODUCE OUTPUT button below to start the stream and hit the STOP STREAM to stop. "
+ "Happy navigation!";

class App extends Component {
  // Change this url to the server's IP:PORT, 10.0.2.2 is for AVD localhost testing purpose.
  url = 'http://132.206.74.92:8002/';
  // url = 'http://10.0.2.2:5000/';
  my_path = '';
  resized_img_path = '';
  // Image resize
  h = 1280;
  w = 640;
  beep = '';

  state = {
    takingPic: false,
    isVisible: false,
    running: false,
    doorReadings: {
      dists: [],
      angles: []
    },
    mode: "Voice",
    speaking: false,
    phase: "Searching",
    totalSpoken: 0,
    lastSpokenWords: "",
    numberOfSame: 0,
  };

  setupSounds() {
    for (let i = 0; i < sounds.length; i++) {
        let sound = new Sound(sounds[i], Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
            console.log('sound ' + sounds[i] + ' loaded successfully');
        });
        // Reduce the volume by half
        sound.setVolume(0.5);

        this.setState(prevState => ({
            sounds: {
                ...prevState.sounds,
                [sounds[i]]: sound
            }
        }));
    }
}

  componentDidMount = () => {
    Tts.voices().then(voices => {
      // voices.forEach((voice) => console.log(voice.id));
      Tts.setDefaultVoice("en-au-x-auc-local")
    });
    Tts.setDefaultRate(0.6);
    Tts.addEventListener('tts-finish', (event) => this.setState({ speaking: false })); // prevent from speaking before finishing

    this.setupSounds();
  };

  resetState = () => {
    this.setState({
      takingPic: false,
      isVisible: false,
      doorReadings: {
        dists: [],
        angles: []
      },
      speaking: false,
      phase: "Searching",
      totalSpoken: 0,
      lastSpokenWords: "",
      numberOfSame: 0,
    })
  };

  takePicture_img = async () => {
    if (this.camera && !this.state.takingPic) {
      let options = {
        quality: 0.85,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      this.setState({ takingPic: true });

      try {
        const data = await this.camera.takePictureAsync(options);
        // To print alerts, Alert.alert('Successful', JSON.stringify(data));

        // Resizing image to reduce transmission time
        const cropData = {
          offset: { x: 0, y: 0 },
          size: { width: data.width, height: data.height },
          displaySize: { width: this.w, height: this.h },
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
            { 'Content-Type': 'multipart/form-data' },
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
            this.setState({ isVisible: true });
          })
          .catch(e => console.log(e))
          .done();
      } catch (err) {
        Alert.alert('Error', 'Failed to take picture: ' + (err.message || err));
      } finally {
        this.setState({ takingPic: false });
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

      this.setState({ takingPic: true });

      try {
        const data = await this.camera.takePictureAsync(options);
        // To print alert, Alert.alert('Successful', JSON.stringify(data));

        // Resizing image to reduce transmission time
        const cropData = {
          offset: { x: 0, y: 0 },
          size: { width: data.width, height: data.height },
          displaySize: { width: this.w, height: this.h },
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
        this.setState({ takingPic: false });
      }
    }
  };

  delay = (time) => new Promise(resolve => setTimeout(resolve, time));

  takeStream = async () => {
    // Modified above to take multiple images and pass them to AudioFeedback
    if (this.state.running) {
      return;
    }
    this.state.running = true;
    while (this.state.running) {
      console.log("in loop");
      if (this.camera && !this.state.takingPic) {
        let options = {
          quality: 0.85,
          fixOrientation: true,
          forceUpOrientation: true,
        };

        this.setState({ takingPic: true });

        try {
          const data = await this.camera.takePictureAsync(options);
          // To print alert, Alert.alert('Successful', JSON.stringify(data));

          // Resizing image to reduce transmission time
          const cropData = {
            offset: { x: 0, y: 0 },
            size: { width: data.width, height: data.height },
            displaySize: { width: this.w, height: this.h },
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
              this.outputResult(res);
            })
            .catch(e => console.log(e))
            .done();
        } catch (err) {
          Alert.alert('Error', 'Failed to take picture: ' + (err.message || err));
        } finally {
          this.setState({ takingPic: false });
        }
      }
      await this.delay(1000);
    }
  };


  outputPositionText = (position) => {
    switch (position) {
      case 10:
      case 11:
      case 1:
      case 2:
        return "At " + position + " o'clock";
      case 12:
        return "Straight ahead";
      default:
        return "";
    }
  }

  speakInstructions = (words) => {
    Tts.setDefaultRate(0.5);
    if (!this.state.speaking) {
      this.setState({ speaking: true });
      if (Platform.OS === 'android') {
        Tts.speak(words, { androidParams: androidParams });
      } else {
        Tts.speak(words, iosParams);
      }
    }
    Tts.setDefaultRate(0.6);
  }

  speak = (words) => {
    if (this.state.lastSpokenWords == words && this.state.numberOfSame < 3) {
      this.setState({ numberOfSame: this.state.numberOfSame + 1 });
      return;
    }
    if (this.state.numberOfSame >= 3) {
      this.setState({ numberOfSame: 0 });
    }
    if (this.state.totalSpoken == 10) {
      Tts.stop();
      this.setState({ totalSpoken: 0 });
    }
    // only speak if not already speaking
    if (!this.state.speaking) {
      this.setState({ speaking: true, totalSpoken: this.state.totalSpoken + 1, lastSpokenWords: words });
      if (Platform.OS === 'android') {
        Tts.speak(words, { androidParams: androidParams });
      } else {
        Tts.speak(words, iosParams);
      }
    }
  }

  playSound = (sound) => {
    // Get the current playback point in seconds
    sound.getCurrentTime((seconds) => console.log('playing at ' + seconds));

    // Pause the sound
    sound.pause();

    // Stop the sound and rewind to the beginning
    sound.stop(() => {
        // Note: If you want to play a sound after stopping and rewinding it,
        // it is important to call play() in a callback.
        sound.play((success) => {
            if (success) {
                console.log('successfully finished playing');
                sound.stop();
            } else {
                console.log('playback failed due to audio decoding errors');
                sound.stop();
            }
        });;
    });

    // Release the audio player resource
    // sound.release();
  }

  vibrateIntensityBasedOnDistance = (distance) => {
    // possible looping as distance gets smaller
    if (distance < 1) {
      ReactNativeHapticFeedback.trigger("impactHeavy", options);
      console.log("vibrate heavy");
    } else if (distance < 2) {
      ReactNativeHapticFeedback.trigger("impactMedium", options);
      console.log("vibrate medium");
    } else {
      ReactNativeHapticFeedback.trigger("impactLight", options);
      console.log("vibrate light");
    }
  }

  beepBasedOnDistanceAndAngle = (distance, angle) => {
    let beep;
    if (distance < 1) {
      beep = this.state.sounds[map_sounds['beep_3_center']];
    } else if (distance < 2) {
      beep = this.state.sounds[map_sounds['beep_2_center']];
    } else {
      beep = this.state.sounds[map_sounds['beep_1_center']];
    }
    if (angle == 10) {
      beep.setPan(-1);
      this.playSound(beep);
    } else if (angle == 11) {
      beep.setPan(-0.5);
      this.playSound(beep);
    } else if (angle == 12) {
      beep.setPan(0);
      this.playSound(beep);
    } else if (angle == 1) {
      beep.setPan(0.5);
      this.playSound(beep);
    } else if (angle == 2) {
      beep.setPan(1);
      this.playSound(beep);
    }
  }

  calculateStdev(array) {
    if (array.length == 0) {
      return 0;
    }
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

  relativeDiff = (num1, num2) => {
    if (num1 == 0) {
      return Math.abs(num1 - num2) / num2;
    } else if (num2 == 0) {
      return Math.abs(num1 - num2) / num1;
    } else {
      return 0;
    }
  }

  searchPhase = (distances, angles) => {
    console.log("Door Detected");
    distances[0] = Math.round(distances[0] * 10) / 10;
    console.log(distances[0] + " meters away");
    if (this.state.mode == "Voice") {
      if (distances[0] != 0) {
        this.speak("A door was detected, " + distances[0] + " meters away, " + this.outputPositionText(angles[0])); // maybe filter out very high distances (e.g > 10 meters)
      } else {
        this.speak("A door was detected, " + this.outputPositionText(angles[0]));
      }
      console.log("At " + angles[0] + " o'clock");
    } else {
      //this.vibrateIntensityBasedOnDistance(distances[0]);
      this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
    }
    if (this.state.doorReadings.dists.length >= 1) {
      let dist2 = this.state.doorReadings.dists[this.state.doorReadings.dists.length - 1];
      let ang2 = this.state.doorReadings.angles[this.state.doorReadings.angles.length - 1];
      console.log(this.relativeDiff(distances[0], dist2));
      if (this.relativeDiff(distances[0], dist2) < 0.5 && Math.abs(angles[0] - ang2) <= 2) {
        if (distances[0] > 2) { // we are more than 2 meters away
          this.setState(prevState => ({
            doorReadings: {
              dists: [...prevState.doorReadings.dists, distances],
              angles: [...prevState.doorReadings.angles, angles]
            },
            phase: "Calibrating"
          }));
          return;
        } else if (distances[0] > 0.5 && distances[0] < 2) { // we are between 0.5 and 2 meters away
          this.setState(prevState => ({
            doorReadings: {
              dists: [...prevState.doorReadings.dists, distances],
              angles: [...prevState.doorReadings.angles, angles]
            },
            phase: "Approaching"
          }));
          return;
        } else if (distances[0] > 0) { // we are less than 0.5 meters away
          this.setState(prevState => ({
            doorReadings: {
              dists: [...prevState.doorReadings.dists, distances],
              angles: [...prevState.doorReadings.angles, angles]
            },
            phase: "Approaching"
          }));
          return;
        } else { // we are 0 meters away
          // maybe wait for a second reading to confirm
          console.log("door reached already");
          if (this.state.mode == "Voice") {
            this.speak("Door reached!");
          } else {
            //this.vibrateIntensityBasedOnDistance(distances[0]);
            this.playSound(this.state.sounds[map_sounds['door_opening']])
          }
          this.resetState();
          return;
        }
      }
    }
    this.setState(prevState => ({
      doorReadings: {
        dists: [...prevState.doorReadings.dists, distances],
        angles: [...prevState.doorReadings.angles, angles]
      }
    }));

  }

  calibratingPhase = (distances, angles) => {
    console.log("Calibrating phase");
    distances[0] = Math.round(distances[0] * 10) / 10;
    console.log(distances[0] + " meters away");
    if (distances[0] > 2) { // we are greater than 2 meters away
      if (this.state.mode == "Voice") {
        this.speak("Continue approaching, only " + distances[0] + " meters away, " + this.outputPositionText(angles[0]));
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
      }
    } else if (distances[0] > 0.5 && distances[0] < 2) { // we are between 0.5 and 2 meters away
      this.setState(prevState => ({
        doorReadings: {
          dists: [...prevState.doorReadings.dists, distances],
          angles: [...prevState.doorReadings.angles, angles]
        },
        phase: "Approaching"
      }));
      // maybe wait for a second reading to confirm
      if (this.state.mode == "Voice") {
        this.speak("Calibration complete, continue approaching, you are now " + distances[0] + " meters away. Door is " + this.outputPositionText(angles[0]));
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
      }
      return;
    } else if (distances[0] > 0) { // we are less than 0.5 meters away
      this.setState(prevState => ({
        doorReadings: {
          dists: [...prevState.doorReadings.dists, distances],
          angles: [...prevState.doorReadings.angles, angles]
        },
        phase: "Approaching"
      }));
      console.log("reach for doorknob");
      if (this.state.mode == "Voice") {
        this.speak("Reach for the door, it is only " + distances[0] + " meters away, " + this.outputPositionText(angles[0]));
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
      }
      return;
    } else { // we are 0 meters away
      console.log("door reached already");
      if (this.state.mode == "Voice") {
        this.speak("Door reached!");
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.playSound(this.state.sounds[map_sounds['door_opening']])
      }
      this.resetState();
      return;
    }
    this.setState(prevState => ({
      doorReadings: {
        dists: [...prevState.doorReadings.dists, distances],
        angles: [...prevState.doorReadings.angles, angles]
      }
    }));

    return;
  }

  approachingPhase = (distances, angles) => {
    console.log("New detection");
    distances[0] = Math.round(distances[0] * 10) / 10;
    console.log(distances[0] + " meters away");
    if (distances[0] > 2) { // we are greater than 2 meters away, which is impossible in the approaching phase
      console.log("Invalid reading");
      return;
    } else if (distances[0] > 0.5 && distances[0] < 2) { // we are between 0.5 and 2 meters away
      if (this.state.mode == "Voice") {
        this.speak("Continue approaching, only " + distances[0] + " meters away, " + this.outputPositionText(angles[0]));
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
      }
    } else if (distances[0] > 0) { // we are less than 0.5 meters away
      console.log("reach for doorknob");
      if (this.state.mode == "Voice") {
        this.speak("Reach for the door, it is only " + distances[0] + " meters away, " + this.outputPositionText(angles[0]));
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.beepBasedOnDistanceAndAngle(distances[0], angles[0]);
      }
    } else { // we are 0 meters away
      // maybe wait for a second reading to confirm
      console.log("door reached already");
      if (this.state.mode == "Voice") {
        this.speak("Door reached!");
      } else {
        //this.vibrateIntensityBasedOnDistance(distances[0]);
        this.playSound(this.state.sounds[map_sounds['door_opening']])
      }
      this.resetState();
      return;
    }

    if (this.state.doorReadings.length > MAX_APPROACHING_READINGS) {
      this.resetState();
    } else {
      this.setState(prevState => ({
        doorReadings: {
          dists: [...prevState.doorReadings.dists, distances],
          angles: [...prevState.doorReadings.angles, angles]
        }
      }));
    }
  }

  outputResult = (res) => {
    //{"columns":["orie(clk)","dist(m)","conf"],"index":[0],"data":[[12,0,0.425]]}
    let distances = [];
    let angles = [];
    for (let i = 0; i < res.index.length; i++) {
      let index = res.index[i];
      let data = res.data[index];
      let angle = data[0];
      let distance = data[1];
      let confidence = data[2];
      distances.push(distance);
      angles.push(angle);
    }

    if (distances.length == 0) {
      console.log("No results");
      return;
    }

    if (this.state.phase == "Searching") {
      this.searchPhase(distances, angles);
    } else if (this.state.phase == "Calibrating") {
      this.calibratingPhase(distances, angles);
    } else {
      this.approachingPhase(distances, angles);
    }
  }

  stopStream = () => {
    this.setState({ running: false });
    Tts.stop();
    this.resetState();
  }

  render() {
    return (
      <View style={styles.container}>
                
        <RNCamera
          style={{ flex: 5, alignItems: 'center' }}
          ref={ref => {
            this.camera = ref;
          }}
        >
          <TouchableOpacity
          activeOpacity={0.5}
          style={styles.buttonHelp}
          onPress={() => this.speakInstructions(instructions)}>
          <Text
            style={{
              alignItems: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}>
            HELP
          </Text>
        </TouchableOpacity>
      </RNCamera>

        <Text style={styles.text}>{(this.state.running ? this.state.phase + " phase" : "Not Running") + ":" + this.state.mode + " mode"}</Text>
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
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.button}
          onPress={this.takeStream}>
          <Text
            style={{
              alignItems: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}>
            TAKE STREAM AND PRODUCE OUTPUT
          </Text>
        </TouchableOpacity>
        <Button
          title="Stop stream"
          onPress={() => {
            this.stopStream();
          }}
        />
        <Button
          title="Toggle mode"
          onPress={() => {
            this.setState({ mode: this.state.mode == "Voice" ? "Beep" : "Voice" });
          }}
        />
        <Text>{this.state.mode}</Text>
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
                this.setState({ isVisible: !this.state.isVisible });
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
  buttonHelp:{
    alignItems: 'center',
    backgroundColor: '#008ecc',
    padding: 5,
  },
  text: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 5,
    backgroundColor: 'black',
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  image: {
    width: '100%',
    height: '95%',
  },
});

export default App;
