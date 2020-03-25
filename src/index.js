const core = require("@actions/core");
const axios = require("axios");

const auth = {}
let customHeaders = {}

if (!!core.getInput('customHeaders')) {
  try {
    customHeaders = JSON.parse(core.getInput('customHeaders'));
  } catch(error) {
    core.error('Could not parse customHeaders string value')
  }
}

const headers = { 'Content-Type': core.getInput('contentType') || 'application/json' }

if (!!core.getInput('username')) {
  auth.username = core.getInput('username');
}

if (!!core.getInput('password')) {
  auth.password = core.getInput('password');
}

if (!!core.getInput('bearerToken')) {
  headers['Authentication'] = `Bearer ${core.getInput('bearerToken')}`;
}

const instance = axios.create({
  baseURL: core.getInput('url', { required: true }),
  timeout: parseInt(core.getInput('timeout') || 5000, 10),
  headers: { ...headers, ...customHeaders }
});


(async() => {
  try {
    const response = await instance.request({
      auth,
      method: core.getInput('method') || 'POST',
      data: JSON.parse(core.getInput('data') || '{}')
    })

    core.setOutput('response', JSON.stringify(response.data))
  } catch (error) {
    core.setFailed(JSON.stringify({ code: error.response.code, message: error.response.data }))
  }
})()
