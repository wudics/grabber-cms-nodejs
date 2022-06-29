var cheerio = require('cheerio');
var cfg = require('../config/config');
var mysql = require('mysql');
var stream = require('stream');

var pool = mysql.createPool(cfg.mysql);



// pool.getConnection((err, conn) => {

//     conn.query("select * from `archives` order by id desc")
//         .on("error", (err) => {
//             // error
//             console.log(err);
//         })
//         .stream()
//         .pipe(new stream.Transform({
//             objectMode: true,
//             transform: (row, encoding, callback) => {
//             // Do something with the row of data
//                 console.log(row.id);
            
//             }
//         }))
//         .on("finish", () => {
//             console.log("finish");
//             conn.end();
//         });

// });


pool.getConnection((err, conn) => {

    var query = conn.query("select * from `archives` order by id desc");
    query
        .on('error', function(err) {
            // Handle error, an 'end' event will be emitted after this as well
        })
        .on('fields', function(fields) {
            // the field packets for the rows to follow
        })
        .on('result', function(row) {
            // Pausing the connnection is useful if your processing involves I/O
            conn.pause();

            processRow(row, function() {
                conn.resume();
            });
        })
        .on('end', function() {
            // all rows have been received
        });

});


function processRow(row, callback) {

    console.log(row.title, row.id);

    let $ = cheerio.load(row.content, null, false);

    $("p").each(async (index, element) => {
        let html = $(element).html();
        if (html.indexOf("更多关于") >= 0 && html.indexOf("//www.jb51.net/") >= 0) {
            console.log("--> found ad");
            $(element).remove();


            let newContent = $.html();
            let result = await updateContent(row.id, newContent);

            if (result) {
                console.log("--> clean", row.id);
            } else {
                console.log("--> clean fail");
            }
        }
    });

    callback();
}

function updateContent(id, content) {
    return new Promise((resolve, reject) => {

        pool.getConnection((err, conn) => {

            if (err) {
                resolve(null);
                return;
            }

            
            let sql = "update `archives` set `content`=? where `id`=?";
            let params = [content, id];
            conn.query(sql, params, (err, result) => {

                pool.releaseConnection(conn);
                if (err) {
                    resolve(false);
                    return;
                }

                if (result.affectedRows > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }

            });

        });

    });
}