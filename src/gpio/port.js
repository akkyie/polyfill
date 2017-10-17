/* eslint-disable */

const GPIOPort = function (portNumber) {
  infoLog(`GPIOPort:${portNumber}`);
  this.init(portNumber);
};

GPIOPort.prototype = {
  init(portNumber) {
    this.portNumber = portNumber;
    this.portName = '';
    this.pinName = '';
    this.direction = '';
    this.exported = false;
    this.value = null;
    this.onchange = null;
  },

  export(direction) {
    return new Promise((resolve, reject) => {
      let dir = -1;
      if (direction === 'out') {
        dir = 0;
        bone.removeEvent(0x14, this.portNumber);
      } else if (direction === 'in') {
        dir = 1;
        //        console.dir(bone);
        bone.registerEvent(0x14, this.portNumber, (buf) => {
          if (typeof this.onchange === 'function') {
            infoLog('onchange');
            this.onchange(buf[5]);
          }
        });
      } else {
        reject(`export:direction not valid! [${direction}]`);
      }
      infoLog(`export: Port:${this.portNumber} direction=${direction}`);
      const data = new Uint8Array([this.portNumber, dir]);
      bone.send(0x10, data).then((result) => {
        if (result[0] == 0) {
          reject(`GPIOPort(${this.portNumber}).export() error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },
  read() {
    return new Promise((resolve, reject) => {
      infoLog(`read: Port:${this.portNumber}`);
      const data = new Uint8Array([this.portNumber]);
      bone.send(0x12, data).then((result) => {
        if (result[0] == 0) {
          reject(`GPIOPort(${this.portNumber}).read() error`);
        } else {
          resolve(result[1]);
        }
      }, (error) => {
        reject(error);
      });
    });
  },
  write(value) {
    return new Promise((resolve, reject) => {
      infoLog(`write: Port:${this.portNumber} value=${value}`);
      const data = new Uint8Array([this.portNumber, value]);
      bone.send(0x11, data).then((result) => {
        if (result[0] == 0) {
          reject(`GPIOPort(${this.portNumber}).write() error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },
  onchange: null,
  unexport() {
    return new Promise((resolve, reject) => {
      infoLog(`unexport: Port:${this.portNumber}`);
      const data = new Uint8Array([this.portNumber, value]);
      bone.send(0x13, data).then((result) => {
        if (result[0] == 0) {
          reject(`GPIOPort(${this.portNumber}).unexport() error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },
};

export default GPIOPort;
