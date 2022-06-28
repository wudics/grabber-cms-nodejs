var path = require('path');
// var fs = require('fs');
// var privateKey  = fs.readFileSync(path.join(__dirname, 'private.pem'), 'utf8');
// var certificate = fs.readFileSync(path.join(__dirname, 'ca.crt'), 'utf8');
// var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();
// var httpsServer = require('https').Server(credentials, app);
var httpServer = require('http').Server(app);
var bodyParser = require('body-parser');
var mysql = require('mysql');
var ejs = require('ejs');
var cfg = require('./config/config');
var cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('views', 'template');       // 设置视图目录
app.set('view engine', 'html');     // 设置视图引擎
app.engine('html', ejs.__express);  // 绑定视图引擎

var pool = mysql.createPool(cfg.mysql);

// 设置全局变量
app.locals.cfg = cfg;

var homeRouter = require('./router/home');
app.use('/', homeRouter(pool));

var homeRouter = require('./router/admin');
app.use('/admin', homeRouter(pool));

httpServer.listen(cfg.httpPort, function () {
    console.log(`Listening on ${httpServer.address().port}`);
});

// httpsServer.listen(cfg.httpsPort, function () {
//     console.log(`Listening on ${httpsServer.address().port}`);
// });

