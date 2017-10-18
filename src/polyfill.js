// Version 2017.09.27

import Router from './router';
import { GPIOAccess } from './gpio';

export default function polyfill(serverURL) {
  const router = new Router(serverURL);

  if (!navigator.requestGPIOAccess) {
    navigator.requestGPIOAccess = () => new Promise(((resolve) => {
      router.waitConnection().then(() => {
        const gpioAccess = new GPIOAccess(router);
        console.log('gpioAccess.resolve');
        resolve(gpioAccess);
      });
    }));
  }
}
