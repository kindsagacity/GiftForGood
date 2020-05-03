let express = require('express');
let fs = require('fs');
let helper = require('../util/helper');
let router = express.Router();
let multer = require('multer');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/temp');
    },
    filename: function (req, file, cb) {
        let filename = file.originalname + '_' + helper.genRandom(8);
        cb(null, filename);
    }
});

let upload = multer({ storage: storage });

let MiddlewareController = require('../controllers/MiddlewareController');
let ApiController = require('../controllers/ApiController');

module.exports = router;
