'use strict'

const axios = require('axios');
const fs = require('fs');
const { GithubActions } = require('../githubActions');

/**
 * @param {string} filePath
 * @param {GithubActions} actions
 * 
 * @returns {(response: axios.AxiosResponse) => void}
 */
const createPersistHandler = (filePath, actions) => (response) => {
    let data = response.data

    if (typeof data == 'object') {
        data = JSON.stringify(data)
    }

    fs.writeFile(filePath, data, error => {
        if (!error) {
            actions.info(`response persisted successfully at ${filePath}`)
            return
        }
    
        actions.warning(JSON.stringify({ message: error.message, data: response.data }))
    })
}

module.exports = { createPersistHandler }