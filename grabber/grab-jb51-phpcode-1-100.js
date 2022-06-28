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

var grabUtils = require('./grab-utils');
var cheerio = require('cheerio');

var cfg = require('../config/config');
var mysql = require('mysql');

var pool = mysql.createPool(cfg.mysql);

(async () => {

    var errTimeCountOfArtlist = 0;
    var errTimeCountOfContent = 0;

    for (var i = 0; i < 100; i++) {

        try {

            await grabUtils.sleep(1000);

            var url = "https://www.jb51.net/list/list_15_" + (i + 1) + ".htm";
            console.log("-- 获取单页文章列表...", url);
            var artlist = await grabUtils.getArtlistInOnePage(url, artlistProc);

            // getArtlistInOnePage出错
            if (artlist.length == 0) {
                i--;
                errTimeCountOfArtlist++;

                if (errTimeCountOfArtlist >= 10) {
                    console.log("getArtlistInOnePage出错", "重试", errTimeCountOfArtlist, "次，终止");
                    break;
                } else {
                    console.log("getArtlistInOnePage出错", "重试", errTimeCountOfArtlist, "次");
                    continue;
                }
            }
            
            for (var k = 0; k < artlist.length; k++) {

                await grabUtils.sleep(2000);

                try {
                    var artObj = grabUtils.deepCopy(artlist[k]);
                    var art = await grabUtils.getContent(artObj, contentProc);

                    // getContent出错
                    if (!art) {
                        k--;
                        errTimeCountOfContent++
                        
                        if (errTimeCountOfContent >= 10) {
                            console.log("getContent出错", "重试", errTimeCountOfContent, "次，终止");
                            break;
                        } else {
                            console.log("getContent出错", "重试", errTimeCountOfContent, "次");
                            continue;
                        }
                        
                    }

                    var insertId = await addGrabsArticle(art);
                    art.id = insertId;

                    if (insertId) {
                        console.log("---- 正在抓取..." + (k + 1) + "/" + artlist.length +"\t", art.url, "\t", art.title, art.id, "\t完成");
                    } else {
                        console.log("---- 正在抓取..." + (k + 1) + "/" + artlist.length +"\t", art.url, "\t", art.title, art.id, "\t错误");
                    }

                } catch (err) {

                    console.log(err);
                    continue;

                }                
                
            }
            

        } catch (err) {

            console.log(err);
            continue;

        }
        
    }

    

    for (var i = 0; i < artlist.length; i++) {

        try {
            
        } catch (err) {
            
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
            // conn.on("error", (err) => {
            //     console.log("[mysql error]", err);
            //     resolve(null);
            // });

            let sql = "insert into `archives`(`title`,`pubdate`,`type`,`cat`,`seokey`,`seodesc`,`content`,`images`,`isdel`,`ispublish`) values(?,?,?,?,?,?,?,?,?,?)";
            let params = [
                art.title,
                Date.now() + "",
                1,  // article
                2,  // 编程开发
                art.seokey,
                art.seodesc,
                art.content,
                JSON.stringify(art.images),
                0,
                0
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

    // seo keywords
    var seokey = $('meta[name="keywords"]').attr('content');

    // seo description
    var seodesc = $('meta[name="description"]').attr('content');

    return {
        content: content,
        title: title,
        seokey: seokey,
        seodesc: seodesc
    }

}

