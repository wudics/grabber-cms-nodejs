var express = require('express');
var router = express.Router();
var cfg = require('../config/config');
var jwt = require('jwt-simple');
var cheerio = require('cheerio');

var pool = null;

router.get('/', async (req, res, next) => {

    let rows = await getArchives(20);
    // console.log(rows);
    for (let k in rows) {

        let $ = cheerio.load(rows[k].content, null, false);
        rows[k].content = $.text().substring(0, 120);
        rows[k].images = JSON.parse(rows[k].images);
        if (rows[k].images.length > 0) {
            rows[k].picurl = rows[k].images[0].src;
        } else {
            rows[k].picurl = "/blog/images/ico_sys_tag.png";
        }
        let pubdate = new Date(rows[k].pubdate);
        rows[k].pubdate = dateFormat("YYYY-mm-dd HH:MM", pubdate);
        rows[k].click = Math.round(Math.random() * 10000);
    }

    let rows_left_1 = await getRandArchives(10, 1);
    for (let k in rows_left_1) {
        rows_left_1[k].title = rows_left_1[k].title.substring(0, 60);
    }

    let rows_left_2 = await getRandArchives(10, 2);
    for (let k in rows_left_2) {
        rows_left_2[k].title = rows_left_2[k].title.substring(0, 60);
    }

    let rows_left_3 = await getRandArchives(10, 3);
    for (let k in rows_left_3) {
        rows_left_3[k].title = rows_left_3[k].title.substring(0, 60);
    }

    res.render("blog/list_article.html", {
        cat: cfg.categories,        // 导航分类列表
        catid: 0,                   // 当前导航选中状态
        title: "菜鸟集中营",
        keywords: "",
        description: "",
        archives: rows,
        archives_left_1: rows_left_1,
        archives_left_2: rows_left_2,
        archives_left_3: rows_left_3,
    });
});

router.get('/cat/:catid', async (req, res, next) => {

    let rows = await getArchives(20, req.params.catid);
    // console.log(rows);
    for (let k in rows) {

        let $ = cheerio.load(rows[k].content, null, false);
        rows[k].content = $.text().substring(0, 120);
        rows[k].images = JSON.parse(rows[k].images);
        if (rows[k].images.length > 0) {
            rows[k].picurl = rows[k].images[0].src;
        } else {
            rows[k].picurl = "/blog/images/ico_sys_tag.png";
        }
        let pubdate = new Date(rows[k].pubdate);
        rows[k].pubdate = dateFormat("YYYY-mm-dd HH:MM", pubdate);
        rows[k].click = Math.round(Math.random() * 10000);
    }

    let rows_left_1 = await getRandArchives(10, 1);
    for (let k in rows_left_1) {
        rows_left_1[k].title = rows_left_1[k].title.substring(0, 60);
    }

    let rows_left_2 = await getRandArchives(10, 2);
    for (let k in rows_left_2) {
        rows_left_2[k].title = rows_left_2[k].title.substring(0, 60);
    }

    let rows_left_3 = await getRandArchives(10, 3);
    for (let k in rows_left_3) {
        rows_left_3[k].title = rows_left_3[k].title.substring(0, 60);
    }




    var title = "菜鸟集中营";
    var keywords = "";
    var description = "";
    
    for (var k in cfg.categories) {
        if (cfg.categories[k].id == req.params.catid) {
            title = cfg.categories[k].catname + "_" + title;
            keywords = cfg.categories[k].keywords + "_" + title;
            description = cfg.categories[k].description + "_" + title;
        }
    }

    res.render("blog/list_article.html", {
        cat: cfg.categories,        // 导航分类列表
        catid: req.params.catid,    // 当前导航选中状态
        title: title,
        keywords: keywords,
        description: description,
        archives: rows,
        archives_left_1: rows_left_1,
        archives_left_2: rows_left_2,
        archives_left_3: rows_left_3,
    });
});

module.exports = (poolofmysql) => {
    pool = poolofmysql;
    return router;
};


/*
获取前N条文档
*/
function getArchives(size, cat = 0) {
    return new Promise((resolve, reject) => {

        pool.getConnection((err, conn) => {

            if (err) {
                resolve(null);
                return;
            }

            
            let sql = "select * from `archives` order by id desc limit 0," + size;
            if (cat > 0) {
                sql = "select * from `archives` where `cat`=" + cat + " order by id desc limit 0," + size;
            }
            // console.log(sql);
            conn.query(sql, (err, rows) => {
                pool.releaseConnection(conn);
                if (err) {
                    resolve(null);
                    return;
                }

                resolve(rows);

            });

        });

    });
}

/*
随机获取N条文档
*/
function getRandArchives(size, cat = 0) {
    return new Promise((resolve, reject) => {

        pool.getConnection((err, conn) => {

            if (err) {
                resolve(null);
                return;
            }
            
            let sql = "select * from `archives` order by RAND() limit 0," + size;
            if (cat > 0) {
                sql = "select * from `archives` where `cat`=" + cat + " order by RAND() limit 0," + size;
            }
            // console.log(sql);
            conn.query(sql, (err, rows) => {
                pool.releaseConnection(conn);
                if (err) {
                    resolve(null);
                    return;
                }

                resolve(rows);

            });

        });

    });
}



/*
时间戳格式化输出
let date = new Date()
dateFormat("YYYY-mm-dd HH:MM", date)
>>> 2019-06-06 19:45
*/
function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}