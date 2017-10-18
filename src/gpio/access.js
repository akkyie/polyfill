// GPIOAccess

import GPIOPort from './port';

// Raspberry Pi GPIO Port Number
// TODO: add portName and pinName
const gpioPorts = [4, 17, 27, 22, 23, 24, 25, 5, 6, 12, 13, 19, 16, 26, 20, 21];

export default class GPIOAccess {
  constructor(router) {
    this.ports = new Map();
    for (let cnt = 0; cnt < gpioPorts.length; cnt += 1) {
      this.ports.set(gpioPorts[cnt], new GPIOPort(router, gpioPorts[cnt]));
    }
  }
}
