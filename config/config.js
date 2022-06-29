module.exports = {
    httpPort: 8080,
    httpsPort: 8443,
    jwtSecret: "powman",
    tokenExpiresTime: 1000 * 60 * 60 * 24 * 7,  // 授权7天
    mysql: {
        host: "localhost",
        user: "root",
        password: '88888888',
        database: "nodecms"
    },
    dir: {
        static_layuimini: "/layuimini",
        static_blog: "/blog"
    },
    types: [
        {id: 1, typename: "article"},
        {id: 2, typename: "software"},
    ],
    categories: [
        {id: 1, catname: "IT资讯", parentid: 0, keywords: "", description: ""},
        {id: 2, catname: "编程开发", parentid: 0, keywords: "", description: ""},
        {id: 3, catname: "绿色软件", parentid: 0, keywords: "", description: ""},
    ],
}

