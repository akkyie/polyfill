/* eslint-disable */
// Version 2017.09.27

import Router from './router.js';
import GPIOAccess from './gpio/access.js';
import GPIOPort from './gpio/port.js';
import I2CAccess from './i2c/access.js';
import I2CPort from './i2c/port.js'

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

function I2CSlaveDevice (portNumber, slaveAddress) {
  return new Promise((resolve, reject) => {
    this.init(portNumber, slaveAddress).then(() => {
      resolve(this)
    }, (err) => {
      reject(err)
    })
  })
}

I2CSlaveDevice.prototype = {
  portNumber: null,
  slaveAddress: null,
  slaveDevice: null,

  init: function (portNumber, slaveAddress) {
    return new Promise((resolve, reject) => {
      this.portNumber = portNumber
      this.slaveAddress = slaveAddress
      var data = new Uint8Array([this.slaveAddress, 1])
      bone.send(0x20, data).then((result) => {
        if (result[0] != 0) {
          infoLog('I2CSlaveDevice.init() result OK')
          resolve(this)
        } else {
          errLog('I2CSlaveDevice.init() result NG')
          reject('I2CSlaveDevice.init() result NG:')
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  read8: function (registerNumber) {
    return new Promise((resolve, reject) => {
      var data = new Uint8Array([this.slaveAddress, registerNumber, 1])
      bone.send(0x23, data).then((result) => {
        infoLog('I2CSlaveDevice.read8() result value=' + result)
        var readSize = result[0]
        if (readSize == 1) {
          resolve(result[1])
        } else {
          reject('read8() readSize unmatch : ' + readSize)
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  read16: function (registerNumber) {
    return new Promise((resolve, reject) => {
      infoLog('I2CSlaveDevice.read16() registerNumber=' + registerNumber)
      var data = new Uint8Array([this.slaveAddress, registerNumber, 2])
      bone.send(0x23, data).then((result) => {
        infoLog('I2CSlaveDevice.write8() result value=' + result)
        var readSize = result[0]
        if (readSize == 2) {
          var res_l = result[1]
          var res_h = result[2]
          var res = res_l + (res_h << 8)
          resolve(res)
        } else {
          reject('read16() readSize unmatch : ' + readSize)
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  write8: function (registerNumber, value) {
    return new Promise((resolve, reject) => {
      infoLog('I2CSlaveDevice.write8() registerNumber=' + registerNumber, ' value=' + value)
      var size = 2
      var data = new Uint8Array([this.slaveAddress, size, registerNumber, value])
      bone.send(0x21, data).then((result) => {
        infoLog('I2CSlaveDevice.write8() result value=' + result)
        if (result[0] != size) {
          reject('I2CSlaveAddress(' + this.slaveAddress + ').write8():error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  write16: function (registerNumber, value) {
    return new Promise((resolve, reject) => {
      infoLog('I2CSlaveDevice.write16() registerNumber=' + registerNumber, ' value=' + value)
      var value_L = value & 0x00ff
      var value_H = (value >> 8) & 0x00ff
      var size = 3
      var data = new Uint8Array([this.slaveAddress, size, registerNumber, value_L, value_H])
      bone.send(0x21, data).then((result) => {
        infoLog('I2CSlaveDevice.write16() result value=' + result)
        if (result[0] != size) {
          reject('I2CSlaveAddress(' + this.slaveAddress + ').write16():error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  readByte: function () {
    return new Promise((resolve, reject) => {
      var data = new Uint8Array([this.slaveAddress, 1])
      bone.send(0x22, data).then((result) => {
        infoLog('I2CSlaveDevice.readByte() result value=' + result)
        var readSize = result[0]
        if (readSize == 1) {
          resolve(result[1])
        } else {
          reject('readByte() readSize unmatch : ' + readSize)
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  readBytes: function (length) {
    return new Promise((resolve, reject) => {
      if ((typeof length !== 'number') || (length > 127)) {
        reject('readBytes() readSize error : ' + length)
      }
      var data = new Uint8Array([this.slaveAddress, length])
      bone.send(0x22, data).then((result) => {
        infoLog('I2CSlaveDevice.readBytes() result value=' + result)
        var readSize = result[0]
        if (readSize == length) {
          var buffer = result
          buffer.shift() // readSizeを削除
          resolve(buffer)
        } else {
          reject('readBytes() readSize unmatch : ' + readSize)
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  writeByte: function (value) {
    return new Promise((resolve, reject) => {
      infoLog('I2CSlaveDevice.writeByte() value=' + value)
      var size = 1
      var data = new Uint8Array([this.slaveAddress, size, value])
      bone.send(0x21, data).then((result) => {
        infoLog('I2CSlaveDevice.writeByte() result' + result)
        if (result[0] != size) {
          reject('I2CSlaveAddress(' + this.slaveAddress + ').writeByte():error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  },

  writeBytes: function (buffer) {
    return new Promise((resolve, reject) => {
      if (buffer.length == null) {
        reject('readBytes() parameter error : ' + buffer)
      }
      var arr = [this.slaveAddress, buffer.length]
      for (var cnt = 0; cnt < buffer.length; cnt++) {
        arr.push(buffer[cnt])
      }
      var data = new Uint8Array(arr)
      bone.send(0x21, data).then((result) => {
        infoLog('I2CSlaveDevice.writeBytes() result value=' + result)
        if (result[0] == buffer.length) {
          var resbuffer = result
          resbuffer.shift() // readSizeを削除
          resolve(resbuffer)
        } else {
          reject('writeBytes() writeSize unmatch : ' + result[0])
        }
      }, (error) => {
        reject(error)
      })
    })
  }

}

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
