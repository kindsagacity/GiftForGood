let View = require('../views/base');
let cheerio = require('cheerio');

let BaseController = require('./BaseController');
let CollectionModel = require('../models/CollectionModel');
let CustomerModel = require('../models/CustomerModel');
let GiftModel = require('../models/GiftModel');
let ProductModel = require('../models/ProductModel');

let Config = require('../config')();
let sgMail = require('@sendgrid/mail');

module.exports = BaseController.extend({
    name: 'ClientController',

    dashboard: async function (req, res, next) {
        const current_client = req.session.user;
        const collections = await CollectionModel.find({ _client: current_client['_id'] }).populate('_products');

        let v = new View(res, 'client/client-dashboard');
        v.render({
            page_title: 'client-dashboard',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res,
            collections: collections
        });
    },

    gifts: async function (req, res, next) {
        const current_client = req.session.user;
        const gifts = await GiftModel.find({ _sender: current_client['_id'], step: 'redeemed' }).populate('_chosen');
        for (let i = 0; i < gifts.length; i++) {
            const product_content = gifts[i]['_chosen']['Body (HTML)'];
            const $ = cheerio.load(product_content);
            gifts[i]['_chosen']['short-desc'] = $('p.short-desc').html();
            gifts[i]['_chosen']['long-desc'] = $('div.long-desc').html();
        }
        let v = new View(res, 'client/client-gifts');
        v.render({
            page_title: 'client-gifts',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res,
            gifts: gifts
        });
    },

    activity: async function (req, res, next) {
        const current_client = req.session.user;
        const gifts = await GiftModel.find({ _sender: current_client['_id'], step: 'redeemed' }).populate('_chosen');
        for (let i = 0; i < gifts.length; i++) {
            const product_content = gifts[i]['_chosen']['Body (HTML)'];
            const $ = cheerio.load(product_content);
            gifts[i]['_chosen']['short-desc'] = $('p.short-desc').html();
            gifts[i]['_chosen']['long-desc'] = $('div.long-desc').html();
        }
        let v = new View(res, 'client/client-activity');
        v.render({
            page_title: 'client-activity',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res,
            gifts: gifts
        });
    },

    users: async function (req, res, next) {
        const current_client = req.session.user;
        const customers = await CustomerModel.find({ _client: current_client['_id'] });

        let v = new View(res, 'client/client-users');
        v.render({
            page_title: 'client-users',
            page_type: 'client-dashboard-page',
            session: req.session,
            i18n: res,
            users: customers
        });
    },
    add_user: async function (req, res, next) {
        try {
            const current_client = req.session.user;
            const { avatar, first_name, last_name, address, job, email, phone } = req.body;
            const new_customer = new CustomerModel({
                _client: current_client['_id'],
                avatar: avatar,
                first_name: first_name,
                last_name: last_name,
                address: address,
                job: job,
                email: email,
                phone: phone
            });
            await new_customer.save();
            return res.send({ status: 'success', data: new_customer });
        } catch (err) {
            console.log(err);
            res.status(400);
            return res.send({
                status: 'failed',
                msg: 'Invalid operation'
            })
        }
    },

    gift_it_forward: async function (req, res, next) {
        const current_client = req.session.user;
        let price = req.query.price;
        const gift_id = req.query.gid;
        const collection_id = req.query.cid || '';
        const offset = 0;
        let count = 20;
        if (!price) {
            price = "25";
        }
        let products = [];

        if (collection_id) {
            const collection = await CollectionModel.findOne({ _id: collection_id }).populate('_products');
            if (collection) {
                products = collection['_products'].slice(0, 20);
            }
        } else {
            const price_limits = {
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

            products = await ProductModel
                .find({ "Variant Price": { $gt: low_price, $lte: high_price }, Title: { $ne: ""}, "Image Src": { $ne: "" } })
                .skip(offset)
                .limit(count)
                .sort({ Title: 1 });
        }
        count = products.length;

        let gift = gift_id ? await GiftModel.findOne({ "_id": gift_id, _sender: current_client['_id'] })
                                            .populate('_products') : null;
                                    // : await GiftModel.findOne({ "step": { $ne: "ordered" }, _sender: current_client['_id'] })
                                    //                 .populate('_products');
        if (!gift) {
            gift = { _id: "", _products: [] };
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
            count: count,
            cid: collection_id
        })
    },
    show_more_products: async function (req, res, next) {
        try {
            let offset = Number(req.body.offset) || 0;
            let count = Number(req.body.count) || 20;
            let price = req.body.price || "25";
            const collection_id = req.body.cid;
            let products = [];

            offset += count;
            if (collection_id) {
                const collection = await CollectionModel.findOne({ _id: collection_id }).populate('_products');
                if (collection) {
                    products = collection['_products'].slice(offset, offset + count);
                }
            } else {
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

                products = await ProductModel
                    .find({ "Variant Price": { $gt: low_price, $lte: high_price }, Title: { $ne: ""}, "Image Src": { $ne: "" } })
                    .skip(offset)
                    .limit(count)
                    .sort({ Title: 1 });
            }

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
            const current_client = req.session.user;
            const product_id = req.body.pid;
            let gift_id = req.body.gid;
            let gift = null;
            if (gift_id && (gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }))) {
                if (gift._products.includes(product_id)) {
                    success = false;
                } else {
                    await gift.updateOne({ $push: { _products: product_id } });
                }
            } else {
                let products = [];
                products.push(product_id);
                gift = await GiftModel.create({ _products: products, step: "created", _sender: current_client['_id'] });
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
    save_collection: async function (req, res, next) {
        try {
            const current_client = req.session.user;
            const collection_name = req.body.title;
            const product_ids = req.body.products;
            const new_collection = new CollectionModel({
                _client: current_client['_id'],
                title: collection_name,
                _products: product_ids,
            });
            await new_collection.save();
            return res.send({ status: 'success' });
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
        const current_client = req.session.user;
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }).populate('_products');
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
            const current_client = req.session.user;
            const gift_id = req.body.gid;
            const { first_name, last_name, company_name, email } = req.body;
            let gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] });
            if (gift) {
                await gift.updateOne({
                    rec_first_name: first_name,
                    rec_last_name: last_name,
                    rec_company_name: company_name,
                    rec_email: email,
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
        const current_client = req.session.user;
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }).populate('_products');
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
    upload_file: async function (req, res, next) {
        let file_name = req.file.filename;
        return res.send({
            status: 'success',
            file_link: Config.SITE_LINK + Config.UPLOAD_PREFIX + file_name
        })
    },
    customize_message: async function (req, res, next) {
        try {
            const current_client = req.session.user;
            const gift_id = req.body.gid;
            const { email_message, email_video, email_logo, email_banner } = req.body;
            let gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] });
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
        const current_client = req.session.user;
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }).populate('_products');

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
            const current_client = req.session.user;
            const gift_id = req.body.gid;
            const gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }).populate('_products');
            if (gift) {
                sgMail.setApiKey(Config.SENDGRID_API_KEY);
                const msg = {
                    to: gift.rec_email,
                    from: Config.SENDGRID_SENDER_EMAIL,
                    subject: 'Gift Email from <' + current_client.email + '>',
                    templateId: 'd-feadacdf21f948e0a784e43c71e596d3',
                    dynamic_template_data: {
                        logo_url: gift.email_logo || '',
                        banner_video_url: (gift.email_banner && gift.email_banner.endsWith('.mp4')) ? gift.email_banner : '',
                        banner_video_thumbnail: (gift.email_banner && gift.email_banner.endsWith('.mp4')) ? 'http://159.65.181.178/resources/images/video-player.gif' : gift.email_banner,
                        email_video_url: gift.email_video ? gift.email_video : '',
                        email_video_thumbnail: gift.email_video ? 'http://159.65.181.178/resources/images/video-player.gif' : '',
                        gift_url: Config.SITE_LINK + 'collections?gid=' + gift_id,
                        message: gift.email_message
                    }
                };
                //
                await sgMail.send(msg);
                await gift.updateOne({ step: 'opened' });
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
        const current_client = req.session.user;
        const gift_id = req.query.gid;
        const gift = await GiftModel.findOne({ _id: gift_id, _sender: current_client['_id'] }).populate('_products');
        if (gift) {
            let v = new View(res, 'client/confirmed-order');
            v.render({
                page_title: 'confirmed-order',
                page_type: 'gift-step-page',
                session: req.session,
                i18n: res,
                gift: gift
            });
        } else {
            res.redirect('/step1');
        }
    },
});
