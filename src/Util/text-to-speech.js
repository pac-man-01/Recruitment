import axios from "axios";
import BASE_URL from "./configApi";

const getAudioDuration = (audioBlob) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = (error) => {
      reject(error);
    };
    audio.src = URL.createObjectURL(audioBlob);
  });
};

const avatarUrl = `${BASE_URL}/getAvatarResponse`;
// const avatarUrl =
//   "https://rec-eng-service-backend-uat-dot-in-gcp-apa-svc-af576-npd-1.wl.r.appspot.com/getAvatarResponse";

const handleConvertToSpeech = async (text, { setmicDuration }) => {
  try {
    const token = localStorage.getItem("access_token");
    // console.log("Text",token)

    const data = await fetch(`${avatarUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: text }),
    });
    const response = (await data.json()).messages;

    // const audioContent = response.data.audioContent;
    const audioContent = response[0].audio;
    const audioBlob = base64ToBlob(audioContent, "audio/mp3");
    getAudioDuration(audioBlob)
      .then((duration) => {
        // timerForAudio = duration;
        setmicDuration(duration);
      })
      .catch((error) => {
        // console.log("SAR", error);
        console.error("Error getting audio duration:", error);
      });
    playAudio(audioBlob);
  } catch (error) {
    // console.log("DEB", error);
    console.error("Error converting text to speech:", error);
  }
};

const base64ToBlob = (base64String, contentType) => {
  const byteCharacters = atob(base64String);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const playAudio = (audioBlob) => {
  const audioContext = new window.AudioContext();
  const fileReader = new FileReader();
  fileReader.onload = () => {
    audioContext.decodeAudioData(fileReader.result, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    });
  };
  fileReader.readAsArrayBuffer(audioBlob);
};

export default handleConvertToSpeech;
