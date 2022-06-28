var prefix = "https://www.baidu.com";
var url1 = "/pathname/1";
var url2 = "/pathname/1?params=aaa/bbb&others";

var src1 = "https://www.baidu.com/pathname/xxx/sss.jpg?others/something";
var src2 = "xxx/sss.jpg?others/something";
var src3 = "/xxx/sss.jpg?others/something";
var src4 = "//xxx/sss.jpg?others/something";


console.log(parseImageUrl(src4, prefix, url2));



function parseImageUrl(src, prefix = "https://www.baidu.com", url = "/pathname/1") {

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
            if (url.IndexOf("?") == -1) {

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


console.log(new URL("https://www.baidu.com/pathname/1?params=aaa/bbb&others"));

var k = -1;
if (k) {
    console.log(true);
} else {
    console.log(false);
}

var obj = require('./objthis');
obj.fn();


try {

    var sdfd = null;
    var ss = sdfd.sss;

} catch (err) {
    // console.log(err);
}