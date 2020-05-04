let express = require('express');
let router = express.Router();

let CustomerController = require('../controllers/CustomerController');

router.get('/collections', function (req, res, next) {
    CustomerController.collections(req, res, next);
});
router.post('/collections/choose', function (req, res, next) {
    CustomerController.choose_gift(req, res, next);
});

router.get('/product/single', function (req, res, next) {
    CustomerController.single_product(req, res, next);
});

router.get('/product/detail', function (req, res, next) {
    CustomerController.product_detail(req, res, next);
});

router.get('/gift-note', function (req, res, next) {
    CustomerController.gift_note(req, res, next);
});
router.post('/confirm-gift', function (req, res, next) {
    CustomerController.confirm_gift(req, res, next);
});

router.get('/gift-note-thank', function (req, res, next) {
    CustomerController.gift_note_thank(req, res, next);
});
router.post('/add-thank-note', function (req, res, next) {
    CustomerController.add_thank_note(req, res, next);
});

module.exports = router;
