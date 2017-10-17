/* eslint-disable */

function I2CSlaveDevice(portNumber, slaveAddress) {
  return new Promise((resolve, reject) => {
    this.init(portNumber, slaveAddress).then(() => {
      resolve(this);
    }, (err) => {
      reject(err);
    });
  });
}

I2CSlaveDevice.prototype = {
  portNumber: null,
  slaveAddress: null,
  slaveDevice: null,

  init(portNumber, slaveAddress) {
    return new Promise((resolve, reject) => {
      this.portNumber = portNumber;
      this.slaveAddress = slaveAddress;
      const data = new Uint8Array([this.slaveAddress, 1]);
      bone.send(0x20, data).then((result) => {
        if (result[0] != 0) {
          infoLog('I2CSlaveDevice.init() result OK');
          resolve(this);
        } else {
          errLog('I2CSlaveDevice.init() result NG');
          reject('I2CSlaveDevice.init() result NG:');
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  read8(registerNumber) {
    return new Promise((resolve, reject) => {
      const data = new Uint8Array([this.slaveAddress, registerNumber, 1]);
      bone.send(0x23, data).then((result) => {
        infoLog(`I2CSlaveDevice.read8() result value=${result}`);
        const readSize = result[0];
        if (readSize == 1) {
          resolve(result[1]);
        } else {
          reject(`read8() readSize unmatch : ${readSize}`);
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  read16(registerNumber) {
    return new Promise((resolve, reject) => {
      infoLog(`I2CSlaveDevice.read16() registerNumber=${registerNumber}`);
      const data = new Uint8Array([this.slaveAddress, registerNumber, 2]);
      bone.send(0x23, data).then((result) => {
        infoLog(`I2CSlaveDevice.write8() result value=${result}`);
        const readSize = result[0];
        if (readSize == 2) {
          const res_l = result[1];
          const res_h = result[2];
          const res = res_l + (res_h << 8);
          resolve(res);
        } else {
          reject(`read16() readSize unmatch : ${readSize}`);
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  write8(registerNumber, value) {
    return new Promise((resolve, reject) => {
      infoLog(`I2CSlaveDevice.write8() registerNumber=${registerNumber}`, ` value=${value}`);
      const size = 2;
      const data = new Uint8Array([this.slaveAddress, size, registerNumber, value]);
      bone.send(0x21, data).then((result) => {
        infoLog(`I2CSlaveDevice.write8() result value=${result}`);
        if (result[0] != size) {
          reject(`I2CSlaveAddress(${this.slaveAddress}).write8():error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  write16(registerNumber, value) {
    return new Promise((resolve, reject) => {
      infoLog(`I2CSlaveDevice.write16() registerNumber=${registerNumber}`, ` value=${value}`);
      const value_L = value & 0x00ff;
      const value_H = (value >> 8) & 0x00ff;
      const size = 3;
      const data = new Uint8Array([this.slaveAddress, size, registerNumber, value_L, value_H]);
      bone.send(0x21, data).then((result) => {
        infoLog(`I2CSlaveDevice.write16() result value=${result}`);
        if (result[0] != size) {
          reject(`I2CSlaveAddress(${this.slaveAddress}).write16():error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  readByte() {
    return new Promise((resolve, reject) => {
      const data = new Uint8Array([this.slaveAddress, 1]);
      bone.send(0x22, data).then((result) => {
        infoLog(`I2CSlaveDevice.readByte() result value=${result}`);
        const readSize = result[0];
        if (readSize == 1) {
          resolve(result[1]);
        } else {
          reject(`readByte() readSize unmatch : ${readSize}`);
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  readBytes(length) {
    return new Promise((resolve, reject) => {
      if ((typeof length !== 'number') || (length > 127)) {
        reject(`readBytes() readSize error : ${length}`);
      }
      const data = new Uint8Array([this.slaveAddress, length]);
      bone.send(0x22, data).then((result) => {
        infoLog(`I2CSlaveDevice.readBytes() result value=${result}`);
        const readSize = result[0];
        if (readSize == length) {
          const buffer = result;
          buffer.shift(); // readSizeを削除
          resolve(buffer);
        } else {
          reject(`readBytes() readSize unmatch : ${readSize}`);
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  writeByte(value) {
    return new Promise((resolve, reject) => {
      infoLog(`I2CSlaveDevice.writeByte() value=${value}`);
      const size = 1;
      const data = new Uint8Array([this.slaveAddress, size, value]);
      bone.send(0x21, data).then((result) => {
        infoLog(`I2CSlaveDevice.writeByte() result${result}`);
        if (result[0] != size) {
          reject(`I2CSlaveAddress(${this.slaveAddress}).writeByte():error`);
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  },

  writeBytes(buffer) {
    return new Promise((resolve, reject) => {
      if (buffer.length == null) {
        reject(`readBytes() parameter error : ${buffer}`);
      }
      const arr = [this.slaveAddress, buffer.length];
      for (let cnt = 0; cnt < buffer.length; cnt++) {
        arr.push(buffer[cnt]);
      }
      const data = new Uint8Array(arr);
      bone.send(0x21, data).then((result) => {
        infoLog(`I2CSlaveDevice.writeBytes() result value=${result}`);
        if (result[0] == buffer.length) {
          const resbuffer = result;
          resbuffer.shift(); // readSizeを削除
          resolve(resbuffer);
        } else {
          reject(`writeBytes() writeSize unmatch : ${result[0]}`);
        }
      }, (error) => {
        reject(error);
      });
    });
  },

};

export default I2CSlaveDevice;
