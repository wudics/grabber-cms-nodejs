var request = require('request');
var cheerio = require('cheerio');
var cfg = require('../config/config');
var mysql = require('mysql');
var fs = require('fs');

var pool = mysql.createPool(cfg.mysql);

var artlist = [];
var prefixurl = "https://www.jb51.net";
var url = prefixurl + "/list/list_15_1.htm";

request({
    url: url,
    method: "GET",
}, (errRequest, resultStatus, htmlstr) => {
    if (!errRequest && resultStatus.statusCode == 200) {
        var $ = cheerio.load(htmlstr, null, false);
        $("div.artlist").find("dt > a").each(function(index, element) {
            var arc = {};
            arc.href = prefixurl + element.attribs["href"];
            arc.text = $(element).text();
            artlist.push(arc);
        });

        // console.log(artlist);
        getContent(artlist);

    } else {
        console.log("err-1", errRequest);
    }
});

async function getContent(artlist) {

    for (let i = 7; i < artlist.length; i++) {

        await sleep(5000);

        console.log("正在处理：" + (i + 1) + "/" + artlist.length +"\t", artlist[i].href, "\t", artlist[i].text);
        request({
            url: artlist[i].href,
            method: "GET"
        }, (errRequest, resultStatus, htmlstr) => {
            if (!errRequest && resultStatus.statusCode == 200) {
                var $ = cheerio.load(htmlstr, null, false);
                artlist[i].data = {};

                // 文章标题
                artlist[i].data.title = $("#article > h1").text();

                // 文章内容
                $("#content .art_xg").prev("p").remove();
                $("#content .art_xg").remove();
                artlist[i].data.content = $("#content").html();

                // 文章图片
                var imageDownLoaders = [];
                $("#content img").each((index, element) => {
                    var src = $(element).attr("src");
                    var imageurl = parseImageUrl(src, prefixurl, url);
                    var filename = 'upload/' + new Date().getFullYear() + new Date().getMonth() + random(16) + "." + parseExt(imageurl);
                    $(element).attr("src", filename);
                    imageDownLoaders.push(download(imageurl, filename));    // 此时download返回的是Promise对象，并未真正开始下载图片，需要使用then、all等方法触发启动
                });
                artlist[i].data.content = $("#content").html(); // update content with new src

                // 注释掉all方法，测试是否使用all方法才会开始执行下载（测试结果为，注销掉all仍然会下载图片，在push时，download函数已经触发下载）
                Promise.all(imageDownLoaders).then((result => {
                    console.log(result);
                }));
                
                // imageDownLoaders.forEach((downloader) => {
                //     downloader.then((result) => {
                //         console.log(result);
                //     });
                // });

                // console.log(artlist[i]);
                
            } else {
                console.log("err-2", i, errRequest);
            }
        });
        
    }
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
var prefix = "https://www.baidu.com";
var url1 = "/pathname/1";
var url2 = "/pathname/1?params=aaa/bbb&others";

var src1 = "https://www.baidu.com/pathname/xxx/sss.jpg?others/something";
var src2 = "xxx/sss.jpg?others/something";
var src3 = "/xxx/sss.jpg?others/something";
var src4 = "//xxx/sss.jpg?others/something";

console.log(parseImageUrl(src4, prefix, url2));
*/
function parseImageUrl(src, prefix, url) {

    if (prefix.charAt(prefix.length) == "/") {
        prefix = prefix.substring(0, prefix.length - 1);
    }

    var imageurl = "";
    try {

        // src1
        let srcObj = new URL(src);
        imageurl = srcObj.href;

    } catch (err) {
        if (src.charAt(0) != "/") {

            // src2
            if (url.indexOf("?") == -1) {

                // url1 - src2
                imageurl = prefix + url.substring(0, (url.lastIndexOf("/") == -1 ? url.length : url.lastIndexOf("/"))) + "/" + src;

            } else {

                // url2 - src2
                let urlFixed = url.substring(0, url.indexOf("?"));
                imageurl = prefix + urlFixed.substring(0, (urlFixed.lastIndexOf("/") == -1 ? urlFixed.length : urlFixed.lastIndexOf("/"))) + "/" + src;

            }


        } else if (src.charAt(0) == "/" && src.charAt(1) != "/") {

            // src3
            imageurl = prefix + src;

        } else if (src.charAt(0) == "/" && src.charAt(1) == "/") {

            // src4
            prefix = prefix.substring(0, prefix.indexOf("://"));
            imageurl = prefix + ":" + src;

        }
    }

    return imageurl;
}

/*
从地址获取扩展名
*/
function parseExt(imgsrc) {
    var extlist = ["bmp", "jpg", "png", "gif", "webp"];
    imgsrc = imgsrc.substring(0, (imgsrc.indexOf("?") == -1 ? imgsrc.length : imgsrc.indexOf("?")));
    var ext = imgsrc.substring(imgsrc.lastIndexOf(".") + 1, imgsrc.length);
    if (extlist.includes(ext)) {
        return ext;
    } else {
        return "";
    }    
}

/*
Promise 单图片下载，成功resolve文件的路径，失败resolve null
无论下载成功与否，都使用resolve，而不是用reject，原因是需要使用Promise.all时，不会因为某一张图片下载失败而终止所有下载
而使用Promise.all的原因是，需要对所有图片进行处理完成之后，才能一次性保存到数据库
*/
function download(imgsrc, filename) {
    return new Promise((resolve, reject) => {

        var readStream = request(imgsrc);
        var writeStream = fs.createWriteStream(filename);

        readStream.pipe(writeStream);

        readStream.on('end', function() {
            console.log('下载完成');
            resolve(filename);
        });

        readStream.on('error', function(err) {
            // console.log("错误信息:", err);
            resolve(null);
        })

        writeStream.on("finish", function() {
            console.log("保存成功");
            writeStream.end();
            resolve(filename);
        });

    });
}

/*
生成随机字符串
console.log(random());        //jcBvYzfa
console.log(random(16));      //d9oq0A3vooaDod8X
console.log(random(16, {numbers: false}));     //AgfPTKheCgMvwNqX
console.log(random(16, {letters: false}));     //0889014544916637
console.log(random(16, {letters: 'ABCDEFG'})); //055B1627E43GA7D8
console.log(random(16, {specials: true}));     //,o=8l{iay>AOegW[
console.log(random(16, {specials: true, numbers: false, letters: false}));    //)-[+$^%+$|)-{(]%
console.log(random(16, {specials: ':;', numbers: false, letters: false}));    //:;:;;;:;;;;;;;::
console.log(random(16, true)); //SMm,EjETKMldIM/J
*/
function random(length, options) {
    var numbers = '0123456789';
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var specials = '~!@#$%^*()_+-=[]{}|;:,./<>?';

    length || (length = 8);
    options || (options = {});

    var chars = '';
    var result = '';

    if (options === true) {
        chars = numbers + letters + specials;
    } else if (typeof options == 'string') {
        chars = options;
    } else {
    if (options.numbers !== false) {
        chars += (typeof options.numbers == 'string') ? options.numbers : numbers;
    }

    if (options.letters !== false) {
        chars += (typeof options.letters == 'string') ? options.letters : letters;
    }

    if (options.specials) {
        chars += (typeof options.specials == 'string') ? options.specials : specials;
    }
    }

    while (length > 0) {
        length--;
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
