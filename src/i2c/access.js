/* eslint-disable */

// / ///////////////////////////////////////////////////////////////////////
// I2CAccess

const i2cPorts = [1];

const I2CAccess = function () {
  this.init();
};

I2CAccess.prototype = {
  init() {
    this.ports = new Map();
    for (let cnt = 0; cnt < i2cPorts.length; cnt++) {
      this.ports.set(i2cPorts[cnt], new I2CPort(i2cPorts[cnt]));
    }
  },
  ports: new Map(),
};

export default I2CAccess;
