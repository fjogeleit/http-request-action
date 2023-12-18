'use strict'

const core = require("@actions/core");

class GithubActions {
  debug(message) {
    core.debug(message)
  }

  info(message) {
    core.info(message)
  }

  warning(message) {
    core.warning(message)
  }

  setOutput(name, output) {
    core.setOutput(name, output)
  }

  setSecret(value) {
    core.setSecret(value)
  }

  setFailed(message) {
    core.setFailed(message)
  }
}

class LogActions {
  info(message) {
    console.info(message)
  }

  debug(message) {
    console.info(message)
  }

  warning(message) {
    console.warn(message)
  }

  setOutput(name, output) {
    console.log(name, output)
  }

  setFailed(message) {
    console.error(message)
  }
}

module.exports = { GithubActions, LogActions }
