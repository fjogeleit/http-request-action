const core = require("@actions/core");
const axios = require("axios");

const METHOD_GET = 'GET'
const METHOD_POST = 'POST'

let auth = undefined
let customHeaders = {}

if (!!core.getInput('customHeaders')) {
  try {
    customHeaders = JSON.parse(core.getInput('customHeaders'));
  } catch(error) {
    core.error('Could not parse customHeaders string value')
  }
}

const headers = { 'Content-Type': core.getInput('contentType') || 'application/json' }

if (!!core.getInput('username') || !!core.getInput('password')) {
  core.debug('Add BasicHTTP Auth config')

  auth = {
    username: core.getInput('username'),
    password: core.getInput('password')
  }
}

if (!!core.getInput('bearerToken')) {
  headers['Authorization'] = `Bearer ${core.getInput('bearerToken')}`;
}

const instanceConfig = {
  baseURL: core.getInput('url', { required: true }),
  timeout: parseInt(core.getInput('timeout') || 5000, 10),
  headers: { ...headers, ...customHeaders }
}

core.debug('Instance Configuration: ' + JSON.stringify(instanceConfig))

const instance = axios.create(instanceConfig);

(async() => {
  try {
    const method = core.getInput('method') || METHOD_POST;
    const data = method === METHOD_GET ? undefined : JSON.parse(core.getInput('data') || '{}')

    const requestData = {
      auth,
      method,
      data
    }

    core.debug('Request Data: ' + JSON.stringify(requestData))

    const response = await instance.request(requestData)

    core.setOutput('response', JSON.stringify(response.data))
  } catch (error) {
    core.setOutput(error.toJSON());
    
    if (error.response) {
      core.setFailed(JSON.stringify({ code: error.response.code, message: error.response.data }))
    } else if (error.request) {
      core.setFailed(JSON.stringify({ error: "no response received" }));
    } else {
      core.setFailed(error.message);
    }
  }
})()
