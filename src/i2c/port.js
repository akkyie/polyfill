/* eslint-disable */

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

export default I2CPort;
