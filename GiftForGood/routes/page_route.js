let express = require('express');
let router = express.Router();

let MiddlewareController = require('../controllers/MiddlewareController');
let ClientController = require('../controllers/ClientController');
let CustomerController = require('../controllers/CustomerController');

router.get('/', function (req, res, next) {
    ClientController.gift_it_forward(req, res, next);
});

router.get('/step1', function (req, res, next) {
    ClientController.gift_it_forward(req, res, next);
});

router.post('/step1/add-product', function (req, res, next) {
    ClientController.add_product_as_gift(req, res, next);
});
router.post('/step1/show-more', function (req, res, next) {
    ClientController.show_more_products(req, res, next);
});

router.get('/step2', function (req, res, next) {
    ClientController.recipient_information(req, res, next);
});
router.post('/step2/add-information', function (req, res, next) {
    ClientController.add_recipient_information(req, res, next);
});

router.get('/step3', function (req, res, next) {
    ClientController.brand_message(req, res, next);
});
router.post('/step3/customize', function (req, res, next) {
    ClientController.customize_message(req, res, next);
});

router.get('/step4', function (req, res, next) {
    ClientController.confirm_details(req, res, next);
});
router.post('/step4/send', function (req, res, next) {
    ClientController.send_gift(req, res, next);
});

router.get('/confirmed', function (req, res, next) {
    ClientController.confirmed_order(req, res, next);
});

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
