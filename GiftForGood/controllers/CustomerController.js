let View = require('../views/base');
let cheerio = require('cheerio');

let BaseController = require('./BaseController');
let GiftModel = require('../models/GiftModel');
let ProductModel = require('../models/ProductModel');
let Helper = require('../util/helper');

module.exports = BaseController.extend({
    name: 'CustomerController',

    collections: async function (req, res, next) {
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id }).populate('_products');

        if (gift) {
            let v = new View(res, 'customer/collections');
            v.render({
                page_title: 'collections',
                page_type: 'customer-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
    },
    choose_gift: async function (req, res, next) {
        try {
            const gift_id = req.body.gid;
            const product_id = req.body.pid;
            let gift = await GiftModel.findOne({ _id: gift_id });
            if (gift) {
                await gift.updateOne({ _chosen: product_id });
                return res.send({
                    status: 'success'
                })
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Invalid gift id'
                })
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation'
            })
        }
    },

    single_product: async function (req, res, next) {
        const gift_id = req.query.gid;
        let gift = await GiftModel.findOne({ _id: gift_id }).populate('_chosen');
        if (gift && gift['_chosen']) {
            const product_content = gift['_chosen']['Body (HTML)'];
            const $ = cheerio.load(product_content);
            gift['_chosen']['short-desc'] = $('p.short-desc').html();
            gift['_chosen']['long-desc'] = $('div.long-desc').html();
            let v = new View(res, 'customer/single-product');
            v.render({
                page_title: 'single-product',
                page_type: 'customer-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
    },

    product_detail: async function (req, res, next) {
        const gift_id = req.query.gid;
        let gift = await GiftModel.findOne({ _id: gift_id }).populate('_chosen');
        if (gift && gift['_chosen']) {
            const product_content = gift['_chosen']['Body (HTML)'];
            const $ = cheerio.load(product_content);
            gift['_chosen']['short-desc'] = $('p.short-desc').html();
            gift['_chosen']['long-desc'] = $('div.long-desc').html();
            let v = new View(res, 'customer/product-detail');
            v.render({
                page_title: 'product-detail',
                page_type: 'customer-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
    },

    gift_note: async function (req, res, next) {
        let gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id }).populate('_chosen');
        if (gift) {
            let v = new View(res, 'customer/gift-note');
            v.render({
                page_title: 'gift-note',
                page_type: 'customer-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
    },
    confirm_gift: async function (req, res, next) {
        try {
            let gift_id = req.body.gid;
            const { first_name, last_name, address, apartment, city, state, zip_code, email, phone } = req.body;
            let gift = await GiftModel.findOne({ _id: gift_id });
            if (gift) {
                await gift.updateOne({
                    rec_first_name: first_name,
                    rec_last_name: last_name,
                    rec_address: address,
                    rec_apartment: apartment,
                    rec_city: city,
                    rec_state: state,
                    rec_zip_code: zip_code,
                    rec_email: email,
                    rec_phone: phone
                });
                return res.send({
                    status: 'success'
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Invalid gift id'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation'
            });
        }
    },

    gift_note_thank: async function (req, res, next) {
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id });
        if (gift) {
            let v = new View(res, 'customer/gift-note-thank');
            v.render({
                page_title: 'gift-note-thank',
                page_type: 'customer-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
    },
    add_thank_note: async function (req, res, next) {
        try {
            const gift_id = req.body.gid;
            const thank_note = req.body.thank_note;
            let gift = await GiftModel.findOne({ _id: gift_id });
            if (gift) {
                await gift.updateOne({ thank_note: thank_note });
                return res.send({
                    status: 'success'
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Invalid gift id'
                });
            }
        } catch (err) {
            console.log(err);
            res.status(400);
            res.send({
               status: 'failed',
               msg: 'Invalid operation'
            });
        }
    }
});
