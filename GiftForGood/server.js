let express = require('express');
let flash = require('connect-flash');
let path = require('path');
let session = require('express-session');
let mongoose = require('mongoose');
let cors = require('cors');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');

let user_route = require('./routes/user_route');
let admin_route = require('./routes/admin_route');
let auth_route = require('./routes/auth_route');
let api_route = require('./routes/api_route');
let dbhelper = require('./util/dbhelper');
let config = require('./config')();

let app = express();

let i18n = require('i18n');
i18n.configure({
    //define how many languages we would support in our application
    locales: ['EN', 'PL'],

    //define the path to language json files, default is /locales
    directory: __dirname + '/locales',

    //define the default language
    defaultLocale: 'EN',

    // define a custom cookie name to parse locale settings from
    cookie: 'i18n'
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(cors());
app.use(session({
    secret: "1234567890",
    cookie: {maxAge: 25200000},
    resave: true,
    saveUninitialized: false
}));

app.use(i18n.init);
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(flash());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db_name,
                                { useNewUrlParser: true }, async function (err, db) {
    await dbhelper.initialize();

    const now = new Date();
    if (err) {
        console.log('[' + now.toLocaleString() + '] ' + 'Sorry, there is no mongo db server running.');
    } else {
        let attachDB = function (req, res, next) {
            req.db = db;
            next();
        };

        app.use('/', attachDB, user_route);
        app.use('/auth', attachDB, auth_route);
        app.use('/admin', attachDB, admin_route);
        app.use('/api', attachDB, api_route);

        /*** Error Routes ***/
        app.get('*', function (req, res, next) {
            res.render("partials/error", {session: req.session});
        });
        app.get('/404', function (req, res, next) {
            res.render("partials/error", {session: req.session});
        });

        app.listen(config.port, function () {
            console.log('[' + now.toLocaleString() + '] ' + 'Server listening ' + config.base_url);
        });
    }
});

