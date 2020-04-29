let express = require('express');
let router = express.Router();

let MiddlewareController = require('../controllers/MiddlewareController');
let AdminController = require('../controllers/AdminController');

router.get('/account-settings', MiddlewareController.m_checkLogin,
  function (req, res, next) {
    AdminController.account_settings(req, res, next);
});
router.post('/account-settings/edit-profile', MiddlewareController.m_checkLoginPost,
  function (req, res, next) {
    AdminController.editProfile(req, res, next);
});
router.post('/account-settings/change-avatar', MiddlewareController.m_checkLoginPost,
  function (req, res, next) {
    AdminController.changeAvatar(req, res, next);
});

router.get('/client-management', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin,
  function (req, res, next) {
    AdminController.clientManagement(req, res, next);
});

router.post('/editClient', MiddlewareController.m_checkLoginPost, MiddlewareController.m_checkAdminPost,
  function (req, res, next) {
    AdminController.editClient(req, res, next);
});

router.get('/program-management', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin,
  function (req, res, next) {
      AdminController.programManagement(req, res, next);
});

router.post('/upload-program', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin,
  function (req, res, next) {
    AdminController.uploadProgram(req, res, next);
  });

router.get('/upload-management', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin,
  function (req, res, next) {
      AdminController.uploadManagement(req, res, next);
  });

router.post('/upload-delete', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin,
  function (req, res, next) {
    AdminController.uploadDelete(req, res, next);
  });

module.exports = router;
