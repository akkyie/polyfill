/* eslint-disable */
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

export default GPIOAccess;
