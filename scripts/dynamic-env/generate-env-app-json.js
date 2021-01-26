const merge = require('deepmerge'); //eslint-disable-line
const baseAppJson = require('../../app.json');
const override = require('./app.secrets.json');

const merged = merge.all([baseAppJson, override]);
console.log(JSON.stringify(merged, null, 2)); //eslint-disable-line
