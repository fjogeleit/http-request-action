const axios = require("axios");

const METHOD_GET = 'GET'
const METHOD_POST = 'POST'

const request = async({ method, instanceConfig, data, auth, actions, preventFailureOnNoResponse }) => {
  try {
    const instance = axios.create(instanceConfig);

    const jsonData = method === METHOD_GET ? undefined : JSON.parse(data.replace(/\\n/g, '\n'))

    const requestData = {
      auth,
      method,
      data: jsonData
    }

    actions.debug('Request Data: ' + JSON.stringify(requestData))

    const response = await instance.request(requestData)

    actions.setOutput('response', JSON.stringify(response.data))
  } catch (error) {
    if (error.toJSON) {
      actions.setOutput(JSON.stringify(error.toJSON()));
    }

    if (error.response) {
      actions.setFailed(JSON.stringify({ code: error.response.code, message: error.response.data }))
    } else if (error.request && !preventFailureOnNoResponse) {
      actions.setFailed(JSON.stringify({ error: "no response received" }));
    } else if (error.request && preventFailureOnNoResponse) {
      actions.warning(JSON.stringify(error));
    } else {
      actions.setFailed(JSON.stringify({ message: error.message, data }));
    }
  }
}

module.exports = {
  request,
  METHOD_POST,
  METHOD_GET,
}
