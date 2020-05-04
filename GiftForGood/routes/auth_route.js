let express = require('express');
let router = express.Router();

let AuthController = require('../controllers/AuthController');

router.get('/login', function (req, res, next) {
    AuthController.login(req, res, next);
});
router.post('/login', function (req, res, next) {
    AuthController.postLogin(req, res, next);
});

router.get('/register', function (req, res, next) {
    AuthController.register(req, res, next);
});
router.post('/register', function (req, res, next) {
    AuthController.postRegister(req, res, next);
});

router.get('/verification-email', function (req, res, next) {
    AuthController.verify_email(req, res, next);
});
router.post('/verification-email', function (req, res, next) {
    AuthController.postVerifyEmail(req, res, next);
});

router.get('/reset-password', function (req, res, next) {
    AuthController.resetPassword(req, res, next);
});
router.get('/forgot-password', function (req, res, next) {
    AuthController.forgotPassword(req, res, next);
});
router.post('/forgot-password', function (req, res, next) {
    AuthController.postForgotPassword(req, res, next);
});
router.post('/reset-password', function (req, res, next) {
    AuthController.postResetPassword(req, res, next);
});

router.get('/logout', function (req, res, next) {
    AuthController.logout(req, res, next);
});
router.post('/logout', function (req, res, next) {
    AuthController.postLogout(req, res, next);
});

module.exports = router;
