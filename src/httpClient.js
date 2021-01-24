const axios = require("axios");
const FormData = require('form-data')
const fs = require('fs')

const METHOD_GET = 'GET'
const METHOD_POST = 'POST'

const request = async({ method, instanceConfig, data, files, auth, actions, preventFailureOnNoResponse, escapeData }) => {
  try {
    if (escapeData) {
      data = data.replace(/"[^"]*"/g, (match) => { 
          return match.replace(/[\n\r]\s*/g, "\\n");
      }); 
    }

    if (method === METHOD_GET) {
      data = undefined;
    }

    if (files && files !== '{}') {
      filesJson = convertToJSON(files)
      dataJson = convertToJSON(data)

      if (Object.keys(filesJson).length > 0) {
        try {
          data = convertToFormData(dataJson, filesJson)
          instanceConfig = await updateConfig(instanceConfig, data, actions)
        } catch(error) {
          actions.setFailed({ message: `Unable to convert Data and Files into FormData: ${error.message}`, data: dataJson, files: filesJson })
          return
        }
      }
    }

    const requestData = {
      auth,
      method,
      data
    }

    actions.debug('Instance Configuration: ' + JSON.stringify(instanceConfig))
    
    const instance = axios.create(instanceConfig);

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

const convertToJSON = (value) => {
  try {
    return JSON.parse(value)
  } catch(e) {
    return {}
  }
}

const convertToFormData = (data, files) => {
  formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }

  for (const [key, value] of Object.entries(files)) {
    formData.append(key, fs.createReadStream(value))
  }

  return formData
}

const updateConfig = async (instanceConfig, formData, actions) => {
  try {
    const formHeaders = formData.getHeaders()
    const contentType = formHeaders['content-type']

    delete formHeaders['content-type']

    return { 
      ...instanceConfig, 
      headers: { 
        ...instanceConfig.headers, 
        ...formHeaders,
        'Content-Length': await contentLength(formData),
        'Content-Type': contentType
      }
    }
  } catch(error) {
    actions.setFailed({ message: `Unable to read Content-Length: ${error.message}`, data, files })
  }
}

const contentLength = (formData) => new Promise((resolve, reject) => {
  formData.getLength((err, length) => {
    if (err) {
      reject (err)
      return
    }

    resolve(length)
  })
})

module.exports = {
  request,
  METHOD_POST,
  METHOD_GET,
}
