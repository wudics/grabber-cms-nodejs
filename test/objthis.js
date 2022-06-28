var obj = {
    fn: defaultFn,
    proc: proc
};

function defaultFn(getthename) {
    console.log("哈哈哈");
    this.proc("aaa");
    proc("bbb");
}

function proc(xxx) {
    console.log("呵呵呵", xxx);
}

function getname() {
    return "小明";
}

module.exports = obj;