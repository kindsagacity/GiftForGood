let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let moment = require('moment');

let BaseController = require('./BaseController');
let UserModel = require('../models/ClientModel');
let Helper = require('../util/helper');

module.exports = BaseController.extend({
    name: 'CustomerController',

    collections: async function (req, res, next) {
        let v = new View(res, 'user/collections');
        v.render({
            page_title: 'collections',
            page_type: 'collection-page',
            session: req.session,
            i18n: res
        })
    },
    single_product: async function (req, res, next) {
        let v = new View(res, 'user/single-product');
        v.render({
            page_title: 'single-product',
            page_type: 'collection-page',
            session: req.session,
            i18n: res
        })
    },
    product_detail: async function (req, res, next) {
        let v = new View(res, 'user/product-detail');
        v.render({
            page_title: 'product-detail',
            page_type: 'collection-page',
            session: req.session,
            i18n: res
        })
    },
    gift_note: async function (req, res, next) {
        let v = new View(res, 'user/gift-note');
        v.render({
            page_title: 'gift-note',
            page_type: 'collection-page',
            session: req.session,
            i18n: res
        })
    },
    gift_note_thank: async function (req, res, next) {
        let v = new View(res, 'user/gift-note-thank');
        v.render({
            page_title: 'gift-note-thank',
            page_type: 'collection-page',
            session: req.session,
            i18n: res
        })
    },
});
