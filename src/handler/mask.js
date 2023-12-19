'use strict'

const axios = require('axios');
const { GithubActions } = require('../githubActions');

/**
 * @param {GithubActions} actions
 * 
 * @returns {(response: axios.AxiosResponse) => void}
 */
const createMaskHandler = (actions) => (response) => {
    actions.setSecret(JSON.stringify(response.data))
}

module.exports = { createMaskHandler }