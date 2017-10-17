/* eslint-disable */
// Version 2017.09.27

import Router from './router.js';

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
// GPIOAccess
// Raspberry Pi GPIO Port Number

// todo: add portName and pinName
var gpioPorts = [4, 17, 27, 22, 23, 24, 25, 5, 6, 12, 13, 19, 16, 26, 20, 21]

var GPIOAccess = function () {
  this.init()
}

GPIOAccess.prototype = {
  init: function () {
    this.ports = new Map()
    for (var cnt = 0; cnt < gpioPorts.length; cnt++) {
      this.ports.set(gpioPorts[cnt], new GPIOPort(gpioPorts[cnt]))
    }
  },
  ports: new Map(),
  unexportAll: null,
  onchange: null
}

var GPIOPort = function (portNumber) {
  infoLog('GPIOPort:' + portNumber)
  this.init(portNumber)
}

GPIOPort.prototype = {
  init: function (portNumber) {
    this.portNumber = portNumber
    this.portName = ''
    this.pinName = ''
    this.direction = ''
    this.exported = false
    this.value = null
    this.onchange = null
  },

  export: function (direction) {
    return new Promise((resolve, reject) => {
      var dir = -1
      if (direction === 'out') {
        dir = 0
        bone.removeEvent(0x14, this.portNumber)
      } else if (direction === 'in') {
        dir = 1
        //        console.dir(bone);
        bone.registerEvent(0x14, this.portNumber, (buf) => {
          if (typeof this.onchange === 'function') {
            infoLog('onchange')
            this.onchange(buf[5])
          }
        })
      } else {
        reject('export:direction not valid! [' + direction + ']')
      }
      infoLog('export: Port:' + this.portNumber + ' direction=' + direction)
      var data = new Uint8Array([this.portNumber, dir])
      bone.send(0x10, data).then((result) => {
        if (result[0] == 0) {
          reject('GPIOPort(' + this.portNumber + ').export() error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  },
  read: function () {
    return new Promise((resolve, reject) => {
      infoLog('read: Port:' + this.portNumber)
      var data = new Uint8Array([this.portNumber])
      bone.send(0x12, data).then((result) => {
        if (result[0] == 0) {
          reject('GPIOPort(' + this.portNumber + ').read() error')
        } else {
          resolve(result[1])
        }
      }, (error) => {
        reject(error)
      })
    })
  },
  write: function (value) {
    return new Promise((resolve, reject) => {
      infoLog('write: Port:' + this.portNumber + ' value=' + value)
      var data = new Uint8Array([this.portNumber, value])
      bone.send(0x11, data).then((result) => {
        if (result[0] == 0) {
          reject('GPIOPort(' + this.portNumber + ').write() error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  },
  onchange: null,
  unexport: function () {
    return new Promise((resolve, reject) => {
      infoLog('unexport: Port:' + this.portNumber)
      var data = new Uint8Array([this.portNumber, value])
      bone.send(0x13, data).then((result) => {
        if (result[0] == 0) {
          reject('GPIOPort(' + this.portNumber + ').unexport() error')
        } else {
          resolve()
        }
      }, (error) => {
        reject(error)
      })
    })
  }
}

/// ///////////////////////////////////////////////////////////////////////
// I2CAccess

var i2cPorts = [1]

var I2CAccess = function () {
  this.init()
}

I2CAccess.prototype = {
  init: function () {
    this.ports = new Map()
    for (var cnt = 0; cnt < i2cPorts.length; cnt++) {
      this.ports.set(i2cPorts[cnt], new I2CPort(i2cPorts[cnt]))
    }
  },
  ports: new Map()
}

function I2CPort (portNumber) {
  this.init(portNumber)
}

I2CPort.prototype = {
  init: function (portNumber) {
    this.portNumber = portNumber
  },

  portNumber: 0,
  open: function (slaveAddress) {
    return new Promise((resolve, reject) => {
      new I2CSlaveDevice(this.portNumber, slaveAddress).then((i2cslave) => {
        resolve(i2cslave)
      }, (err) => {
        reject(err)
      })
    })
  }
}

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
