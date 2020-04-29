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

router.post('/process_list', MiddlewareController.parseBody,
                                ApiController.updateProcessList, ApiController.genNextCommand);

router.post('/upload_file', MiddlewareController.parseBody, MiddlewareController.checkFolders,
                                upload.single('mc'), ApiController.uploadFile, ApiController.genNextCommand);

router.post('/invalid_module', MiddlewareController.parseBody,
                                ApiController.invalidModule, ApiController.genNextCommand);

router.post('/dependency_check', MiddlewareController.parseBody,
                                ApiController.dependencyCheck, ApiController.genNextCommand);

module.exports = router;
