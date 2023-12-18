'use strict'

const axios = require('axios');
const { GithubActions } = require('../githubActions');

/**
 * @param {GithubActions} actions
 * 
 * @returns {(response: axios.AxiosResponse) => void}
 */
const createMaskHandler = (actions) => (response) => {
    let data = response.data

    if (typeof data == 'object') {
        data = JSON.stringify(data)
    }

    actions.setSecret(data)
}

module.exports = { createMaskHandler }