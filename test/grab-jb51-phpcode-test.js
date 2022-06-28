/*

1. 循环获取1到10页，保存所有网址和标题列表，保存到本地文件或者数据库
[
    {
        id: 1,
        url: "https://sss",
        title: "xxx",
        isDone: false,
        content: "",
        images: []
    },
    {
        id: 2,
        url: "https://sss",
        title: "xxx",
        isDone: false,
        content: "",
        images: []
    },
]

2. 从本地文件或者数据库加载一定数量的网址和标题列表（没有处理过内容和图片的），循环获取抓取内容和图片，替换src，更新本地文件或者数据库指定条目

*/

var grabUtils = require('../grabber/grab-utils');
var cheerio = require('cheerio');

var cfg = require('../config/config');
var mysql = require('mysql');

var pool = mysql.createPool(cfg.mysql);

(async () => {

    var pagelist = [
        "https://www.jb51.net/list/list_15_1.htm",
        // "https://www.jb51.net/list/list_15_2.htm",
        // "https://www.jb51.net/list/list_15_3.htm",
        // "https://www.jb51.net/list/list_15_4.htm",
        // "https://www.jb51.net/list/list_15_5.htm",
        // "https://www.jb51.net/list/list_15_6.htm",
        // "https://www.jb51.net/list/list_15_7.htm",
        // "https://www.jb51.net/list/list_15_8.htm",
        // "https://www.jb51.net/list/list_15_9.htm",
        // "https://www.jb51.net/list/list_15_10.htm",
    ];

    var artlist = [];

    for (var i = 0; i < pagelist.length; i++) {
        try {
            var artlistNew = await grabUtils.getArtlistInOnePage(pagelist[i], artlistProc);
            artlist = artlist.concat(artlistNew);
            await grabUtils.sleep(1000);
        } catch (err) {
            console.log(err);
            return;
        }
    }

    for (var i = 0; i < artlist.length; i++) {

        try {
            var artObj = grabUtils.deepCopy(artlist[i]);
            var art = await grabUtils.getContent(artObj, contentProc);

            var insertId = await addGrabsArticle(art);
            art.id = insertId;

            if (insertId) {
                console.log("正在抓取..." + (i + 1) + "/" + artlist.length +"\t", art.url, "\t", art.title, art.id, "\t完成");
            } else {
                console.log("正在抓取..." + (i + 1) + "/" + artlist.length +"\t", art.url, "\t", art.title, art.id, "\t错误");
            }
            
            await grabUtils.sleep(2000);
        } catch (err) {
            console.log(err);
            continue;
        }
        
    }
    

})();

/*
插入数据库
*/
function addGrabsArticle(art) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                resolve(null);
                return;
            }

            let sql = "insert into `grabs_article`(`title`,`isdone`,`content`,`images`) values(?,?,?,?)";
            let params = [
                art.title,
                1,
                art.content,
                JSON.stringify(art.images)
            ];
            conn.query(sql, params, (err, result) => {

                pool.releaseConnection(conn);

                if (err) {
                    
                    resolve(null);
                    return;
                }
                if (result.affectedRows > 0) {
                    resolve(result.insertId);
                }
                
            });
        });
    });
}


/*
文章列表获取
*/
function artlistProc(htmlstr) {

    var artlist = [];
    var prefixurl = "https://www.jb51.net";

    var $ = cheerio.load(htmlstr, null, false);
    $("div.artlist").find("dt > a").each(function(index, element) {
        var art = {};

        art.id = index + 1;
        art.url = prefixurl + element.attribs["href"];
        art.title = $(element).text();
        art.isDone = false;
        art.content = "";
        art.images = [];

        // 加入到列表
        artlist.push(art);
    });

    return artlist;

}

/*
内容页面获取
var {content, title} = contentProc(htmlstr);
*/
function contentProc(htmlstr) {
    var $ = cheerio.load(htmlstr, null, false);

    // 文章标题
    var title = $("#article > h1").text();

    // 文章内容
    $("#content .art_xg").prev("p").remove();
    $("#content .art_xg").remove();
    var content = $("#content").html();

    return {
        content: content,
        title: title,
    }

}

