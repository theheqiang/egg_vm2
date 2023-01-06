const fs = require("fs");

function getCode(name, type){
    try{
        return fs.readFileSync(`./user/${name}/${type}.js`) + "\r\n";
    }catch (e){
        console.log(`./user/${name}/${type}.js不存在`);
        return "";
    }
}
module.exports = {
    getCode
}
