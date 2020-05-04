
let fs = require('fs');

let BaseController = require('./BaseController');
let Constants = require('../util/constant');
let helper = require('../util/helper');

module.exports = {
    name: 'MiddlewareController',

    doCheckLogin: function (req, res, next) {
        if (req.session.login === 1 && req.session.user) next();
        else {
            req.session.login = 0;
            req.session.user = null;
            res.redirect('/login?redirect=' + req.url);
        }
    },
    doCheckLoginPost: function (req, res, next) {
        if (req.session.login === 1 && req.session.user) next();
        else {
            req.session.login = 0;
            req.session.user = null;
            res.status(400);
            res.send({status: 'failed', message: res.cookie().__('You are not logged in')});
        }
    }
};


