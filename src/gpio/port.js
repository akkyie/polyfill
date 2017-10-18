export default class GPIOPort {
  constructor(router, portNumber) {
    this.router = router;
    this.portNumber = portNumber;
    this.portName = '';
    this.pinName = '';
    this.direction = '';
    this.exported = false;
    this.value = null;
    this.onchange = null;
  }

  export(direction) {
    return new Promise((resolve, reject) => {
      let dir = -1;
      if (direction === 'out') {
        dir = 0;
        this.router.removeEvent(0x14, this.portNumber);
      } else if (direction === 'in') {
        dir = 1;
        this.router.registerEvent(0x14, this.portNumber, (buf) => {
          if (typeof this.onchange === 'function') {
            console.log('onchange');
            this.onchange(buf[5]);
          }
        });
      } else {
        reject(new Error(`export:direction not valid! [${direction}]`));
      }
      console.log(`export: Port:${this.portNumber} direction=${direction}`);
      const data = new Uint8Array([this.portNumber, dir]);
      this.router.send(0x10, data).then((result) => {
        if (result[0] === 0) {
          reject(new Error(`GPIOPort(${this.portNumber}).export() error`));
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  }

  read() {
    return new Promise((resolve, reject) => {
      console.log(`read: Port:${this.portNumber}`);
      const data = new Uint8Array([this.portNumber]);
      this.router.send(0x12, data).then((result) => {
        if (result[0] === 0) {
          reject(new Error(`GPIOPort(${this.portNumber}).read() error`));
        } else {
          resolve(result[1]);
        }
      }, (error) => {
        reject(error);
      });
    });
  }

  write(value) {
    return new Promise((resolve, reject) => {
      console.log(`write: Port:${this.portNumber} value=${value}`);
      const data = new Uint8Array([this.portNumber, value]);
      this.router.send(0x11, data).then((result) => {
        if (result[0] === 0) {
          reject(new Error(`GPIOPort(${this.portNumber}).write() error`));
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  }

  unexport(value) {
    return new Promise((resolve, reject) => {
      console.log(`unexport: Port:${this.portNumber}`);
      const data = new Uint8Array([this.portNumber, value]);
      this.router.send(0x13, data).then((result) => {
        if (result[0] === 0) {
          reject(new Error(`GPIOPort(${this.portNumber}).unexport() error`));
        } else {
          resolve();
        }
      }, (error) => {
        reject(error);
      });
    });
  }
}
