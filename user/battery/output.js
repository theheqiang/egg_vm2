// 全局对象配置
debugger;
eggvm = {
    "toolsFunc":{},//功能函数相关，插件
    "envFunc":{},// 具体环境实现相关
    "config":{}, // 配置相关
    "memory":{}, // 内存
}
eggvm.config.proxy = false; // 是否开启代理
eggvm.config.print = true; // 是否输出日志
eggvm.memory.symbolProxy = Symbol("proxy");// 独一无二的属性, 标记是否已代理
eggvm.memory.symbolData = Symbol("data");// 用来保存当前对象上的原型属性
eggvm.memory.tag = []; // 内存，存储tag标签
eggvm.memory.filterProxyProp =[eggvm.memory.symbolProxy,eggvm.memory.symbolData,Symbol.toPrimitive,Symbol.toStringTag, "eval"];// 需要过滤的属性
eggvm.memory.globalVar = {};// 存取全局变量
eggvm.memory.globalVar.jsonCookie = {};// json格式的cookie
eggvm.memory.globalVar.fontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]; // 浏览器能够识别的字体
eggvm.memory.asyncEvent = {};
eggvm.memory.globalVar.timeoutID = 0;

// 插件功能相关
!function (){
    // 创建pluginArray
    eggvm.toolsFunc.createPluginArray = function createPluginArray(){
        let pluginArray = {};
        pluginArray = eggvm.toolsFunc.createProxyObj(pluginArray, PluginArray, "pluginArray");
        eggvm.toolsFunc.setProtoArr.call(pluginArray, "length", 0);
        return pluginArray;
    }
    // 添加Plugin
    eggvm.toolsFunc.addPlugin = function addPlugin(plugin){
        let pluginArray = eggvm.memory.globalVar.pluginArray;
        if(pluginArray === undefined){
            pluginArray = eggvm.toolsFunc.createPluginArray();
        }
        let index = pluginArray.length;
        pluginArray[index] = plugin;
        Object.defineProperty(pluginArray, plugin.name, {value: plugin, writable: false, enumerable: false, configurable: true});
        eggvm.toolsFunc.setProtoArr.call(pluginArray, "length", index+1);
        eggvm.memory.globalVar.pluginArray = pluginArray;
        return pluginArray;
    }
    // 创建MimeTypeArray对象
    eggvm.toolsFunc.createMimeTypeArray = function createMimeTypeArray(){
        let mimeTypeArray = {};
        mimeTypeArray = eggvm.toolsFunc.createProxyObj(mimeTypeArray, MimeTypeArray, "mimeTypeArray");
        eggvm.toolsFunc.setProtoArr.call(mimeTypeArray, "length", 0);
        return mimeTypeArray;
    }
    // 添加MimeType
    eggvm.toolsFunc.addMimeType = function addMimeType(mimeType){
        let mimeTypeArray = eggvm.memory.globalVar.mimeTypeArray;
        if(mimeTypeArray === undefined){
            mimeTypeArray = eggvm.toolsFunc.createMimeTypeArray();
        }
        let index = mimeTypeArray.length;
        let flag = true;
        for(let i=0;i<index;i++){
            if(mimeTypeArray[i].type === mimeType.type){
                flag = false;
            }
        }
        if(flag){
            mimeTypeArray[index] = mimeType;
            Object.defineProperty(mimeTypeArray, mimeType.type, {value: mimeType, writable: false, enumerable: false, configurable: true});
            eggvm.toolsFunc.setProtoArr.call(mimeTypeArray, "length", index+1);
        }
        eggvm.memory.globalVar.mimeTypeArray = mimeTypeArray;
        return mimeTypeArray;
    }

    // 创建MimeType
    eggvm.toolsFunc.createMimeType = function createMimeType(mimeTypeJson, plugin){
        let mimeType = {};
        eggvm.toolsFunc.createProxyObj(mimeType, MimeType, "mimeType");
        eggvm.toolsFunc.setProtoArr.call(mimeType, "description", mimeTypeJson.description);
        eggvm.toolsFunc.setProtoArr.call(mimeType, "suffixes", mimeTypeJson.suffixes);
        eggvm.toolsFunc.setProtoArr.call(mimeType, "type", mimeTypeJson.type);
        eggvm.toolsFunc.setProtoArr.call(mimeType, "enabledPlugin", plugin);
        eggvm.toolsFunc.addMimeType(mimeType);
        return mimeType;
    }

    // 创建plugin
    eggvm.toolsFunc.createPlugin = function createPlugin(data){
        let mimeTypes = data.mimeTypes;
        let plugin = {};
        plugin = eggvm.toolsFunc.createProxyObj(plugin, Plugin, "plugin");
        eggvm.toolsFunc.setProtoArr.call(plugin, "description", data.description);
        eggvm.toolsFunc.setProtoArr.call(plugin, "filename", data.filename);
        eggvm.toolsFunc.setProtoArr.call(plugin, "name", data.name);
        eggvm.toolsFunc.setProtoArr.call(plugin, "length", mimeTypes.length);
        for(let i=0; i<mimeTypes.length; i++){
            let mimeType = eggvm.toolsFunc.createMimeType(mimeTypes[i], plugin);
            plugin[i] = mimeType;
            Object.defineProperty(plugin, mimeTypes[i].type, {value: mimeType, writable: false, enumerable: false, configurable: true});
        }
        eggvm.toolsFunc.addPlugin(plugin);
        return plugin;
    }

    // 解析URL属性
    eggvm.toolsFunc.parseUrl = function parseUrl(str) {
        if (!parseUrl || !parseUrl.options) {
            parseUrl.options = {
                strictMode: false,
                key: ["href", "protocol", "host", "userInfo", "user", "password", "hostname", "port", "relative", "pathname", "directory", "file", "search", "hash"],
                q: {
                    name: "queryKey",
                    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
                },
                parser: {
                    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
                }
            };
        }
        if (!str) {
            return '';
        }
        var o = parseUrl.options,
            m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            urlJson = {},
            i = 14;
        while (i--) urlJson[o.key[i]] = m[i] || "";
        urlJson[o.q.name] = {};
        urlJson[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
            if ($1) urlJson[o.q.name][$1] = $2;
        });
        delete  urlJson["queryKey"];
        delete  urlJson["userInfo"];
        delete  urlJson["user"];
        delete  urlJson["password"];
        delete  urlJson["relative"];
        delete  urlJson["directory"];
        delete  urlJson["file"];
        urlJson["protocol"] += ":";
        urlJson["origin"] = urlJson["protocol"] + "//" + urlJson["host"];
        urlJson["search"] = urlJson["search"] && "?" + urlJson["search"];
        urlJson["hash"] = urlJson["hash"] && "#" + urlJson["hash"];
        return urlJson;
    }

    // 单标签字符串解析
    eggvm.toolsFunc.getTagJson = function getTagJson(tagStr){
        let arrList = tagStr.match("<(.*?)>")[1].split(" ");
        let tagJson = {};
        tagJson["type"] = arrList[0];
        tagJson["prop"] = {};
        for(let i=1;i<arrList.length;i++){
            let item = arrList[i].split("=");
            let key = item[0];
            let value = item[1].replaceAll("\"","").replaceAll("'","");
            tagJson["prop"][key] = value;
        }
        return tagJson;
    }


    eggvm.toolsFunc.getCollection = function getCollection(type){
        let collection = [];
        for (let i = 0; i < eggvm.memory.tag.length; i++) {
            let tag = eggvm.memory.tag[i];
            if(eggvm.toolsFunc.getType(tag) === type){
                collection.push(tag);
            }
        }
        return collection;
    }

    // 获取原型对象上自身属性值
    eggvm.toolsFunc.getProtoArr = function getProtoArr(key){
        return this[eggvm.memory.symbolData] && this[eggvm.memory.symbolData][key];
    }
     // 设置原型对象上自身属性值
    eggvm.toolsFunc.setProtoArr = function setProtoArr(key, value){
        if(!(eggvm.memory.symbolData in this)){
            Object.defineProperty(this, eggvm.memory.symbolData, {
                enumerable:false,
                configurable:false,
                writable:true,
                value:{}
            });
        }
        this[eggvm.memory.symbolData][key] = value;
    }

    // 获取一个自增的ID
    eggvm.toolsFunc.getID = function getID(){
        if(eggvm.memory.ID === undefined){
            eggvm.memory.ID = 0;
        }
        eggvm.memory.ID += 1;
        return eggvm.memory.ID;
    }

    // 代理原型对象
    eggvm.toolsFunc.createProxyObj = function createProxyObj(obj, proto, name){
        Object.setPrototypeOf(obj,proto.prototype);
        return eggvm.toolsFunc.proxy(obj, `${name}_ID(${eggvm.toolsFunc.getID()})`);
    }
    // hook 插件
    eggvm.toolsFunc.hook = function hook(func, funcInfo, isDebug, onEnter, onLeave, isExec){
        // func ： 原函数，需要hook的函数
        // funcInfo: 是一个对象，objName，funcName属性
        // isDebug: 布尔类型, 是否进行调试，关键点定位，回溯调用栈
        // onEnter：函数， 原函数执行前执行的函数，改原函数入参，或者输出入参
        // onLeave： 函数，原函数执行完之后执行的函数，改原函数的返回值，或者输出原函数的返回值
        // isExec ： 布尔， 是否执行原函数，比如无限debuuger函数
        if(typeof func !== 'function'){
            return func;
        }
        if(funcInfo === undefined){
            funcInfo = {};
            funcInfo.objName = "globalThis";
            funcInfo.funcName = func.name || '';
        }
        if(isDebug === undefined){
            isDebug = false;
        }
        if(!onEnter){
            onEnter = function (obj){
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用，参数是${JSON.stringify(obj.args)}}`);
            }
        }
        if(!onLeave){
            onLeave = function (obj){
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用，返回值是[${obj.result}}]`);
            }
        }
        if(isExec === undefined){
            isExec = true;
        }
        // 替换的函数
        let hookFunc = function (){
            if(isDebug){
                debugger;
            }
            let obj = {};
            obj.args = [];
            for (let i=0;i<arguments.length;i++){
                obj.args[i] = arguments[i];
            }
            // 原函数执行前
            onEnter.call(this, obj); // onEnter(obj);
            // 原函数正在执行
            let result;
            if(isExec){
                result = func.apply(this, obj.args);
            }
            obj.result = result;
            // 原函数执行后
            onLeave.call(this, obj); // onLeave(obj);
            // 返回结果
            return obj.result;
        }
        // hook 后的函数进行native
        eggvm.toolsFunc.setNative(hookFunc, funcInfo.funcName);
        eggvm.toolsFunc.reNameFunc(hookFunc, funcInfo.funcName);
        return hookFunc;
    }
    // hook 对象的属性，本质是替换属性描述符
    eggvm.toolsFunc.hookObj = function hookObj(obj, objName, propName, isDebug){
        // obj :需要hook的对象
        // objName: hook对象的名字
        // propName： 需要hook的对象属性名
        // isDubug: 是否需要debugger
        let oldDescriptor = Object.getOwnPropertyDescriptor(obj, propName);
        let newDescriptor = {};
        if(!oldDescriptor.configurable){ // 如果是不可配置的，直接返回
            return;
        }
        // 必须有的属性描述
        newDescriptor.configurable = true;
        newDescriptor.enumerable = oldDescriptor.enumerable;
        if(oldDescriptor.hasOwnProperty("writable")){
            newDescriptor.writable = oldDescriptor.writable;
        }
        if(oldDescriptor.hasOwnProperty("value")){
            let value = oldDescriptor.value;
            if(typeof value !== "function"){
                return;
            }
            let funcInfo = {
                "objName": objName,
                "funcName": propName
            }
            newDescriptor.value = eggvm.toolsFunc.hook(value,funcInfo ,isDebug);
        }
        if(oldDescriptor.hasOwnProperty("get")){
            let get = oldDescriptor.get;
            let funcInfo = {
                "objName": objName,
                "funcName": `get ${propName}`
            }
            newDescriptor.get = eggvm.toolsFunc.hook(get,funcInfo ,isDebug);
        }
        if(oldDescriptor.hasOwnProperty("set")){
            let set = oldDescriptor.set;
            let funcInfo = {
                "objName": objName,
                "funcName": `set ${propName}`
            }
            newDescriptor.set = eggvm.toolsFunc.hook(set,funcInfo ,isDebug);
        }
        Object.defineProperty(obj, propName, newDescriptor);
    }
    // hook 原型对象的所有属性
    eggvm.toolsFunc.hookProto = function hookProto(proto, isDebug){
        // proto :函数原型
        // isDebug: 是否debugger
        let protoObj = proto.prototype;
        let name = proto.name;
        for(const prop in Object.getOwnPropertyDescriptors(protoObj)){
            eggvm.toolsFunc.hookObj(protoObj, `${name}.prototype`, prop, isDebug);
        }
        console.log(`hook ${name}.prototype`);
    }
    // 获取对象类型
    eggvm.toolsFunc.getType = function getType(obj){
        return Object.prototype.toString.call(obj);
    }

    // 过滤代理属性
    eggvm.toolsFunc.filterProxyProp = function filterProxyProp(prop){
        for(let i=0;i<eggvm.memory.filterProxyProp.length;i++){
            if(eggvm.memory.filterProxyProp[i] === prop){
                return true;
            }
        }
        return false;
    }

    // proxy代理器
    eggvm.toolsFunc.proxy = function proxy(obj, objName){
        // obj: 原始对象
        // objName: 原始对象的名字
        if(!eggvm.config.proxy){
            return obj;
        }
        if(eggvm.memory.symbolProxy in obj){// 判断对象obj是否是已代理的对象
            return obj[eggvm.memory.symbolProxy];
        }
        let handler = {
            get:function (target,prop,receiver){// 三个参数
                let result;
                try {//防止报错
                    result = Reflect.get(target,prop,receiver);
                    if(eggvm.toolsFunc.filterProxyProp(prop)){
                        return result;
                    }
                    let type = eggvm.toolsFunc.getType(result);
                    if(result instanceof Object){
                        console.log(`{get|obj:[${objName}] -> prop:[${prop.toString()}],type:[${type}]}`);
                        // 递归代理
                        result = eggvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}`);
                    }else if(typeof result === "symbol"){
                        console.log(`{get|obj:[${objName}] -> prop:[${prop.toString()}],ret:[${result.toString()}]}`);
                    }else{
                        console.log(`{get|obj:[${objName}] -> prop:[${prop.toString()}],ret:[${result}]}`);
                    }

                }catch (e) {
                    console.log(`{get|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`);
                }
                return result;
            },
            set:function (target,prop,value,receiver){
                let result;
                try{
                    result = Reflect.set(target,prop,value,receiver);
                    let type = eggvm.toolsFunc.getType(value);
                    if(value instanceof Object){
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],type:[${type}]}`);
                    }else if(typeof value === "symbol"){
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value.toString()}]}`);
                    }else{
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${value}]}`);
                    }
                }catch (e){
                    console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`);
                }
                return result;
            },
            getOwnPropertyDescriptor:function (target, prop){
                let result;// undefined, 描述符对象
                try{
                    result = Reflect.getOwnPropertyDescriptor(target, prop);
                    let type = eggvm.toolsFunc.getType(result);
                    if("constructor" !== prop){
                        console.log(`{getOwnPropertyDescriptor|obj:[${objName}] -> prop:[${prop.toString()}],type:[${type}]}`);
                    }
                    // if(typeof result !== "undefined"){
                    //     result = eggvm.toolsFunc.proxy(result, `${objName}.${prop.toString()}.PropertyDescriptor`);
                    // }
                }catch (e){
                     console.log(`{getOwnPropertyDescriptor|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`);
                }
                return result;
            },
            defineProperty: function (target, prop, descriptor){
                let result;
                try{
                    result = Reflect.defineProperty(target, prop, descriptor);
                    console.log(`{defineProperty|obj:[${objName}] -> prop:[${prop.toString()}]}`);
                }catch (e) {
                    console.log(`{defineProperty|obj:[${objName}] -> prop:[${prop.toString()}],error:[${e.message}]}`);
                }
                return result;
            },
            apply:function (target, thisArg, argumentsList){
                // target: 函数对象
                // thisArg: 调用函数的this指针
                // argumentsList: 数组， 函数的入参组成的一个列表
                let result;
                try{
                    result = Reflect.apply(target, thisArg, argumentsList);
                    let type = eggvm.toolsFunc.getType(result);
                    if(result instanceof Object){
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}], type:[${type}]}`);
                    }else if(typeof result === "symbol"){
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}] result:[${result.toString()}]}`);
                    }else{
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}] result:[${result}]}`);
                    }
                }catch (e) {
                    console.log(`{apply|function:[${objName}], args:[${argumentsList}] error:[${e.message}]}`);
                }
                return result;
            },
            construct:function (target, argArray, newTarget) {
                // target: 函数对象
                // argArray： 参数列表
                // newTarget：代理对象
                let result;
                try{
                    result = Reflect.construct(target, argArray, newTarget);
                    let type = eggvm.toolsFunc.getType(result);
                    console.log(`{construct|function:[${objName}], type:[${type}]}`);
                }catch (e) {
                    console.log(`{construct|function:[${objName}],error:[${e.message}]}`);
                }
                return result;

            },
            deleteProperty:function (target, propKey){
                let result = Reflect.deleteProperty(target, propKey);
                console.log(`{deleteProperty|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`);
                return result;
            },
            has:function (target, propKey){ // in 操作符
                let result = Reflect.has(target, propKey);
                if(propKey !== eggvm.memory.symbolProxy){
                    console.log(`{has|obj:[${objName}] -> prop:[${propKey.toString()}], result:[${result}]}`);
                }
                return result;
            },
            ownKeys: function (target){
                let result = Reflect.ownKeys(target);
                console.log(`{ownKeys|obj:[${objName}]}`);
                return result
            },
            getPrototypeOf:function(target){
                let result = Reflect.getPrototypeOf(target);
                console.log(`{getPrototypeOf|obj:[${objName}]}`);
                return result;
            },
            setPrototypeOf:function(target, proto){
                let result = Reflect.setPrototypeOf(target, proto);
                console.log(`{setPrototypeOf|obj:[${objName}]}`);
                return result;
            },
            preventExtensions:function(target){
                let result = Reflect.preventExtensions(target, proto);
                console.log(`{preventExtensions|obj:[${objName}]}`);
                return result;
            },
            isExtensible:function(target){
                let result = Reflect.isExtensible(target, proto);
                console.log(`{isExtensible|obj:[${objName}]}`);
                return result;
            }
        };
        let proxyObj = new Proxy(obj, handler);
        Object.defineProperty(obj, eggvm.memory.symbolProxy, {
            configurable:false,
            enumerable:false,
            writable:false,
            value:proxyObj
        });
        return proxyObj;
}
    // env函数分发器
    eggvm.toolsFunc.dispatch = function dispatch(self, obj, objName, funcName, argList, defaultValue){
        let name = `${objName}_${funcName}`; // EventTarget_addEventListener
        if(Object.getOwnPropertyDescriptor(obj, "constructor") !== undefined){
            if(Object.getOwnPropertyDescriptor(self, "constructor") !== undefined){
                // self 不是实例对象
                return eggvm.toolsFunc.throwError('TypeError', 'Illegal invocation');
            }
        }
        try{
            return eggvm.envFunc[name].apply(self, argList);
        }catch (e){
            if(defaultValue === undefined){
                console.log(`[${name}]正在执行，错误信息: ${e.message}`);
            }
            return defaultValue;
        }
    }
    // 定义对象属性defineProperty
    eggvm.toolsFunc.defineProperty = function defineProperty(obj, prop, oldDescriptor){
        let newDescriptor = {};
        newDescriptor.configurable = eggvm.config.proxy || oldDescriptor.configurable;// 如果开启代理必须是true
        newDescriptor.enumerable = oldDescriptor.enumerable;
        if(oldDescriptor.hasOwnProperty("writable")){
            newDescriptor.writable = eggvm.config.proxy || oldDescriptor.writable;// 如果开启代理必须是true
        }
        if(oldDescriptor.hasOwnProperty("value")){
            let value = oldDescriptor.value;
            if(typeof value === "function"){
                eggvm.toolsFunc.safeFunc(value, prop);
            }
            newDescriptor.value = value;
        }
        if(oldDescriptor.hasOwnProperty("get")){
            let get = oldDescriptor.get;
            if(typeof get === "function"){
                eggvm.toolsFunc.safeFunc(get, `get ${prop}`);
            }
            newDescriptor.get = get;
        }
        if(oldDescriptor.hasOwnProperty("set")){
            let set = oldDescriptor.set;
            if(typeof set === "function"){
                eggvm.toolsFunc.safeFunc(set, `set ${prop}`);
            }
            newDescriptor.set = set;
        }
        Object.defineProperty(obj, prop, newDescriptor);
    }
    // 函数native化
    !function (){
        const $toString = Function.prototype.toString;
        const symbol = Symbol(); // 独一无二的属性
        const myToString = function (){
            return typeof this === 'function' && this[symbol] || $toString.call(this);
        }
        function set_native(func, key, value){
            Object.defineProperty(func, key, {
                enumerable: false,
                configurable: true,
                writable: true,
                value: value
            });
        }
        delete Function.prototype.toString;
        set_native(Function.prototype, "toString", myToString);
        set_native(Function.prototype.toString, symbol, "function toString() { [native code] }");
        eggvm.toolsFunc.setNative = function (func, funcname) {
            set_native(func, symbol, `function ${funcname || func.name || ''}() { [native code] }`);
        }
    }();
    // 对象重命名
    eggvm.toolsFunc.reNameObj = function reNameObj(obj, name){
        Object.defineProperty(obj.prototype, Symbol.toStringTag, {
            configurable:true,
            enumerable:false,
            value:name,
            writable:false
        });
    }
    // 函数重命名
    eggvm.toolsFunc.reNameFunc = function reNameFunc(func, name){
        Object.defineProperty(func, "name", {
            configurable:true,
            enumerable:false,
            writable:false,
            value:name
        });
    }
    // 函数保护方法
    eggvm.toolsFunc.safeFunc = function safeFunc(func, name){
        eggvm.toolsFunc.setNative(func, name);
        eggvm.toolsFunc.reNameFunc(func, name);
    }
    // 原型保护方法
    eggvm.toolsFunc.safeProto = function safeProto(obj, name){
        eggvm.toolsFunc.setNative(obj, name);
        eggvm.toolsFunc.reNameObj(obj, name);
    }
    // 抛错函数
    eggvm.toolsFunc.throwError = function throwError(name, message){
        let e = new Error();
        e.name = name;
        e.message = message;
        e.stack = `${name}: ${message}\n    at snippet://`;
        throw e;
    }
    // base64编码解码
    eggvm.toolsFunc.base64 = {};
    eggvm.toolsFunc.base64.base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    eggvm.toolsFunc.base64.base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
    eggvm.toolsFunc.base64.base64encode = function base64encode(str) {
      var out, i, len;
      var c1, c2, c3;

      len = str.length;
      i = 0;
      out = "";
      while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
          out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(c1 >> 2);
          out += eggvm.toolsFunc.base64.base64EncodeChars.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
          out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(c1 >> 2);
          out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
          out += eggvm.toolsFunc.base64.base64EncodeChars.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
        }
        c3 = str.charCodeAt(i++);
        out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(c1 >> 2);
        out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += eggvm.toolsFunc.base64.base64EncodeChars.charAt(c3 & 0x3F);
      }
      return out;
    }
    eggvm.toolsFunc.base64.base64decode = function base64decode(str) {
      var c1, c2, c3, c4;
      var i, len, out;

      len = str.length;
      i = 0;
      out = "";
      while (i < len) {
        /* c1 */
        do {
          c1 = eggvm.toolsFunc.base64.base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 == -1);
        if (c1 == -1)
          break;

        /* c2 */
        do {
          c2 = eggvm.toolsFunc.base64.base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 == -1);
        if (c2 == -1)
          break;

        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

        /* c3 */
        do {
          c3 = str.charCodeAt(i++) & 0xff;
          if (c3 == 61)
            return out;
          c3 = eggvm.toolsFunc.base64.base64DecodeChars[c3];
        } while (i < len && c3 == -1);
        if (c3 == -1)
          break;

        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

        /* c4 */
        do {
          c4 = str.charCodeAt(i++) & 0xff;
          if (c4 == 61)
            return out;
          c4 = eggvm.toolsFunc.base64.base64DecodeChars[c4];
        } while (i < len && c4 == -1);
        if (c4 == -1)
          break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
      }
      return out;
    }

}();
// 浏览器接口具体的实现
!function (){


    eggvm.envFunc.BatteryManager_level_get = function BatteryManager_level_get(){
        return 1;
    }
    eggvm.envFunc.BatteryManager_chargingTime_get = function BatteryManager_chargingTime_get(){
        return 0;
    }
    eggvm.envFunc.BatteryManager_charging_get = function BatteryManager_charging_get(){
        return true;
    }
    eggvm.envFunc.Navigator_getBattery = function Navigator_getBattery(){
        let batteryManager = {};
        batteryManager = eggvm.toolsFunc.createProxyObj(batteryManager, BatteryManager, "batteryManager");
        let obj = {
            "then":function (callBack){
                let _callBack = callBack;
                callBack = function (){
                    return _callBack(batteryManager);
                }
                if(eggvm.memory.asyncEvent.promise === undefined){
                    eggvm.memory.asyncEvent.promise = [];
                }
                eggvm.memory.asyncEvent.promise.push(callBack);
            }
        }
        return obj;
    }
    eggvm.envFunc.window_clearTimeout = function window_clearTimeout(){
        let timeoutID = arguments[0];
        for(let i = 0; i< eggvm.memory.asyncEvent.setTimeout.length;i++){
            let event = eggvm.memory.asyncEvent.setTimeout[i];
            if(event.timeoutID === timeoutID){
                delete eggvm.memory.asyncEvent.setTimeout[i];
            }
        }
    }
    eggvm.envFunc.window_setTimeout = function window_setTimeout(){
        let func = arguments[0];
        let delay = arguments[1] || 0;
        let length = arguments.length;
        let args = [];
        for(let i=2;i<length;i++){
            args.push(arguments[i]);
        }
        let type = 1;
        if(typeof func !== "function"){
            type = 0;
        }
        eggvm.memory.globalVar.timeoutID += 1;
        let event = {
            "callback":func,
            "delay":delay,
            "args":args,
            "type":type, // 1代表函数，0代表是字符串代码,eval(code);
            "timeoutID": eggvm.memory.globalVar.timeoutID
        }
        if(eggvm.memory.asyncEvent.setTimeout === undefined){
            eggvm.memory.asyncEvent.setTimeout = [];
        }
        eggvm.memory.asyncEvent.setTimeout.push(event);
        return eggvm.memory.globalVar.timeoutID;
    }
    eggvm.envFunc.XMLHttpRequest_open = function XMLHttpRequest_open(){
        // 浏览器接口
        let method = arguments[0];
        let url = arguments[1];
        return url;
    }
    eggvm.envFunc.HTMLElement_offsetHeight_get = function HTMLElement_offsetHeight_get(){
        debugger;
        let fontFamily = this.style.fontFamily;
        if(eggvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1){// 能够识别的字体
            return 666;
        }else{ // 无法识别的字体
            return 999;
        }
    }
    eggvm.envFunc.HTMLElement_offsetWidth_get = function HTMLElement_offsetWidth_get(){
        let fontFamily = this.style.fontFamily;
        if(eggvm.memory.globalVar.fontList.indexOf(fontFamily) !== -1){// 能够识别的字体
            return 1666;
        }else{ // 无法识别的字体
            return 1999;
        }
    }
    eggvm.envFunc.Element_children_get = function Element_children_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "children");
    }
    eggvm.envFunc.Node_appendChild = function Node_appendChild(){
        let tag = arguments[0];
        let collection = [];
        collection.push(tag);
        collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
        eggvm.toolsFunc.setProtoArr.call(this, "children", collection);
        return tag;
    }
    eggvm.envFunc.Document_body_get = function Document_body_get(){
        let collection = eggvm.toolsFunc.getCollection('[object HTMLBodyElement]');
        return collection[0];
    }
    eggvm.envFunc.Element_innerHTML_set = function Element_innerHTML_set(){
        let htmlStr = arguments[0];
        // <span lang="zh" style="font-family:mmll;font-size:160px">fontTest</span>
        let style = {
            "font-size":"160px",
            "font-family":"mmll",
            "fontFamily":"mmll"
        };
        style = eggvm.toolsFunc.createProxyObj(style,CSSStyleDeclaration, "style");
        let tagJson = {
            "type": "span",
            "prop":{
                "lang":"zh",
                "style":style,
                "textContent":"fontTest"
            }
        }
        let span = document.createElement(tagJson["type"]);
        for (const key in tagJson["prop"]) {
            eggvm.toolsFunc.setProtoArr.call(span, key, tagJson["prop"][key]);
        }
        let collection = [];
        collection.push(span);
        collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
        eggvm.toolsFunc.setProtoArr.call(this, "children", collection);
    }
    eggvm.envFunc.WebGLRenderingContext_canvas_get = function WebGLRenderingContext_canvas_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "canvas");
    }
    eggvm.envFunc.WebGLRenderingContext_createProgram = function WebGLRenderingContext_createProgram(){
        let program = {};
        program = eggvm.toolsFunc.createProxyObj(program, WebGLProgram, "program");
        return program;
    }
    eggvm.envFunc.WebGLRenderingContext_createBuffer = function WebGLRenderingContext_createBuffer(){
        let buffer = {};
        buffer = eggvm.toolsFunc.createProxyObj(buffer, WebGLBuffer, "buffer");
        return buffer;
    }
    eggvm.envFunc.HTMLCanvasElement_toDataURL = function HTMLCanvasElement_toDataURL(){
        let type = eggvm.toolsFunc.getProtoArr.call(this, "type");
        if(type === "2d"){
            return eggvm.memory.globalVar.canvas_2d;
        }else if(type === "webgl"){
            return eggvm.memory.globalVar.canvas_webgl;
        }
    }
    eggvm.envFunc.HTMLCanvasElement_getContext = function HTMLCanvasElement_getContext(){
        let type = arguments[0];
        let context = {};
        switch (type){
            case "2d":
                context = eggvm.toolsFunc.createProxyObj(context, CanvasRenderingContext2D, "context_2d");
                eggvm.toolsFunc.setProtoArr.call(context, "canvas", this);
                eggvm.toolsFunc.setProtoArr.call(this, "type", type);
                break;
            case "webgl":
                context = eggvm.toolsFunc.createProxyObj(context, WebGLRenderingContext, "context_webgl");
                eggvm.toolsFunc.setProtoArr.call(context, "canvas", this);
                eggvm.toolsFunc.setProtoArr.call(this, "type", type);
                break;
            default:
                console.log(`HTMLCanvasElement_getContext_${type}未实现`);
                break;
        }
        return context;
    }
    eggvm.envFunc.HTMLElement_style_get = function HTMLElement_style_get(){
        let style = eggvm.toolsFunc.getProtoArr.call(this, "style");
        if(style === undefined){
            style = eggvm.toolsFunc.createProxyObj({}, CSSStyleDeclaration, "style");
        }
        return style;
    }
    eggvm.envFunc.HTMLCanvasElement_width_set = function HTMLCanvasElement_width_set(){

    }
    eggvm.envFunc.HTMLCanvasElement_height_set = function HTMLCanvasElement_height_set(){

    }
    eggvm.envFunc.MimeTypeArray_namedItem = function MimeTypeArray_namedItem(){
        let name = arguments[0];
        return this[name];
    }
    eggvm.envFunc.MimeTypeArray_item = function MimeTypeArray_item(){
        let index = arguments[0];
        return this[index];
    }
    eggvm.envFunc.Plugin_namedItem = function Plugin_namedItem(){
        let name = arguments[0];
        return this[name];
    }
    eggvm.envFunc.Plugin_item = function Plugin_item(){
        let index = arguments[0];
        return this[index];
    }
    eggvm.envFunc.PluginArray_namedItem = function PluginArray_namedItem(){
        let name = arguments[0];
        return this[name];
    }
    eggvm.envFunc.PluginArray_item = function PluginArray_item(){
        let index = arguments[0];
        return this[index];
    }
    eggvm.envFunc.Navigator_mimeTypes_get = function Navigator_mimeTypes_get(){
        return eggvm.memory.globalVar.mimeTypeArray;
    }
    eggvm.envFunc.MimeType_suffixes_get = function MimeType_suffixes_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "suffixes");
    }
    eggvm.envFunc.MimeType_enabledPlugin_get = function MimeType_enabledPlugin_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "enabledPlugin");
    }
    eggvm.envFunc.MimeType_description_get = function MimeType_description_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "description");
    }
    eggvm.envFunc.Plugin_length_get = function Plugin_length_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "length");
    }
    eggvm.envFunc.Plugin_filename_get = function Plugin_filename_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "filename");
    }
    eggvm.envFunc.Plugin_description_get = function Plugin_description_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "description");
    }
    eggvm.envFunc.Plugin_name_get = function Plugin_name_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "name");
    }
    eggvm.envFunc.PluginArray_length_get = function PluginArray_length_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "length");
    }
    eggvm.envFunc.MimeType_type_get = function MimeType_type_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "type");
    }
    eggvm.envFunc.MimeTypeArray_length_get = function MimeTypeArray_length_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "length");
    }
    eggvm.envFunc.Navigator_plugins_get = function Navigator_plugins_get(){
        return eggvm.memory.globalVar.pluginArray;
    }
    eggvm.envFunc.HTMLAnchorElement_hash_get = function HTMLAnchorElement_hash_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "hash");
    }
    eggvm.envFunc.HTMLAnchorElement_origin_get = function HTMLAnchorElement_origin_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "origin");
    }
    eggvm.envFunc.HTMLAnchorElement_search_get = function HTMLAnchorElement_search_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "search");
    }
    eggvm.envFunc.HTMLAnchorElement_hostname_get = function HTMLAnchorElement_hostname_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "hostname");
    }
    eggvm.envFunc.HTMLAnchorElement_protocol_get = function HTMLAnchorElement_protocol_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "protocol");
    }
    eggvm.envFunc.HTMLAnchorElement_href_get = function HTMLAnchorElement_href_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "href");
    }
    eggvm.envFunc.HTMLAnchorElement_href_set = function HTMLAnchorElement_href_set(){
        let url = arguments[0];
        if(url.indexOf("http") === -1){
            url = location.protocol + "//" + location.hostname + url;
        }
        let jsonUrl = eggvm.toolsFunc.parseUrl(url);
        eggvm.toolsFunc.setProtoArr.call(this, "origin", jsonUrl["origin"]);
        eggvm.toolsFunc.setProtoArr.call(this, "protocol", jsonUrl["protocol"]);
        eggvm.toolsFunc.setProtoArr.call(this, "host", jsonUrl["host"]);
        eggvm.toolsFunc.setProtoArr.call(this, "hostname", jsonUrl["hostname"]);
        eggvm.toolsFunc.setProtoArr.call(this, "port", jsonUrl["port"]);
        eggvm.toolsFunc.setProtoArr.call(this, "pathname", jsonUrl["pathname"]);
        eggvm.toolsFunc.setProtoArr.call(this, "search", jsonUrl["search"]);
        eggvm.toolsFunc.setProtoArr.call(this, "hash", jsonUrl["hash"]);
        eggvm.toolsFunc.setProtoArr.call(this, "href", jsonUrl["href"]);
    }
    eggvm.envFunc.location_hostname_get = function location_hostname_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "hostname");
    }
    eggvm.envFunc.location_hostname_set = function location_hostname_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "hostname", value);
    }
    eggvm.envFunc.location_protocol_get = function location_protocol_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "protocol");
    }
    eggvm.envFunc.location_protocol_set = function location_protocol_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "protocol", value);
    }
    eggvm.envFunc.HTMLInputElement_value_get = function HTMLInputElement_value_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "value");
    }
    eggvm.envFunc.HTMLInputElement_value_set = function HTMLInputElement_value_set(){
        let value = arguments[0];
        eggvm.toolsFunc.setProtoArr.call(this, "value", value);
    }
    eggvm.envFunc.HTMLInputElement_name_get = function HTMLInputElement_name_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "name");
    }
    eggvm.envFunc.HTMLInputElement_name_set = function HTMLInputElement_name_set(){
        let value = arguments[0];
        eggvm.toolsFunc.setProtoArr.call(this, "name", value);
    }
    eggvm.envFunc.Element_id_get = function Element_id_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "id");
    }
    eggvm.envFunc.Element_id_set = function Element_id_set(){
        let value = arguments[0];
        eggvm.toolsFunc.setProtoArr.call(this, "id", value);
    }
    eggvm.envFunc.HTMLInputElement_type_get = function HTMLInputElement_type_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "type");
    }
    eggvm.envFunc.HTMLInputElement_type_set = function HTMLInputElement_type_set(){
        let value = arguments[0];
        eggvm.toolsFunc.setProtoArr.call(this, "type", value);
    }
    eggvm.envFunc.Node_removeChild = function Node_removeChild(){

    }
    eggvm.envFunc.Node_parentNode_get = function Node_parentNode_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "parentNode");
    }
    eggvm.envFunc.HTMLMetaElement_content_get = function HTMLMetaElement_content_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "content");
    }
    eggvm.envFunc.HTMLMetaElement_content_set = function HTMLMetaElement_content_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "content", value);
    }
    eggvm.envFunc.HTMLDivElement_align_get = function HTMLDivElement_align_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "align");
    }
    eggvm.envFunc.HTMLDivElement_align_set = function HTMLDivElement_align_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "align", value);
    }
    eggvm.envFunc.Storage_setItem = function Storage_setItem(){
        let keyName = arguments[0];
        let keyValue = arguments[1];
        this[keyName] = keyValue;
    }
    eggvm.envFunc.Storage_getItem = function Storage_getItem(){
        let key = arguments[0];
        if(key in this){
            return this[key];
        }
        return null;
    }
    eggvm.envFunc.Storage_removeItem = function Storage_removeItem(){
        let key = arguments[0];
        delete this[key];
    }
    eggvm.envFunc.Storage_key = function Storage_key(){
        let index = arguments[0];
        let i = 0;
        for (const key in this) {
            if(i === index){
                return key;
            }
            i++;
        }
        return null;
    }
    eggvm.envFunc.Storage_clear = function Storage_clear(){
        for (const key in this) {
            delete this[key];
        }
    }
    eggvm.envFunc.Storage_length_get = function Storage_length_get(){
        let i = 0;
        for (const key in Object.getOwnPropertyDescriptors(this)) {
            i++;
        }
        return i;
    }
    eggvm.envFunc.Document_createElement = function Document_createElement(){
        let tagName = arguments[0].toLowerCase();
        let options = arguments[1];
        let tag = {};
        switch (tagName){
            case "div":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLDivElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "meta":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLMetaElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "head":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLHeadElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "input":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLInputElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "a":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLAnchorElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "canvas":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLCanvasElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "body":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLBodyElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "span":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLSpanElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            default:
                console.log(`Document_createElement_${tagName}未实现`);
                break;
        }
        return tag;
    }
    eggvm.envFunc.Document_getElementsByTagName = function Document_getElementsByTagName(){
        let tagName = arguments[0].toLowerCase();
        let collection = [];
        switch (tagName){
            case "meta":
                collection = eggvm.toolsFunc.getCollection('[object HTMLMetaElement]');
                collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, `Document_getElementsByTagName_${tagName}`)
                break;
            default:
                console.log(`Document_getElementsByTagName_${tagName}未实现`);
                break;
        }
        return collection;
    }
    eggvm.envFunc.Document_write = function Document_write(){
        let tagStr = arguments[0];
        // 解析标签字符串
        // '<input type="hidden" id="test" name="inputTag" value="666">'
        let tagJson = eggvm.toolsFunc.getTagJson(tagStr);
        let tag = document.createElement(tagJson.type);
        for(const key in tagJson.prop){
            debugger;
            tag[key] = tagJson.prop[key];
            if(tag[key] === undefined){
                eggvm.toolsFunc.setProtoArr.call(tag, key, tagJson.prop[key]);
            }
        }
    }
    eggvm.envFunc.Document_getElementById = function Document_getElementById(){
        let id = arguments[0];
        let tags = eggvm.memory.tag;
        debugger;
        for (let i = 0; i <tags.length; i++) {
            if(tags[i].id === id){
                return tags[i];
            }
        }
        return null;
    }
    eggvm.envFunc.Document_cookie_get = function Document_cookie_get(){
        let jsonCookie = eggvm.memory.globalVar.jsonCookie;
        let tempCookie = "";
        for(const key in jsonCookie){
            if(key === ""){
                tempCookie += `${jsonCookie[key]}; `;
            }else{
                tempCookie += `${key}=${jsonCookie[key]}; `;
            }
        }
        return tempCookie;
    }
    eggvm.envFunc.Document_cookie_set = function Document_cookie_set(){
        let cookieValue = arguments[0];
        let index = cookieValue.indexOf(";");
        if(index !== -1){
            cookieValue = cookieValue.substring(0, index);
        }
        if(cookieValue.indexOf("=") === -1){
            eggvm.memory.globalVar.jsonCookie[""] = cookieValue.trim();
        }else{
            let item = cookieValue.split("=");
            let k = item[0].trim();
            let v = item[1].trim();
            eggvm.memory.globalVar.jsonCookie[k] = v;
        }
    }

    eggvm.envFunc.document_location_get = function document_location_get(){
        return location;
    }
    eggvm.envFunc.window_top_get = function window_top_get(){
        return window;
    }
    eggvm.envFunc.window_self_get = function window_self_get(){
        return window;
    }
}();

// env相关代码// EventTarget对象
EventTarget = function EventTarget(){}
eggvm.toolsFunc.safeProto(EventTarget, "EventTarget");
eggvm.toolsFunc.defineProperty(EventTarget.prototype, "addEventListener", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "addEventListener", arguments)}});
eggvm.toolsFunc.defineProperty(EventTarget.prototype, "dispatchEvent", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "dispatchEvent", arguments)}});
eggvm.toolsFunc.defineProperty(EventTarget.prototype, "removeEventListener", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "removeEventListener", arguments)}});

// WindowProperties对象
WindowProperties = function WindowProperties(){

}
// 保护原型
eggvm.toolsFunc.safeProto(WindowProperties, "WindowProperties");
// 删除构造方法
delete WindowProperties.prototype.constructor;
Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype);


// Window对象
Window = function Window(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Window, "Window");
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype);
eggvm.toolsFunc.defineProperty(Window, "TEMPORARY", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(Window, "PERSISTENT", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Window.prototype, "TEMPORARY", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(Window.prototype, "PERSISTENT", {configurable:false, enumerable:true, writable:false, value:1});

// Node对象
Node = function Node(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Node, "Node");
Object.setPrototypeOf(Node.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(Node, "ELEMENT_NODE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Node, "ATTRIBUTE_NODE", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Node, "TEXT_NODE", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(Node, "CDATA_SECTION_NODE", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(Node, "ENTITY_REFERENCE_NODE", {configurable:false, enumerable:true, writable:false, value:5});
eggvm.toolsFunc.defineProperty(Node, "ENTITY_NODE", {configurable:false, enumerable:true, writable:false, value:6});
eggvm.toolsFunc.defineProperty(Node, "PROCESSING_INSTRUCTION_NODE", {configurable:false, enumerable:true, writable:false, value:7});
eggvm.toolsFunc.defineProperty(Node, "COMMENT_NODE", {configurable:false, enumerable:true, writable:false, value:8});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_NODE", {configurable:false, enumerable:true, writable:false, value:9});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_TYPE_NODE", {configurable:false, enumerable:true, writable:false, value:10});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_FRAGMENT_NODE", {configurable:false, enumerable:true, writable:false, value:11});
eggvm.toolsFunc.defineProperty(Node, "NOTATION_NODE", {configurable:false, enumerable:true, writable:false, value:12});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_DISCONNECTED", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_PRECEDING", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_FOLLOWING", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_CONTAINS", {configurable:false, enumerable:true, writable:false, value:8});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_CONTAINED_BY", {configurable:false, enumerable:true, writable:false, value:16});
eggvm.toolsFunc.defineProperty(Node, "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", {configurable:false, enumerable:true, writable:false, value:32});
eggvm.toolsFunc.defineProperty(Node.prototype, "nodeType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeType_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "nodeName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeName_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "baseURI", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "baseURI_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "isConnected", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isConnected_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "ownerDocument", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "ownerDocument_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "parentNode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "parentNode_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "parentElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "parentElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "childNodes", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "childNodes_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "firstChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "firstChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "lastChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lastChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "previousSibling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "previousSibling_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "nextSibling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nextSibling_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Node.prototype, "nodeValue", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeValue_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "nodeValue_set", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "textContent", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "textContent_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "textContent_set", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "ELEMENT_NODE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Node.prototype, "ATTRIBUTE_NODE", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Node.prototype, "TEXT_NODE", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(Node.prototype, "CDATA_SECTION_NODE", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(Node.prototype, "ENTITY_REFERENCE_NODE", {configurable:false, enumerable:true, writable:false, value:5});
eggvm.toolsFunc.defineProperty(Node.prototype, "ENTITY_NODE", {configurable:false, enumerable:true, writable:false, value:6});
eggvm.toolsFunc.defineProperty(Node.prototype, "PROCESSING_INSTRUCTION_NODE", {configurable:false, enumerable:true, writable:false, value:7});
eggvm.toolsFunc.defineProperty(Node.prototype, "COMMENT_NODE", {configurable:false, enumerable:true, writable:false, value:8});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_NODE", {configurable:false, enumerable:true, writable:false, value:9});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_TYPE_NODE", {configurable:false, enumerable:true, writable:false, value:10});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_FRAGMENT_NODE", {configurable:false, enumerable:true, writable:false, value:11});
eggvm.toolsFunc.defineProperty(Node.prototype, "NOTATION_NODE", {configurable:false, enumerable:true, writable:false, value:12});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_DISCONNECTED", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_PRECEDING", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_FOLLOWING", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINS", {configurable:false, enumerable:true, writable:false, value:8});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINED_BY", {configurable:false, enumerable:true, writable:false, value:16});
eggvm.toolsFunc.defineProperty(Node.prototype, "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", {configurable:false, enumerable:true, writable:false, value:32});
eggvm.toolsFunc.defineProperty(Node.prototype, "appendChild", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "appendChild", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "cloneNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "cloneNode", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "compareDocumentPosition", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "compareDocumentPosition", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "contains", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "contains", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "getRootNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "getRootNode", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "hasChildNodes", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "hasChildNodes", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "insertBefore", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "insertBefore", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "isDefaultNamespace", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isDefaultNamespace", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "isEqualNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isEqualNode", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "isSameNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "isSameNode", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "lookupNamespaceURI", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lookupNamespaceURI", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "lookupPrefix", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "lookupPrefix", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "normalize", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "normalize", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "removeChild", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "removeChild", arguments)}});
eggvm.toolsFunc.defineProperty(Node.prototype, "replaceChild", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Node.prototype, "Node", "replaceChild", arguments)}});

// Element对象
Element = function Element(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Element, "Element");
Object.setPrototypeOf(Element.prototype, Node.prototype);
eggvm.toolsFunc.defineProperty(Element.prototype, "namespaceURI", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "namespaceURI_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "prefix", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "prefix_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "localName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "localName_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "tagName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "tagName_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "id", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "id_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "id_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "className", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "className_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "className_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "classList", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "classList_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "classList_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "slot", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "slot_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "slot_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "attributes", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "attributes_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "shadowRoot", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "shadowRoot_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "part", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "part_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "part_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "assignedSlot", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "assignedSlot_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "innerHTML", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "innerHTML_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "innerHTML_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "outerHTML", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "outerHTML_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "outerHTML_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollTop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTop_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTop_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollLeft", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollLeft_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollLeft_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollWidth_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollHeight_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "clientTop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientTop_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "clientLeft", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientLeft_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "clientWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientWidth_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "clientHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "clientHeight_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "onbeforecopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecopy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onbeforecut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecut_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforecut_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onbeforepaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforepaste_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onbeforepaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onsearch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onsearch_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onsearch_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "elementTiming", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "elementTiming_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "elementTiming_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onwebkitfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "onwebkitfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "onwebkitfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "role", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "role_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "role_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaAtomic", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAtomic_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAtomic_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaAutoComplete", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAutoComplete_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaAutoComplete_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaBusy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBusy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaBusy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaChecked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaChecked_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaChecked_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaColCount", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColCount_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColCount_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaColIndex", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndex_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColIndex_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaColSpan", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColSpan_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaColSpan_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaCurrent", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaCurrent_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaCurrent_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaDescription", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescription_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDescription_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaDisabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDisabled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaDisabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaExpanded", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaExpanded_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaExpanded_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaHasPopup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHasPopup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHasPopup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaHidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHidden_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaHidden_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaInvalid", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaInvalid_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaInvalid_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaKeyShortcuts", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaKeyShortcuts_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaKeyShortcuts_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaLabel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLabel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaLevel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLevel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLevel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaLive", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLive_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaLive_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaModal", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaModal_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaModal_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaMultiLine", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiLine_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiLine_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaMultiSelectable", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiSelectable_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaMultiSelectable_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaOrientation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaOrientation_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaOrientation_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaPlaceholder", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPlaceholder_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPlaceholder_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaPosInSet", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPosInSet_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPosInSet_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaPressed", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPressed_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaPressed_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaReadOnly", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaReadOnly_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaReadOnly_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRelevant", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRelevant_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRelevant_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRequired", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRequired_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRequired_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRoleDescription", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRoleDescription_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRoleDescription_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRowCount", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowCount_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowCount_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRowIndex", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndex_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowIndex_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaRowSpan", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowSpan_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaRowSpan_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaSelected", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSelected_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSelected_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaSetSize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSetSize_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSetSize_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaSort", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSort_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaSort_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaValueMax", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMax_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMax_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaValueMin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMin_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueMin_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaValueNow", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueNow_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueNow_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "ariaValueText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueText_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "ariaValueText_set", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "children", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "children_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "firstElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "firstElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "lastElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "lastElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "childElementCount", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "childElementCount_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "previousElementSibling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "previousElementSibling_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "nextElementSibling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "nextElementSibling_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Element.prototype, "after", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "after", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "animate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "animate", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "append", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "append", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "attachShadow", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "attachShadow", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "before", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "before", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "closest", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "closest", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "computedStyleMap", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "computedStyleMap", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNames", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNames", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNode", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAttributeNodeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAttributeNodeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getBoundingClientRect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getBoundingClientRect", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getClientRects", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getClientRects", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getElementsByClassName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByClassName", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getElementsByTagName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByTagName", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getElementsByTagNameNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getElementsByTagNameNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getInnerHTML", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getInnerHTML", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "hasAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "hasAttributeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttributeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "hasAttributes", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasAttributes", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "hasPointerCapture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "hasPointerCapture", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentElement", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentElement", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentHTML", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentHTML", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "insertAdjacentText", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "insertAdjacentText", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "matches", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "matches", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "prepend", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "prepend", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "querySelector", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "querySelector", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "querySelectorAll", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "querySelectorAll", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "releasePointerCapture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "releasePointerCapture", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "remove", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "remove", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "removeAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "removeAttributeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttributeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "removeAttributeNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "removeAttributeNode", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "replaceChildren", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "replaceChildren", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "replaceWith", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "replaceWith", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "requestFullscreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "requestFullscreen", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "requestPointerLock", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "requestPointerLock", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scroll", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scroll", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollBy", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollBy", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollIntoView", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollIntoView", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollIntoViewIfNeeded", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollIntoViewIfNeeded", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "scrollTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "scrollTo", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNode", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setAttributeNodeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setAttributeNodeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setPointerCapture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setPointerCapture", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "toggleAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "toggleAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "webkitMatchesSelector", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitMatchesSelector", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "webkitRequestFullScreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitRequestFullScreen", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "webkitRequestFullscreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "webkitRequestFullscreen", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "checkVisibility", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "checkVisibility", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "getAnimations", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "getAnimations", arguments)}});
eggvm.toolsFunc.defineProperty(Element.prototype, "setHTML", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Element.prototype, "Element", "setHTML", arguments)}});

// HTMLElement对象
HTMLElement = function HTMLElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLElement, "HTMLElement");
Object.setPrototypeOf(HTMLElement.prototype, Element.prototype);
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "title", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "title_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "title_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "lang", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "lang_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "lang_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "translate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "translate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "translate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "dir", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "dir_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "dir_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "hidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "hidden_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "hidden_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "accessKey", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "accessKey_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "accessKey_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "draggable", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "draggable_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "draggable_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "spellcheck", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "spellcheck_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "spellcheck_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "autocapitalize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "autocapitalize_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "autocapitalize_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "contentEditable", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "contentEditable_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "contentEditable_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "enterKeyHint", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "enterKeyHint_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "enterKeyHint_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "isContentEditable", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "isContentEditable_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "inputMode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "inputMode_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "inputMode_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "virtualKeyboardPolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "virtualKeyboardPolicy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "virtualKeyboardPolicy_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "offsetParent", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "offsetParent_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "offsetTop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "offsetTop_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "offsetLeft", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "offsetLeft_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "offsetWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "offsetWidth_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "offsetHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "offsetHeight_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "innerText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "innerText_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "innerText_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "outerText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "outerText_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "outerText_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onbeforexrselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforexrselect_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforexrselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onabort", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onabort_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onabort_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onbeforeinput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforeinput_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforeinput_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onblur", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onblur_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onblur_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncanplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncanplay_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncanplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncanplaythrough", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncanplaythrough_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncanplaythrough_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onclose", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onclose_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onclose_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncontextlost", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextlost_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextlost_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncontextmenu", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextmenu_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextmenu_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncontextrestored", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextrestored_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncontextrestored_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncuechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncuechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncuechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondblclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondblclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondblclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondrag", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondrag_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondrag_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondragend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondragenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondragleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondragover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragover_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondragstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondragstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondrop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondrop_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondrop_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ondurationchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondurationchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ondurationchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onemptied", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onemptied_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onemptied_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onended", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onended_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onended_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onfocus", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onfocus_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onfocus_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onformdata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onformdata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onformdata_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oninput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oninput_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oninput_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oninvalid", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oninvalid_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oninvalid_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onkeydown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeydown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeydown_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onkeypress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeypress_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeypress_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onkeyup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeyup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onkeyup_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onload_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onloadeddata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadeddata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadeddata_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onloadedmetadata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadedmetadata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadedmetadata_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onloadstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onloadstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmousedown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousedown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousedown_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmouseenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmouseleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmousemove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousemove_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousemove_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmouseout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseout_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmouseover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseover_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmouseup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmouseup_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onmousewheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousewheel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onmousewheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpause", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpause_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpause_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onplay_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onplaying", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onplaying_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onplaying_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onprogress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onprogress_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onprogress_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onratechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onratechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onratechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onreset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onreset_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onreset_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onresize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onresize_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onresize_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onscroll", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onscroll_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onscroll_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onsecuritypolicyviolation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsecuritypolicyviolation_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsecuritypolicyviolation_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onseeked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onseeked_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onseeked_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onseeking", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onseeking_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onseeking_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselect_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onslotchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onslotchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onslotchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onstalled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onstalled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onstalled_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onsubmit", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsubmit_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsubmit_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onsuspend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsuspend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onsuspend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontimeupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontimeupdate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontimeupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontoggle", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontoggle_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontoggle_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onvolumechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onvolumechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onvolumechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwaiting", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwaiting_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwaiting_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwebkitanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwebkitanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationiteration_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwebkitanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkitanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwebkittransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkittransitionend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwebkittransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onwheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwheel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onwheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onauxclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onauxclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onauxclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ongotpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ongotpointercapture_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ongotpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onlostpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onlostpointercapture_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onlostpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerdown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerdown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerdown_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointermove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointermove_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointermove_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerrawupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerrawupdate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerrawupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerup_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointercancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointercancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointercancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerover_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerout_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpointerleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpointerleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onselectstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselectstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselectstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onselectionchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselectionchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onselectionchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationiteration_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontransitionrun", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionrun_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionrun_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontransitionstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "ontransitioncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitioncancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "ontransitioncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncopy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "oncut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncut_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "oncut_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onpaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpaste_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onpaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "dataset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "dataset_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "nonce", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "nonce_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "nonce_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "autofocus", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "autofocus_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "autofocus_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "tabIndex", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "tabIndex_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "tabIndex_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "style", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "style_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "style_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "attributeStyleMap", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "attributeStyleMap_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "attachInternals", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "attachInternals", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "blur", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "blur", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "click", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "click", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "focus", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "focus", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "inert", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "inert_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "inert_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLElement.prototype, "onbeforematch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforematch_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLElement.prototype, "HTMLElement", "onbeforematch_set", arguments)}});

// HTMLAnchorElement对象
HTMLAnchorElement = function HTMLAnchorElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLAnchorElement, "HTMLAnchorElement");
Object.setPrototypeOf(HTMLAnchorElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "target", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "target_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "target_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "download", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "download_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "download_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "ping", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "ping_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "ping_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "rel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rel_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "relList", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "relList_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "relList_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hreflang", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hreflang_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hreflang_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "type_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "type_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "referrerPolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "referrerPolicy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "referrerPolicy_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "text", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "text_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "text_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "coords", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "coords_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "coords_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "charset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "charset_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "charset_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "name_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "name_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "rev", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rev_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "rev_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "shape", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "shape_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "shape_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "origin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "origin_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "protocol", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "protocol_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "protocol_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "username", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "username_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "username_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "password", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "password_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "password_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "host", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "host_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "host_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hostname", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hostname_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hostname_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "port", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "port_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "port_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "pathname", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "pathname_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "pathname_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "search", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "search_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "search_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hash", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hash_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hash_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "href", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "href_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "href_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "toString", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "toString", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAnchorElement.prototype, "hrefTranslate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hrefTranslate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLAnchorElement.prototype, "HTMLAnchorElement", "hrefTranslate_set", arguments)}});

// HTMLBodyElement对象
HTMLBodyElement = function HTMLBodyElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLBodyElement, "HTMLBodyElement");
Object.setPrototypeOf(HTMLBodyElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "text", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "text_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "text_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "link", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "link_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "link_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "vLink", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "vLink_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "vLink_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "aLink", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "aLink_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "aLink_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "bgColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "bgColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "bgColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "background", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "background_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "background_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onblur", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onblur_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onblur_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onfocus", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onfocus_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onfocus_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onload_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onresize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onresize_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onresize_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onscroll", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onscroll_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onscroll_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onafterprint", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onafterprint_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onafterprint_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onbeforeprint", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeprint_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeprint_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onbeforeunload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeunload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onbeforeunload_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onhashchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onhashchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onhashchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onlanguagechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onlanguagechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onlanguagechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onmessage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessage_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessage_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onmessageerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessageerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onmessageerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onoffline", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onoffline_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onoffline_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "ononline", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ononline_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "ononline_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpagehide", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpagehide_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpagehide_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpageshow", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpageshow_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpageshow_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onpopstate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpopstate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onpopstate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onrejectionhandled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onrejectionhandled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onrejectionhandled_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onstorage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onstorage_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onstorage_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onunhandledrejection", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunhandledrejection_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunhandledrejection_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBodyElement.prototype, "onunload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBodyElement.prototype, "HTMLBodyElement", "onunload_set", arguments)}});

// HTMLCanvasElement对象
HTMLCanvasElement = function HTMLCanvasElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLCanvasElement, "HTMLCanvasElement");
Object.setPrototypeOf(HTMLCanvasElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "width", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "width_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "width_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "height", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "height_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "height_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "captureStream", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "captureStream", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "getContext", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "getContext", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "toBlob", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "toBlob", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "toDataURL", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCanvasElement.prototype, "HTMLCanvasElement", "transferControlToOffscreen", arguments)}});

// HTMLDivElement对象
HTMLDivElement = function HTMLDivElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLDivElement, "HTMLDivElement");
Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLDivElement.prototype, "align", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_set", arguments)}});

// HTMLHeadElement对象
HTMLHeadElement = function HTMLHeadElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLHeadElement, "HTMLHeadElement");
Object.setPrototypeOf(HTMLHeadElement.prototype, HTMLElement.prototype);

// HTMLInputElement对象
HTMLInputElement = function HTMLInputElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLInputElement, "HTMLInputElement");
Object.setPrototypeOf(HTMLInputElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "accept", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "accept_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "accept_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "alt", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "alt_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "alt_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "autocomplete", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "autocomplete_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "autocomplete_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "defaultChecked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultChecked_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultChecked_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "checked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checked_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checked_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "dirName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "dirName_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "dirName_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "disabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "disabled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "disabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "form", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "form_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "files", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "files_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "files_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formAction", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formAction_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formAction_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formEnctype", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formEnctype_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formEnctype_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formMethod", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formMethod_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formMethod_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formNoValidate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formNoValidate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formNoValidate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "formTarget", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formTarget_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "formTarget_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "height", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "height_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "height_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "indeterminate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "indeterminate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "indeterminate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "list", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "list_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "max", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "max_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "max_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "maxLength", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "maxLength_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "maxLength_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "min", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "min_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "min_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "minLength", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "minLength_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "minLength_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "multiple", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "multiple_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "multiple_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "name_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "name_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "pattern", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "pattern_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "pattern_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "placeholder", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "placeholder_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "placeholder_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "readOnly", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "readOnly_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "readOnly_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "required", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "required_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "required_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "size", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "size_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "size_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "src", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "src_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "src_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "step", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "step_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "step_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "type_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "type_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "defaultValue", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultValue_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "defaultValue_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "value", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "value_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "value_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "valueAsDate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsDate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsDate_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "valueAsNumber", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsNumber_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "valueAsNumber_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "width", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "width_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "width_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "willValidate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "willValidate_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "validity", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "validity_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "validationMessage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "validationMessage_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "labels", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "labels_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionStart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionStart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionStart_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionEnd", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionEnd_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionEnd_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "selectionDirection", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionDirection_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "selectionDirection_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "align", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "align_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "align_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "useMap", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "useMap_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "useMap_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "webkitdirectory", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitdirectory_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitdirectory_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "incremental", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "incremental_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "incremental_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "checkValidity", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "checkValidity", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "reportValidity", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "reportValidity", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "select", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "select", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setCustomValidity", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setCustomValidity", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setRangeText", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setRangeText", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "setSelectionRange", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "setSelectionRange", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "showPicker", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "showPicker", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "stepDown", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "stepDown", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "stepUp", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "stepUp", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLInputElement.prototype, "webkitEntries", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLInputElement.prototype, "HTMLInputElement", "webkitEntries_get", arguments)}, set:undefined});

// HTMLMetaElement对象
HTMLMetaElement = function HTMLMetaElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLMetaElement, "HTMLMetaElement");
Object.setPrototypeOf(HTMLMetaElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "name_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "name_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "httpEquiv", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "httpEquiv_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "httpEquiv_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "content", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "content_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "content_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "media", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "media_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "media_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLMetaElement.prototype, "scheme", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "scheme_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLMetaElement.prototype, "HTMLMetaElement", "scheme_set", arguments)}});

// HTMLSpanElement对象
HTMLSpanElement = function HTMLSpanElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLSpanElement, "HTMLSpanElement");
Object.setPrototypeOf(HTMLSpanElement.prototype, HTMLElement.prototype);

// Document对象
Document = function Document(){}
eggvm.toolsFunc.safeProto(Document, "Document");
Object.setPrototypeOf(Document.prototype, Node.prototype);
eggvm.toolsFunc.defineProperty(Document.prototype, "implementation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "implementation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "URL", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "URL_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "documentURI", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentURI_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "compatMode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "compatMode_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "characterSet", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "characterSet_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "charset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "charset_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "inputEncoding", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "inputEncoding_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "contentType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "contentType_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "doctype", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "doctype_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "documentElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlEncoding", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlEncoding_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlVersion", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlStandalone", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "domain", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "referrer", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "referrer_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "cookie", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "lastModified", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastModified_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "readyState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "readyState_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "title", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "dir", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "body", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "head", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "head_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "images", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "images_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "embeds", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "embeds_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "plugins", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "plugins_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "links", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "links_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "forms", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "forms_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "scripts", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scripts_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "currentScript", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "currentScript_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "defaultView", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "defaultView_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "designMode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onreadystatechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "anchors", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "anchors_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "applets", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "applets_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "fgColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "linkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "vlinkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "alinkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "bgColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "all", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "all_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "scrollingElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scrollingElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "hidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hidden_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "visibilityState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "visibilityState_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "wasDiscarded", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "wasDiscarded_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "featurePolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "featurePolicy_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitVisibilityState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitVisibilityState_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitHidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitHidden_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforecopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforecut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforepaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfreeze", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onresume", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsearch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onvisibilitychange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreenEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreen", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitIsFullScreen", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitIsFullScreen_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitCurrentFullScreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitCurrentFullScreenElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenEnabled_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "rootElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "rootElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforexrselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onabort", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforeinput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onblur", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncanplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncanplaythrough", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onclose", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextlost", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextmenu", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextrestored", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncuechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondblclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondrag", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondrop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondurationchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onemptied", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onended", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfocus", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onformdata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oninput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oninvalid", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeydown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeypress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeyup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadeddata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadedmetadata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousedown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousemove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousewheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpause", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onplaying", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onprogress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onratechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onreset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onresize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onscroll", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsecuritypolicyviolation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onseeked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onseeking", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onslotchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onstalled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsubmit", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsuspend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontimeupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontoggle", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onvolumechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwaiting", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkittransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onauxclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ongotpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onlostpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerdown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointermove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerrawupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointercancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselectstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselectionchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionrun", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitioncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "children", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "children_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "firstElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "firstElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "lastElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "childElementCount", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "childElementCount_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "activeElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "activeElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "styleSheets", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "styleSheets_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pointerLockElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pointerLockElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "adoptedStyleSheets", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptedStyleSheets_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptedStyleSheets_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fonts", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fonts_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "adoptNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "adoptNode", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "append", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "append", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "captureEvents", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "captureEvents", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "caretRangeFromPoint", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "caretRangeFromPoint", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "clear", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "clear", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "close", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "close", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createAttribute", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createAttribute", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createAttributeNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createAttributeNS", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createCDATASection", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createCDATASection", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createComment", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createComment", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createDocumentFragment", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createDocumentFragment", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createElement", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createElement", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createElementNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createElementNS", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createEvent", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createEvent", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createExpression", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createExpression", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createNSResolver", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createNSResolver", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createNodeIterator", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createNodeIterator", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createProcessingInstruction", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createProcessingInstruction", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createRange", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createRange", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createTextNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createTextNode", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "createTreeWalker", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "createTreeWalker", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "elementFromPoint", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "elementFromPoint", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "elementsFromPoint", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "elementsFromPoint", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "evaluate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "evaluate", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "execCommand", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "execCommand", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "exitFullscreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitFullscreen", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "exitPointerLock", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitPointerLock", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getElementById", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementById", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getElementsByClassName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByClassName", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getElementsByName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByName", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getElementsByTagName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByTagName", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getElementsByTagNameNS", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getElementsByTagNameNS", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getSelection", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getSelection", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "hasFocus", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hasFocus", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "importNode", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "importNode", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "open", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "open", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "prepend", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "prepend", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "queryCommandEnabled", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandEnabled", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "queryCommandIndeterm", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandIndeterm", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "queryCommandState", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandState", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "queryCommandSupported", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandSupported", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "queryCommandValue", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "queryCommandValue", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "querySelector", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "querySelector", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "querySelectorAll", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "querySelectorAll", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "releaseEvents", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "releaseEvents", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "replaceChildren", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "replaceChildren", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitCancelFullScreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitCancelFullScreen", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitExitFullscreen", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitExitFullscreen", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "write", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "write", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "writeln", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "writeln", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "prerendering", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "prerendering_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onprerenderingchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fragmentDirective", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fragmentDirective_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforematch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "timeline", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "timeline_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureEnabled_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "exitPictureInPicture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "exitPictureInPicture", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "getAnimations", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "getAnimations", arguments)}});

// HTMLDocument对象
HTMLDocument = function HTMLDocument(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLDocument, "HTMLDocument");
Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);
// document对象
document = {}
Object.setPrototypeOf(document, HTMLDocument.prototype);
eggvm.toolsFunc.defineProperty(document, "location", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, document, "document", "location_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, document, "document", "location_set", arguments)}});

// Storage对象
Storage = function Storage(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Storage, "Storage");
eggvm.toolsFunc.defineProperty(Storage.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Storage.prototype, "clear", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "clear", arguments)}});
eggvm.toolsFunc.defineProperty(Storage.prototype, "getItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "getItem", arguments)}});
eggvm.toolsFunc.defineProperty(Storage.prototype, "key", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "key", arguments)}});
eggvm.toolsFunc.defineProperty(Storage.prototype, "removeItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "removeItem", arguments)}});
eggvm.toolsFunc.defineProperty(Storage.prototype, "setItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Storage.prototype, "Storage", "setItem", arguments)}});

// localStorage对象
localStorage = {}
Object.setPrototypeOf(localStorage, Storage.prototype);
// sessionStorage对象
sessionStorage = {}
Object.setPrototypeOf(sessionStorage, Storage.prototype);

// Navigator对象
Navigator = function Navigator(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Navigator, "Navigator");
eggvm.toolsFunc.defineProperty(Navigator.prototype, "vendorSub", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vendorSub_get", arguments, '')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "productSub", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "productSub_get", arguments, '20030107')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "vendor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vendor_get", arguments, 'Google Inc.')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "maxTouchPoints", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "maxTouchPoints_get", arguments, 0)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "scheduling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "scheduling_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "userActivation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "userActivation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "doNotTrack", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "doNotTrack_get", arguments, '1')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "geolocation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "geolocation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "connection", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "connection_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "plugins", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "plugins_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "mimeTypes", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mimeTypes_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "pdfViewerEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "pdfViewerEnabled_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "webkitTemporaryStorage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webkitTemporaryStorage_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "webkitPersistentStorage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webkitPersistentStorage_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "hardwareConcurrency", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "hardwareConcurrency_get", arguments, 4)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "cookieEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "cookieEnabled_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "appCodeName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appCodeName_get", arguments, 'Mozilla')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "appName", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appName_get", arguments, 'Netscape')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "appVersion", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "appVersion_get", arguments, '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "platform", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "platform_get", arguments, 'Win32')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "product", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "product_get", arguments, 'Gecko')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "userAgent", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "userAgent_get", arguments, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "language", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "language_get", arguments, 'zh-CN')}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "languages", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "languages_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "onLine", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "onLine_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "webdriver", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webdriver_get", arguments, false)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "getGamepads", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "getGamepads", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "javaEnabled", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "javaEnabled", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "sendBeacon", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "sendBeacon", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "vibrate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "vibrate", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "bluetooth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "bluetooth_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "clipboard", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "clipboard_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "credentials", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "credentials_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "keyboard", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "keyboard_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "managed", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "managed_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "mediaDevices", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mediaDevices_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "storage", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "storage_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "serviceWorker", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "serviceWorker_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "virtualKeyboard", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "virtualKeyboard_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "wakeLock", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "wakeLock_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "deviceMemory", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "deviceMemory_get", arguments, 8)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "ink", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "ink_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "hid", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "hid_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "locks", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "locks_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "mediaCapabilities", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mediaCapabilities_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "mediaSession", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "mediaSession_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "permissions", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "permissions_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "presentation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "presentation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "serial", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "serial_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "usb", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "usb_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "windowControlsOverlay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "windowControlsOverlay_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "xr", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "xr_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "userAgentData", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "userAgentData_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "canShare", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "canShare", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "share", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "share", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "clearAppBadge", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "clearAppBadge", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "getUserMedia", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "getUserMedia", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "requestMIDIAccess", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "requestMIDIAccess", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "requestMediaKeySystemAccess", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "requestMediaKeySystemAccess", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "setAppBadge", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "setAppBadge", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "webkitGetUserMedia", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "webkitGetUserMedia", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "getBattery", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "getBattery", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "getInstalledRelatedApps", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "getInstalledRelatedApps", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "registerProtocolHandler", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "registerProtocolHandler", arguments)}});
eggvm.toolsFunc.defineProperty(Navigator.prototype, "unregisterProtocolHandler", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "unregisterProtocolHandler", arguments)}});
// navigator对象
navigator = {}
Object.setPrototypeOf(navigator, Navigator.prototype);

// Location对象
Location = function Location(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Location, "Location");
// location对象
location = {}
Object.setPrototypeOf(location, Location.prototype);
eggvm.toolsFunc.defineProperty(location, "valueOf", {configurable:false, enumerable:false, writable:false, value:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "valueOf", arguments)}});
eggvm.toolsFunc.defineProperty(location, "ancestorOrigins", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "ancestorOrigins_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(location, "href", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "href_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "href_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "origin", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "origin_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(location, "protocol", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "protocol_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "protocol_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "host", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "host_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "host_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "hostname", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hostname_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hostname_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "port", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "port_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "port_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "pathname", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "pathname_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "pathname_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "search", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "search_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "search_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "hash", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hash_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hash_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "assign", {configurable:false, enumerable:true, writable:false, value:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "assign", arguments)}});
eggvm.toolsFunc.defineProperty(location, "reload", {configurable:false, enumerable:true, writable:false, value:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "reload", arguments)}});
eggvm.toolsFunc.defineProperty(location, "replace", {configurable:false, enumerable:true, writable:false, value:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "replace", arguments)}});
eggvm.toolsFunc.defineProperty(location, "toString", {configurable:false, enumerable:true, writable:false, value:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "toString", arguments)}});

// HTMLCollection对象
HTMLCollection = function HTMLCollection(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLCollection, "HTMLCollection");
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "item", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "namedItem", arguments)}});

// Plugin对象
Plugin = function Plugin(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Plugin, "Plugin");
eggvm.toolsFunc.defineProperty(Plugin.prototype, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "name_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Plugin.prototype, "filename", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "filename_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Plugin.prototype, "description", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "description_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Plugin.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Plugin.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "item", arguments)}});
eggvm.toolsFunc.defineProperty(Plugin.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Plugin.prototype, "Plugin", "namedItem", arguments)}});

// PluginArray对象
PluginArray = function PluginArray(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(PluginArray, "PluginArray");
eggvm.toolsFunc.defineProperty(PluginArray.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, PluginArray.prototype, "PluginArray", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(PluginArray.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, PluginArray.prototype, "PluginArray", "item", arguments)}});
eggvm.toolsFunc.defineProperty(PluginArray.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, PluginArray.prototype, "PluginArray", "namedItem", arguments)}});
eggvm.toolsFunc.defineProperty(PluginArray.prototype, "refresh", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, PluginArray.prototype, "PluginArray", "refresh", arguments)}});

// MimeType对象
MimeType = function MimeType(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(MimeType, "MimeType");
eggvm.toolsFunc.defineProperty(MimeType.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "type_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MimeType.prototype, "suffixes", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "suffixes_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MimeType.prototype, "description", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "description_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MimeType.prototype, "enabledPlugin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MimeType.prototype, "MimeType", "enabledPlugin_get", arguments)}, set:undefined});

// MimeTypeArray对象
MimeTypeArray = function MimeTypeArray(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(MimeTypeArray, "MimeTypeArray");
eggvm.toolsFunc.defineProperty(MimeTypeArray.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MimeTypeArray.prototype, "MimeTypeArray", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MimeTypeArray.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, MimeTypeArray.prototype, "MimeTypeArray", "item", arguments)}});
eggvm.toolsFunc.defineProperty(MimeTypeArray.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, MimeTypeArray.prototype, "MimeTypeArray", "namedItem", arguments)}});

// CSSStyleDeclaration对象
CSSStyleDeclaration = function CSSStyleDeclaration(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(CSSStyleDeclaration, "CSSStyleDeclaration");
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "cssText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "cssText_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "cssText_set", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "parentRule", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "parentRule_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "cssFloat", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "cssFloat_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "cssFloat_set", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "getPropertyPriority", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "getPropertyPriority", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "getPropertyValue", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "getPropertyValue", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "item", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "removeProperty", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "removeProperty", arguments)}});
eggvm.toolsFunc.defineProperty(CSSStyleDeclaration.prototype, "setProperty", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CSSStyleDeclaration.prototype, "CSSStyleDeclaration", "setProperty", arguments)}});

// CanvasRenderingContext2D对象
CanvasRenderingContext2D = function CanvasRenderingContext2D(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(CanvasRenderingContext2D, "CanvasRenderingContext2D");
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "canvas", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "canvas_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "globalAlpha", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "globalAlpha_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "globalAlpha_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "globalCompositeOperation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "globalCompositeOperation_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "globalCompositeOperation_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "filter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "filter_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "filter_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "imageSmoothingEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "imageSmoothingEnabled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "imageSmoothingEnabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "imageSmoothingQuality", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "imageSmoothingQuality_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "imageSmoothingQuality_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "strokeStyle", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "strokeStyle_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "strokeStyle_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fillStyle", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fillStyle_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fillStyle_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "shadowOffsetX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowOffsetX_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowOffsetX_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "shadowOffsetY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowOffsetY_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowOffsetY_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowBlur_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowBlur_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "shadowColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowColor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "shadowColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "lineWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineWidth_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineWidth_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "lineCap", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineCap_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineCap_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "lineJoin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineJoin_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineJoin_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "miterLimit", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "miterLimit_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "miterLimit_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "lineDashOffset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineDashOffset_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineDashOffset_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "font", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "font_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "font_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "textAlign", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textAlign_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textAlign_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "textBaseline", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textBaseline_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textBaseline_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "direction", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "direction_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "direction_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fontKerning", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontKerning_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontKerning_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fontStretch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontStretch_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontStretch_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fontVariantCaps", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontVariantCaps_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fontVariantCaps_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "letterSpacing", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "letterSpacing_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "letterSpacing_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "textRendering", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textRendering_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "textRendering_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "wordSpacing", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "wordSpacing_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "wordSpacing_set", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "clip", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "clip", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "createConicGradient", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "createConicGradient", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "createImageData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "createImageData", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "createLinearGradient", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "createLinearGradient", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "createPattern", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "createPattern", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "createRadialGradient", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "createRadialGradient", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "drawFocusIfNeeded", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "drawFocusIfNeeded", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "drawImage", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fill", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fill", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fillText", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "getContextAttributes", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "getContextAttributes", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "getImageData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "getImageData", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "getLineDash", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "getLineDash", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "getTransform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "getTransform", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "isContextLost", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "isContextLost", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "isPointInPath", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "isPointInPath", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "isPointInStroke", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "isPointInStroke", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "measureText", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "measureText", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "putImageData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "putImageData", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "reset", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "reset", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "roundRect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "roundRect", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "save", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "save", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "scale", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "scale", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "setLineDash", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "setLineDash", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "setTransform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "setTransform", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "stroke", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "stroke", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "strokeText", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "strokeText", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "transform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "transform", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "translate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "translate", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "arc", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "arc", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "arcTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "arcTo", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "beginPath", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "beginPath", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "bezierCurveTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "bezierCurveTo", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "clearRect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "clearRect", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "closePath", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "closePath", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "ellipse", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "ellipse", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "fillRect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "fillRect", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "lineTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "lineTo", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "moveTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "moveTo", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "quadraticCurveTo", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "quadraticCurveTo", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "rect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "rect", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "resetTransform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "resetTransform", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "restore", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "restore", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "rotate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "rotate", arguments)}});
eggvm.toolsFunc.defineProperty(CanvasRenderingContext2D.prototype, "strokeRect", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D", "strokeRect", arguments)}});

// WebGLRenderingContext对象
WebGLRenderingContext = function WebGLRenderingContext(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(WebGLRenderingContext, "WebGLRenderingContext");
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:256});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:1024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COLOR_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:16384});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "POINTS", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINES", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINE_LOOP", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINE_STRIP", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TRIANGLES", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TRIANGLE_STRIP", {configurable:false, enumerable:true, writable:false, value:5});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TRIANGLE_FAN", {configurable:false, enumerable:true, writable:false, value:6});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ZERO", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SRC_COLOR", {configurable:false, enumerable:true, writable:false, value:768});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_SRC_COLOR", {configurable:false, enumerable:true, writable:false, value:769});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:770});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:771});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:772});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:773});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DST_COLOR", {configurable:false, enumerable:true, writable:false, value:774});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_DST_COLOR", {configurable:false, enumerable:true, writable:false, value:775});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SRC_ALPHA_SATURATE", {configurable:false, enumerable:true, writable:false, value:776});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FUNC_ADD", {configurable:false, enumerable:true, writable:false, value:32774});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_EQUATION", {configurable:false, enumerable:true, writable:false, value:32777});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_EQUATION_RGB", {configurable:false, enumerable:true, writable:false, value:32777});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_EQUATION_ALPHA", {configurable:false, enumerable:true, writable:false, value:34877});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FUNC_SUBTRACT", {configurable:false, enumerable:true, writable:false, value:32778});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FUNC_REVERSE_SUBTRACT", {configurable:false, enumerable:true, writable:false, value:32779});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_DST_RGB", {configurable:false, enumerable:true, writable:false, value:32968});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_SRC_RGB", {configurable:false, enumerable:true, writable:false, value:32969});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:32970});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:32971});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CONSTANT_COLOR", {configurable:false, enumerable:true, writable:false, value:32769});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_CONSTANT_COLOR", {configurable:false, enumerable:true, writable:false, value:32770});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CONSTANT_ALPHA", {configurable:false, enumerable:true, writable:false, value:32771});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ONE_MINUS_CONSTANT_ALPHA", {configurable:false, enumerable:true, writable:false, value:32772});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND_COLOR", {configurable:false, enumerable:true, writable:false, value:32773});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ARRAY_BUFFER", {configurable:false, enumerable:true, writable:false, value:34962});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ELEMENT_ARRAY_BUFFER", {configurable:false, enumerable:true, writable:false, value:34963});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34964});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ELEMENT_ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34965});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STREAM_DRAW", {configurable:false, enumerable:true, writable:false, value:35040});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STATIC_DRAW", {configurable:false, enumerable:true, writable:false, value:35044});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DYNAMIC_DRAW", {configurable:false, enumerable:true, writable:false, value:35048});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BUFFER_SIZE", {configurable:false, enumerable:true, writable:false, value:34660});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BUFFER_USAGE", {configurable:false, enumerable:true, writable:false, value:34661});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CURRENT_VERTEX_ATTRIB", {configurable:false, enumerable:true, writable:false, value:34342});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRONT", {configurable:false, enumerable:true, writable:false, value:1028});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BACK", {configurable:false, enumerable:true, writable:false, value:1029});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRONT_AND_BACK", {configurable:false, enumerable:true, writable:false, value:1032});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_2D", {configurable:false, enumerable:true, writable:false, value:3553});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CULL_FACE", {configurable:false, enumerable:true, writable:false, value:2884});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLEND", {configurable:false, enumerable:true, writable:false, value:3042});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DITHER", {configurable:false, enumerable:true, writable:false, value:3024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_TEST", {configurable:false, enumerable:true, writable:false, value:2960});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_TEST", {configurable:false, enumerable:true, writable:false, value:2929});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SCISSOR_TEST", {configurable:false, enumerable:true, writable:false, value:3089});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "POLYGON_OFFSET_FILL", {configurable:false, enumerable:true, writable:false, value:32823});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLE_ALPHA_TO_COVERAGE", {configurable:false, enumerable:true, writable:false, value:32926});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLE_COVERAGE", {configurable:false, enumerable:true, writable:false, value:32928});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NO_ERROR", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INVALID_ENUM", {configurable:false, enumerable:true, writable:false, value:1280});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INVALID_VALUE", {configurable:false, enumerable:true, writable:false, value:1281});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INVALID_OPERATION", {configurable:false, enumerable:true, writable:false, value:1282});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "OUT_OF_MEMORY", {configurable:false, enumerable:true, writable:false, value:1285});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CW", {configurable:false, enumerable:true, writable:false, value:2304});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CCW", {configurable:false, enumerable:true, writable:false, value:2305});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINE_WIDTH", {configurable:false, enumerable:true, writable:false, value:2849});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ALIASED_POINT_SIZE_RANGE", {configurable:false, enumerable:true, writable:false, value:33901});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ALIASED_LINE_WIDTH_RANGE", {configurable:false, enumerable:true, writable:false, value:33902});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CULL_FACE_MODE", {configurable:false, enumerable:true, writable:false, value:2885});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRONT_FACE", {configurable:false, enumerable:true, writable:false, value:2886});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_RANGE", {configurable:false, enumerable:true, writable:false, value:2928});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:2930});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:2931});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_FUNC", {configurable:false, enumerable:true, writable:false, value:2932});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:2961});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_FUNC", {configurable:false, enumerable:true, writable:false, value:2962});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_FAIL", {configurable:false, enumerable:true, writable:false, value:2964});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_PASS_DEPTH_FAIL", {configurable:false, enumerable:true, writable:false, value:2965});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_PASS_DEPTH_PASS", {configurable:false, enumerable:true, writable:false, value:2966});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_REF", {configurable:false, enumerable:true, writable:false, value:2967});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_VALUE_MASK", {configurable:false, enumerable:true, writable:false, value:2963});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:2968});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_FUNC", {configurable:false, enumerable:true, writable:false, value:34816});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_FAIL", {configurable:false, enumerable:true, writable:false, value:34817});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_PASS_DEPTH_FAIL", {configurable:false, enumerable:true, writable:false, value:34818});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_PASS_DEPTH_PASS", {configurable:false, enumerable:true, writable:false, value:34819});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_REF", {configurable:false, enumerable:true, writable:false, value:36003});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_VALUE_MASK", {configurable:false, enumerable:true, writable:false, value:36004});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BACK_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:36005});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VIEWPORT", {configurable:false, enumerable:true, writable:false, value:2978});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SCISSOR_BOX", {configurable:false, enumerable:true, writable:false, value:3088});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COLOR_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:3106});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COLOR_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:3107});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNPACK_ALIGNMENT", {configurable:false, enumerable:true, writable:false, value:3317});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "PACK_ALIGNMENT", {configurable:false, enumerable:true, writable:false, value:3333});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_TEXTURE_SIZE", {configurable:false, enumerable:true, writable:false, value:3379});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_VIEWPORT_DIMS", {configurable:false, enumerable:true, writable:false, value:3386});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SUBPIXEL_BITS", {configurable:false, enumerable:true, writable:false, value:3408});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RED_BITS", {configurable:false, enumerable:true, writable:false, value:3410});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "GREEN_BITS", {configurable:false, enumerable:true, writable:false, value:3411});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BLUE_BITS", {configurable:false, enumerable:true, writable:false, value:3412});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ALPHA_BITS", {configurable:false, enumerable:true, writable:false, value:3413});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_BITS", {configurable:false, enumerable:true, writable:false, value:3414});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_BITS", {configurable:false, enumerable:true, writable:false, value:3415});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "POLYGON_OFFSET_UNITS", {configurable:false, enumerable:true, writable:false, value:10752});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "POLYGON_OFFSET_FACTOR", {configurable:false, enumerable:true, writable:false, value:32824});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_BINDING_2D", {configurable:false, enumerable:true, writable:false, value:32873});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLE_BUFFERS", {configurable:false, enumerable:true, writable:false, value:32936});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLES", {configurable:false, enumerable:true, writable:false, value:32937});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLE_COVERAGE_VALUE", {configurable:false, enumerable:true, writable:false, value:32938});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLE_COVERAGE_INVERT", {configurable:false, enumerable:true, writable:false, value:32939});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COMPRESSED_TEXTURE_FORMATS", {configurable:false, enumerable:true, writable:false, value:34467});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DONT_CARE", {configurable:false, enumerable:true, writable:false, value:4352});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FASTEST", {configurable:false, enumerable:true, writable:false, value:4353});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NICEST", {configurable:false, enumerable:true, writable:false, value:4354});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "GENERATE_MIPMAP_HINT", {configurable:false, enumerable:true, writable:false, value:33170});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BYTE", {configurable:false, enumerable:true, writable:false, value:5120});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_BYTE", {configurable:false, enumerable:true, writable:false, value:5121});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SHORT", {configurable:false, enumerable:true, writable:false, value:5122});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_SHORT", {configurable:false, enumerable:true, writable:false, value:5123});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INT", {configurable:false, enumerable:true, writable:false, value:5124});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_INT", {configurable:false, enumerable:true, writable:false, value:5125});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT", {configurable:false, enumerable:true, writable:false, value:5126});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_COMPONENT", {configurable:false, enumerable:true, writable:false, value:6402});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ALPHA", {configurable:false, enumerable:true, writable:false, value:6406});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RGB", {configurable:false, enumerable:true, writable:false, value:6407});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RGBA", {configurable:false, enumerable:true, writable:false, value:6408});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LUMINANCE", {configurable:false, enumerable:true, writable:false, value:6409});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LUMINANCE_ALPHA", {configurable:false, enumerable:true, writable:false, value:6410});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_SHORT_4_4_4_4", {configurable:false, enumerable:true, writable:false, value:32819});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_SHORT_5_5_5_1", {configurable:false, enumerable:true, writable:false, value:32820});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNSIGNED_SHORT_5_6_5", {configurable:false, enumerable:true, writable:false, value:33635});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAGMENT_SHADER", {configurable:false, enumerable:true, writable:false, value:35632});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_SHADER", {configurable:false, enumerable:true, writable:false, value:35633});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_VERTEX_ATTRIBS", {configurable:false, enumerable:true, writable:false, value:34921});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_VERTEX_UNIFORM_VECTORS", {configurable:false, enumerable:true, writable:false, value:36347});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_VARYING_VECTORS", {configurable:false, enumerable:true, writable:false, value:36348});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:35661});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:35660});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:34930});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_FRAGMENT_UNIFORM_VECTORS", {configurable:false, enumerable:true, writable:false, value:36349});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SHADER_TYPE", {configurable:false, enumerable:true, writable:false, value:35663});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DELETE_STATUS", {configurable:false, enumerable:true, writable:false, value:35712});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINK_STATUS", {configurable:false, enumerable:true, writable:false, value:35714});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VALIDATE_STATUS", {configurable:false, enumerable:true, writable:false, value:35715});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ATTACHED_SHADERS", {configurable:false, enumerable:true, writable:false, value:35717});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ACTIVE_UNIFORMS", {configurable:false, enumerable:true, writable:false, value:35718});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ACTIVE_ATTRIBUTES", {configurable:false, enumerable:true, writable:false, value:35721});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SHADING_LANGUAGE_VERSION", {configurable:false, enumerable:true, writable:false, value:35724});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CURRENT_PROGRAM", {configurable:false, enumerable:true, writable:false, value:35725});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NEVER", {configurable:false, enumerable:true, writable:false, value:512});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LESS", {configurable:false, enumerable:true, writable:false, value:513});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "EQUAL", {configurable:false, enumerable:true, writable:false, value:514});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LEQUAL", {configurable:false, enumerable:true, writable:false, value:515});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "GREATER", {configurable:false, enumerable:true, writable:false, value:516});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NOTEQUAL", {configurable:false, enumerable:true, writable:false, value:517});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "GEQUAL", {configurable:false, enumerable:true, writable:false, value:518});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ALWAYS", {configurable:false, enumerable:true, writable:false, value:519});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "KEEP", {configurable:false, enumerable:true, writable:false, value:7680});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "REPLACE", {configurable:false, enumerable:true, writable:false, value:7681});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INCR", {configurable:false, enumerable:true, writable:false, value:7682});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DECR", {configurable:false, enumerable:true, writable:false, value:7683});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INVERT", {configurable:false, enumerable:true, writable:false, value:5386});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INCR_WRAP", {configurable:false, enumerable:true, writable:false, value:34055});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DECR_WRAP", {configurable:false, enumerable:true, writable:false, value:34056});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VENDOR", {configurable:false, enumerable:true, writable:false, value:7936});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERER", {configurable:false, enumerable:true, writable:false, value:7937});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERSION", {configurable:false, enumerable:true, writable:false, value:7938});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NEAREST", {configurable:false, enumerable:true, writable:false, value:9728});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINEAR", {configurable:false, enumerable:true, writable:false, value:9729});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NEAREST_MIPMAP_NEAREST", {configurable:false, enumerable:true, writable:false, value:9984});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINEAR_MIPMAP_NEAREST", {configurable:false, enumerable:true, writable:false, value:9985});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NEAREST_MIPMAP_LINEAR", {configurable:false, enumerable:true, writable:false, value:9986});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LINEAR_MIPMAP_LINEAR", {configurable:false, enumerable:true, writable:false, value:9987});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_MAG_FILTER", {configurable:false, enumerable:true, writable:false, value:10240});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_MIN_FILTER", {configurable:false, enumerable:true, writable:false, value:10241});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_WRAP_S", {configurable:false, enumerable:true, writable:false, value:10242});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_WRAP_T", {configurable:false, enumerable:true, writable:false, value:10243});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE", {configurable:false, enumerable:true, writable:false, value:5890});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP", {configurable:false, enumerable:true, writable:false, value:34067});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_BINDING_CUBE_MAP", {configurable:false, enumerable:true, writable:false, value:34068});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_POSITIVE_X", {configurable:false, enumerable:true, writable:false, value:34069});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_NEGATIVE_X", {configurable:false, enumerable:true, writable:false, value:34070});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_POSITIVE_Y", {configurable:false, enumerable:true, writable:false, value:34071});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_NEGATIVE_Y", {configurable:false, enumerable:true, writable:false, value:34072});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_POSITIVE_Z", {configurable:false, enumerable:true, writable:false, value:34073});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE_CUBE_MAP_NEGATIVE_Z", {configurable:false, enumerable:true, writable:false, value:34074});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_CUBE_MAP_TEXTURE_SIZE", {configurable:false, enumerable:true, writable:false, value:34076});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE0", {configurable:false, enumerable:true, writable:false, value:33984});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE1", {configurable:false, enumerable:true, writable:false, value:33985});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE2", {configurable:false, enumerable:true, writable:false, value:33986});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE3", {configurable:false, enumerable:true, writable:false, value:33987});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE4", {configurable:false, enumerable:true, writable:false, value:33988});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE5", {configurable:false, enumerable:true, writable:false, value:33989});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE6", {configurable:false, enumerable:true, writable:false, value:33990});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE7", {configurable:false, enumerable:true, writable:false, value:33991});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE8", {configurable:false, enumerable:true, writable:false, value:33992});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE9", {configurable:false, enumerable:true, writable:false, value:33993});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE10", {configurable:false, enumerable:true, writable:false, value:33994});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE11", {configurable:false, enumerable:true, writable:false, value:33995});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE12", {configurable:false, enumerable:true, writable:false, value:33996});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE13", {configurable:false, enumerable:true, writable:false, value:33997});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE14", {configurable:false, enumerable:true, writable:false, value:33998});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE15", {configurable:false, enumerable:true, writable:false, value:33999});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE16", {configurable:false, enumerable:true, writable:false, value:34000});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE17", {configurable:false, enumerable:true, writable:false, value:34001});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE18", {configurable:false, enumerable:true, writable:false, value:34002});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE19", {configurable:false, enumerable:true, writable:false, value:34003});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE20", {configurable:false, enumerable:true, writable:false, value:34004});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE21", {configurable:false, enumerable:true, writable:false, value:34005});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE22", {configurable:false, enumerable:true, writable:false, value:34006});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE23", {configurable:false, enumerable:true, writable:false, value:34007});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE24", {configurable:false, enumerable:true, writable:false, value:34008});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE25", {configurable:false, enumerable:true, writable:false, value:34009});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE26", {configurable:false, enumerable:true, writable:false, value:34010});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE27", {configurable:false, enumerable:true, writable:false, value:34011});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE28", {configurable:false, enumerable:true, writable:false, value:34012});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE29", {configurable:false, enumerable:true, writable:false, value:34013});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE30", {configurable:false, enumerable:true, writable:false, value:34014});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "TEXTURE31", {configurable:false, enumerable:true, writable:false, value:34015});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "ACTIVE_TEXTURE", {configurable:false, enumerable:true, writable:false, value:34016});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "REPEAT", {configurable:false, enumerable:true, writable:false, value:10497});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CLAMP_TO_EDGE", {configurable:false, enumerable:true, writable:false, value:33071});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MIRRORED_REPEAT", {configurable:false, enumerable:true, writable:false, value:33648});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_VEC2", {configurable:false, enumerable:true, writable:false, value:35664});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_VEC3", {configurable:false, enumerable:true, writable:false, value:35665});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_VEC4", {configurable:false, enumerable:true, writable:false, value:35666});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INT_VEC2", {configurable:false, enumerable:true, writable:false, value:35667});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INT_VEC3", {configurable:false, enumerable:true, writable:false, value:35668});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INT_VEC4", {configurable:false, enumerable:true, writable:false, value:35669});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BOOL", {configurable:false, enumerable:true, writable:false, value:35670});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BOOL_VEC2", {configurable:false, enumerable:true, writable:false, value:35671});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BOOL_VEC3", {configurable:false, enumerable:true, writable:false, value:35672});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BOOL_VEC4", {configurable:false, enumerable:true, writable:false, value:35673});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_MAT2", {configurable:false, enumerable:true, writable:false, value:35674});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_MAT3", {configurable:false, enumerable:true, writable:false, value:35675});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FLOAT_MAT4", {configurable:false, enumerable:true, writable:false, value:35676});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLER_2D", {configurable:false, enumerable:true, writable:false, value:35678});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "SAMPLER_CUBE", {configurable:false, enumerable:true, writable:false, value:35680});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_ENABLED", {configurable:false, enumerable:true, writable:false, value:34338});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_SIZE", {configurable:false, enumerable:true, writable:false, value:34339});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_STRIDE", {configurable:false, enumerable:true, writable:false, value:34340});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_TYPE", {configurable:false, enumerable:true, writable:false, value:34341});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_NORMALIZED", {configurable:false, enumerable:true, writable:false, value:34922});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_POINTER", {configurable:false, enumerable:true, writable:false, value:34373});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34975});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "IMPLEMENTATION_COLOR_READ_TYPE", {configurable:false, enumerable:true, writable:false, value:35738});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "IMPLEMENTATION_COLOR_READ_FORMAT", {configurable:false, enumerable:true, writable:false, value:35739});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COMPILE_STATUS", {configurable:false, enumerable:true, writable:false, value:35713});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LOW_FLOAT", {configurable:false, enumerable:true, writable:false, value:36336});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MEDIUM_FLOAT", {configurable:false, enumerable:true, writable:false, value:36337});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "HIGH_FLOAT", {configurable:false, enumerable:true, writable:false, value:36338});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "LOW_INT", {configurable:false, enumerable:true, writable:false, value:36339});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MEDIUM_INT", {configurable:false, enumerable:true, writable:false, value:36340});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "HIGH_INT", {configurable:false, enumerable:true, writable:false, value:36341});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER", {configurable:false, enumerable:true, writable:false, value:36160});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER", {configurable:false, enumerable:true, writable:false, value:36161});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RGBA4", {configurable:false, enumerable:true, writable:false, value:32854});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RGB5_A1", {configurable:false, enumerable:true, writable:false, value:32855});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RGB565", {configurable:false, enumerable:true, writable:false, value:36194});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_COMPONENT16", {configurable:false, enumerable:true, writable:false, value:33189});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_INDEX8", {configurable:false, enumerable:true, writable:false, value:36168});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_STENCIL", {configurable:false, enumerable:true, writable:false, value:34041});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_WIDTH", {configurable:false, enumerable:true, writable:false, value:36162});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_HEIGHT", {configurable:false, enumerable:true, writable:false, value:36163});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_INTERNAL_FORMAT", {configurable:false, enumerable:true, writable:false, value:36164});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_RED_SIZE", {configurable:false, enumerable:true, writable:false, value:36176});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_GREEN_SIZE", {configurable:false, enumerable:true, writable:false, value:36177});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_BLUE_SIZE", {configurable:false, enumerable:true, writable:false, value:36178});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_ALPHA_SIZE", {configurable:false, enumerable:true, writable:false, value:36179});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_DEPTH_SIZE", {configurable:false, enumerable:true, writable:false, value:36180});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_STENCIL_SIZE", {configurable:false, enumerable:true, writable:false, value:36181});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", {configurable:false, enumerable:true, writable:false, value:36048});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", {configurable:false, enumerable:true, writable:false, value:36049});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", {configurable:false, enumerable:true, writable:false, value:36050});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE", {configurable:false, enumerable:true, writable:false, value:36051});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "COLOR_ATTACHMENT0", {configurable:false, enumerable:true, writable:false, value:36064});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36096});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "STENCIL_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36128});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "DEPTH_STENCIL_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:33306});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "NONE", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_COMPLETE", {configurable:false, enumerable:true, writable:false, value:36053});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_INCOMPLETE_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36054});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36055});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_INCOMPLETE_DIMENSIONS", {configurable:false, enumerable:true, writable:false, value:36057});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_UNSUPPORTED", {configurable:false, enumerable:true, writable:false, value:36061});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "FRAMEBUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:36006});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "RENDERBUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:36007});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "MAX_RENDERBUFFER_SIZE", {configurable:false, enumerable:true, writable:false, value:34024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "INVALID_FRAMEBUFFER_OPERATION", {configurable:false, enumerable:true, writable:false, value:1286});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNPACK_FLIP_Y_WEBGL", {configurable:false, enumerable:true, writable:false, value:37440});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNPACK_PREMULTIPLY_ALPHA_WEBGL", {configurable:false, enumerable:true, writable:false, value:37441});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "CONTEXT_LOST_WEBGL", {configurable:false, enumerable:true, writable:false, value:37442});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "UNPACK_COLORSPACE_CONVERSION_WEBGL", {configurable:false, enumerable:true, writable:false, value:37443});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext, "BROWSER_DEFAULT_WEBGL", {configurable:false, enumerable:true, writable:false, value:37444});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "canvas", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "canvas_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "drawingBufferWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawingBufferWidth_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "drawingBufferHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawingBufferHeight_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:256});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:1024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COLOR_BUFFER_BIT", {configurable:false, enumerable:true, writable:false, value:16384});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "POINTS", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINES", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINE_LOOP", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINE_STRIP", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TRIANGLES", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TRIANGLE_STRIP", {configurable:false, enumerable:true, writable:false, value:5});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TRIANGLE_FAN", {configurable:false, enumerable:true, writable:false, value:6});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ZERO", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SRC_COLOR", {configurable:false, enumerable:true, writable:false, value:768});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_SRC_COLOR", {configurable:false, enumerable:true, writable:false, value:769});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:770});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:771});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:772});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:773});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DST_COLOR", {configurable:false, enumerable:true, writable:false, value:774});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_DST_COLOR", {configurable:false, enumerable:true, writable:false, value:775});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SRC_ALPHA_SATURATE", {configurable:false, enumerable:true, writable:false, value:776});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FUNC_ADD", {configurable:false, enumerable:true, writable:false, value:32774});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_EQUATION", {configurable:false, enumerable:true, writable:false, value:32777});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_EQUATION_RGB", {configurable:false, enumerable:true, writable:false, value:32777});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_EQUATION_ALPHA", {configurable:false, enumerable:true, writable:false, value:34877});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FUNC_SUBTRACT", {configurable:false, enumerable:true, writable:false, value:32778});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FUNC_REVERSE_SUBTRACT", {configurable:false, enumerable:true, writable:false, value:32779});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_DST_RGB", {configurable:false, enumerable:true, writable:false, value:32968});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_SRC_RGB", {configurable:false, enumerable:true, writable:false, value:32969});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_DST_ALPHA", {configurable:false, enumerable:true, writable:false, value:32970});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_SRC_ALPHA", {configurable:false, enumerable:true, writable:false, value:32971});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CONSTANT_COLOR", {configurable:false, enumerable:true, writable:false, value:32769});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_CONSTANT_COLOR", {configurable:false, enumerable:true, writable:false, value:32770});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CONSTANT_ALPHA", {configurable:false, enumerable:true, writable:false, value:32771});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ONE_MINUS_CONSTANT_ALPHA", {configurable:false, enumerable:true, writable:false, value:32772});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND_COLOR", {configurable:false, enumerable:true, writable:false, value:32773});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ARRAY_BUFFER", {configurable:false, enumerable:true, writable:false, value:34962});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ELEMENT_ARRAY_BUFFER", {configurable:false, enumerable:true, writable:false, value:34963});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34964});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ELEMENT_ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34965});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STREAM_DRAW", {configurable:false, enumerable:true, writable:false, value:35040});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STATIC_DRAW", {configurable:false, enumerable:true, writable:false, value:35044});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DYNAMIC_DRAW", {configurable:false, enumerable:true, writable:false, value:35048});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BUFFER_SIZE", {configurable:false, enumerable:true, writable:false, value:34660});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BUFFER_USAGE", {configurable:false, enumerable:true, writable:false, value:34661});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CURRENT_VERTEX_ATTRIB", {configurable:false, enumerable:true, writable:false, value:34342});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRONT", {configurable:false, enumerable:true, writable:false, value:1028});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BACK", {configurable:false, enumerable:true, writable:false, value:1029});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRONT_AND_BACK", {configurable:false, enumerable:true, writable:false, value:1032});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_2D", {configurable:false, enumerable:true, writable:false, value:3553});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CULL_FACE", {configurable:false, enumerable:true, writable:false, value:2884});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLEND", {configurable:false, enumerable:true, writable:false, value:3042});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DITHER", {configurable:false, enumerable:true, writable:false, value:3024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_TEST", {configurable:false, enumerable:true, writable:false, value:2960});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_TEST", {configurable:false, enumerable:true, writable:false, value:2929});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SCISSOR_TEST", {configurable:false, enumerable:true, writable:false, value:3089});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "POLYGON_OFFSET_FILL", {configurable:false, enumerable:true, writable:false, value:32823});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLE_ALPHA_TO_COVERAGE", {configurable:false, enumerable:true, writable:false, value:32926});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLE_COVERAGE", {configurable:false, enumerable:true, writable:false, value:32928});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NO_ERROR", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INVALID_ENUM", {configurable:false, enumerable:true, writable:false, value:1280});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INVALID_VALUE", {configurable:false, enumerable:true, writable:false, value:1281});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INVALID_OPERATION", {configurable:false, enumerable:true, writable:false, value:1282});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "OUT_OF_MEMORY", {configurable:false, enumerable:true, writable:false, value:1285});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CW", {configurable:false, enumerable:true, writable:false, value:2304});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CCW", {configurable:false, enumerable:true, writable:false, value:2305});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINE_WIDTH", {configurable:false, enumerable:true, writable:false, value:2849});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ALIASED_POINT_SIZE_RANGE", {configurable:false, enumerable:true, writable:false, value:33901});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ALIASED_LINE_WIDTH_RANGE", {configurable:false, enumerable:true, writable:false, value:33902});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CULL_FACE_MODE", {configurable:false, enumerable:true, writable:false, value:2885});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRONT_FACE", {configurable:false, enumerable:true, writable:false, value:2886});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_RANGE", {configurable:false, enumerable:true, writable:false, value:2928});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:2930});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:2931});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_FUNC", {configurable:false, enumerable:true, writable:false, value:2932});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:2961});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_FUNC", {configurable:false, enumerable:true, writable:false, value:2962});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_FAIL", {configurable:false, enumerable:true, writable:false, value:2964});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_PASS_DEPTH_FAIL", {configurable:false, enumerable:true, writable:false, value:2965});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_PASS_DEPTH_PASS", {configurable:false, enumerable:true, writable:false, value:2966});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_REF", {configurable:false, enumerable:true, writable:false, value:2967});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_VALUE_MASK", {configurable:false, enumerable:true, writable:false, value:2963});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:2968});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_FUNC", {configurable:false, enumerable:true, writable:false, value:34816});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_FAIL", {configurable:false, enumerable:true, writable:false, value:34817});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_PASS_DEPTH_FAIL", {configurable:false, enumerable:true, writable:false, value:34818});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_PASS_DEPTH_PASS", {configurable:false, enumerable:true, writable:false, value:34819});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_REF", {configurable:false, enumerable:true, writable:false, value:36003});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_VALUE_MASK", {configurable:false, enumerable:true, writable:false, value:36004});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BACK_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:36005});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VIEWPORT", {configurable:false, enumerable:true, writable:false, value:2978});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SCISSOR_BOX", {configurable:false, enumerable:true, writable:false, value:3088});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COLOR_CLEAR_VALUE", {configurable:false, enumerable:true, writable:false, value:3106});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COLOR_WRITEMASK", {configurable:false, enumerable:true, writable:false, value:3107});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNPACK_ALIGNMENT", {configurable:false, enumerable:true, writable:false, value:3317});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "PACK_ALIGNMENT", {configurable:false, enumerable:true, writable:false, value:3333});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_TEXTURE_SIZE", {configurable:false, enumerable:true, writable:false, value:3379});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_VIEWPORT_DIMS", {configurable:false, enumerable:true, writable:false, value:3386});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SUBPIXEL_BITS", {configurable:false, enumerable:true, writable:false, value:3408});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RED_BITS", {configurable:false, enumerable:true, writable:false, value:3410});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "GREEN_BITS", {configurable:false, enumerable:true, writable:false, value:3411});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BLUE_BITS", {configurable:false, enumerable:true, writable:false, value:3412});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ALPHA_BITS", {configurable:false, enumerable:true, writable:false, value:3413});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_BITS", {configurable:false, enumerable:true, writable:false, value:3414});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_BITS", {configurable:false, enumerable:true, writable:false, value:3415});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "POLYGON_OFFSET_UNITS", {configurable:false, enumerable:true, writable:false, value:10752});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "POLYGON_OFFSET_FACTOR", {configurable:false, enumerable:true, writable:false, value:32824});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_BINDING_2D", {configurable:false, enumerable:true, writable:false, value:32873});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLE_BUFFERS", {configurable:false, enumerable:true, writable:false, value:32936});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLES", {configurable:false, enumerable:true, writable:false, value:32937});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLE_COVERAGE_VALUE", {configurable:false, enumerable:true, writable:false, value:32938});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLE_COVERAGE_INVERT", {configurable:false, enumerable:true, writable:false, value:32939});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COMPRESSED_TEXTURE_FORMATS", {configurable:false, enumerable:true, writable:false, value:34467});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DONT_CARE", {configurable:false, enumerable:true, writable:false, value:4352});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FASTEST", {configurable:false, enumerable:true, writable:false, value:4353});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NICEST", {configurable:false, enumerable:true, writable:false, value:4354});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "GENERATE_MIPMAP_HINT", {configurable:false, enumerable:true, writable:false, value:33170});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BYTE", {configurable:false, enumerable:true, writable:false, value:5120});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_BYTE", {configurable:false, enumerable:true, writable:false, value:5121});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SHORT", {configurable:false, enumerable:true, writable:false, value:5122});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_SHORT", {configurable:false, enumerable:true, writable:false, value:5123});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INT", {configurable:false, enumerable:true, writable:false, value:5124});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_INT", {configurable:false, enumerable:true, writable:false, value:5125});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT", {configurable:false, enumerable:true, writable:false, value:5126});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_COMPONENT", {configurable:false, enumerable:true, writable:false, value:6402});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ALPHA", {configurable:false, enumerable:true, writable:false, value:6406});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RGB", {configurable:false, enumerable:true, writable:false, value:6407});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RGBA", {configurable:false, enumerable:true, writable:false, value:6408});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LUMINANCE", {configurable:false, enumerable:true, writable:false, value:6409});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LUMINANCE_ALPHA", {configurable:false, enumerable:true, writable:false, value:6410});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_SHORT_4_4_4_4", {configurable:false, enumerable:true, writable:false, value:32819});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_SHORT_5_5_5_1", {configurable:false, enumerable:true, writable:false, value:32820});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNSIGNED_SHORT_5_6_5", {configurable:false, enumerable:true, writable:false, value:33635});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAGMENT_SHADER", {configurable:false, enumerable:true, writable:false, value:35632});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_SHADER", {configurable:false, enumerable:true, writable:false, value:35633});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_VERTEX_ATTRIBS", {configurable:false, enumerable:true, writable:false, value:34921});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_VERTEX_UNIFORM_VECTORS", {configurable:false, enumerable:true, writable:false, value:36347});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_VARYING_VECTORS", {configurable:false, enumerable:true, writable:false, value:36348});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:35661});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:35660});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_TEXTURE_IMAGE_UNITS", {configurable:false, enumerable:true, writable:false, value:34930});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_FRAGMENT_UNIFORM_VECTORS", {configurable:false, enumerable:true, writable:false, value:36349});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SHADER_TYPE", {configurable:false, enumerable:true, writable:false, value:35663});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DELETE_STATUS", {configurable:false, enumerable:true, writable:false, value:35712});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINK_STATUS", {configurable:false, enumerable:true, writable:false, value:35714});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VALIDATE_STATUS", {configurable:false, enumerable:true, writable:false, value:35715});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ATTACHED_SHADERS", {configurable:false, enumerable:true, writable:false, value:35717});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ACTIVE_UNIFORMS", {configurable:false, enumerable:true, writable:false, value:35718});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ACTIVE_ATTRIBUTES", {configurable:false, enumerable:true, writable:false, value:35721});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SHADING_LANGUAGE_VERSION", {configurable:false, enumerable:true, writable:false, value:35724});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CURRENT_PROGRAM", {configurable:false, enumerable:true, writable:false, value:35725});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NEVER", {configurable:false, enumerable:true, writable:false, value:512});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LESS", {configurable:false, enumerable:true, writable:false, value:513});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "EQUAL", {configurable:false, enumerable:true, writable:false, value:514});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LEQUAL", {configurable:false, enumerable:true, writable:false, value:515});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "GREATER", {configurable:false, enumerable:true, writable:false, value:516});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NOTEQUAL", {configurable:false, enumerable:true, writable:false, value:517});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "GEQUAL", {configurable:false, enumerable:true, writable:false, value:518});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ALWAYS", {configurable:false, enumerable:true, writable:false, value:519});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "KEEP", {configurable:false, enumerable:true, writable:false, value:7680});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "REPLACE", {configurable:false, enumerable:true, writable:false, value:7681});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INCR", {configurable:false, enumerable:true, writable:false, value:7682});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DECR", {configurable:false, enumerable:true, writable:false, value:7683});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INVERT", {configurable:false, enumerable:true, writable:false, value:5386});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INCR_WRAP", {configurable:false, enumerable:true, writable:false, value:34055});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DECR_WRAP", {configurable:false, enumerable:true, writable:false, value:34056});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VENDOR", {configurable:false, enumerable:true, writable:false, value:7936});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERER", {configurable:false, enumerable:true, writable:false, value:7937});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERSION", {configurable:false, enumerable:true, writable:false, value:7938});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NEAREST", {configurable:false, enumerable:true, writable:false, value:9728});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINEAR", {configurable:false, enumerable:true, writable:false, value:9729});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NEAREST_MIPMAP_NEAREST", {configurable:false, enumerable:true, writable:false, value:9984});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINEAR_MIPMAP_NEAREST", {configurable:false, enumerable:true, writable:false, value:9985});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NEAREST_MIPMAP_LINEAR", {configurable:false, enumerable:true, writable:false, value:9986});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LINEAR_MIPMAP_LINEAR", {configurable:false, enumerable:true, writable:false, value:9987});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_MAG_FILTER", {configurable:false, enumerable:true, writable:false, value:10240});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_MIN_FILTER", {configurable:false, enumerable:true, writable:false, value:10241});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_WRAP_S", {configurable:false, enumerable:true, writable:false, value:10242});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_WRAP_T", {configurable:false, enumerable:true, writable:false, value:10243});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE", {configurable:false, enumerable:true, writable:false, value:5890});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP", {configurable:false, enumerable:true, writable:false, value:34067});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_BINDING_CUBE_MAP", {configurable:false, enumerable:true, writable:false, value:34068});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_POSITIVE_X", {configurable:false, enumerable:true, writable:false, value:34069});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_NEGATIVE_X", {configurable:false, enumerable:true, writable:false, value:34070});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_POSITIVE_Y", {configurable:false, enumerable:true, writable:false, value:34071});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_NEGATIVE_Y", {configurable:false, enumerable:true, writable:false, value:34072});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_POSITIVE_Z", {configurable:false, enumerable:true, writable:false, value:34073});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE_CUBE_MAP_NEGATIVE_Z", {configurable:false, enumerable:true, writable:false, value:34074});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_CUBE_MAP_TEXTURE_SIZE", {configurable:false, enumerable:true, writable:false, value:34076});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE0", {configurable:false, enumerable:true, writable:false, value:33984});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE1", {configurable:false, enumerable:true, writable:false, value:33985});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE2", {configurable:false, enumerable:true, writable:false, value:33986});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE3", {configurable:false, enumerable:true, writable:false, value:33987});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE4", {configurable:false, enumerable:true, writable:false, value:33988});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE5", {configurable:false, enumerable:true, writable:false, value:33989});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE6", {configurable:false, enumerable:true, writable:false, value:33990});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE7", {configurable:false, enumerable:true, writable:false, value:33991});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE8", {configurable:false, enumerable:true, writable:false, value:33992});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE9", {configurable:false, enumerable:true, writable:false, value:33993});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE10", {configurable:false, enumerable:true, writable:false, value:33994});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE11", {configurable:false, enumerable:true, writable:false, value:33995});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE12", {configurable:false, enumerable:true, writable:false, value:33996});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE13", {configurable:false, enumerable:true, writable:false, value:33997});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE14", {configurable:false, enumerable:true, writable:false, value:33998});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE15", {configurable:false, enumerable:true, writable:false, value:33999});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE16", {configurable:false, enumerable:true, writable:false, value:34000});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE17", {configurable:false, enumerable:true, writable:false, value:34001});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE18", {configurable:false, enumerable:true, writable:false, value:34002});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE19", {configurable:false, enumerable:true, writable:false, value:34003});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE20", {configurable:false, enumerable:true, writable:false, value:34004});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE21", {configurable:false, enumerable:true, writable:false, value:34005});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE22", {configurable:false, enumerable:true, writable:false, value:34006});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE23", {configurable:false, enumerable:true, writable:false, value:34007});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE24", {configurable:false, enumerable:true, writable:false, value:34008});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE25", {configurable:false, enumerable:true, writable:false, value:34009});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE26", {configurable:false, enumerable:true, writable:false, value:34010});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE27", {configurable:false, enumerable:true, writable:false, value:34011});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE28", {configurable:false, enumerable:true, writable:false, value:34012});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE29", {configurable:false, enumerable:true, writable:false, value:34013});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE30", {configurable:false, enumerable:true, writable:false, value:34014});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "TEXTURE31", {configurable:false, enumerable:true, writable:false, value:34015});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "ACTIVE_TEXTURE", {configurable:false, enumerable:true, writable:false, value:34016});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "REPEAT", {configurable:false, enumerable:true, writable:false, value:10497});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CLAMP_TO_EDGE", {configurable:false, enumerable:true, writable:false, value:33071});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MIRRORED_REPEAT", {configurable:false, enumerable:true, writable:false, value:33648});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_VEC2", {configurable:false, enumerable:true, writable:false, value:35664});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_VEC3", {configurable:false, enumerable:true, writable:false, value:35665});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_VEC4", {configurable:false, enumerable:true, writable:false, value:35666});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INT_VEC2", {configurable:false, enumerable:true, writable:false, value:35667});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INT_VEC3", {configurable:false, enumerable:true, writable:false, value:35668});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INT_VEC4", {configurable:false, enumerable:true, writable:false, value:35669});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BOOL", {configurable:false, enumerable:true, writable:false, value:35670});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BOOL_VEC2", {configurable:false, enumerable:true, writable:false, value:35671});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BOOL_VEC3", {configurable:false, enumerable:true, writable:false, value:35672});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BOOL_VEC4", {configurable:false, enumerable:true, writable:false, value:35673});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_MAT2", {configurable:false, enumerable:true, writable:false, value:35674});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_MAT3", {configurable:false, enumerable:true, writable:false, value:35675});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FLOAT_MAT4", {configurable:false, enumerable:true, writable:false, value:35676});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLER_2D", {configurable:false, enumerable:true, writable:false, value:35678});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "SAMPLER_CUBE", {configurable:false, enumerable:true, writable:false, value:35680});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_ENABLED", {configurable:false, enumerable:true, writable:false, value:34338});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_SIZE", {configurable:false, enumerable:true, writable:false, value:34339});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_STRIDE", {configurable:false, enumerable:true, writable:false, value:34340});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_TYPE", {configurable:false, enumerable:true, writable:false, value:34341});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_NORMALIZED", {configurable:false, enumerable:true, writable:false, value:34922});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_POINTER", {configurable:false, enumerable:true, writable:false, value:34373});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:34975});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "IMPLEMENTATION_COLOR_READ_TYPE", {configurable:false, enumerable:true, writable:false, value:35738});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "IMPLEMENTATION_COLOR_READ_FORMAT", {configurable:false, enumerable:true, writable:false, value:35739});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COMPILE_STATUS", {configurable:false, enumerable:true, writable:false, value:35713});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LOW_FLOAT", {configurable:false, enumerable:true, writable:false, value:36336});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MEDIUM_FLOAT", {configurable:false, enumerable:true, writable:false, value:36337});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "HIGH_FLOAT", {configurable:false, enumerable:true, writable:false, value:36338});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "LOW_INT", {configurable:false, enumerable:true, writable:false, value:36339});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MEDIUM_INT", {configurable:false, enumerable:true, writable:false, value:36340});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "HIGH_INT", {configurable:false, enumerable:true, writable:false, value:36341});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER", {configurable:false, enumerable:true, writable:false, value:36160});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER", {configurable:false, enumerable:true, writable:false, value:36161});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RGBA4", {configurable:false, enumerable:true, writable:false, value:32854});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RGB5_A1", {configurable:false, enumerable:true, writable:false, value:32855});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RGB565", {configurable:false, enumerable:true, writable:false, value:36194});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_COMPONENT16", {configurable:false, enumerable:true, writable:false, value:33189});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_INDEX8", {configurable:false, enumerable:true, writable:false, value:36168});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_STENCIL", {configurable:false, enumerable:true, writable:false, value:34041});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_WIDTH", {configurable:false, enumerable:true, writable:false, value:36162});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_HEIGHT", {configurable:false, enumerable:true, writable:false, value:36163});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_INTERNAL_FORMAT", {configurable:false, enumerable:true, writable:false, value:36164});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_RED_SIZE", {configurable:false, enumerable:true, writable:false, value:36176});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_GREEN_SIZE", {configurable:false, enumerable:true, writable:false, value:36177});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_BLUE_SIZE", {configurable:false, enumerable:true, writable:false, value:36178});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_ALPHA_SIZE", {configurable:false, enumerable:true, writable:false, value:36179});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_DEPTH_SIZE", {configurable:false, enumerable:true, writable:false, value:36180});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_STENCIL_SIZE", {configurable:false, enumerable:true, writable:false, value:36181});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", {configurable:false, enumerable:true, writable:false, value:36048});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", {configurable:false, enumerable:true, writable:false, value:36049});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", {configurable:false, enumerable:true, writable:false, value:36050});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE", {configurable:false, enumerable:true, writable:false, value:36051});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "COLOR_ATTACHMENT0", {configurable:false, enumerable:true, writable:false, value:36064});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36096});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "STENCIL_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36128});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "DEPTH_STENCIL_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:33306});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "NONE", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_COMPLETE", {configurable:false, enumerable:true, writable:false, value:36053});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_INCOMPLETE_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36054});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT", {configurable:false, enumerable:true, writable:false, value:36055});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_INCOMPLETE_DIMENSIONS", {configurable:false, enumerable:true, writable:false, value:36057});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_UNSUPPORTED", {configurable:false, enumerable:true, writable:false, value:36061});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "FRAMEBUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:36006});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "RENDERBUFFER_BINDING", {configurable:false, enumerable:true, writable:false, value:36007});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "MAX_RENDERBUFFER_SIZE", {configurable:false, enumerable:true, writable:false, value:34024});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "INVALID_FRAMEBUFFER_OPERATION", {configurable:false, enumerable:true, writable:false, value:1286});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNPACK_FLIP_Y_WEBGL", {configurable:false, enumerable:true, writable:false, value:37440});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNPACK_PREMULTIPLY_ALPHA_WEBGL", {configurable:false, enumerable:true, writable:false, value:37441});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "CONTEXT_LOST_WEBGL", {configurable:false, enumerable:true, writable:false, value:37442});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "UNPACK_COLORSPACE_CONVERSION_WEBGL", {configurable:false, enumerable:true, writable:false, value:37443});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "BROWSER_DEFAULT_WEBGL", {configurable:false, enumerable:true, writable:false, value:37444});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "activeTexture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "activeTexture", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "attachShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "attachShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bindAttribLocation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bindAttribLocation", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bindRenderbuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bindRenderbuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "blendColor", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "blendColor", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "blendEquation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "blendEquation", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "blendEquationSeparate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "blendEquationSeparate", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "blendFunc", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "blendFunc", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "blendFuncSeparate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "blendFuncSeparate", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bufferData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bufferData", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bufferSubData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bufferSubData", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "checkFramebufferStatus", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "checkFramebufferStatus", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "compileShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "compileShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "compressedTexImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "compressedTexImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "compressedTexSubImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "compressedTexSubImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "copyTexImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "copyTexImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "copyTexSubImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "copyTexSubImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createBuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createBuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createFramebuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createFramebuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createRenderbuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createRenderbuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "createTexture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "createTexture", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "cullFace", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "cullFace", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteBuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteBuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteFramebuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteFramebuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteRenderbuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteRenderbuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "deleteTexture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "deleteTexture", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "depthFunc", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "depthFunc", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "depthMask", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "depthMask", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "depthRange", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "depthRange", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "detachShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "detachShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "disable", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "disable", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "enable", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "enable", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "finish", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "finish", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "flush", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "flush", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "framebufferRenderbuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "framebufferRenderbuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "framebufferTexture2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "framebufferTexture2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "frontFace", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "frontFace", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "generateMipmap", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "generateMipmap", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getActiveAttrib", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getActiveAttrib", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getActiveUniform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getActiveUniform", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getAttachedShaders", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getAttachedShaders", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getAttribLocation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getAttribLocation", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getBufferParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getBufferParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getContextAttributes", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getContextAttributes", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getError", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getError", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getExtension", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getExtension", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getFramebufferAttachmentParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getFramebufferAttachmentParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getProgramInfoLog", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getProgramInfoLog", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getProgramParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getProgramParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getRenderbufferParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getRenderbufferParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getShaderInfoLog", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getShaderInfoLog", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getShaderParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getShaderParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getShaderPrecisionFormat", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getShaderPrecisionFormat", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getShaderSource", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getShaderSource", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getSupportedExtensions", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getSupportedExtensions", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getTexParameter", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getTexParameter", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getUniform", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getUniform", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getUniformLocation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getUniformLocation", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getVertexAttrib", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getVertexAttrib", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "getVertexAttribOffset", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "getVertexAttribOffset", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "hint", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "hint", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isBuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isBuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isContextLost", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isContextLost", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isEnabled", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isEnabled", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isFramebuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isFramebuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isRenderbuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isRenderbuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isShader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isShader", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "isTexture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "isTexture", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "lineWidth", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "lineWidth", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "linkProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "linkProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "pixelStorei", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "pixelStorei", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "polygonOffset", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "polygonOffset", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "readPixels", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "readPixels", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "renderbufferStorage", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "renderbufferStorage", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "sampleCoverage", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "sampleCoverage", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "shaderSource", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "shaderSource", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilFunc", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilFunc", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilFuncSeparate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilFuncSeparate", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilMask", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilMask", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilMaskSeparate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilMaskSeparate", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilOp", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilOp", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "stencilOpSeparate", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "stencilOpSeparate", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "texImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "texImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "texParameterf", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "texParameterf", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "texParameteri", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "texParameteri", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "texSubImage2D", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "texSubImage2D", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "useProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "useProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "validateProgram", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "validateProgram", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bindBuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bindBuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bindFramebuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bindFramebuffer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "bindTexture", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "bindTexture", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "clear", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "clear", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "clearColor", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "clearColor", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "clearDepth", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "clearDepth", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "clearStencil", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "clearStencil", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "colorMask", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "colorMask", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "disableVertexAttribArray", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "disableVertexAttribArray", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "drawArrays", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawArrays", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "drawElements", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawElements", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "enableVertexAttribArray", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "enableVertexAttribArray", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "scissor", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "scissor", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform1f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform1f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform1fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform1fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform1i", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform1i", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform1iv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform1iv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform2f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform2f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform2fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform2fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform2i", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform2i", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform2iv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform2iv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform3f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform3f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform3fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform3fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform3i", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform3i", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform3iv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform3iv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform4f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform4f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform4fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform4fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform4i", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform4i", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniform4iv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniform4iv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniformMatrix2fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniformMatrix2fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniformMatrix3fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniformMatrix3fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "uniformMatrix4fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "uniformMatrix4fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib1f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib1f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib1fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib1fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib2f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib2f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib2fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib2fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib3f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib3f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib3fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib3fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib4f", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib4f", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttrib4fv", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttrib4fv", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "vertexAttribPointer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "vertexAttribPointer", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "viewport", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "viewport", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "drawingBufferColorSpace", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawingBufferColorSpace_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "drawingBufferColorSpace_set", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "unpackColorSpace", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "unpackColorSpace_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "unpackColorSpace_set", arguments)}});
eggvm.toolsFunc.defineProperty(WebGLRenderingContext.prototype, "makeXRCompatible", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, WebGLRenderingContext.prototype, "WebGLRenderingContext", "makeXRCompatible", arguments)}});

// WebGLBuffer对象
WebGLBuffer = function WebGLBuffer(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(WebGLBuffer, "WebGLBuffer");

// WebGLProgram对象
WebGLProgram = function WebGLProgram(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(WebGLProgram, "WebGLProgram");

// XMLHttpRequestEventTarget对象
XMLHttpRequestEventTarget = function XMLHttpRequestEventTarget(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(XMLHttpRequestEventTarget, "XMLHttpRequestEventTarget");
Object.setPrototypeOf(XMLHttpRequestEventTarget.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onloadstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onloadstart_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onloadstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onprogress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onprogress_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onprogress_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onabort", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onabort_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onabort_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onerror_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onload_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onload_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "ontimeout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "ontimeout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "ontimeout_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequestEventTarget.prototype, "onloadend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onloadend_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequestEventTarget.prototype, "XMLHttpRequestEventTarget", "onloadend_set", arguments)}});

// XMLHttpRequest对象
XMLHttpRequest = function XMLHttpRequest(){}
eggvm.toolsFunc.safeProto(XMLHttpRequest, "XMLHttpRequest");
Object.setPrototypeOf(XMLHttpRequest.prototype, XMLHttpRequestEventTarget.prototype);
eggvm.toolsFunc.defineProperty(XMLHttpRequest, "UNSENT", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(XMLHttpRequest, "OPENED", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(XMLHttpRequest, "HEADERS_RECEIVED", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(XMLHttpRequest, "LOADING", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(XMLHttpRequest, "DONE", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "onreadystatechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "onreadystatechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "onreadystatechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "readyState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "readyState_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "timeout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "timeout_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "timeout_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "withCredentials", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "withCredentials_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "withCredentials_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "upload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "upload_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "responseURL", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "responseURL_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "status", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "status_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "statusText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "statusText_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "responseType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "responseType_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "responseType_set", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "response", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "response_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "responseText", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "responseText_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "responseXML", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "responseXML_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "UNSENT", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "OPENED", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "HEADERS_RECEIVED", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "LOADING", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "DONE", {configurable:false, enumerable:true, writable:false, value:4});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "abort", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "abort", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "getAllResponseHeaders", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "getAllResponseHeaders", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "getResponseHeader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "getResponseHeader", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "open", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "open", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "overrideMimeType", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "overrideMimeType", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "send", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "send", arguments)}});
eggvm.toolsFunc.defineProperty(XMLHttpRequest.prototype, "setRequestHeader", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, XMLHttpRequest.prototype, "XMLHttpRequest", "setRequestHeader", arguments)}});

// BatteryManager对象
BatteryManager = function BatteryManager(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(BatteryManager, "BatteryManager");
Object.setPrototypeOf(BatteryManager.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "charging", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "charging_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "chargingTime", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "chargingTime_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "dischargingTime", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "dischargingTime_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "level", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "level_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "onchargingchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onchargingchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onchargingchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "onchargingtimechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onchargingtimechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onchargingtimechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "ondischargingtimechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "ondischargingtimechange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "ondischargingtimechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(BatteryManager.prototype, "onlevelchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onlevelchange_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, BatteryManager.prototype, "BatteryManager", "onlevelchange_set", arguments)}});

// window对象
// 删除浏览器中不存在的对象
delete global;
delete Buffer;
delete process;
delete GLOBAL;
delete root;
delete VMError;
delete globalThis[Symbol.toStringTag];
delete WindowProperties;
window = globalThis;
Object.setPrototypeOf(window, Window.prototype);



eggvm.toolsFunc.defineProperty(window, "atob", {configurable:true, enumerable:true, writable:true,
    value:function atob(str){
        return eggvm.toolsFunc.base64.base64decode(str);
    }
});
eggvm.toolsFunc.defineProperty(window, "btoa", {
    configurable:true,
    enumerable:true,
    writable:true,
    value:function btoa(str){
        return eggvm.toolsFunc.base64.base64encode(str);
    }
});
eggvm.toolsFunc.defineProperty(window, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "name_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "name_set", arguments)}});

eggvm.toolsFunc.defineProperty(window, "location", {configurable: false});
eggvm.toolsFunc.defineProperty(window, "top", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "top_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(window, "self", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_set", arguments)}});
eggvm.toolsFunc.defineProperty(window, "setTimeout", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "setTimeout", arguments)}});
eggvm.toolsFunc.defineProperty(window, "clearTimeout", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "clearTimeout", arguments)}});


eval = eggvm.toolsFunc.hook(eval, undefined, false, function (){},function (){});
// 全局变量初始化
!function (){
    let onEnter = function (obj){
        try{
            eggvm.toolsFunc.printLog(obj.args);
        }catch (e){}
    }
    console.log = eggvm.toolsFunc.hook(
        console.log,
        undefined,
        false,
        onEnter,
        function (){},
        eggvm.config.print
    );
    eggvm.toolsFunc.createPlugin({
            "description": "Portable Document Format",
            "filename":"internal-pdf-viewer",
            "name":"PDF Viewer",
            "mimeTypes": [{
                "type":'application/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            },{
                "type":'text/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            }]
        });
    eggvm.toolsFunc.createPlugin({
            "description": "Portable Document Format",
            "filename":"internal-pdf-viewer",
            "name":"Chrome PDF Viewer",
            "mimeTypes": [{
                "type":'application/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            },{
                "type":'text/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            }]
        });
    eggvm.toolsFunc.createPlugin({
            "description": "Portable Document Format",
            "filename":"internal-pdf-viewer",
            "name":"Chromium PDF Viewer",
            "mimeTypes": [{
                "type":'application/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            },{
                "type":'text/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            }]
        });
    eggvm.toolsFunc.createPlugin({
            "description": "Portable Document Format",
            "filename":"internal-pdf-viewer",
            "name":"Microsoft Edge PDF Viewer",
            "mimeTypes": [{
                "type":'application/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            },{
                "type":'text/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            }]
        });
    eggvm.toolsFunc.createPlugin({
            "description": "Portable Document Format",
            "filename":"internal-pdf-viewer",
            "name":"WebKit built-in PDF",
            "mimeTypes": [{
                "type":'application/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            },{
                "type":'text/pdf',
                "suffixes": 'pdf',
                "description": 'Portable Document Format'
            }]
        });

}();
// 需要代理的对象
// window = new Proxy(window, {});
localStorage = eggvm.toolsFunc.proxy(localStorage, "localStorage");
sessionStorage = eggvm.toolsFunc.proxy(sessionStorage, "sessionStorage");
location = eggvm.toolsFunc.proxy(location, "location");
document = eggvm.toolsFunc.proxy(document, "document");
window = eggvm.toolsFunc.proxy(window, "window");
console.log("同步代码开始执行");
navigator.getBattery().then(function(battery){
    console.log("charging",battery.charging);
    console.log("chargingTime",battery.chargingTime);
    console.log("level",battery.level);
    result = btoa("" + battery.charging + battery.chargingTime + battery.level);
    console.log(result);
});
console.log("同步代码结束执行");
let promise = eggvm.memory.asyncEvent.promise;
for(let i=0;i<promise.length;i++){
    let callback = promise[i];
    callback();
}
