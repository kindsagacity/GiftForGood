let crypto = require('crypto');
let fs = require('fs');
let path = require('path');
let View = require('../views/base');

let Constants = require('../util/constant');
let Helper = require('../util/helper');

let BaseController = require('./BaseController');

module.exports = BaseController.extend({
    name: 'ApiController',


});

