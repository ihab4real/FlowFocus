/** @type {import('@babel/core').ConfigFunction} */
export default {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }], // Use automatic runtime
  ],
};