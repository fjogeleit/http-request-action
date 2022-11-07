'use strict'

const core = require('@actions/core');
const axios = require('axios');
const https = require('https');
const { request, METHOD_POST } = require('./httpClient');
const { GithubActions } = require('./githubActions');

let customHeaders = {}

if (!!core.getInput('customHeaders')) {
  try {
    customHeaders = JSON.parse(core.getInput('customHeaders'));
  } catch(error) {
    core.error('Could not parse customHeaders string value')
  }
}

const headers = { 'Content-Type': core.getInput('contentType') || 'application/json' }

if (!!core.getInput('bearerToken')) {
  headers['Authorization'] = `Bearer ${core.getInput('bearerToken')}`;
}

/** @type {axios.AxiosRequestConfig} */
const instanceConfig = {
  baseURL: core.getInput('url', { required: true }),
  timeout: parseInt(core.getInput('timeout') || 5000, 10),
  headers: { ...headers, ...customHeaders }
}

if (!!core.getInput('httpsCA')) {
  instanceConfig.httpsAgent = new https.Agent({ ca: core.getInput('httpsCA') })
}

if (!!core.getInput('username') || !!core.getInput('password')) {
  core.debug('Add BasicHTTP Auth config')

  instanceConfig.auth = {
    username: core.getInput('username'),
    password: core.getInput('password')
  }
}

const data = core.getInput('data') || '{}';
const files = core.getInput('files') || '{}';
const file = core.getInput('file')
const method = core.getInput('method') || METHOD_POST;
const preventFailureOnNoResponse = core.getInput('preventFailureOnNoResponse') === 'true';
const escapeData = core.getInput('escapeData') === 'true';

const ignoreStatusCodes = core.getInput('ignoreStatusCodes')
let ignoredCodes = []

if (typeof ignoreStatusCodes === 'string' && ignoreStatusCodes.length > 0) {
  ignoredCodes = ignoreStatusCodes.split(',').map(statusCode => parseInt(statusCode.trim()))
}

request({ data, method, instanceConfig, preventFailureOnNoResponse, escapeData, files, file, ignoredCodes, actions: new GithubActions() })
