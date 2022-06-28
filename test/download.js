var fs = require('fs');
const { exit } = require('process');
var request = require("request");

var src = "https://www.google.com.hk/images/srpr/logo3w.png?sdf24343=sd224&sdj3jdfoj/sdsd//dfdfdfd";
var readStream = request(src);

var filename = "image" + "." + parseExt(src);

var writeStream = fs.createWriteStream('upload/' + filename);

readStream.pipe(writeStream);

readStream.on('end', function() {
    console.log('下载完成');
});

readStream.on('error', function(err) {
    console.log("错误信息:", err);
})

writeStream.on("finish", function() {
    console.log("保存成功");
    writeStream.end();
});


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
