// JavaScript references to DOM elements
const recordBtnEl = document.getElementById("record-button");
const saveBtnEl = document.getElementById("save-button");
const messageEl = document.getElementById("message-div");
const messageBoardEl = document.getElementById("message-board");
const modal = new bootstrap.Modal(document.getElementById("my-modal"), {
  backdrop: "static",
});
const modalInputEl = document.getElementById("name-input");
const modalSaveBtnEl = document.getElementById("modal-save-button");
const modalCloseBtnEl = document.getElementById("modal-close-button");
const modalXOutBtnEl = document.getElementById("xOut-button");
const copyrightEl = document.getElementById("copyright");

copyrightEl.textContent = `Copyright ${new Date().getFullYear()} James Compagnoni`;

// const PORT = process.env.PORT || 8000;

// set initial state of application variables
let isRecording = false;
let socket;
let recorder;
let messageText;
const savedMessages = JSON.parse(localStorage.getItem("savedMessages")) || [];

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
    const response = await fetch('/transcription'); // get temp session token from server.js (backend)
    // const response = await fetch(`http://localhost:8000/transcription`); // get temp session token from server.js (backend)
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
  recordBtnEl.classList = isRecording ? "btn btn-danger" : "btn btn-success";
  recordBtnEl.innerText = isRecording ? "Stop Recording" : "Start Recording";
};

const showModal = () => {
  // save message in global variable
  messageText = messageEl.textContent;
  // if no text, run alert and exit function
  if (!messageText) {
    alert(
      "Press the record button first to transcribe your speech to text, then stop recording and hit save."
    );
    return null;
  }
  // otherwise show the modal
  modal.show();
};

const messageTemplate = (message, author, date) => {
  const now = date || new Date().toDateString();

  return `
    <li>
      <span class="message-icon"></span>
      <div class="message-box">
          <span class="message">
            ${message}
          </span>
          <span class="message-meta">
              ${author} on ${now} 
          </span>
      </div>
    </li>`;
};

const saveToMessageBoard = (e) => {
  // get input's current value
  let name = modalInputEl.value;
  // if user clicks x or close button, set name to anonymous and leave modal
  let btnId = e.target.getAttribute('id');
  if(btnId == 'xOut-button' || btnId == 'modal-close-button') {
    name = "Anonymous";
    modal.hide();
  }   
  // create message object and push to savedMessages
  const newMessage = {
    name,
    messageText,
    date: new Date().toDateString(),
  };
  savedMessages.push(newMessage);
  localStorage.setItem("savedMessages", JSON.stringify(savedMessages));
  // pass in message text and name to template literal
  const newMsg = messageTemplate(messageText, name);
  // insert into DOM
  messageBoardEl.insertAdjacentHTML("afterbegin", newMsg);
  modal.hide();
  messageEl.textContent = "";
};

const populateOnLoad = (retrievedMessages) => {
  if (!retrievedMessages.length) return;
  retrievedMessages.forEach((msg) => {
    // destructure properties of smg
    const { name, messageText, date } = msg;
    // pass in message text and name to template literal
    const msgHtml = messageTemplate(messageText, name, date);
    // insert into DOM
    messageBoardEl.insertAdjacentHTML("afterbegin", msgHtml);
  });
};

const changeButtonState = () => {
  modalInputEl.value === ""
    ? (modalSaveBtnEl.disabled = true)
    : (modalSaveBtnEl.disabled = false);
};

// event listeners
recordBtnEl.addEventListener("click", run);
saveBtnEl.addEventListener("click", showModal);
modalInputEl.addEventListener("keyup", changeButtonState);
modalSaveBtnEl.addEventListener("click", saveToMessageBoard);
modalCloseBtnEl.addEventListener("click", saveToMessageBoard);
modalXOutBtnEl.addEventListener("click", saveToMessageBoard);


populateOnLoad(savedMessages);