let config = {
    mode: 'local',
    port: 3000,
    cron_port: 3001,
    base_url: 'http://127.0.0.1:3000',
    mongo: {
        host: '127.0.0.1',
        port: 27017,
        db_name: 'giftdb'
    },
    dev_info: {
        name: 'Developer',
        email: 'dev@dev.com',
        password: 'dev'
    },
    admin_info: {
        name: 'Administrator',
        email: 'admin@admin.com',
        password: 'admin'
    },
    user_info: {
        name: 'User',
        email: 'user@user.com',
        password: 'user'
    },
    mail_info: {
        host: 'smtp.gmail.com',
        user: 'bluedragon@gmail.com',
        password: 'password',
    },
    jwt_secret: '1234567890qwertyuiop',
};

module.exports = function () {
    return config;
};
