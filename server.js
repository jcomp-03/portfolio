// import modules/packages/dependencies
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const PORT = process.env.PORT || 8000;
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

app.get("/healthcheck", async (req, res) => {
  try {
    console.log(`${process.env.TEST_VARIABLE}`)
    console.log('Successfully hitting endpoint /healthcheck');
    res.status(200).json('Successfully hitting endpoint /healthcheck');
  } catch (error) {
    console.log("***** Error! Something undesired happened: *****\n", error);
    res.status(400).json(error);
  }
});


// start the web server, listening for connections on the port assigned above
const server = app.listen(PORT, () => {
  console.log(`***** Server is running on port ${PORT} *****`);
});
