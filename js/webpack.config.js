// Importa a configuração base do Webpack fornecida pelo Flarum.
// Isso já inclui muitas configurações padrão úteis (babel, etc.).
const config = require('flarum-webpack-config')();

// Importa o plugin necessário para extrair o CSS para arquivos separados.
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// --- Ponto de Entrada JavaScript ---
// Define explicitamente qual arquivo JavaScript principal o Webpack deve começar a processar
// para o painel de administração. O caminho é relativo a este arquivo de configuração (webpack.config.js).
config.entry = {
  admin: './src/admin/index.js', // Mapeia a saída 'admin.js' para a entrada './src/admin/index.js'
};

// --- Configuração do Plugin de Extração de CSS ---
// Garante que a propriedade 'plugins' exista como um array no objeto de configuração.
// Se 'flarum-webpack-config' já tiver adicionado plugins, nós adicionaremos aos existentes.
config.plugins = config.plugins || [];

// Adiciona uma nova instância do MiniCssExtractPlugin à lista de plugins.
// Este plugin é responsável por pegar todo o CSS encontrado durante o build
// e salvá-lo em arquivos separados.
config.plugins.push(new MiniCssExtractPlugin({
    // Define o padrão de nome para os arquivos CSS de saída.
    // '[name].css' usará o nome da chave do ponto de entrada ('admin' neste caso),
    // resultando em 'admin.css'.
    filename: '[name].css'
}));

// --- Regra para Processar Arquivos LESS ---
// Adiciona uma regra específica para dizer ao Webpack como lidar com arquivos '.less'.
// As regras são aplicadas aos módulos (arquivos) durante o processo de build.
config.module.rules.push({
  // A expressão regular que define quais arquivos esta regra deve processar.
  // Neste caso, qualquer arquivo que termine com '.less'.
  test: /\.less$/,

  // Os loaders que serão usados para processar os arquivos correspondentes.
  // Os loaders são aplicados na ordem inversa (de baixo para cima ou da direita para a esquerda).
  use: [
    // 1º Loader (aplicado por último no resultado final): MiniCssExtractPlugin.loader
    // Este loader especial pega o CSS processado pelos loaders anteriores
    // e o prepara para ser extraído pelo plugin principal em um arquivo separado.
    // Ele substitui o 'style-loader' que injetaria o CSS no JS.
    MiniCssExtractPlugin.loader,

    // 2º Loader: 'css-loader'
    // Interpreta as diretivas '@import' e 'url()' dentro do CSS como se fossem
    // 'import'/'require()' do JavaScript e resolve seus caminhos.
    'css-loader',

    // 3º Loader (aplicado primeiro no arquivo .less): 'less-loader'
    // Compila o código Less para CSS padrão.
    'less-loader'
  ]
});

// Exporta o objeto de configuração modificado para que o Webpack possa usá-lo.
module.exports = config;
