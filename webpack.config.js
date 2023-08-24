const path = require('path');

module.exports = {
    entry: '/js/admin.js',
    output: {
        filename: 'admin.js',
        path: path.resolve(__dirname, 'examples/js'),
        libraryTarget: 'module',
    },    
    experiments: {'outputModule': true},
    mode: 'development',
};
