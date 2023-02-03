// 入口
// 导入模块
const {VM, VMScript} = require("vm2");
const fs = require("fs");
const user = require("./config/user.config.js");
const tools = require("./config/tools.config.js");
const env = require("./config/env.config.js");


// 名称!
const name = "douyin";
// 情况日志
fs.writeFileSync(`./user/${name}/log.txt`, "");
// 创建虚拟机实例
const vm = new VM({
    sandbox:{fs ,ldObj,_name_:name}
});
// 配置相关
const configCode = fs.readFileSync("./config/config.js");
// 功能插件相关函数
const toolsCode = tools.getCode();
// 浏览器环境相关代码
const envCode = env.getCode();
// 全局初始化代码
const globalVarCode = tools.getFile("globalVar");
// 用户初始化代码
const userVarCode = user.getCode(name, "userVar");
// 设置代理对象
const proxyObjCode = tools.getFile("proxyObj");
// 需要调试的代码
const debugCode = user.getCode(name, "input");
// 异步执行的代码
const asyncCode = user.getCode(name, "async");
// 整合代码
const code = `${configCode}${toolsCode}${envCode}${globalVarCode}${userVarCode}${proxyObjCode}${debugCode}${asyncCode}`;
const logCode = fs.readFileSync("./tools/printLog.js");
const codeTest = `${configCode}${toolsCode}${logCode}${envCode}${globalVarCode}${userVarCode}${proxyObjCode}${debugCode}${asyncCode}`;
// 创建执行脚本
const script = new VMScript(codeTest, "./debugJS.js");
// 运行脚本文件
const result = vm.run(script);
// 输出结果
console.log(result);
// 输出文件
fs.writeFileSync(`./user/${name}/output.js`, code);
console.log("执行完成");