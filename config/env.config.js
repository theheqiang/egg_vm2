const fs = require("fs");

function getFile(name){
    try{
        return fs.readFileSync(`./env/${name}.js`) + "\r\n";
    }catch (e){
        console.log(`./env/${name}.js不存在`);
        return "";
    }
}

function getCode(){
    let code = "// env相关代码";
    code += getFile("Window");
    return code;
}
module.exports = {
    getCode
}
