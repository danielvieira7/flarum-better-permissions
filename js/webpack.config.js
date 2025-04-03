const config = require('flarum-webpack-config')();

// --- ADICIONE ESTA PARTE ---
// Define explicitamente onde encontrar o ponto de entrada principal
// O caminho é relativo ao webpack.config.js (que está na pasta js)
config.entry = {
  admin: './src/admin/index.js', // Mapeia a saída 'admin.js' para a entrada './src/admin/index.js'
};
// --- FIM DA PARTE ADICIONADA ---


// Mantenha a configuração do Less que já tínhamos:
config.module.rules.push({
  test: /\.less$/,
  use: [
    { loader: 'style-loader' }, // Ou MiniCssExtractPlugin.loader para produção
    { loader: 'css-loader' },
    { loader: 'less-loader' }
  ]
});

module.exports = config;
