export default class Router {
  init(serverURL) {
    console.log('bone.init()');
    this.session = 0;
    this.waitQueue = [];
    this.queue = new Map();
    this.onevents = new Map();
    this.wss = new WebSocket(serverURL);
    this.wss.binaryType = 'arraybuffer';
    this.wss.onopen = () => {
      console.log('onopen');
      for (let cnt = 0; cnt < this.waitQueue.length; cnt += 1) {
        if (typeof this.waitQueue[cnt] === 'function') {
          this.waitQueue[cnt](true);
        }
      }
      this.waitQueue = [];
    };
    this.wss.onerror = (error) => {
      console.error(`ws error: ${error}`);
      for (let cnt = 0; cnt < this.waitQueue.length; cnt += 1) {
        if (typeof this.waitQueue[cnt] === 'function') {
          this.waitQueue[cnt](false);
        }
      }
      this.waitQueue = [];
    };
    this.wss.onmessage = (mes) => {
      const buffer = new Uint8Array(mes.data);
      console.log(`on message:${buffer}`);
      if (buffer[0] === 1) {
        this.receive(buffer);
      } else if (buffer[0] === 2) {
        this.onEvent(buffer);
      }
    };
  }

  send(func, data) {
    return new Promise((resolve, reject) => {
      if (!(data instanceof Uint8Array)) {
        reject(new Error('type error: Please using with Uint8Array buffer.'));
        return;
      }
      const length = data.length + 4;
      let buf = new Uint8Array(length);

      buf[0] = 1; // 1: API Request
      buf[1] = (this.session) & 0x00ff; // session LSB
      buf[2] = (this.session >> 8); // session MSB
      buf[3] = func;

      for (let cnt = 0; cnt < data.length; cnt += 1) {
        buf[4 + cnt] = data[cnt];
      }
      console.log(`send message:${buf}`);
      this.queue.set(this.session, (d) => {
        resolve(d);
      });
      this.wss.send(buf);
      buf = null;
      this.session += 1;
      if (this.session > 0xffff) {
        this.session = 0;
      }
    });
  }

  receive(mes) {
    if (!(mes instanceof Uint8Array)) {
      console.error('type error: Please using with Uint8Array buffer.');
      return;
    }
    const session = ((mes[1] & 0x00ff) | (mes[2] << 8));
    const func = this.queue.get(session);
    if (typeof func === 'function') {
      console.log('result');
      const data = [];
      for (let cnt = 0; cnt < (mes.length - 4); cnt += 1) {
        data.push(mes[4 + cnt]);
      }
      func(data);
      this.queue.delete(session);
    } else {
      console.error(`func type error: session=${session} func=${func}`);
    }
  }

  registerEvent(f, port, func) {
    const key = (f << 8) | port;
    this.onevents.set(key, func);
  }

  removeEvent(f, port) {
    const key = (f << 8) | port;
    this.onevents.delete(key);
  }

  onEvent(data) {
    if (!(data instanceof Uint8Array)) {
      console.error('type error: Please using with Uint8Array buffer.');
      return;
    }

    // [0] Change Callback (2)
    // [1] session id LSB (0)
    // [2] session id MSB (0)
    // [3] function id (0x14)
    // [4] Port Number
    // [5] Value (0:LOW 1:HIGH)
    let key = data[3];
    key = (key << 8) | data[4];

    const func = this.onevents.get(key);
    if (typeof func === 'function') {
      console.log('onevent');
      func(data);
    }
  }

  waitConnection() {
    return new Promise((resolve, reject) => {
      this.waitQueue.push((result) => {
        if (result === true) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }
}
