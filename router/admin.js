var express = require('express');
var router = express.Router();
var cfg = require('../config/config');
var jwt = require('jwt-simple');

var pool = null;

router.get('/', (req, res, next) => {
    res.render("layuimini/index.html", {});
});

router.get('/dashboard', (req, res, next) => {
    res.render("layuimini/page/welcome-1.html", {});
});

module.exports = (pool) => {
    pool = pool;
    return router;
};