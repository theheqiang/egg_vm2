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
    code += getFile("EventTarget");
    code += getFile("WindowProperties");
    code += getFile("Window");
    code += getFile("Node");
    code += getFile("Document");
    code += getFile("HTMLDocument");
    code += getFile("Storage");
    code += getFile("Navigator");
    code += getFile("Location");
    code += getFile("globalThis");// 全局环境
    return code;
}
module.exports = {
    getCode
}
