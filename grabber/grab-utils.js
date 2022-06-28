var request = require("request");
var cheerio = require('cheerio');
var fs = require('fs');

/*

使用方法，必须要实现的抓取方法有2个
1. getArtlistInOnePage参数中的artlistProc，传入参数列表页面的htmlstr，返回文章数组[]
2. getContent参数中的contentProc，传入参数内容页面的htmlstr，返回对象info对象（包含art部分字段）

*/

var grabUtils = {
    getArtlistInOnePage: getArtlistInOnePage,
    getContent: getContent,
    imageSaveProc: defaultImageSaveProc,
    imgProc: defaultImgProc,
    imageReplaceProc: defaultImageReplaceProc,
    downloader: downloader,
    random: random,
    parseExt: parseExt,
    parseImageUrl: parseImageUrl,
    sleep: sleep,
    deepCopy: deepCopy,
};

/*
获取单个列表页中的文章地址列表
url：列表地址
artlistProc: 列表条目获取规则函数，返回网址列表，[{href: "https://xxx...", title: "xxx"}, {href: "https://xxx...", title: "xxx"}]
promise全部resolve出artlist，artlist正常情况下有值，失败情况下为空数组[]
*/
function getArtlistInOnePage(url, artlistProc) {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            method: "GET"
        }, (errRequest, resultStatus, htmlstr) => {
            if (!errRequest && resultStatus.statusCode == 200) {
                resolve(artlistProc(htmlstr));
            } else {
                resolve([]);
            }
        });
    });
}

/*
获取文章内容，包括下载文章内所有图片，下载失败的图片不替换内容的src，保留原样，下载成功的图替换src原来的内容
*/
function getContent(artObj, contentProc, imgSavePath = grabUtils.imageSaveProc, imgProc = grabUtils.imgProc) {

    return new Promise((resolve, reject) => {
        request({
            url: artObj.url,
            method: "GET"
        }, async (errRequest, resultStatus, htmlstr) => {
            if (!errRequest && resultStatus.statusCode == 200) {

                // 解析内容和标题（还可以有作者、发布时间、关键词、概要描述等）
                // 做浅拷贝，而不做深拷贝，是为了防止artObj原来字段的值被置空
                var info = contentProc(htmlstr);
                for (var k in info) {
                    artObj[k] = info[k];
                }

                // 解析和下载图片，替换内容原图片src地址
                artObj = await imgProc(artObj, imgSavePath);
                artObj.isDone = true;
                resolve(artObj);
                
            } else {
                resolve(null);
            }
        });
    });
    
}

/*
默认图片下载存储路径，在图片下载器中被调用
*/
function defaultImageSaveProc(imgUrl) {
    var filename = 'upload/' + new Date().getFullYear() + new Date().getMonth() + random(16) + "." + parseExt(imgUrl);
    return filename;
}

/*
默认图片下载和替换src方法
*/
function defaultImgProc(artObj, imageSaveProc = grabUtils.imageSaveProc, imageReplaceProc = grabUtils.imageReplaceProc) {
    return new Promise((resolve, reject) => {
        var $ = cheerio.load(artObj.content, null, false);

        var imageDownLoaders = [];
        $("img").each((index, element) => {
            var src = $(element).attr("src");
            var artUrl = new URL(artObj.url);
            var imgUrl = parseImageUrl(src, artUrl.origin, artUrl.pathname);

            // 开始下载单张图片，并返回promise，后续可以用Promise.all来监听所有下载事件全部结束
            imageDownLoaders.push(downloader(imgUrl, $, element, imageSaveProc, imageReplaceProc));

            // 限制图片下载请求频率 单位ms
            sleep(10);
        });

        // 所有图片下载结束后触发（某一图片若下载失败，则返回的列表中，该项值为null）
        Promise.all(imageDownLoaders).then((result => {

            // 更新content到artObj
            artObj.content = $.html();   // 这里输出的字符串如果被包裹了html、head、body等标签，需要在load的时候将第3个参数isDocument设置为false，var $ = cheerio.load(artObj.content, null, false);
            artObj.images = result;
            resolve(artObj);

        }));
    });
}

/*
默认图片src替换方法，在图片下载器中被调用
*/
function defaultImageReplaceProc($, elem, pathname) {

    var src = "/" + pathname;

    $(elem).attr("src", src);

    return src;
}


/*
图片下载器
Promise 单图片下载，成功resolve文件的路径，失败resolve null
无论下载成功与否，都使用resolve，而不是用reject，原因是需要使用Promise.all时，不会因为某一张图片下载失败而终止所有下载
而使用Promise.all的原因是，需要对所有图片进行处理完成之后，才能一次性保存到数据库
*/
function downloader(imgsrc, $, element, imageSaveProc = grabUtils.imageSaveProc, imageReplaceProc = grabUtils.imageReplaceProc) {

    var filename = imageSaveProc(imgsrc);

    return new Promise((resolve, reject) => {

        var readStream = request(imgsrc);
        var writeStream = fs.createWriteStream(filename);

        readStream.pipe(writeStream);

        readStream.on('end', function() {
            // console.log('下载完成');
            // resolve(filename);   // 在一个promise中多次resolve 不会触发多次then的回调
        });

        readStream.on('error', function(err) {
            // console.log("错误信息:", err);
            // 下载失败不替换src，保留原样
            resolve({
                source: imgsrc,     // 替换前的src
                save: null,         // 文件保存的路径
                src: null           // 替换后的src
            });
        })

        writeStream.on("finish", function() {
            // console.log("保存成功");
            writeStream.end();

            var src = imageReplaceProc($, element, filename);

            resolve({
                source: imgsrc,     // 替换前的src
                save: filename,     // 文件保存的路径
                src: src            // 替换后的src
            });
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

/*
从地址获取图片扩展名，获取失败返回空字符串
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
处理img图片中src属性的多种情况，生成统一的可用于远程下载的图片url地址
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
睡眠功能，防止请求太快导致被封禁
使用Promise方式，可以在async的函数体中使用await调用
await sleep(5000); // 睡眠5秒
*/
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
对象深拷贝
*/
function deepCopy(src) {

    if (typeof src != "object") {
        return src;
    }

    var obj = {};
    for (var k in src) {
        obj[k] = deepCopy(src[k]);
    }

    return obj;
}

module.exports = grabUtils;