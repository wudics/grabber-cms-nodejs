var express = require('express');
var router = express.Router();
var cfg = require('../config/config');
var jwt = require('jwt-simple');

var pool = null;

router.get('/', (req, res, next) => {
    res.render("blog/list_article.html", {cat: cfg.categories, catid: 0});
});

router.get('/cat/:catid', (req, res, next) => {
    res.render("blog/list_article.html", {cat: cfg.categories, catid: req.params.catid});
});

module.exports = (pool) => {
    pool = pool;
    return router;
};