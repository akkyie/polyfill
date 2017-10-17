/* eslint-disable */
// Version 2017.09.27

import Router from './router.js';
import GPIOAccess from './gpio/access.js';
import GPIOPort from './gpio/port.js';
import I2CAccess from './i2c/access.js';
import I2CPort from './i2c/port.js'
import I2CSlaveDevice from './i2c/slaveDevice.js'

var serverURL = 'ws://x.x.x.x:33330/'

function infoLog (str) {
  // console.log("info: "+str);
}

function errLog (str) {
  console.log('error: ' + str)
}

bone = (() => {
  var rt = new Router()
  rt.init(serverURL)
  return rt
})()

/// ///////////////////////////////////////////////////////////////////////
// navigator

if (!navigator.requestI2CAccess) {
  navigator.requestI2CAccess = function () {
    return new Promise(function (resolve, reject) {
      //      console.dir(bone);
      bone.waitConnection().then(() => {
        var i2cAccess = new I2CAccess()
        infoLog('I2CAccess.resolve')
        resolve(i2cAccess)
      })
    })
  }
}

if (!navigator.requestGPIOAccess) {
  navigator.requestGPIOAccess = function () {
    return new Promise(function (resolve, reject) {
      //      console.dir(bone);
      bone.waitConnection().then(() => {
        var gpioAccess = new GPIOAccess()
        infoLog('gpioAccess.resolve')
        resolve(gpioAccess)
      })
    })
  }
}
