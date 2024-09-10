'use strict';

const { GithubActions } = require('./githubActions');
const FormData = require('form-data');
const fs = require('fs');

/**
 * @param {string} value
 *
 * @returns {Object}
 */
const convertToJSON = (value) => {
  try {
    return JSON.parse(value) || {};
  } catch (e) {
    return {};
  }
};

/**
 * @param {{ [key: string]: string }}  data
 * @param {{ [key: string]: string }}  files
 * @param {boolean} convertPaths
 *
 * @returns {FormData}
 */
const convertToFormData = (data, files, convertPaths) => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }

  for (const [key, value] of Object.entries(files)) {
    formData.append(key, fs.createReadStream(value));
  }

  return formData;
};

/**
 * @param {() => Promise} callback
 * @param {{ retry: number; sleep: number; actions: GithubActions }} options
 *
 * @returns {Promise}
 */
const retry = async (callback, options) => {
  let lastErr = null;
  let i = 0;

  do {
    try {
      return await callback();
    } catch (err) {
      lastErr = err;
    }

    if (i < options.retry) {
      options.actions.warning(`#${i + 1} request failed: ${lastErr}`);
      await sleep(options.sleep);
    }

    i++;
  } while (i <= options.retry);

  throw lastErr;
};

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = {
  convertToJSON,
  convertToFormData,
  retry,
};
