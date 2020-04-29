let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let moment = require('moment');

let BaseController = require('./BaseController');
let InfectedUserModel = require('../models/InfectedUserModel');
let ProgramModel = require('../models/ProgramModel');
let UploadModel = require('../models/UploadModel');
let UserModel = require('../models/UserModel');
let Helper = require('../util/helper');

module.exports = BaseController.extend({
    name: 'UserController',

    account_settings: async function (req, res, next) {
        let user = await UserModel.findOne({id: req.session.user.id});
        let v = new View(res, 'settings/account_settings');
        v.render({
            title: 'MTAssist|Profile',
            session: req.session,
            i18n: res,
            tab_text: 'settings',
            sub_text: 'settings_profile',
            user: user,
        })
    },

    editProfile: async function (req, res, next) {
        let username = req.body.username, email = req.body.email,
            old_password = req.body.old_password, new_password = req.body.new_password;
        let user = await UserModel.findOne({id: req.session.user.id});
        if (user.email !== email) return res.send({status: 'error', message: res.cookie().__('Undefined user')});
        if (!user.verifyPassword(old_password)) return res.send({
            status: 'error',
            message: res.cookie().__('Old password is not correct')
        });
        user.username = username;
        user.password = new_password;
        await user.save();
        req.session.user = user;
        return res.send({status: 'success', message: res.cookie().__('Updated user profile successfully')});
    },

    changeAvatar: async function (req, res, next) {
        let user = await UserModel.findOne({id: req.session.user.id});
        let avatarPath = user.avatar;
        if (req.body.avatarImg.length > 1000) {
            let avatarData = req.body.avatarImg.replace(/^data:image\/\w+;base64,/, "");
            let file_extension = '.png';
            if (avatarData.charAt(0) === '/') file_extension = '.jpg';
            else if (avatarData.charAt(0) === 'R') file_extension = '.gif';
            let public_path = path.resolve('public');
            avatarPath = '/avatars/avatar_' + user.id + file_extension;
            let avatarUploadPath = path.resolve('public') + avatarPath;
            fs.writeFileSync(avatarUploadPath, avatarData, 'base64');
        }
        await user.updateOne({avatar: avatarPath});
        req.session.user.avatar = avatarPath;
        return res.send({
            status: 'success',
            message: res.cookie().__('Changed avatar successfully'),
            avatarPath: avatarPath
        });
    },
    error: function (req, res, next) {
        let v = new View(res, 'partials/error');
        v.render({
            title: 'MTAssist|Error',
            session: req.session,
            i18n: res,
        })
    },

    clientManagement: async function (req, res, next) {
        let user = req.session.user;
        let infectedUsers = await InfectedUserModel.find({});
        for (let i in infectedUsers) {
            infectedUsers[i].formattedCreatedAt = moment(infectedUsers[i].createdAt).format('MMMM DD YYYY, HH:mm:ss.SSS');
            infectedUsers[i].formattedUpdatedAt = moment(infectedUsers[i].updatedAt).format('MMMM DD YYYY, HH:mm:ss.SSS');
        }

        let v = new View(res, 'admin_vs/client_manage');
        v.render({
            title: 'MTAssist|Client Management',
            session: req.session,
            i18n: res,
            tab_text: 'admin_client_management',
            sub_text: '',
            user: user,
            users: infectedUsers,
        })
    },

    editClient: async function (req, res, next) {
        let type = req.body.type;

        if (type === "edit") {
            let id = req.body.id;
            let username = req.body.username;
            let user = await InfectedUserModel.findOne({ id: id });
            if (!user) {
                return res.send({ status: 'error', message: res.cookie().__('Undefined Client') });
            }
            await user.updateOne({ username });
            return res.send({ status: 'success', message: res.cookie().__('Updated user profile successfully') });
        } else if (type === "start" || type === "stop") {
            let id = req.body.id;
            let user = await InfectedUserModel.findOne({ id: id });
            if (!user) {
                return res.send({ status: 'error', message: res.cookie().__('Undefined user') });
            }
            await user.updateOne({ status: type === 'start' ? 0 : 1 });
            return res.send({ status: 'success', message: res.cookie().__('Updated successfully') });
        }
    },
});
