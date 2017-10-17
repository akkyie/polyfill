/* eslint-disable */

function router () {}
router.prototype = {
  wss: null,
  send: null,
  queue: null, // function queue
  onevents: null, // onevent queue
  waitQueue: null,
  session: 0,
  init: function (serverURL) {
    infoLog('bone.init()')
    this.waitQueue = new Array()
    this.queue = new Map()
    this.onevents = new Map()
    this.wss = new WebSocket(serverURL)
    this.wss.binaryType = 'arraybuffer'
    this.wss.onopen = () => {
      infoLog('onopen')
      for (var cnt = 0; cnt < this.waitQueue.length; cnt++) {
        if (typeof this.waitQueue[cnt] === 'function') {
          this.waitQueue[cnt](true)
        }
      }
      this.waitQueue = []
    }
    this.wss.onerror = function (error) {
      errLog('ws error: ' + error)
      for (var cnt = 0; cnt < this.waitQueue.length; cnt++) {
        if (typeof this.waitQueue[cnt] === 'function') {
          this.waitQueue[cnt](false)
        }
      }
      this.waitQueue = []
    }
    this.wss.onmessage = (mes) => {
      var buffer = new Uint8Array(mes.data)
      infoLog('on message:' + buffer)
      if (buffer[0] == 1) {
        this.receive(buffer)
      } else if (buffer[0] == 2) {
        this.onEvent(buffer)
      }
    }
  },
  send: function (func, data) {
    return new Promise((resolve, reject) => {
      if (!(data instanceof Uint8Array)) {
        reject('type error: Please using with Uint8Array buffer.')
        return
      }
      var length = data.length + 4
      var buf = new Uint8Array(length)

      buf[0] = 1 // 1: API Request
      buf[1] = (this.session) & 0x00ff // session LSB
      buf[2] = (this.session >> 8) // session MSB
      buf[3] = func

      for (var cnt = 0; cnt < data.length; cnt++) {
        buf[4 + cnt] = data[cnt]
      }
      infoLog('send message:' + buf)
      this.queue.set(this.session, (data) => {
        resolve(data)
      })
      this.wss.send(buf)
      buf = null
      this.session++
      if (this.session > 0xffff) {
        this.session = 0
      }
    })
  },

  receive: function (mes) {
    if (!(mes instanceof Uint8Array)) {
      errLog('type error: Please using with Uint8Array buffer.')
      return
    }
    var session = ((mes[1] & 0x00ff) | (mes[2] << 8))
    var func = this.queue.get(session)
    if (typeof func === 'function') {
      infoLog('result')
      var data = new Array()
      for (var cnt = 0; cnt < (mes.length - 4); cnt++) {
        data.push(mes[4 + cnt])
      }
      func(data)
      this.queue.delete(session)
    } else {
      errLog('func type error: session=' + session + ' func=' + func)
    }
  },

  registerEvent: function (f, port, func) {
    var key = (f << 8) | port
    this.onevents.set(key, func)
  },

  removeEvent: function (f, port) {
    var key = (f << 8) | port
    this.onevents.delete(key)
  },

  onEvent: function (data) {
    if (!(data instanceof Uint8Array)) {
      errLog('type error: Please using with Uint8Array buffer.')
      return
    }

    // [0] Change Callback (2)
    // [1] session id LSB (0)
    // [2] session id MSB (0)
    // [3] function id (0x14)
    // [4] Port Number
    // [5] Value (0:LOW 1:HIGH)
    var key = data[3]
    key = (key << 8) | data[4]

    var func = this.onevents.get(key)
    if (typeof func === 'function') {
      infoLog('onevent')
      func(data)
    }
  },

  waitConnection: function (func) {
    return new Promise((resolve, reject) => {
      this.waitQueue.push((result) => {
        if (result == true) {
          resolve()
        } else {
          reject()
        }
      })
    })
  }
}

export default router;
