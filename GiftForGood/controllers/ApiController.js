var cheerio = require('cheerio');
let crypto = require('crypto');
let fs = require('fs');
let path = require('path');
let View = require('../views/base');

let Constants = require('../util/constant');
let Helper = require('../util/helper');

let BaseController = require('./BaseController');

let InfectedUserModel = require('../models/InfectedUserModel');
let ProgramModel = require('../models/ProgramModel');
let UploadModel = require('../models/UploadModel');

module.exports = BaseController.extend({
    name: 'ApiController',


});

