let View = require('../views/base');
let crypto = require('crypto');
let config = require('../config/index')();
let nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    host: config.mail_info.host,
    port: 587,
    secure: false,
    auth: {
        user: config.mail_info.user,
        pass: config.mail_info.password
    }
});

let ejs = require('ejs');
let jwt = require('jsonwebtoken');

let BaseController = require('./BaseController');
let ClientModel = require('../models/ClientModel');

module.exports = BaseController.extend({
    name: 'AuthController',
    login: async function (req, res, next) {
        const redirect_url = req.query.redirect || '/';
        if (req.session.login === 1) return res.redirect(redirect_url);
        let v = new View(res, 'client/client-login');
        v.render({
            page_title: 'client-login',
            page_type: 'client-auth-page',
            session: req.session,
            i18n: res,
            redirect: redirect_url
        });
    },

    register: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let v = new View(res, 'client/client-register');
        v.render({
            page_title: 'client-register',
            page_type: 'client-auth-page',
            session: req.session,
            i18n: res
        });
    },

    forgotPassword: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let v = new View(res, 'auth/forgot_password');
        v.render({
            title: 'MTAssist | Forgot password',
            session: req.session,
            i18n: res,
        })
    },

    resetPassword: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let token = req.query.token;
        if (!token) return res.redirect('/404');
        let user = await ClientModel.findOne({reset_token: token});
        if (!user) return res.redirect('/404');
        req.session.user = user;
        let v = new View(res, 'auth/reset_password');
        v.render({
            title: 'MTAssist | Forgot password',
            session: req.session,
            i18n: res,
        })
    },

    logout: async function (req, res, next) {
        req.session.login = 0;
        req.session.user = null;
        req.session.save();
        return res.redirect('/login');
    },

    postLogout: async function (req, res, next) {
        req.session.login = 0;
        req.session.user = null;
        req.session.save();
        return res.send({
            status: 'success',
            msg: res.cookie().__('Logout Success')
        });
    },

    postLogin: async function (req, res, next) {
        let email = req.body.email;
        let password = req.body.password;
        if (email === '' || password === '' || email.indexOf('@') <= 0) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Login information is not valid')
            });
        }
        let user = await ClientModel.findOne({ email: email });
        if (!user) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Unknown user')
            });
        }
        if (user.email_verify_flag !== 2) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Verify your email')
            });
        }
        if (!user.verifyPassword(password)) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Password is not correct')
            });
        }

        await user.updateOne({ last_signin_at: new Date() });
        req.session.user = user;
        req.session.login = 1;
        let token = jwt.sign({ login_email: email }, config.jwt_secret, { expiresIn: '240h' });
        return res.send({
            status: 'success',
            msg: res.cookie().__('Login success'),
            token: token
        });
    },

    postRegister: async function (req, res, next) {
        const { first_name, last_name, email, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Register fields are not valid')
            });
        }

        let check_user = await ClientModel.findOne({email: email});
        if (check_user) {
            res.status(400);
            return res.send({
                status: 'failed',
                msg: res.cookie().__('Email is registered already')
            });
        }

        let email_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'email';
        let email_verify_token = crypto.createHash('md5').update(email_token_str).digest('hex');
        let new_user = new ClientModel({
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: password,
            // email_verify_flag: 1,
            email_verify_flag: 2,
            email_verify_token: email_verify_token,
            phone_verify_flag: 1,
            avatar: '/resources/images/users/default.png',
            role: 1,
        });

        const user = await new_user.save();
        req.session.user = user;
        req.session.login = 1;
        const token = jwt.sign({ login_email: email }, config.jwt_secret, { expiresIn: '240h' });
        return res.send({
            status: 'success',
            msg: res.cookie().__('Register success'),
            token: token
        });

        // let verify_email_link = config.base_url + "/verification-email?token=" + email_verify_token;
        // let template = 'views/templates/verify_email.ejs';
        // let templateData = {
        //     verify_email_link: verify_email_link,
        //     base_url: config.base_url,
        //     i18n: res,
        // };
        //
        // ejs.renderFile(template, templateData, (err, html) => {
        //     if (err) {
        //         console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
        //         return res.send({status: 'fail', message: res.cookie().__('html rendering failed')});
        //     }
        //
        //     let mailOpts = {
        //         from: 'MTAssist Manager',
        //         to: register_email,
        //         subject: 'Notification center',
        //         html: html
        //     };
        //     transporter.sendMail(mailOpts, async (err, info) => {
        //         if (err) {
        //             console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
        //             return res.send({status: 'fail', message: res.cookie().__('Email sending failed')});
        //         }
        //         console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
        //         return res.send({
        //             status: 'success',
        //             message: res.cookie().__('Registered successfully. Please check your email verification')
        //         });
        //     });
        // });
    },

    postForgotPassword: async function (req, res, next) {
        let forgot_email = req.body.forgot_email;
        let user = await ClientModel.findOne({email: forgot_email});
        if (!user) return res.send({status: 'error', message: res.cookie().__('Unknown user')});
        let forgot_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'forgot';
        let forgot_token = crypto.createHash('md5').update(forgot_token_str).digest('hex');

        let verify_email_link = config.base_url + "/secret/reset-password?token=" + forgot_token;
        let template = 'views/templates/reset_password.ejs';
        let templateData = {
            reset_password_link: verify_email_link,
            base_url: config.base_url,
            i18n: res,
        };
        ejs.renderFile(template, templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
                return res.send({status: 'fail', message: res.cookie().__('html rendering failed')});
            }
            let mailOpts = {
                from: 'MTAssist Manager',
                to: forgot_email,
                subject: 'Notification center',
                html: html
            };
            transporter.sendMail(mailOpts, async (err, info) => {
                if (err) {
                    console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    return res.send({status: 'error', msg: 'Failed sending message to your email'});
                }
                console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                await user.updateOne({reset_flag: 1, reset_token: forgot_token});
                return res.send({status: 'success', msg: res.cookie().__('Please check your email')});
            });
        });
    },

    postResetPassword: async function (req, res, next) {
        if (!req.session.user) return res.send({status: 'error', msg: res.cookie().__('Unknown user')});
        let user = await ClientModel.findOne({id: req.session.user.id});
        if (!user) return res.send({status: 'error', msg: res.cookie().__('Unknown user')});
        user.password = req.body.new_password;
        await user.save();
        return res.send({status: 'success', msg: res.cookie().__('Updated password successfully')});
    },

    verify_email: async function (req, res, next) {
        let token = req.query.token;
        if (!token) {
            let v = new View(res, 'auth/email_verify');
            v.render({
                title: 'MTAssist | Email Verify',
                session: req.session,
                i18n: res,
            })
        } else {
            let user = await ClientModel.findOne({email_verify_token: token});
            if (!user) return res.redirect('/404');
            await user.updateOne({email_verify_flag: 2, email_verify_token: ''});
            return res.redirect('/');
        }

    },

    postVerifyEmail: async function (req, res, next) {
        let verify_email = req.body.verify_email;
        let user = await ClientModel.findOne({email: verify_email});
        if (!user) return res.send({status: 'error', msg: res.cookie().__('Unknown user')});
        let email_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'email';
        let email_verify_token = crypto.createHash('md5').update(email_token_str).digest('hex');

        let verify_email_link = config.base_url + "/secret/verification-email?token=" + email_verify_token;
        let template = 'views/templates/verify_email.ejs';
        let templateData = {
            verify_email_link: verify_email_link,
            base_url: config.base_url,
            i18n: res,
        };
        ejs.renderFile(template, templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
                return res.send({status: 'fail', msg: res.cookie().__('html rendering failed')});
            }
            let mailOpts = {
                from: 'MTAssist Manager',
                to: verify_email,
                subject: 'Notification center',
                html: html
            };
            transporter.sendMail(mailOpts, async (err, info) => {
                if (err) {
                    console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    return res.send({status: 'fail', msg: res.cookie().__('Email sending failed')});
                }
                console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                await user.updateOne({email_verify_flag: 1, email_verify_token: email_verify_token});
                return res.send({status: 'success', msg: res.cookie().__('Please check your email verification')});
            });
        });
    }
});
