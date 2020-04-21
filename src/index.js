const core = require("@actions/core");
const axios = require("axios");

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
  headers['Authentication'] = `Bearer ${core.getInput('bearerToken')}`;
}

const instanceConfig = {
  baseURL: core.getInput('url', { required: true }),
  timeout: parseInt(core.getInput('timeout') || 5000, 10),
  headers: { ...headers, ...customHeaders }
}

core.debug(JSON.stringify(instanceConfig))

const instance = axios.create(instanceConfig);

(async() => {
  try {
    const requestData = {
      auth,
      method: core.getInput('method') || 'POST',
      data: JSON.parse(core.getInput('data') || '{}')
    }

    core.debug(JSON.stringify(requestData))

    const response = await instance.request(requestData)

    core.setOutput('response', JSON.stringify(response.data))
  } catch (error) {
    core.setFailed(JSON.stringify({ code: error.response.code, message: error.response.data }))
  }
})()
