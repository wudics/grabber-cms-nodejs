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

console.log(random());        //jcBvYzfa
console.log(random(16));      //d9oq0A3vooaDod8X
console.log(random(16, {numbers: false}));     //AgfPTKheCgMvwNqX
console.log(random(16, {letters: false}));     //0889014544916637
console.log(random(16, {letters: 'ABCDEFG'})); //055B1627E43GA7D8
console.log(random(16, {specials: true}));     //,o=8l{iay>AOegW[
console.log(random(16, {specials: true, numbers: false, letters: false}));    //)-[+$^%+$|)-{(]%
console.log(random(16, {specials: ':;', numbers: false, letters: false}));    //:;:;;;:;;;;;;;::
console.log(random(16, true)); //SMm,EjETKMldIM/J

console.log(new Date().getFullYear());