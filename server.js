// import modules/packages/dependencies
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  try {
    const response = await axios.post(
      // use account token to get a temp user token
      "https://api.assemblyai.com/v2/realtime/token",
      // can set a TTL timer in seconds.
      { expires_in: 120 }, 
      // AssemblyAI API Key goes here; saved as environment variable for privacy/security
      { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } }
    );
    // console.log('Response data is', response);
    // destructure data property from response
    const { data } = response;
    // create new environment variable to store temporary authentication token
    process.env.TEMP_TOKEN = data.token;
    // console.log('process.env.TEMP_TOKEN is', process.env.TEMP_TOKEN);
    
    res.json(data);
  } catch (error) {
    console.log("***** Error! Something undesired happened: *****\n", error);
    res.status(400).json(error);
    // const {response: {status, data}} = error;
    // res.status(status).json(data);
  }
});

// set port number
app.set("port", 8000);

// start the web server, listening for connections on the port assigned above
const server = app.listen(app.get("port"), () => {
  console.log(`***** Server is running on port ${server.address().port} *****`);
});