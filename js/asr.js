// JavaScript references to DOM elements
const buttonEl = document.getElementById("startBtn");
const messageEl = document.getElementById("asr-text");
// const titleEl = document.getElementById("real-time-title");

// set initial state of application variables
let isRecording = false;
let socket;
let recorder;

// runs real-time transcription and handles global variables
const run = async () => {
  if (isRecording) {
    if (socket) {
      socket.send(JSON.stringify({ terminate_session: true }));
      socket.close();
      socket = null;
    }

    if (recorder) {
      recorder.pauseRecording();
      recorder = null;
    }
  } else {
    const response = await fetch("http://localhost:8000"); // get temp session token from server.js (backend)
    const data = await response.json();

    if (data.error) {
      alert("Your transcription request can't be completed:", data.error);
      // return out of function
      return null;
    }

    const { token } = data;

    // establish wss with AssemblyAI (AAI) at 16000 sample rate
    socket = new WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
    );

    // handle incoming messages to display transcription to the DOM
    const texts = {};
    // onmessage event listener, i.e. when a message is received from the server
    socket.onmessage = (message) => {
      let msg = "";
      const res = JSON.parse(message.data);
      // JSON response from WebSocket API features keys like audio_start and text
      // In line of code below, assign a new property to object 'texts' with its name as
      // the current audio_start time and text as its value
      texts[res.audio_start] = res.text;
      // traverse the properties of the object 'texts', saving their names in an array 'keys'
      const keys = Object.keys(texts);

      keys.sort((a, b) => a - b);
      for (const key of keys) {
        if (texts[key]) {
          msg += ` ${texts[key]}`;
        }
      }
      messageEl.innerText = msg;
    };
    // onerror event listener
    socket.onerror = (event) => {
      console.error(event);
      socket.close();
    };
    // onclose event listener
    socket.onclose = (event) => {
      console.log(event);
      socket = null;
    };
    // onopen event listener
    socket.onopen = () => {
      // once socket is open, begin recording
    //   messageEl.style.display = "";
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          recorder = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm;codecs=pcm", // endpoint requires 16bit PCM audio
            recorderType: StereoAudioRecorder,
            timeSlice: 250, // set 250 ms intervals of data that sends to AAI
            desiredSampRate: 16000,
            numberOfAudioChannels: 1, // real-time requires only one channel
            bufferSize: 4096,
            audioBitsPerSecond: 128000,
            ondataavailable: (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64data = reader.result;

                // audio data must be sent as a base64 encoded string
                if (socket) {
                  socket.send(
                    JSON.stringify({
                      audio_data: base64data.split("base64,")[1],
                    })
                  );
                }
              };
              reader.readAsDataURL(blob);
            },
          });

          recorder.startRecording();
        })
        .catch((err) => console.error(err));
    };
  }

  isRecording = !isRecording;
  buttonEl.innerText = isRecording ? "Stop Recording" : "Start Recording";
//   titleEl.innerText = isRecording
//     ? "Click stop to end recording!"
//     : "Click start to begin recording!";
};

buttonEl.addEventListener("click", () => run());
