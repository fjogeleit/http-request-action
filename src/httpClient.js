'use strict'

const axios = require('axios');
const FormData = require('form-data')
const fs = require('fs')
const url = require('url');

const METHOD_GET = 'GET'
const METHOD_POST = 'POST'

const HEADER_CONTENT_TYPE = 'Content-Type'

const CONTENT_TYPE_URLENCODED = 'application/x-www-form-urlencoded'

/**
 * @param {Object} param0
 * @param {string} param0.method HTTP Method
 * @param {axios.AxiosRequestConfig} param0.instanceConfig
 * @param {string} param0.data Request Body as string, default {}
 * @param {string} param0.files Map of Request Files (name: absolute path) as JSON String, default: {}
 * @param {string} param0.file Single request file (absolute path)
 * @param {*} param0.actions 
 * @param {number[]} param0.ignoredCodes Prevent Action to fail if the API response with one of this StatusCodes
 * @param {boolean} param0.preventFailureOnNoResponse Prevent Action to fail if the API respond without Response
 * @param {boolean} param0.escapeData Escape unescaped JSON content in data
 *
 * @returns {Promise<void>}
 */
const request = async({ method, instanceConfig, data, files, file, actions, ignoredCodes, preventFailureOnNoResponse, escapeData }) => {
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
      let filesJson = convertToJSON(files)
      let dataJson = convertToJSON(data)

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

    // Only consider file if neither data nor files provided
    if ((!data || data === '{}') && (!files || files === '{}') && file) {
      data = fs.createReadStream(file)
      updateConfigForFile(instanceConfig, file, actions)
    }

    if (instanceConfig.headers[HEADER_CONTENT_TYPE] === CONTENT_TYPE_URLENCODED) {
      let dataJson = convertToJSON(data)
      if (typeof dataJson === 'object' && Object.keys(dataJson).length) {
        data = (new url.URLSearchParams(dataJson)).toString();
      }
    }

    const requestData = {
      method,
      data,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    actions.debug('Instance Configuration: ' + JSON.stringify(instanceConfig))
    
    const instance = axios.create(instanceConfig);

    actions.debug('Request Data: ' + JSON.stringify(requestData))

    const response = await instance.request(requestData)

    actions.setOutput('response', JSON.stringify(response.data))
    
    actions.setOutput('headers', response.headers)
  } catch (error) {
    if ((typeof error === 'object') && (error.isAxiosError === true)) {
      const { name, message, code, response } = error
      actions.setOutput('requestError', JSON.stringify({ name, message, code, status: response && response.status ? response.status : null }));
    }

    if (error.response && ignoredCodes.includes(error.response.status)) {
      actions.warning(JSON.stringify({ code: error.response.status, message: error.response.data }))
    } else if (error.response) {
      actions.setFailed(JSON.stringify({ code: error.response.status, message: error.response.data }))
    } else if (error.request && !preventFailureOnNoResponse) {
      actions.setFailed(JSON.stringify({ error: "no response received" }));
    } else if (error.request && preventFailureOnNoResponse) {
      actions.warning(JSON.stringify(error));
    } else {
      actions.setFailed(JSON.stringify({ message: error.message, data }));
    }
  }
}

/**
 * @param {string} value
 *
 * @returns {Object}
 */
const convertToJSON = (value) => {
  try {
    return JSON.parse(value) || {}
  } catch(e) {
    return {}
  }
}

/**
 * @param {Object} data
 * @param {Object} files
 *
 * @returns {FormData}
 */
const convertToFormData = (data, files) => {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }

  for (const [key, value] of Object.entries(files)) {
    formData.append(key, fs.createReadStream(value))
  }

  return formData
}

/**
 * @param {{ baseURL: string; timeout: number; headers: { [name: string]: string } }} instanceConfig
 * @param {FormData} formData
 * @param {*} actions
 *
 * @returns {Promise<{ baseURL: string; timeout: number; headers: { [name: string]: string } }>}
 */
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

/**
 * @param instanceConfig
 * @param filePath
 * @param {*} actions
 *
 * @returns {{ baseURL: string; timeout: number; headers: { [name: string]: string } }}
 */
const updateConfigForFile = (instanceConfig, filePath, actions) => {
  try {
    const { size } = fs.statSync(filePath)

    return {
      ...instanceConfig,
      headers: {
        ...instanceConfig.headers,
        'Content-Length': size,
        'Content-Type': 'application/octet-stream'
      }
    }
  } catch(error) {
    actions.setFailed({ message: `Unable to read Content-Length: ${error.message}`, data, files })
  }
}

/**
 * @param {FormData} formData
 *
 * @returns {Promise<number>}
 */
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
