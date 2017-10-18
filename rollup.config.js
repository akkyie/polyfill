import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/polyfill.js',
  output: {
    file: 'build/polyfill.js',
    format: 'iife',
  },
  name: 'polyfill',
  plugins: [
    resolve({
      jsnext: true,
      browser: true,
      preferBuiltins: false,
      modulesOnly: true,
    }),
  ],
};
