var { Users } = require('../models/users');

var authentication = (req, res, next) => {
    var token = req.header('x-auth');

    Users.findByToken(token).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next()
    }, (e) => {
        res.status(401).send(e)
    })
};

module.exports = { authentication };