let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let moment = require('moment');

let BaseController = require('./BaseController');
let GiftModel = require('../models/GiftModel');
let ProductModel = require('../models/ProductModel');
let UserModel = require('../models/ClientModel');
let Helper = require('../util/helper');

module.exports = BaseController.extend({
    name: 'ClientController',

    dashboard: async function (req, res, next) {
        let v = new View(res, 'client/client-dashboard');
        v.render({
            page_title: 'client-dashboard',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res
        });
    },

    gifts: async function (req, res, next) {
        let v = new View(res, 'client/client-gifts');
        v.render({
            page_title: 'client-gifts',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res
        });
    },

    activity: async function (req, res, next) {
        let v = new View(res, 'client/client-activity');
        v.render({
            page_title: 'client-activity',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res
        });
    },

    users: async function (req, res, next) {
        let v = new View(res, 'client/client-users');
        v.render({
            page_title: 'client-users',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res
        });
    },

    gift_it_forward: async function (req, res, next) {
        let price = req.query.price;
        const gift_id = req.query.gid;
        const offset = 0;
        const count = 20;
        if (!price) {
            price = "25";
        }
        let price_limits = {
            "25": { 'low': 0, 'high': 25 },
            "50": { 'low': 25, 'high': 50 },
            "75": { 'low': 50, 'high': 75 },
            "100": { 'low': 75, 'high': 100 },
            "150": { 'low': 100, 'high': 150 },
            "200": { 'low': 150, 'high': 200 },
            "1000": { 'low': 200, 'high': 1000 },
        };
        let low_price = 0;
        let high_price = 25;
        if (price_limits.hasOwnProperty(price)) {
            low_price = Number(price_limits[price]['low']);
            high_price = Number(price_limits[price]['high']);
        }

        const products = await ProductModel
          .find({ "Variant Price": { $gt: low_price, $lte: high_price }, Title: { $ne: ""}, "Image Src": { $ne: "" } })
          .skip(offset)
          .limit(count)
          .sort({ Title: 1 });

        let gift = { _id: "", products: [] };
        const gift_record = gift_id ? await GiftModel.findOne({ "_id": gift_id })
                                            .populate('_products')
                                    : await GiftModel.findOne({ "step": { $ne: "ordered" } })
                                                    .populate('_products');
        if (gift_record) {
            gift._id = gift_record['_id'];
            for (let i = 0; i < gift_record._products.length; i++) {
                const product = gift_record._products[i];
                gift.products.push({ "_id": product['_id'], Title: product['Title'], "Image Src": product['Image Src'] });
            }
        }

        let v = new View(res, 'client/gift-it-forward');
        v.render({
            page_title: 'gift-it-forward',
            page_type: 'gift-step-page',
            session: req.session,
            i18n: res,
            limit_price: price,
            gift: gift,
            products: products,
            offset: offset,
            count: count
        })
    },
    show_more_products: async function (req, res, next) {
        try {
            let offset = Number(req.body.offset) || 0;
            let count = Number(req.body.count) || 20;
            offset += count;
            let price = req.query.price || "25";
            let price_limits = {
                "25": { 'low': 0, 'high': 25 },
                "50": { 'low': 25, 'high': 50 },
                "75": { 'low': 50, 'high': 75 },
                "100": { 'low': 75, 'high': 100 },
                "150": { 'low': 100, 'high': 150 },
                "200": { 'low': 150, 'high': 200 },
                "1000": { 'low': 200, 'high': 1000 },
            };
            let low_price = 0;
            let high_price = 25;
            if (price_limits.hasOwnProperty(price)) {
                low_price = Number(price_limits[price]['low']);
                high_price = Number(price_limits[price]['high']);
            }

            const products = await ProductModel
              .find({ "Variant Price": { $gt: low_price, $lte: high_price }, Title: { $ne: ""}, "Image Src": { $ne: "" } })
              .skip(offset)
              .limit(count)
              .sort({ Title: 1 });

            count = products.length;
            return res.send({ status: "success", products, offset, count });
        } catch (err) {
            console.log(err);
            return res.send({ status: "failed", products: [] });
        }
    },
    add_product_as_gift: async function (req, res, next) {
        try {
            let success = true;
            const product_id = req.body.pid;
            let gift_id = req.body.gid;
            let gift = null;
            if (gift_id && (gift = await GiftModel.findOne({ _id: gift_id }))) {
                if (gift._products.includes(product_id)) {
                    success = false;
                } else {
                    await gift.updateOne({ $push: { _products: product_id } });
                }
            } else {
                let products = [];
                products.push(product_id);
                gift = await GiftModel.create({ _products: products, step: "step1" });
            }
            gift_id = gift['_id'];

            if (success) {
                return res.send({
                    status: 'success',
                    gift_id: gift_id
                });
            } else {
                res.status(400);
                return res.send({
                    status: 'failed',
                    msg: 'Product already exist'
                })
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

    recipient_information: async function (req, res, next) {
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id });
        // If gift with given id exists
        if (gift) {
            let v = new View(res, 'client/recipient-information');
            v.render({
                page_title: 'recipient-information',
                page_type: 'gift-step-page',
                session: req.session,
                i18n: res,
                gift: gift
            })
        }
        // If gift not exist
        else {
            res.redirect('/step1');
        }
    },
    add_recipient_information: async function (req, res, next) {
        try {
            const gift_id = req.body.gid;
            const { first_name, last_name, company_name, email } = req.body;
            let gift = await GiftModel.findOne({ _id: gift_id });
            if (gift) {
                await gift.updateOne({
                    rec_first_name: first_name,
                    rec_last_name: last_name,
                    rec_company_name: company_name,
                    rec_email: email,
                    step: 'step2'
                });
                return res.send({ status: 'success' });
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

    brand_message: async function (req, res, next) {
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id });
        // If gift with given id exists
        if (gift) {
            let v = new View(res, 'client/brand-message');
            v.render({
                page_title: 'brand-message',
                page_type: 'gift-step-page',
                session: req.session,
                i18n: res,
                gift: gift
            })
        }
        // If gift not exist
        else {
            res.redirect('/step1');
        }
    },
    customize_message: async function (req, res, next) {
        try {
            const gift_id = req.body.gid;
            const { email_message, email_video, email_logo, email_banner } = req.body;
            let gift = await GiftModel.findOne({ _id: gift_id });
            if (gift) {
                await gift.updateOne({ email_message, email_video, email_logo, email_banner });
                res.send({
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
                message: 'Invalid operation'
            })
        }
    },

    confirm_details: async function (req, res, next) {
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id }).populate('_products');

        // If gift with given id exists
        if (gift) {
            let v = new View(res, 'client/confirm-details');
            v.render({
                page_title: 'confirm-details',
                page_type: 'gift-step-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        }
        // If gift not exist
        else {
            res.redirect('/step1');
        }
    },
    send_gift: async function (req, res, next) {
        try {
            const gift_id = req.body.gid;
            const gift = await GiftModel.findOne({ _id: gift_id }).populate('_products');
            if (gift) {
                await gift.updateOne({ step: 'ordered' });
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
            return res.send({
                status: 'failed',
                msg: 'Invalid operation'
            });
        }
    },

    confirmed_order: async function (req, res, next) {
        let v = new View(res, 'client/confirmed-order');
        v.render({
            page_title: 'confirmed-order',
            page_type: 'gift-step-page',
            session: req.session,
            i18n: res
        })
    },
});
