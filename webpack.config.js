const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add custom webpack config for scroll issues
  config.module.rules.push({
    test: /\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }
  });
  
  return config;
};