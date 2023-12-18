'use strict'

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const url = require('url');
const { GithubActions } = require('./githubActions');
const { convertToJSON, convertToFormData, retry } = require('./helper');

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
 * @param {GithubActions} param0.actions 
 * @param {{ 
 *  ignoredCodes: number[];
 *  preventFailureOnNoResponse: boolean,
 *  escapeData: boolean;
 *  retry: number;
 *  retryWait: number;
 * }} param0.options
 *
 * @returns {Promise<axios.AxiosResponse>}
 */
const request = async({ method, instanceConfig, data, files, file, actions, options }) => {
  actions.debug(`options: ${JSON.stringify(options)}`)
  
  try {
    if (options.escapeData) {
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
          actions.setFailed(JSON.stringify({ message: `Unable to convert Data and Files into FormData: ${error.message}`, data: dataJson, files: filesJson }))
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
    
    /** @type {axios.AxiosInstance} */
    const instance = axios.create(instanceConfig);

    actions.debug('Request Data: ' + JSON.stringify(requestData))

    const execRequest = async () => {
      try {
        return await instance.request(requestData)
      } catch(error) {
        if (error.response && options.ignoredCodes.includes(error.response.status)) {
          actions.warning(`ignored status code: ${JSON.stringify({ code: error.response.status, message: error.response.data })}`)
          
          return null
        }
        
        if (!error.response && error.request && options.preventFailureOnNoResponse) {
          actions.warning(`no response received: ${JSON.stringify(error)}`);

          return null
        }

        throw error
      }
    }

    /** @type {axios.AxiosResponse|null} */
    const response = await retry(execRequest, {
      actions,
      retry: options.retry || 0,
      sleep: options.retryWait // wait time after each retry
    })

    if (!response) {
      return null
    }

    return response
  } catch (error) {
    if ((typeof error === 'object') && (error.isAxiosError === true)) {
      const { name, message, code, response } = error
      actions.setOutput('requestError', JSON.stringify({ name, message, code, status: response && response.status ? response.status : null }));
    }

    if (error.response) {
      actions.setFailed(JSON.stringify({ code: error.response.status, message: error.response.data }))
    } else if (error.request) {
      actions.setFailed(JSON.stringify({ error: "no response received" }));
    } else {
      actions.setFailed(JSON.stringify({ message: error.message, data }));
    }
  }
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
