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
eggvm.memory.asyncEvent = {};// 异步事件
eggvm.memory.globalVar = {};// 存取全局变量
eggvm.memory.globalVar.jsonCookie = {};// json格式的cookie
eggvm.memory.globalVar.fontList = ["SimHei", "SimSun", "NSimSun", "FangSong", "KaiTi"]; // 浏览器能够识别的字体
eggvm.memory.globalVar.timeoutID = 0;
eggvm.memory.globalVar.all = new ldObj();


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
            let value = item[1].replace(/["']/g,"");
            tagJson["prop"][key] = value;
        }
        return tagJson;
    }

    // 获取type类型的集合
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
                    }else{
                        console.log(`{get|obj:[${objName}] -> prop:[${prop.toString()}],ret:[${String(result)}]}`);
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
                    }else{
                        console.log(`{set|obj:[${objName}] -> prop:[${prop.toString()}],value:[${String(value)}]}`);
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
    eggvm.envFunc.Document_all_get = function Document_all_get(){
        let all = eggvm.memory.globalVar.all;
        Object.setPrototypeOf(all, HTMLAllCollection.prototype);
        return all;
    }
    eggvm.envFunc.Navigator_webkitPersistentStorage_get = function Navigator_webkitPersistentStorage_get(){
        return eggvm.toolsFunc.getProtoArr.call(this,"webkitPersistentStorage");
    }
    eggvm.envFunc.Document_characterSet_get = function Document_characterSet_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "characterSet");
    }
    eggvm.envFunc.Document_charset_get = function Document_characterSet_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "charset");
    }
    eggvm.envFunc.Event_timeStamp_get = function Event_timeStamp_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "timeStamp");
    }
    eggvm.envFunc.MouseEvent_clientY_get = function MouseEvent_clientY_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "clientY");
    }
    eggvm.envFunc.MouseEvent_clientX_get = function MouseEvent_clientX_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "clientX");
    }
    eggvm.envFunc.MouseEvent_offsetY_get = function MouseEvent_offsetY_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "offsetY");
    }
    eggvm.envFunc.MouseEvent_offsetX_get = function MouseEvent_offsetX_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "offsetX");
    }
    eggvm.envFunc.MouseEvent_x_get = function MouseEvent_x_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "x");
    }
    eggvm.envFunc.MouseEvent_y_get = function MouseEvent_y_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "y");
    }
    eggvm.envFunc.MouseEvent_screenX_get = function MouseEvent_screenX_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "screenX");
    }
    eggvm.envFunc.MouseEvent_screenY_get = function MouseEvent_screenY_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "screenY");
    }

    eggvm.envFunc.MouseEvent_button_get = function MouseEvent_button_get(){
        // 暂时设置为0,为鼠标左键
        return 0;
    }

    eggvm.envFunc.EventTarget_addEventListener = function EventTarget_addEventListener(){
        let type = arguments[0];
        let listener = arguments[1];
        let options = arguments[2];
        let event = {
            "self": this,
            "type": type,
            "listener":listener,
            "options":options
        }
        if(eggvm.memory.asyncEvent.listener === undefined){
            eggvm.memory.asyncEvent.listener = {};
        }
        if(eggvm.memory.asyncEvent.listener[type] === undefined){
           eggvm.memory.asyncEvent.listener[type] = [];
        }
        eggvm.memory.asyncEvent.listener[type].push(event);
    }
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
        // <span style="font-family:mmllii;font-size:114px">mmmmmmmmmmmlliii</span>
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
    eggvm.envFunc.Navigator_connection_get = function Navigator_connection_get(){
        return eggvm.toolsFunc.getProtoArr.call(this,"connection");
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
    eggvm.envFunc.HTMLAnchorElement_port_get = function HTMLAnchorElement_port_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "port");
    }
    eggvm.envFunc.HTMLAnchorElement_pathname_get = function HTMLAnchorElement_pathname_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "pathname");
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
    eggvm.envFunc.HTMLAnchorElement_host_get = function HTMLAnchorElement_host_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "host");
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
    eggvm.envFunc.location_href_set = function location_href_set(){
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
    eggvm.envFunc.location_toString = function location_toString(){
        return eggvm.toolsFunc.getProtoArr.call(this, "href");
    }
    eggvm.envFunc.location_href_get = function location_href_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "href");
    }

    eggvm.envFunc.location_hostname_get = function location_hostname_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "hostname");
    }
    eggvm.envFunc.location_host_get = function location_host_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "host");
    }
    eggvm.envFunc.location_pathname_get = function location_pathname_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "pathname");
    }
    eggvm.envFunc.location_hostname_set = function location_hostname_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "hostname", value);
    }
    eggvm.envFunc.location_protocol_get = function location_protocol_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "protocol");
    }
    eggvm.envFunc.location_origin_get = function location_origin_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "origin");
    }
    eggvm.envFunc.location_port_get = function location_port_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "port");
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
            case "base":
                collection = eggvm.toolsFunc.getCollection('[object HTMLBaseElement]');
                collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, `Document_getElementsByTagName_${tagName}`)
                break;
            default:
                console.log(`Document_getElementsByTagName_${tagName}未实现`);
                break;
        }
        return collection;
    }
    eggvm.envFunc.Element_getElementsByTagName = function Element_getElementsByTagName(){
        let tagName = arguments[0].toLowerCase();
        let collection = [];
        switch (tagName){
            case "i":
                collection = [];
                collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, `Element_getElementsByTagName_${tagName}`)
                break;
            default:
                console.log(`Element_getElementsByTagName_${tagName}未实现`);
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
        return tempCookie.replace(/; $/,"");
    }
    eggvm.envFunc.Document_cookie_set = function Document_cookie_set(){
        let cookieValue = arguments[0];
        cookieValue = cookieValue.replace(/[; ]*$/,"");

        let itemList = cookieValue.split("; ");
        itemList.forEach((item) =>{

            if(item.indexOf("=") === -1){
                eggvm.memory.globalVar.jsonCookie[""] = item.trim();
            }else{
                let k = item.split("=")[0].trim();
                let v = item.split("=")[1].trim();
                eggvm.memory.globalVar.jsonCookie[k] = v;
            }
        })

    }

    eggvm.envFunc.document_location_get = function document_location_get(){
        return location;
    }
    eggvm.envFunc.Document_referrer_get = function Document_referrer_get(){
        return "";
    }
    eggvm.envFunc.Document_referrer_get = function Document_referrer_get(){
        return "";
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

// HTMLBaseElement对象
HTMLBaseElement = function HTMLBaseElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLBaseElement, "HTMLBaseElement");
Object.setPrototypeOf(HTMLBaseElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLBaseElement.prototype, "href", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "href_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "href_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBaseElement.prototype, "target", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "target_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "target_set", arguments)}});

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

// HTMLScriptElement对象
HTMLScriptElement = function HTMLScriptElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLScriptElement, "HTMLScriptElement");
Object.setPrototypeOf(HTMLScriptElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLScriptElement, "supports", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement, "HTMLScriptElement", "supports", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "src", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "src_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "src_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "type_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "type_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "noModule", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "noModule_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "noModule_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "charset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "charset_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "charset_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "async", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "async_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "async_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "defer", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "defer_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "defer_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "crossOrigin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "crossOrigin_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "crossOrigin_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "text", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "text_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "text_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "referrerPolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "referrerPolicy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "referrerPolicy_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "event", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "event_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "event_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "htmlFor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "htmlFor_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "htmlFor_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "integrity", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "integrity_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "integrity_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "fetchPriority", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "fetchPriority_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "fetchPriority_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLScriptElement.prototype, "blocking", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "blocking_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLScriptElement.prototype, "HTMLScriptElement", "blocking_set", arguments)}});

// HTMLSpanElement对象
HTMLSpanElement = function HTMLSpanElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLSpanElement, "HTMLSpanElement");
Object.setPrototypeOf(HTMLSpanElement.prototype, HTMLElement.prototype);

// HTMLStyleElement对象
HTMLStyleElement = function HTMLStyleElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLStyleElement, "HTMLStyleElement");
Object.setPrototypeOf(HTMLStyleElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLStyleElement.prototype, "disabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "disabled_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "disabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLStyleElement.prototype, "media", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "media_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "media_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLStyleElement.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "type_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "type_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLStyleElement.prototype, "sheet", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "sheet_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLStyleElement.prototype, "blocking", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "blocking_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLStyleElement.prototype, "HTMLStyleElement", "blocking_set", arguments)}});

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
eggvm.toolsFunc.defineProperty(Navigator.prototype, "languages", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Navigator.prototype, "Navigator", "languages_get", arguments,['en-US'])}, set:undefined});
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

// NetworkInformation对象
NetworkInformation = function NetworkInformation(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(NetworkInformation, "NetworkInformation");
Object.setPrototypeOf(NetworkInformation.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "onchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "onchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "onchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "effectiveType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "effectiveType_get", arguments, '3g')}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "rtt", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "rtt_get", arguments, 550)}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "downlink", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "downlink_get", arguments, 1.45)}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "saveData", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "saveData_get", arguments, false)}, set:undefined});

connection = {}
Object.setPrototypeOf(connection,NetworkInformation.prototype);
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

// Screen对象
Screen = function Screen(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}

screen = {}
Object.setPrototypeOf(screen,Screen.prototype)
eggvm.toolsFunc.safeProto(Screen, "Screen");
Object.setPrototypeOf(Screen.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(Screen.prototype, "availWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availWidth_get", arguments, 1600)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availHeight_get", arguments, 860)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "width", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "width_get", arguments, 1600)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "height", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "height_get", arguments, 900)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "colorDepth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "colorDepth_get", arguments, 24)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "pixelDepth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "pixelDepth_get", arguments, 24)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availLeft", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availLeft_get", arguments, 0)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availTop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availTop_get", arguments, 0)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "orientation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "orientation_get", arguments)}, set:undefined});

// Event对象
Event = function Event(){return eggvm.toolsFunc.throwError("TypeError", "Failed to construct 'Event': 1 argument required, but only 0 present.")}
eggvm.toolsFunc.safeProto(Event, "Event");
eggvm.toolsFunc.defineProperty(Event, "NONE", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(Event, "CAPTURING_PHASE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Event, "AT_TARGET", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Event, "BUBBLING_PHASE", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(Event.prototype, "type", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "type_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "target", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "target_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "currentTarget", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "currentTarget_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "eventPhase", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "eventPhase_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "bubbles", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "bubbles_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "cancelable", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "cancelable_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "defaultPrevented", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "defaultPrevented_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "composed", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "composed_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "timeStamp", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "timeStamp_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "srcElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "srcElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Event.prototype, "returnValue", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "returnValue_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "returnValue_set", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "cancelBubble", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "cancelBubble_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "cancelBubble_set", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "NONE", {configurable:false, enumerable:true, writable:false, value:0});
eggvm.toolsFunc.defineProperty(Event.prototype, "CAPTURING_PHASE", {configurable:false, enumerable:true, writable:false, value:1});
eggvm.toolsFunc.defineProperty(Event.prototype, "AT_TARGET", {configurable:false, enumerable:true, writable:false, value:2});
eggvm.toolsFunc.defineProperty(Event.prototype, "BUBBLING_PHASE", {configurable:false, enumerable:true, writable:false, value:3});
eggvm.toolsFunc.defineProperty(Event.prototype, "composedPath", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "composedPath", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "initEvent", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "initEvent", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "preventDefault", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "preventDefault", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "stopImmediatePropagation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "stopImmediatePropagation", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "stopPropagation", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "stopPropagation", arguments)}});
eggvm.toolsFunc.defineProperty(Event.prototype, "path", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Event.prototype, "Event", "path_get", arguments)}, set:undefined});

// UIEvent对象
UIEvent = function UIEvent(){return eggvm.toolsFunc.throwError("TypeError", "Failed to construct 'UIEvent': 1 argument required, but only 0 present.")}
eggvm.toolsFunc.safeProto(UIEvent, "UIEvent");
Object.setPrototypeOf(UIEvent.prototype, Event.prototype);
eggvm.toolsFunc.defineProperty(UIEvent.prototype, "view", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, UIEvent.prototype, "UIEvent", "view_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(UIEvent.prototype, "detail", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, UIEvent.prototype, "UIEvent", "detail_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(UIEvent.prototype, "sourceCapabilities", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, UIEvent.prototype, "UIEvent", "sourceCapabilities_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(UIEvent.prototype, "which", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, UIEvent.prototype, "UIEvent", "which_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(UIEvent.prototype, "initUIEvent", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, UIEvent.prototype, "UIEvent", "initUIEvent", arguments)}});

// MouseEvent对象
MouseEvent = function MouseEvent(){return eggvm.toolsFunc.throwError("TypeError", "Failed to construct 'MouseEvent': 1 argument required, but only 0 present.")}
eggvm.toolsFunc.safeProto(MouseEvent, "MouseEvent");
Object.setPrototypeOf(MouseEvent.prototype, UIEvent.prototype);
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "screenX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "screenX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "screenY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "screenY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "clientX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "clientX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "clientY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "clientY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "ctrlKey", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "ctrlKey_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "shiftKey", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "shiftKey_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "altKey", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "altKey_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "metaKey", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "metaKey_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "button", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "button_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "buttons", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "buttons_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "relatedTarget", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "relatedTarget_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "pageX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "pageX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "pageY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "pageY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "x", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "x_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "y", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "y_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "offsetX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "offsetX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "offsetY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "offsetY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "movementX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "movementX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "movementY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "movementY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "fromElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "fromElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "toElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "toElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "layerX", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "layerX_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "layerY", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "layerY_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "getModifierState", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "getModifierState", arguments)}});
eggvm.toolsFunc.defineProperty(MouseEvent.prototype, "initMouseEvent", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, MouseEvent.prototype, "MouseEvent", "initMouseEvent", arguments)}});

// HTMLAllCollection对象
HTMLAllCollection = function HTMLAllCollection(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLAllCollection, "HTMLAllCollection");
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "item", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "namedItem", arguments)}});

// window对象
// 删除浏览器中不存在的对象
delete global;
delete Buffer;
delete process;
delete GLOBAL;
delete root;
delete VMError;
delete ldObj;
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

eggvm.toolsFunc.defineProperty(window, "top", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "top_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(window, "self", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_set", arguments)}});
eggvm.toolsFunc.defineProperty(window, "parent", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "self_set", arguments)}});
eggvm.toolsFunc.defineProperty(window, "setTimeout", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "setTimeout", arguments)}});
eggvm.toolsFunc.defineProperty(window, "clearTimeout", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "clearTimeout", arguments)}});
eggvm.toolsFunc.defineProperty(window, "setInterval", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "setInterval", arguments)}});


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
(function() {
    AUPnQ.BkA = function() {
        var rmJ = 2;
        for (; rmJ !== 1; ) {
            switch (rmJ) {
                case 2:
                    return {
                        sHE: function(tuC) {
                            var uft = 2;
                            for (; uft !== 14; ) {
                                switch (uft) {
                                    case 5:
                                        uft = voI < wVP.length ? 4 : 7;
                                        break;
                                    case 2:
                                        var xvO = ''
                                            , wVP = decodeURI('.%043%0D%25%1C4%1A1%01#%1C%194?%22%1C\'%19%05(%1C$+#%0F%0363\'%25%1F:6%09%19(%087%0D46g%25?%022!37%03%00n1~44=%06.%198%18;%18%0E%11/%196%09#*%0E%03%3E%0F%0F%174%036%09$2%04%3E%1C%3E-)4%04/5%1A%19%25?%022!3J-%1A86(%1E$%182b*%0B$H8,+%13%7D%0A2b&%04%7D\'5(%22%09)Rw%1C6%1F8%1D2b.%19%7D%0D:23%13%0368%20-%0F%3E%1C%09%1C6%1F8%1A.%1C%19:%18&%13%0B%09-%0369\'?%1E%03%05%3E&#%0686%09\'5%182%1A%090&%049%07:%1C-%18%101%09#%06%13/6%09%1C%22%00%02%19%09##%0E4%1C%3E-)49%05%10%1A%19%0D:6%09%1C%19%1E5%0D9%1C$%186%22%09!5%0F%3C%1C2%1C%19%091%0D60%19%1F3%0C2$.%048%0C%096(9)%1A%3E,%204;;4%14%194%3E%09;.%194%0370!341%0D9%253%02%032%20%18%3E49%0D&7%22%1F86%09%1A%05%12%196%03*.%19%7D%0A%25-0%198%1Ap1g%030%18;\'*%0F3%1C66.%053H8$g%25?%022!3D%3E%1A2#3%0F%7D%01$b&J.%00%3E/g%0B3%0Cw&(%0F.%06p6g%19(%18\'-5%1E%7D%09w1%22%092%063b&%18:%1D:\')%1Es6%3C47%08%03%001&(44%1B%12/7%1E$6:7+%1E4%18;+$%0B)%018,%19%06502%1C4%1E8%18%09%1C%15/%17-%14%16%02.%03%0D932%0F(%0D%09.&%19)%3E6.%19%0F1%0D%090&%09866.+4%03%1881.%1E4%079%1C%13%024%1Bw%205%05*%1B20%60%19%7D%01:2+%0F0%0D96&%1E4%079b(%0C%7D\'5(%22%09)F40%22%0B)%0Dw+4J%3CH$*.%07%7D%099&g%0E2%0D$,%60%1E%7D%1B%2227%05/%1Cwe)%1F1%04pb&%19%7D%1C?\'g%0C4%1A$6g%0B/%0F%22/%22%04)F%09o%1948%18%09%1C%22%0B%3E%00%09oj4%036%09%1C%19%0F%25%18803%19%036%10\'%22%1E8%1B#%1C%102%12%12%09.&%04:6\'0(%1E2%1C.2%224:%20%3C%14%19%095%09%25%01(%0E8)#');
                                        uft = 1;
                                        break;
                                    case 1:
                                        var voI = 0
                                            , yXx = 0;
                                        uft = 5;
                                        break;
                                    case 4:
                                        uft = yXx === tuC.length ? 3 : 9;
                                        break;
                                    case 8:
                                        voI++,
                                            yXx++;
                                        uft = 5;
                                        break;
                                    case 3:
                                        yXx = 0;
                                        uft = 9;
                                        break;
                                    case 9:
                                        xvO += String.fromCharCode(wVP.charCodeAt(voI) ^ tuC.charCodeAt(yXx));
                                        uft = 8;
                                        break;
                                    case 7:
                                        xvO = xvO.split('^');
                                        return function(AvT) {
                                            var Bgf = 2;
                                            for (; Bgf !== 1; ) {
                                                switch (Bgf) {
                                                    case 2:
                                                        return xvO[AvT];
                                                        break;
                                                }
                                            }
                                        }
                                            ;
                                        break;
                                }
                            }
                        }('Gj]hWB')
                    };
                    break;
            }
        }
    }();
    AUPnQ.CdF = function() {
        var Cwt = 2;
        for (; Cwt !== 1; ) {
            switch (Cwt) {
                case 2:
                    return {
                        DPr: function ETI(FVP, GMp) {
                            var HtB = 2;
                            for (; HtB !== 10; ) {
                                switch (HtB) {
                                    case 4:
                                        IdU[(JZz + GMp) % FVP] = [];
                                        HtB = 3;
                                        break;
                                    case 13:
                                        KDs -= 1;
                                        HtB = 6;
                                        break;
                                    case 9:
                                        var LSJ = 0;
                                        HtB = 8;
                                        break;
                                    case 8:
                                        HtB = LSJ < FVP ? 7 : 11;
                                        break;
                                    case 12:
                                        LSJ += 1;
                                        HtB = 8;
                                        break;
                                    case 6:
                                        HtB = KDs >= 0 ? 14 : 12;
                                        break;
                                    case 1:
                                        var JZz = 0;
                                        HtB = 5;
                                        break;
                                    case 2:
                                        var IdU = [];
                                        HtB = 1;
                                        break;
                                    case 3:
                                        JZz += 1;
                                        HtB = 5;
                                        break;
                                    case 14:
                                        IdU[LSJ][(KDs + GMp * LSJ) % FVP] = IdU[KDs];
                                        HtB = 13;
                                        break;
                                    case 5:
                                        HtB = JZz < FVP ? 4 : 9;
                                        break;
                                    case 7:
                                        var KDs = FVP - 1;
                                        HtB = 6;
                                        break;
                                    case 11:
                                        return IdU;
                                        break;
                                }
                            }
                        }(9, 3)
                    };
                    break;
            }
        }
    }();
    AUPnQ.DVy = function() {
        return typeof AUPnQ.BkA.sHE === 'function' ? AUPnQ.BkA.sHE.apply(AUPnQ.BkA, arguments) : AUPnQ.BkA.sHE;
    }
    ;
    AUPnQ.ESd = function() {
        return typeof AUPnQ.CdF.DPr === 'function' ? AUPnQ.CdF.DPr.apply(AUPnQ.CdF, arguments) : AUPnQ.CdF.DPr;
    }
    ;
    function AUPnQ() {}
    !function() {
        (function(t, e) {
            var nhpQ = AUPnQ.DVy
                , mpWkZP = ['qsiCR'].concat(nhpQ)
                , ovjG = mpWkZP[1];
            mpWkZP.shift();
            var pfGF = mpWkZP[0];
            typeof exports === ovjG(24) && typeof module !== ovjG(51) ? module[nhpQ(92)] = e() : typeof UjhT === ovjG(19) && UjhT[ovjG(14)] ? UjhT(ovjG(94), e) : (t = typeof globalThis !== nhpQ(51) ? globalThis : t || self,
                t[nhpQ(58)] = e());
        }(this, function() {
            var sauC = AUPnQ.DVy
                , rUWkQI = ['vNfnD'].concat(sauC)
                , twAN = rUWkQI[1];
            rUWkQI.shift();
            var uhsP = rUWkQI[0];
            'use strict';
            var e = sauC(10);
            function FQJF(e) {
                var Mem = AUPnQ.ESd()[3][7];
                for (; Mem !== AUPnQ.ESd()[3][6]; ) {
                    switch (Mem) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 1;
                            var r = twAN(81);
                            var i = sauC(81);
                            var o = sauC(81);
                            var e = e;
                        function GPlY() {
                            var NAS = AUPnQ.ESd()[0][7];
                            for (; NAS !== AUPnQ.ESd()[0][6]; ) {
                                switch (NAS) {
                                    case AUPnQ.ESd()[3][7]:
                                        try {
                                            if (e[twAN(34)][sauC(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        NAS = AUPnQ.ESd()[0][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function HLmT(e) {
                var OBu = AUPnQ.ESd()[3][7];
                for (; OBu !== AUPnQ.ESd()[0][6]; ) {
                    switch (OBu) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 5;
                            var r = twAN(86);
                            var i = twAN(86);
                            var o = sauC(86);
                            var e = e;
                        function GPlY() {
                            var Pnz = AUPnQ.ESd()[3][7];
                            for (; Pnz !== AUPnQ.ESd()[3][6]; ) {
                                switch (Pnz) {
                                    case AUPnQ.ESd()[0][7]:
                                        try {
                                            if (e[sauC(34)][sauC(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        Pnz = AUPnQ.ESd()[3][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function IDrp(e) {
                var QlK = AUPnQ.ESd()[0][7];
                for (; QlK !== AUPnQ.ESd()[3][6]; ) {
                    switch (QlK) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 4;
                            var r = twAN(81);
                            var i = twAN(86);
                            var o = twAN(86);
                            var e = e;
                        function GPlY() {
                            var RbS = AUPnQ.ESd()[0][7];
                            for (; RbS !== AUPnQ.ESd()[0][6]; ) {
                                switch (RbS) {
                                    case AUPnQ.ESd()[0][7]:
                                        try {
                                            if (e[sauC(34)][sauC(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        RbS = AUPnQ.ESd()[0][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function JVPR(e) {
                var SUJ = AUPnQ.ESd()[0][7];
                for (; SUJ !== AUPnQ.ESd()[0][6]; ) {
                    switch (SUJ) {
                        case AUPnQ.ESd()[0][7]:
                            var n = 8;
                            var r = sauC(86);
                            var i = sauC(81);
                            var o = sauC(81);
                            var e = e;
                        function GPlY() {
                            var TaB = AUPnQ.ESd()[0][7];
                            for (; TaB !== AUPnQ.ESd()[0][6]; ) {
                                switch (TaB) {
                                    case AUPnQ.ESd()[0][7]:
                                        try {
                                            if (e[twAN(34)][sauC(59)]) {
                                                e[sauC(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        TaB = AUPnQ.ESd()[3][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function KJrn(e) {
                var Uej = AUPnQ.ESd()[0][7];
                for (; Uej !== AUPnQ.ESd()[0][6]; ) {
                    switch (Uej) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 7;
                            var r = sauC(86);
                            var i = twAN(81);
                            var o = sauC(86);
                            var e = e;
                        function GPlY() {
                            var Vef = AUPnQ.ESd()[3][7];
                            for (; Vef !== AUPnQ.ESd()[0][6]; ) {
                                switch (Vef) {
                                    case AUPnQ.ESd()[3][7]:
                                        try {
                                            if (e[twAN(34)][twAN(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        Vef = AUPnQ.ESd()[0][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function li(e) {
                var WcY = AUPnQ.ESd()[3][7];
                for (; WcY !== AUPnQ.ESd()[0][6]; ) {
                    switch (WcY) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 3;
                            var r = sauC(81);
                            var i = sauC(86);
                            var o = sauC(81);
                            var e = e;
                        function GPlY() {
                            var Xnp = AUPnQ.ESd()[0][7];
                            for (; Xnp !== AUPnQ.ESd()[0][6]; ) {
                                switch (Xnp) {
                                    case AUPnQ.ESd()[0][7]:
                                        try {
                                            if (e[twAN(34)][twAN(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        Xnp = AUPnQ.ESd()[0][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function LEZA(e) {
                var YkE = AUPnQ.ESd()[0][7];
                for (; YkE !== AUPnQ.ESd()[3][6]; ) {
                    switch (YkE) {
                        case AUPnQ.ESd()[0][7]:
                            var n = 6;
                            var r = twAN(86);
                            var i = twAN(86);
                            var o = sauC(81);
                            var e = e;
                        function GPlY() {
                            var ZWM = AUPnQ.ESd()[0][7];
                            for (; ZWM !== AUPnQ.ESd()[3][6]; ) {
                                switch (ZWM) {
                                    case AUPnQ.ESd()[3][7]:
                                        try {
                                            if (e[sauC(34)][sauC(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        ZWM = AUPnQ.ESd()[3][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            function MkMS(e) {
                var ahi = AUPnQ.ESd()[3][7];
                for (; ahi !== AUPnQ.ESd()[3][6]; ) {
                    switch (ahi) {
                        case AUPnQ.ESd()[3][7]:
                            var n = 2;
                            var r = sauC(81);
                            var i = sauC(81);
                            var o = sauC(86);
                            var e = e;
                        function GPlY() {
                            var bRN = AUPnQ.ESd()[0][7];
                            for (; bRN !== AUPnQ.ESd()[0][6]; ) {
                                switch (bRN) {
                                    case AUPnQ.ESd()[3][7]:
                                        try {
                                            if (e[twAN(34)][sauC(59)]) {
                                                e[twAN(15)]({
                                                    "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n,
                                                    "\u0069\u006e\u006e\u0065\u0072": r,
                                                    "\u006d\u0069\u0064\u0064\u006c\u0065": i,
                                                    "\u006f\u0075\u0074\u0073\u0069\u0064\u0065": o
                                                });
                                            }
                                        } catch (t) {}
                                        bRN = AUPnQ.ESd()[3][6];
                                        break;
                                }
                            }
                        }
                            return {
                                "\u0063\u0063": GPlY
                            };
                            break;
                    }
                }
            }
            var t = function(t) {
                var xgrM = AUPnQ.DVy
                    , wEybQw = ['BctCW'].concat(xgrM)
                    , yAgT = wEybQw[1];
                wEybQw.shift();
                var APYw = wEybQw[0];
                function u(t) {
                    var cxc = AUPnQ.ESd()[3][7];
                    for (; cxc !== AUPnQ.ESd()[0][6]; ) {
                        switch (cxc) {
                            case AUPnQ.ESd()[3][7]:
                                return typeof t === yAgT(19);
                                break;
                        }
                    }
                }
                function o(t) {
                    var duZ = AUPnQ.ESd()[3][7];
                    for (; duZ !== AUPnQ.ESd()[0][6]; ) {
                        switch (duZ) {
                            case AUPnQ.ESd()[3][7]:
                                return typeof t === yAgT(24) && t !== null;
                                break;
                        }
                    }
                }
                function c(t) {
                    var eJw = AUPnQ.ESd()[3][7];
                    for (; eJw !== AUPnQ.ESd()[3][6]; ) {
                        switch (eJw) {
                            case AUPnQ.ESd()[0][7]:
                                t();
                                eJw = AUPnQ.ESd()[3][6];
                                break;
                        }
                    }
                }
                function Nvts() {
                    var fbc = AUPnQ.ESd()[0][7];
                    for (; fbc !== AUPnQ.ESd()[3][6]; ) {
                        switch (fbc) {
                            case AUPnQ.ESd()[0][7]:
                                var t = this;
                                t[yAgT(95)] = t[yAgT(63)] = null;
                                fbc = AUPnQ.ESd()[3][6];
                                break;
                        }
                    }
                }
                Nvts[yAgT(97)] = {
                    "\u0065\u006e\u0071\u0075\u0065\u0075\u0065": function(t) {
                        var DyMV = AUPnQ.DVy
                            , CNPFQU = ['GVJsz'].concat(DyMV)
                            , EfTZ = CNPFQU[1];
                        CNPFQU.shift();
                        var FUEa = CNPFQU[0];
                        var e = this;
                        var n = {
                            "\u0065\u006c\u0065": t,
                            "\u006e\u0065\u0078\u0074": null
                        };
                        if (e[EfTZ(95)] === null) {
                            e[EfTZ(95)] = this[DyMV(63)] = n;
                        } else {
                            e[DyMV(63)][EfTZ(30)] = n;
                            e[DyMV(63)] = e[EfTZ(63)][EfTZ(30)];
                        }
                    },
                    "\u0064\u0065\u0071\u0075\u0065\u0075\u0065": function() {
                        var IlvQ = AUPnQ.DVy
                            , HDTPLr = ['LjUFQ'].concat(IlvQ)
                            , JqQg = HDTPLr[1];
                        HDTPLr.shift();
                        var KETc = HDTPLr[0];
                        var t = this;
                        if (t[IlvQ(95)] === null) {
                            throw new Error(IlvQ(22));
                        }
                        var e = t[IlvQ(95)][JqQg(75)];
                        t[IlvQ(95)] = t[IlvQ(95)][IlvQ(30)];
                        return e;
                    },
                    "\u0069\u0073\u0045\u006d\u0070\u0074\u0079": function() {
                        var NvEf = AUPnQ.DVy
                            , MRoLBj = ['QIpiJ'].concat(NvEf)
                            , OYEs = MRoLBj[1];
                        MRoLBj.shift();
                        var PGyo = MRoLBj[0];
                        var t = this;
                        return t[OYEs(95)] === null;
                    },
                    "\u0063\u006c\u0065\u0061\u0072": function() {
                        var SBoH = AUPnQ.DVy
                            , RIPSoX = ['VRIvL'].concat(SBoH)
                            , TJMy = RIPSoX[1];
                        RIPSoX.shift();
                        var UPZU = RIPSoX[0];
                        var t = this;
                        t[SBoH(95)] = t[SBoH(20)] = null;
                    },
                    "\u0065\u0061\u0063\u0068": function(t) {
                        var XplF = AUPnQ.DVy
                            , WFwSHZ = ['abcjU'].concat(XplF)
                            , YCMv = WFwSHZ[1];
                        WFwSHZ.shift();
                        var ZMiH = WFwSHZ[0];
                        var e = this;
                        if (!e[YCMv(67)]()) {
                            t(e[YCMv(61)]());
                            e[XplF(85)](t);
                        }
                    }
                };
                function a(e, t) {
                    var gda = AUPnQ.ESd()[3][7];
                    for (; gda !== AUPnQ.ESd()[0][6]; ) {
                        switch (gda) {
                            case AUPnQ.ESd()[0][7]:
                                if (e === t) {
                                    e[xgrM(60)](new TypeError());
                                } else if (t instanceof OtfA) {
                                    t[yAgT(46)](function(t) {
                                        var ccpA = AUPnQ.DVy
                                            , bsbMIx = ['fGEDZ'].concat(ccpA)
                                            , dJFn = bsbMIx[1];
                                        bsbMIx.shift();
                                        var eRrF = bsbMIx[0];
                                        a(e, t);
                                    }, function(t) {
                                        var hbaU = AUPnQ.DVy
                                            , ggZmkH = ['ktF_O'].concat(hbaU)
                                            , isRs = ggZmkH[1];
                                        ggZmkH.shift();
                                        var jXRD = ggZmkH[0];
                                        e[hbaU(60)](t);
                                    });
                                } else if (u(t) || o(t)) {
                                    var n;
                                    try {
                                        n = t[xgrM(46)];
                                    } catch (i) {
                                        OtfA[xgrM(36)](i);
                                        e[xgrM(60)](i);
                                        return;
                                    }
                                    var r = false;
                                    if (u(n)) {
                                        try {
                                            n[xgrM(55)](t, function(t) {
                                                var mabt = AUPnQ.DVy
                                                    , lWbQXE = ['pcTwn'].concat(mabt)
                                                    , nKgz = lWbQXE[1];
                                                lWbQXE.shift();
                                                var oArm = lWbQXE[0];
                                                if (r) {
                                                    return;
                                                }
                                                r = true;
                                                a(e, t);
                                            }, function(t) {
                                                var rJsU = AUPnQ.DVy
                                                    , qkMhLC = ['uYRBc'].concat(rJsU)
                                                    , sySz = qkMhLC[1];
                                                qkMhLC.shift();
                                                var tuQJ = qkMhLC[0];
                                                if (r) {
                                                    return;
                                                }
                                                r = true;
                                                e[sySz(60)](t);
                                            });
                                        } catch (i) {
                                            if (r) {
                                                return;
                                            }
                                            r = true;
                                            e[xgrM(60)](i);
                                        }
                                    } else {
                                        e[xgrM(4)](t);
                                    }
                                } else {
                                    e[yAgT(4)](t);
                                }
                                gda = AUPnQ.ESd()[0][6];
                                break;
                        }
                    }
                }
                function OtfA(t) {
                    var hRp = AUPnQ.ESd()[3][7];
                    for (; hRp !== AUPnQ.ESd()[3][6]; ) {
                        switch (hRp) {
                            case AUPnQ.ESd()[0][7]:
                                var e = this;
                                e[yAgT(47)] = e[xgrM(28)];
                                e[yAgT(41)] = new Nvts();
                                e[yAgT(39)] = new Nvts();
                                if (u(t)) {
                                    try {
                                        t(function(t) {
                                            var wkAx = AUPnQ.DVy
                                                , vLEViO = ['ACfVt'].concat(wkAx)
                                                , xHZs = vLEViO[1];
                                            vLEViO.shift();
                                            var yanF = vLEViO[0];
                                            e[wkAx(4)](t);
                                        }, function(t) {
                                            var CeRb = AUPnQ.DVy
                                                , BloQey = ['FeiIH'].concat(CeRb)
                                                , Dehz = BloQey[1];
                                            BloQey.shift();
                                            var ELMJ = BloQey[0];
                                            e[Dehz(60)](t);
                                        });
                                    } catch (n) {
                                        OtfA[yAgT(36)](n);
                                    }
                                }
                                hRp = AUPnQ.ESd()[0][6];
                                break;
                        }
                    }
                }
                var e = false;
                OtfA[yAgT(7)] = function() {
                    var HKvN = AUPnQ.DVy
                        , GtjCXj = ['KSgOK'].concat(HKvN)
                        , IFIk = GtjCXj[1];
                    GtjCXj.shift();
                    var JQkK = GtjCXj[0];
                    e = true;
                }
                ;
                OtfA[xgrM(36)] = function(t) {
                    var MNEg = AUPnQ.DVy
                        , LknBhV = ['PZeYF'].concat(MNEg)
                        , NOHl = LknBhV[1];
                    LknBhV.shift();
                    var OPbQ = LknBhV[0];
                    if (typeof getJSError === MNEg(19)) {
                        getJSError(t, true);
                    }
                    if (e && typeof console !== MNEg(51)) {
                        console[MNEg(33)](t);
                    }
                }
                ;
                OtfA[yAgT(97)] = {
                    "\u0050\u0045\u004e\u0044\u0049\u004e\u0047": 0,
                    "\u0052\u0045\u0053\u004f\u004c\u0056\u0045\u0044": 1,
                    "\u0052\u0045\u004a\u0045\u0043\u0054\u0045\u0044": -1,
                    "\u0062\u004a\u004b\u0065": function(t) {
                        var ROpV = AUPnQ.DVy
                            , QDqnkv = ['UOfAI'].concat(ROpV)
                            , SDwQ = QDqnkv[1];
                        QDqnkv.shift();
                        var TtPu = QDqnkv[0];
                        var e = this;
                        if (e[SDwQ(47)] !== e[ROpV(28)]) {
                            return;
                        }
                        e[SDwQ(47)] = e[ROpV(12)];
                        e[ROpV(53)] = t;
                        e[SDwQ(98)]();
                    },
                    "\u005a\u0077\u005a\u0079": function(t) {
                        var WLtT = AUPnQ.DVy
                            , VlMHIG = ['ZYngH'].concat(WLtT)
                            , XaDo = VlMHIG[1];
                        VlMHIG.shift();
                        var YofU = VlMHIG[0];
                        var e = this;
                        if (e[WLtT(47)] !== e[XaDo(28)]) {
                            return;
                        }
                        e[XaDo(47)] = e[WLtT(72)];
                        e[WLtT(66)] = t;
                        e[WLtT(98)]();
                    },
                    "\u0067\u0048\u006b\u0056": function() {
                        var bPUs = AUPnQ.DVy
                            , aqBmYk = ['eRPEx'].concat(bPUs)
                            , csso = aqBmYk[1];
                        aqBmYk.shift();
                        var djUh = aqBmYk[0];
                        var t = this;
                        var e, n, r = t[bPUs(47)];
                        if (r === t[csso(12)]) {
                            e = t[csso(41)];
                            t[csso(39)][bPUs(50)]();
                            n = t[bPUs(53)];
                        } else if (r === t[csso(72)]) {
                            e = t[bPUs(39)];
                            t[bPUs(41)][csso(50)]();
                            n = t[csso(66)];
                        }
                        e[bPUs(85)](function(t) {
                            var gEiP = AUPnQ.DVy
                                , fZbmMD = ['jm_tp'].concat(gEiP)
                                , hpmM = fZbmMD[1];
                            fZbmMD.shift();
                            var iZlf = fZbmMD[0];
                            c(function() {
                                var ltyL = AUPnQ.DVy
                                    , kEekRy = ['oigRu'].concat(ltyL)
                                    , mTVy = kEekRy[1];
                                kEekRy.shift();
                                var nofA = kEekRy[0];
                                t(r, n);
                            });
                        });
                    },
                    "\u0069\u0055\u0051\u006c": function(n, r, i) {
                        var qcje = AUPnQ.DVy
                            , pkokIx = ['tmaCL'].concat(qcje)
                            , riOc = pkokIx[1];
                        pkokIx.shift();
                        var sFVa = pkokIx[0];
                        var o = this;
                        c(function() {
                            var vkqu = AUPnQ.DVy
                                , uTSwap = ['ybGxI'].concat(vkqu)
                                , wwKy = uTSwap[1];
                            uTSwap.shift();
                            var xERx = uTSwap[0];
                            if (u(r)) {
                                var t;
                                try {
                                    t = r(i);
                                } catch (e) {
                                    OtfA[wwKy(36)](e);
                                    o[vkqu(60)](e);
                                    return;
                                }
                                a(o, t);
                            } else {
                                if (n === o[wwKy(12)]) {
                                    o[vkqu(4)](i);
                                } else if (n === o[wwKy(72)]) {
                                    o[vkqu(60)](i);
                                }
                            }
                        });
                    },
                    "\u0074\u0068\u0065\u006e": function(n, r) {
                        var BLxX = AUPnQ.DVy
                            , ASBcCl = ['EWkYl'].concat(BLxX)
                            , ChkH = ASBcCl[1];
                        ASBcCl.shift();
                        var DIXB = ASBcCl[0];
                        var t = this;
                        var i = new OtfA();
                        t[BLxX(41)][BLxX(73)](function(t, e) {
                            var GEqT = AUPnQ.DVy
                                , FZufdd = ['JPZiw'].concat(GEqT)
                                , HTPW = FZufdd[1];
                            FZufdd.shift();
                            var IhAs = FZufdd[0];
                            i[HTPW(11)](t, n, e);
                        });
                        t[BLxX(39)][ChkH(73)](function(t, e) {
                            var LATL = AUPnQ.DVy
                                , KEMn_d = ['OHuWP'].concat(LATL)
                                , MdKt = KEMn_d[1];
                            KEMn_d.shift();
                            var NRyv = KEMn_d[0];
                            i[MdKt(11)](t, r, e);
                        });
                        if (t[ChkH(47)] === t[ChkH(12)]) {
                            t[BLxX(98)]();
                        } else if (t[ChkH(47)] === t[ChkH(72)]) {
                            t[BLxX(98)]();
                        }
                        return i;
                    }
                };
                OtfA[yAgT(77)] = function(n) {
                    var QEZj = AUPnQ.DVy
                        , PmGOYV = ['TOORz'].concat(QEZj)
                        , RNFr = PmGOYV[1];
                    PmGOYV.shift();
                    var Sfau = PmGOYV[0];
                    return new OtfA(function(r, i) {
                            var VHdj = AUPnQ.DVy
                                , UukFft = ['Yqavg'].concat(VHdj)
                                , WPMR = UukFft[1];
                            UukFft.shift();
                            var Xxjw = UukFft[0];
                            var o = n[VHdj(59)];
                            var u = 0;
                            var c = false;
                            var a = [];
                            function PKhf(t, e, n) {
                                var iVJ = AUPnQ.ESd()[3][7];
                                for (; iVJ !== AUPnQ.ESd()[0][6]; ) {
                                    switch (iVJ) {
                                        case AUPnQ.ESd()[0][7]:
                                            if (c) {
                                                return;
                                            }
                                            if (t !== null) {
                                                c = true;
                                                i(t);
                                            }
                                            a[n] = e;
                                            u += 1;
                                            if (u === o) {
                                                c = true;
                                                r(a);
                                            }
                                            iVJ = AUPnQ.ESd()[0][6];
                                            break;
                                    }
                                }
                            }
                            for (var t = 0; t < o; t = t + 1) {
                                (function(e) {
                                    var aNxR = AUPnQ.DVy
                                        , ZX_Cxf = ['dbCHc'].concat(aNxR)
                                        , brkO = ZX_Cxf[1];
                                    ZX_Cxf.shift();
                                    var cSfI = ZX_Cxf[0];
                                    var t = n[e];
                                    if (!(t instanceof OtfA)) {
                                        t = new OtfA(t);
                                    }
                                    t[aNxR(46)](function(t) {
                                        var fxUq = AUPnQ.DVy
                                            , euLqed = ['ilQZT'].concat(fxUq)
                                            , gVOf = euLqed[1];
                                        euLqed.shift();
                                        var hkZP = euLqed[0];
                                        PKhf(null, t, e);
                                    }, function(t) {
                                        var krqh = AUPnQ.DVy
                                            , jbqZGS = ['nQZWu'].concat(krqh)
                                            , lkNi = jbqZGS[1];
                                        jbqZGS.shift();
                                        var mjiS = jbqZGS[0];
                                        PKhf(t || true);
                                    });
                                }(t));
                            }
                        }
                    );
                }
                ;
                OtfA[xgrM(76)] = function(c) {
                    var pKgn = AUPnQ.DVy
                        , ohqHVN = ['svKEj'].concat(pKgn)
                        , quDC = ohqHVN[1];
                    ohqHVN.shift();
                    var rTas = ohqHVN[0];
                    return new OtfA(function(n, r) {
                            var umZf = AUPnQ.DVy
                                , tjmNCR = ['xAVuF'].concat(umZf)
                                , vqYO = tjmNCR[1];
                            tjmNCR.shift();
                            var wbWH = tjmNCR[0];
                            var i = c[vqYO(59)];
                            var o = false;
                            var u = 0;
                            function PKhf(t, e) {
                                var jNv = AUPnQ.ESd()[0][7];
                                for (; jNv !== AUPnQ.ESd()[3][6]; ) {
                                    switch (jNv) {
                                        case AUPnQ.ESd()[0][7]:
                                            if (o) {
                                                return;
                                            }
                                            if (t == null) {
                                                o = true;
                                                n(e);
                                            } else {
                                                u += 1;
                                                if (u >= i) {
                                                    o = true;
                                                    r(t);
                                                }
                                            }
                                            jNv = AUPnQ.ESd()[3][6];
                                            break;
                                    }
                                }
                            }
                            for (var t = 0; t < i; t = t + 1) {
                                (function(t) {
                                    var AyVx = AUPnQ.DVy
                                        , yqYZMV = ['DclbZ'].concat(AyVx)
                                        , BLfh = yqYZMV[1];
                                    yqYZMV.shift();
                                    var CDca = yqYZMV[0];
                                    var e = c[t];
                                    if (!(e instanceof OtfA)) {
                                        e = new OtfA(e);
                                    }
                                    e[AyVx(46)](function(t) {
                                        var FGMg = AUPnQ.DVy
                                            , EIQhWV = ['IcXfk'].concat(FGMg)
                                            , GxPo = EIQhWV[1];
                                        EIQhWV.shift();
                                        var HKgf = EIQhWV[0];
                                        PKhf(null, t);
                                    }, function(t) {
                                        var KWrt = AUPnQ.DVy
                                            , JStCjR = ['NtjiQ'].concat(KWrt)
                                            , LRvb = JStCjR[1];
                                        JStCjR.shift();
                                        var MuOD = JStCjR[0];
                                        PKhf(t || true);
                                    });
                                }(t));
                            }
                        }
                    );
                }
                ;
                OtfA[xgrM(70)] = function(n) {
                    var PoKx = AUPnQ.DVy
                        , OnqeQf = ['SpRxs'].concat(PoKx)
                        , QIMv = OnqeQf[1];
                    OnqeQf.shift();
                    var RbdM = OnqeQf[0];
                    var r = n[QIMv(59)];
                    var i = new OtfA();
                    function o(e, t) {
                        var kUM = AUPnQ.ESd()[3][7];
                        for (; kUM !== AUPnQ.ESd()[0][6]; ) {
                            switch (kUM) {
                                case AUPnQ.ESd()[0][7]:
                                    if (e >= r) {
                                        return i[QIMv(4)](t);
                                    }
                                    new OtfA(n[e])[QIMv(46)](function(t) {
                                        var UfhI = AUPnQ.DVy
                                            , TBvlWp = ['XUwOj'].concat(UfhI)
                                            , Vohl = TBvlWp[1];
                                        TBvlWp.shift();
                                        var WLUN = TBvlWp[0];
                                        o(e + 1, t);
                                    }, function(t) {
                                        var Zvpq = AUPnQ.DVy
                                            , YLpZRd = ['cxwvB'].concat(Zvpq)
                                            , asKH = YLpZRd[1];
                                        YLpZRd.shift();
                                        var bsJz = YLpZRd[0];
                                        i[asKH(60)](t);
                                    });
                                    kUM = AUPnQ.ESd()[0][6];
                                    break;
                            }
                        }
                    }
                    new OtfA(n[0])[PoKx(46)](function(t) {
                        var eIWu = AUPnQ.DVy
                            , dZBHEw = ['hFDHJ'].concat(eIWu)
                            , fHPB = dZBHEw[1];
                        dZBHEw.shift();
                        var gtZ_ = dZBHEw[0];
                        o(1, t);
                    }, function(t) {
                        var jhnw = AUPnQ.DVy
                            , irwdes = ['mApov'].concat(jhnw)
                            , kynE = irwdes[1];
                        irwdes.shift();
                        var lraG = irwdes[0];
                        i[kynE(60)](t);
                    });
                    return i;
                }
                ;
                OtfA[yAgT(97)][yAgT(35)] = function(t, e) {
                    var odfQ = AUPnQ.DVy
                        , nqlZvA = ['rSz_n'].concat(odfQ)
                        , pZMb = nqlZvA[1];
                    nqlZvA.shift();
                    var qAaD = nqlZvA[0];
                    return this[odfQ(46)](t, e);
                }
                ;
                return OtfA;
            }();
            if (typeof Object[twAN(48)] !== twAN(19)) {
                Object[twAN(48)] = function(t, e) {
                    var tRUX = AUPnQ.DVy
                        , sqQIuG = ['wCrLp'].concat(tRUX)
                        , uYPb = sqQIuG[1];
                    sqQIuG.shift();
                    var vBSv = sqQIuG[0];
                    if (typeof t !== tRUX(24) && typeof t !== tRUX(19)) {
                        throw new TypeError(uYPb(21) + t);
                    } else if (t === null) {
                        throw new Error(uYPb(80));
                    }
                    if (typeof e !== uYPb(51))
                        throw new Error(tRUX(64));
                    function F() {
                        var lNi = AUPnQ.ESd()[0][7];
                        for (; lNi !== AUPnQ.ESd()[0][7]; ) {
                            switch (lNi) {
                            }
                        }
                    }
                    F[uYPb(97)] = t;
                    return new F();
                }
                ;
            }
            function QKBQ(t, e) {
                var mdO = AUPnQ.ESd()[0][7];
                for (; mdO !== AUPnQ.ESd()[0][6]; ) {
                    switch (mdO) {
                        case AUPnQ.ESd()[0][7]:
                            try {
                                this[twAN(26)] = Object[twAN(48)](t);
                                this[twAN(33)] = [];
                                this[twAN(34)] = this[twAN(26)][e] ? this[sauC(26)][e][sauC(52)]()[sauC(1)](sauC(38)) : twAN(38);
                                this[twAN(40)] = sauC(81);
                                this[sauC(68)] = sauC(86);
                            } catch (n) {}
                            mdO = AUPnQ.ESd()[3][6];
                            break;
                    }
                }
            }
            QKBQ[twAN(97)] = {
                "\u0056\u0058\u004d\u0050": function(r) {
                    var yCqn = AUPnQ.DVy
                        , xWvLcb = ['CMfMw'].concat(yCqn)
                        , AYqh = xWvLcb[1];
                    xWvLcb.shift();
                    var BjUf = xWvLcb[0];
                    var e = this;
                    new t(function(t, e) {
                            var EqTg = AUPnQ.DVy
                                , DUPfNz = ['HSjAW'].concat(EqTg)
                                , FiGv = DUPfNz[1];
                            DUPfNz.shift();
                            var GROd = DUPfNz[0];
                            var n = r[FiGv(79)];
                            t({
                                "\u0070\u006f\u0073\u0069\u0074\u0069\u006f\u006e": n
                            });
                        }
                    )[AYqh(35)](function(t) {
                        var JuMb = AUPnQ.DVy
                            , IrbnTp = ['MIlwD'].concat(JuMb)
                            , KRLq = IrbnTp[1];
                        IrbnTp.shift();
                        var LeeY = IrbnTp[0];
                        t[JuMb(0)] = r[KRLq(0)];
                        return t;
                    })[yCqn(35)](function(t) {
                        var OiIe = AUPnQ.DVy
                            , NWLHoI = ['RytsA'].concat(OiIe)
                            , PGgF = NWLHoI[1];
                        NWLHoI.shift();
                        var QyiG = NWLHoI[0];
                        t[OiIe(31)] = r[PGgF(31)];
                        return t;
                    })[yCqn(35)](function(t) {
                        var TMEV = AUPnQ.DVy
                            , SLhtiz = ['WtMzh'].concat(TMEV)
                            , UlMn = SLhtiz[1];
                        SLhtiz.shift();
                        var VtOS = SLhtiz[0];
                        t[TMEV(5)] = r[UlMn(5)];
                        return t;
                    })[yCqn(35)](function(t) {
                        var YxOt = AUPnQ.DVy
                            , XPJsBY = ['bMzTZ'].concat(YxOt)
                            , ZGJD = XPJsBY[1];
                        XPJsBY.shift();
                        var aOwp = XPJsBY[0];
                        t[YxOt(74)] = +e[ZGJD(34)][e[ZGJD(34)][YxOt(59)] - 1];
                        return t;
                    })[AYqh(35)](function(t) {
                        var dqoE = AUPnQ.DVy
                            , cpExE_ = ['gTDVJ'].concat(dqoE)
                            , ejiT = cpExE_[1];
                        cpExE_.shift();
                        var fOxu = cpExE_[0];
                        if (e[ejiT(34)][t[dqoE(79)]]) {
                            t[dqoE(0)] === e[dqoE(40)] ? e[ejiT(65)](t[ejiT(79)], t[ejiT(74)]) : e[ejiT(69)](t[dqoE(79)], t[ejiT(74)]);
                            t[dqoE(31)] === e[ejiT(40)] ? e[dqoE(65)](t[ejiT(79)], t[dqoE(74)]) : e[ejiT(69)](t[dqoE(79)], t[ejiT(74)]);
                            t[ejiT(5)] === e[ejiT(40)] ? e[dqoE(65)](t[dqoE(79)], t[ejiT(74)]) : e[ejiT(69)](resposition, t[ejiT(74)]);
                        }
                        return;
                    });
                },
                "\u006b\u0076\u0070\u0062": function(e, n) {
                    var ieHZ = AUPnQ.DVy
                        , hwZLR_ = ['lbJRm'].concat(ieHZ)
                        , jfMp = hwZLR_[1];
                    hwZLR_.shift();
                    var kWaO = hwZLR_[0];
                    var r = this;
                    new t(function(t) {
                            var nPAk = AUPnQ.DVy
                                , mlpKze = ['qGnJi'].concat(nPAk)
                                , oERa = mlpKze[1];
                            mlpKze.shift();
                            var ptNd = mlpKze[0];
                            r[nPAk(34)][e] = (+r[nPAk(34)][e] + n)[oERa(52)]();
                            t();
                        }
                    );
                },
                "\u006c\u0068\u0058\u0065": function(e, n) {
                    var sbSC = AUPnQ.DVy
                        , raPCuN = ['vfzaB'].concat(sbSC)
                        , tLNF = raPCuN[1];
                    raPCuN.shift();
                    var uRQi = raPCuN[0];
                    var r = this;
                    new t(function(t) {
                            var xAwh = AUPnQ.DVy
                                , wgrmds = ['BtMpe'].concat(xAwh)
                                , yqPL = wgrmds[1];
                            wgrmds.shift();
                            var AJHr = wgrmds[0];
                            r[xAwh(34)][e] = (+r[yqPL(34)][e] * n)[yqPL(52)]();
                            t();
                        }
                    );
                }
            };
            var n = function() {
                var DlIC = AUPnQ.DVy
                    , CmNsTv = ['Gcifl'].concat(DlIC)
                    , EMVm = CmNsTv[1];
                CmNsTv.shift();
                var FUoS = CmNsTv[0];
                function Rbfk(t) {
                    var nOD = AUPnQ.ESd()[3][7];
                    for (; nOD !== AUPnQ.ESd()[0][6]; ) {
                        switch (nOD) {
                            case AUPnQ.ESd()[3][7]:
                                var e = 5381;
                                var n = t[EMVm(59)];
                                var r = 0;
                                while (n--) {
                                    e = (e << 5) + e + t[EMVm(99)](r++);
                                }
                                e &= ~(1 << 31);
                                return e;
                                break;
                        }
                    }
                }
                function StJC(t) {
                    var olh = AUPnQ.ESd()[3][7];
                    for (; olh !== AUPnQ.ESd()[0][6]; ) {
                        switch (olh) {
                            case AUPnQ.ESd()[0][7]:
                                if (t[EMVm(96)] && t[DlIC(83)]) {
                                    t[e] = Rbfk(StJC[EMVm(52)]() + Rbfk(Rbfk[EMVm(52)]())) + EMVm(38);
                                }
                            function Oo() {
                                var pQq = AUPnQ.ESd()[0][7];
                                for (; pQq !== AUPnQ.ESd()[3][6]; ) {
                                    switch (pQq) {
                                        case AUPnQ.ESd()[0][7]:
                                            this[DlIC(96)] = t[EMVm(96)];
                                            this[EMVm(83)] = t[DlIC(83)];
                                            pQq = AUPnQ.ESd()[3][6];
                                            break;
                                    }
                                }
                            }
                                Oo[DlIC(97)] = new Tr_m();
                            function Tr_m() {
                                var qcj = AUPnQ.ESd()[0][7];
                                for (; qcj !== AUPnQ.ESd()[3][7]; ) {
                                    switch (qcj) {
                                    }
                                }
                            }
                                Tr_m[DlIC(97)][EMVm(42)] = {
                                    "\u006e": HLmT,
                                    "\u0073": FQJF,
                                    "\u0065": li,
                                    "\u0065\u0073": MkMS,
                                    "\u0065\u006e": IDrp,
                                    "\u0077": KJrn,
                                    "\u0077\u006e": LEZA,
                                    "\u0077\u0073": JVPR,
                                    "\u0066": QKBQ
                                };
                                return new Oo();
                                break;
                        }
                    }
                }
                return function(t) {
                    var IJfi = AUPnQ.DVy
                        , HbDCxG = ['LqDDw'].concat(IJfi)
                        , JYJW = HbDCxG[1];
                    HbDCxG.shift();
                    var KuJR = HbDCxG[0];
                    if (t && Object[JYJW(97)][IJfi(52)][JYJW(55)](t) === JYJW(9)) {
                        return StJC(t);
                    }
                    return Rbfk(Rbfk[JYJW(52)]());
                }
                    ;
            }();
            return n;
        }));
    }();
}());
function randomStr() {
    return (65536 * (1 + Math['random']()) | 0)['toString'](16)['substring'](1);
}

function fourRandomStr(){
    return randomStr() + randomStr()+ randomStr() + randomStr();
}

var eggH;
var eggW;
var eggG;

QBLnx.$_Ak = function() {
    var n = 2;
    for (;1 !== n; ) {
        switch (n) {
            case 2:
                return {
                    $_DBGGT: function(n) {
                        var t = 2;
                        for (;14 !== t; ) {
                            switch (t) {
                                case 5:
                                    t = r < i.length ? 4 : 7;
                                    break;

                                case 2:
                                    var B = "", i = decodeURI("%0D%1C6%1Dv=%0A%1D%3C%1Dw0%1D%064%07%5D%06%17%01?%00H%3C&%086%1Bd7%16%1B;1%5C*%14G%0D%02Z?&F%0D%E9%84%A2%E7%BD%87%E5%8E%9A%E6%94%88%08'%E6%9D%A6%E8%AF%86%EF%BD%82%E8%AE%8F%E6%A2%AF%E6%9E%B6%E5%89%B2%E5%A7%A2%E5%8D%8E%E6%96%8E%E4%BD%8F%E5%84%B6%E7%9B%AB%E9%85%A4%E7%BC%B6%E5%8E%BA%E6%94%9F4%1B%EF%BC%A1%E5%AE%A1%E5%BB%AC%E7%95%9C%E8%AE%A4%E6%96%99%E7%9A%AD%11%3C%EF%BD%A6%0D%0A%5B*%17%1D%0D%0BH,%19U:%02H?%1D@$%0AK(C%0D2%1CLnLC%06%04E%1F*%06g.h%19:7%01:c%09.%03%12%5B%7D%1B=.%12.h.9:%12.l%1A@%18%12%06d/9%08%00%3Cg,%0B%0A%7C%0Cq2%00%16%10,D*!!%04?%5E50=%1BVC/5.%0D%1C%5D9%0C%1A%201%E4%BC%89%E7%BA%81%E5%91%BC%E5%9A%B1%E8%B1%90%E7%9B%AB%E5%8F%AB%E6%94%A8%E4%B9%B5%E6%99%80%E5%86%AE%E6%94%9F%E7%B1%92%E5%9F%93%EF%BD%A2%E8%AE%98%E4%BD%B3%E5%84%8A%E5%87%94%E6%94%A8%E7%B0%83%E5%9F%A4%E5%8E%91%E6%94%9Fw%E5%B9%B6%E5%8B%91%E5%8E%A2%E9%A7%9B1Z=%1BO%E7%A6%81%E7%9B%AB%E9%80%B6%E5%BB%BE%E8%B7%BD%E8%BE%A8s%1CJ7%0A%0AvO%E7%9A%AD%E7%95%B0%E6%89%8F1=%1AD:%1D%1D%0D1Y%20&%1C!%0Cw%0D%0B%0A!,H4%14-2%0CB%1D%0A%1D%3C%1Dw=%0A%1D%3C%1DviH%5E%0DKv%1B9%3E%0D%E7%95%9E%E6%9E%A8%E9%AB%94%E6%8E%A8%E4%BF%B4%E6%8B%93%E6%9D%80%E6%94%86%E6%8D%99&%5D71%0D%07%3C-%0C1K7%17%036%0EG%06%0C%16#%0Aw=%00%1F%3C%1D%5D+&%086%1B%605%19%086+H,%1914%0A%5D%1E%0D%03?6L9%0A14%0A%5D%10%17%1A!%1Cw%E6%8A%8E%E5%8B%90%E5%B6%89%E8%BF%AA%E6%BA%BE%E5%9D%BE%E5%AF%94%E6%89%A8%E4%B9%A5%E6%97%AA%E6%8A%93%E5%9B%97%06B10%1DL9%0C%0A%16%03L5%1D%01'1@6%08%1A'1n=%1D%1B6%1C%5D%1D%0A%1D%3C%1Dw=%0A%1D%3C%1Dv;%17%0B61%0D%07;):1%1FhL1w0j%1F%021~1Y*%17%1B%3C%0CF4&%0A!%1DF*'%5Ec%5Dw%3C%17%0C&%02L6%0C1%E5%84%A0%E9%96%82%E9%AA%A5%E8%AE%99&%086%1Bj7%16%1B6%17%5D%06%1F%0A';@5%1D1!%0EG%3C%17%02%0DKv%1B;%08%0D%09%5C6%1B%1B:%00G%06%5C0%17.b%06%5C0%10+Y%06%1D%1D!%00%5B%07I_g1Z,%0A%06=%08w%3C%1D%1B2%06E%06%0C%00%15%06Q=%1C1%20%1FE1%0C17%06_%06%1B%0E=%19H+&@2%05H%20V%1F;%1F%E8%AF%9E%E6%B0%9A%E6%8B%9D%E9%95%B6%EF%BD%89%5E%07%E8%AE%AF%E4%BE%A5%E6%8D%AE%E7%BC%82%E7%BA%B3%E7%95%AC%E9%81%82%EF%BD%A3%5D%7D%E8%AE%98%E8%81%BD%E7%B2%A3%E6%9F%B9%E9%AB%A3%E5%AF%8B%E7%BC%BE%E5%AE%8B%E6%9D%95&%0B2%1BH%06BO%0D%E8%A6%A9%E8%A7%A0%E9%9B%84%E7%A3%B51%E5%92%94%E5%92%89%EF%BD%B7%E6%81%B2%E7%88%91%E5%91%AC%E4%BB%95%E6%8A%93%E5%9B%97xKO%E7%A6%81%E5%91%A1%E9%87%A4%E8%AE%8D&%072%1Cf/%16?!%00Y=%0A%1B*1%5E1%1C%1B;1%09%06%E5%89%8F%E6%97%9F%E9%AB%9F%E8%AE%AEw%7C'-%19%05w%7C',%1B%1Aw%7C',%19%0Ew7%1A%056%0C%5D%06%11%0241L*%0A%00!0%18hH14%0A%5D%1C%19%1B61_9%14%1A6%20O%06%1D%1D!%00%5B%07I_%601%07w%0D%1C6%1DJ9%14%031%0EJ3W1%E4%BD%B3%E7%BA%B6H(%08%0A=%0B%7D7%E6%8F%9D%E5%8E%8C%E7%9B%97%E5%8E%AD%E6%95%99%E6%9D%91%E8%AE%97%EF%BD%B5%E5%8E%B9%E6%8F%8A%E5%8F%BE1%1C%E9%81%A6%E6%8A%BA%E5%98%87%E5%92%A5%1C7%22%E5%84%90%E7%B5%8F%EF%BC%A5%E5%B8%AE%E4%B9%AC%E9%9D%AF%E4%BE%8E%E8%AE%AE%E5%85%9F%E5%AC%80%E5%9D%90%E4%BB%A1%E9%A0%A6%E9%9C%8D%E4%B8%84%06%10%067%0BL6&@4%0A%5Dv%08%07#%E8%AE%98%E6%B1%AB%E6%8B%BD%E9%95%A1%EF%BD%B5bA%E8%AF%9E%E4%BE%85%E6%8D%B9%E7%BC%BE%E7%BA%8F%E7%94%AA%E9%80%B3%EF%BD%83JA%E6%A2%93%E6%9E%8A%E5%88%B4%E5%A6%93%E5%8D%AE%E6%96%99%E4%BD%B3%E5%84%8A%E7%9A%AD%E9%84%95%E7%BC%96%E5%8E%AD%E6%94%A3%08%5D%E5%93%94%1B%072%03E=%16%0861%0D%07%0B;*%16E=&%1F&%1B%605%19%086+H,%191%3C%01L*%0A%00!1%5C6%1C%0A5%06G=%1C1sBw%7C',%16%1Fw?%1D%1B%00%0AJ7%16%0B%201%5B=%08%032%0CL%06%E5%8B%98%E8%BC%92%E4%B9%BEA%07v&(6%0A%5D=%0B%1Bs%1DL)%0D%06!%0AZx%19O$%06G%3C%17%18s%18@,%10O2OM7%1B%1A%3E%0AG,&%E8%AE%98%E5%84%A0%E9%96%82%E9%AA%A5%E8%AE%99%E9%86%B5%E8%AE%BA%0DAw?%1D%1B%1E%06G-%0C%0A%201%0D%07;-%071M*%19%18%1A%02H?%1D1w0j%11%1C1%E6%8A%85%E5%8B%87%E6%BB%B8%E5%9C%8F%E5%B1%BE%E6%83%83%E6%B4%BD%E5%9A%91%E5%83%A6%E6%AC%BB%E7%A0%96%E6%8A%93%E5%91%9B1%E4%BC%89%E7%BA%81%1A%06=%0Bf6%E6%8F%9D%E5%8E%8C%E7%9B%97%E5%8E%AD%E6%95%99%E6%9D%91%E8%AE%97%EF%BD%B5%E5%8E%B9%E6%8F%8A%E5%8F%BE1%1C%E9%81%A6%E6%8A%BA%E5%98%87%E5%92%A5%1C7%22%E5%84%90%E7%B5%8F%EF%BC%A5%E5%B8%AE%E4%B9%AC%E9%9D%AF%E4%BE%8E%E8%AE%AE%E5%85%9F%E5%AC%80%E5%9D%90%E4%BB%A1%E9%A0%A6%E9%9C%8D%E4%B8%84%06%08%00%20%1Bwh&%02%3C%01@,%17%1D%7D%08L=%0C%0A%20%1B%07;%17%02%7C%02F6%11%1B%3C%1D%06+%1D%0171@6%11%1B%14%0AL,%1D%1C'%E9%86%A3%E9%9D%8B%E7%9B%9C%1F%1B%E6%89%85%E8%81%AAJ0%19%03?%0AG?%1D%E5%8E%AD%E6%94%A3%E7%BD%95%E5%B0%B8bX%E8%AE%98%E6%A2%93%E6%9E%8A%E5%88%B4%E5%A6%93%E5%8D%AE%E5%8E%AD%E6%94%A31%E7%94%81%E6%89%AF%E5%9A%A6%E8%B1%AC%E5%86%AE%E6%94%9F%E6%89%8E%E8%A0%94%E5%BD%BA%E5%B9%97%0D%15Au%1B%01%0D%08%5D%06%0A%0A2%0BP%0B%0C%0E'%0Aw%3E%11%036%01H5%1D1%20%1BP4%1D%1C;%0AL,&K%0C+%60%00&%0A!%1DF*'%5Eb_w=%0A%1D%3C%1DviIZ%0DRw+%08%03:%0CL%06%1B%0E?%03K9%1B%04%0D@%5B=%1E%1D6%1CAv%08%07#%E8%AE%98%E6%B1%AB%E6%8B%BD%E9%95%A1%EF%BD%B5bA%E8%AF%9E%E4%BE%85%E6%8D%B9%E7%BC%BE%E7%BA%8F%E7%94%AA%E9%80%B3%EF%BD%83JA%E5%89%A4%E6%97%9F%E6%AC%88%E6%94%A8%E6%9D%94%E8%BB%84%E6%9D%9A%E9%98%BF%E5%88%9F%EF%BD%90I_%E6%AD%B2%E4%BA%8A%E5%86%AC%EF%BD%91%EF%BD%B4%E8%B7%AA%E8%BE%94%E9%98%BF%E5%88%9F%E8%AE%AF%E5%89%8F%E6%97%9F%E6%94%A7%E4%B9%85%E9%A1%9C%E9%9C%BA%E5%87%B5%E8%AE%BA%0D(L=;%072%03E=%16%0861E9%16%08%0D%0Ew-%16%04=%00%5E6&%06#1%5C+%1D%1D%12%08L6%0C16%1D%5B7%0A0b_%1E%06W%1D6%1CL,V%1F;%1F%E8%AF%9E%E6%B0%9A%E6%8B%9D%E9%95%B6%EF%BD%89%5E%07%E8%AE%AF%E4%BE%A5%E6%8D%AE%E7%BC%82%E7%BA%B3%E7%95%AC%E9%81%82%EF%BD%A3%5D%7D%E8%AE%98%E8%81%BD%E7%B2%A3%E6%9F%B9%E9%AB%A3%E5%AF%8B%E7%BC%BE%E5%AE%8B%E6%9D%95&%E8%AE%82%E9%9E%A0%E6%97%A8%E4%BB%9F%E5%8B%B8%E8%BC%85%E5%A5%9E%E8%B5%B6%EF%BD%B5%18v%E8%AE%8F%E4%BE%B2%E6%8D%92%E7%BC%BE%E7%BB%B5%E7%94%9D%E9%81%A2%EF%BD%B4aA%E8%AF%9E%E8%80%8C%E7%B2%83%E6%9F%AE%E9%AB%9F%E5%AF%B7%E7%BD%B8%E5%AF%BA%E6%9D%B51w0k%1B%0F1?%0AG?%0C%07%0D,F6%1E%064%1A%5B9%0C%06%3C%01%09%1D%0A%1D%3C%1Dw6%19%19:%08H,%17%1D%0D%00O%3E%14%06=%0Aw*%17%1A=%0Bw%7C'+%16%06w%7C'+%17%0Dw,%0F1~%1B%5E%06N_a1H6%17%01*%02F-%0B1%E7%BC%82%E7%BA%B3%E4%B8%A4%E7%BA%81%E5%8B%A31w0m%1E%091%E4%BD%B3%E7%BA%B6K1%16%0B%15%00%5B5%E6%8F%9D%E5%8E%8C%E7%9B%97%E5%8E%AD%E6%95%99%E6%9D%91%E8%AE%97%EF%BD%B5%E5%8E%B9%E6%8F%8A%E5%8F%BE1%1C%E9%81%A6%E6%8A%BA%E5%98%87%E5%92%A5%1C7%22%E5%84%90%E7%B5%8F%EF%BC%A5%E5%B8%AE%E4%B9%AC%E9%9D%AF%E4%BE%8E%E8%AE%AE%E5%85%9F%E5%AC%80%E5%9D%90%E4%BB%A1%E9%A0%A6%E9%9C%8D%E4%B8%84%06%0B%03:%0CL%06%1D%1D!%00%5B%07I_k1J+%0B1%E9%AB%9F%E8%AE%AE%E5%9B%97%E7%88%9F%E5%8B%98%E8%BC%92%E5%A5%A2%E8%B5%8A%EF%BC%B3iV%E8%AE%98%E4%BE%8E%E6%8D%AE%E7%BD%B8%E7%BA%84%E7%94%BD%E9%81%B5%EF%BD%88%5D%07%E8%AE%AF%E8%80%AC%E7%B2%94%E6%9F%92%E9%AB%A3%E5%AE%B1%E7%BC%89%E5%AF%9A%E6%9D%A2%0D%1BL+%0C1%E6%9D%9E%E5%8B%8E%E7%AB%86%3E%17%1D1%06M%3C%1D%01%EF%BD%89O%E8%AF%9E%E8%80%8C%E7%B2%83%E6%9F%AE%E9%AB%9F%E5%AF%B7%E7%BD%B8%E5%AF%BA%E6%9D%B51%E7%B7%A1%E7%B4%8E%E4%B8%A4%E7%B4%BE%E5%8B%A31w0m%1F)1%7C1E7%19%0B6%0Bw%0D,)~Ww%E9%AB%94%E8%AE%B9%E7%9B%AB9%1C%E5%9C%99%E5%9C%98%E4%B9%B5%E5%AC%B7%E5%9D%BB1L*%0A%00!0%18hN1%601L*%0A%00!0%18hM10%00D(%14%0A'%0Aw%7C'+%1B;w=%0A%1D%3C%1DviI%5D%0D%0A%5B*%17%1D%0C%5E%18n&%086%0A%5D=%0B%1B%0C1L*%0A%00!0%18iL16%1D%5B7%0A0b%5E%11%066%0A'%18F*%13O5%0E@4%0D%1D61Z,%1D%1F%0D%E7%9B%81%E8%82%8D%E5%8B%B8%E8%BC%85%E5%A5%9E%E8%B5%B6%EF%BD%B5%18v%E8%AE%8F%E4%BE%B2%E6%8D%92%E7%BC%BE%E7%BB%B5%E7%94%9D%E9%81%A2%EF%BD%B4aA%E8%AF%9E%E8%80%8C%E7%B2%83%E6%9F%AE%E9%AB%9F%E5%AF%B7%E7%BD%B8%E5%AF%BA%E6%9D%B51;%04w9%0D%0B:%00w;%14%0A2%1D%7D1%15%0A%3C%1A%5D%06%19%1F:0Z=%0A%196%1Dw=%0A%1D%3C%1DviHV%0DPw%E9%84%95%E7%BC%96%E9%8D%80%E8%AB%B71%0F%06%E9%84%B5%E7%BC%81%E5%8E%91%E6%94%9FH*%1D%0E%E6%9D%9A%E8%AE%80%EF%BC%B3%E5%8E%B2%E6%8F%9D%E5%8E%B8:%0B%E9%80%A0%E6%8A%B1%E5%98%90%E5%93%A3%17%20d%E5%84%9B%E7%B5%98%EF%BD%A3%E5%B8%A5%E4%B9%BB%E9%9C%A9%E4%BE%85%E8%AE%B9%E5%84%99%E5%AC%8B%E5%9D%87%E4%BA%A7%E9%A0%AD%E9%9C%9A%E4%B9%82%0D%1F%5C+%101%E9%84%9E%E7%BC%81%E9%94%B0%E8%AE%B7&%0E#%06Z=%0A%196%1Dw2%0B1e_%1A%06%1D%1D!%00%5B%07I%5Ed1%04;%161%3E%0AZ+%19%0861%5D1%15%0A%3C%1A%5D%06%1B%072%03E=%16%0861A,%0C%1F%20U%06w%15%00=%06%5D7%0AA4%0AL,%1D%1C'AJ7%15@%3E%00G1%0C%00!@Z=%16%0B%0D%06G%3C%1D%17%1C%09w%22%1016%1D%5B7%0A0b%5E%1A%06%1B%072%1Dh,&%1B%3C#F/%1D%1D%10%0EZ=&%E9%AB%A3%E8%AE%92%E7%9B%ABC+%E5%9D%88%E5%9C%AF%E6%96%B3%E6%B2%BA%E5%8A%89%E8%BC%A5&%1C0%1D@(%0C1%20%1BH;%131%14%0AL%1F,10%07H*;%007%0Ah,&%0A=1%E6%97%89%E6%AC%BC%E7%B0%83%E9%95%B6%E8%AE%BC%E7%B0%94%E5%9E%A2%06%1B%007%0Aw=%0A%1D%3C%1DviI%5E%0D%1CL,,%06%3E%0AF-%0C1?%06G3&%0A!%1D%19hI1%16%01M%06+%1B2%1D%5D%06%5C0%14-%7F%06%5C0%16+l%06%1F%0A'*E=%15%0A=%1BZ%1A%01;2%08g9%15%0A%0DKv%1E%3E:%0D,F6%0C%0A=%1B%04%0C%01%1F61D7%0D%1C6%02F.%1D1%3C%01%5B=%19%0B*%1C%5D9%0C%0A0%07H6%1F%0A%0DKv%1D=:%0D%1DL)%0D%0A%20%1Bh6%11%022%1B@7%16)!%0ED=&%09!%00D%16%0D%021%0A%5B%06%15%0E+1Z=%0C&'%0AD%06%0C%00%00%1B%5B1%16%08%0DKv%1F1'%0D%0AG%3C&%1C'%1D@6%1F%065%16w%7C'*%11%15w;%17%02#%0E%5D%15%17%0B61A=%19%0B%0D+H,%1D1+1%0D%07%3C,%171O*%17%02%00%1B%5B1%16%08%0D%0DO;%19%0C;%0Av%3C%1D%1B6%0C%5D%06%0B%1B2%1B%5C+BO%0DKv%1F=&%0D%1C%5C:%0B%1B!1Y*%17%1B%3C%1BP(%1D1w0n%10%3C1w0l%1F=15%03F7%0A1%20%0AG%3C&K%0C(j%08&%05%20%0C%5B9%15%0D?%0A%5B%06%1E%1D%3C%02j0%19%1D%10%00M=&%1B6%17%5Dw%08%032%06Gc%1B%072%1DZ=%0CR&%1BOu@1:%01@,&K%0C*c%3E&%1F6%1DZ1%0B%1B6%0Bw%005#%1B%1B%5D(*%0A%22%1AL+%0C1%1E%0E%5D0&%0E7%0Bl.%1D%01'#@+%0C%0A=%0A%5B%06%5C0%16,n%06%17%01'%06D=%17%1A'1%065%17%01:%1BF*W%1C6%01M%06%5C0%16.j%06%14%000%0EE%0B%0C%00!%0EN=&%18:%1BA%1B%0A%0A7%0AG,%11%0E?%1Cw9%0C%1B2%0CA%1D%0E%0A=%1Bw%19%1B%0C6%1F%5D%06%121%1E%06J*%17%1C%3C%09%5Dx1%01'%0A%5B6%1D%1Bs*Q(%14%00!%0A%5B%06%5C0%14.b%06r1%3E%00S%0A%1D%1E&%0AZ,9%01:%02H,%11%00=)%5B9%15%0A%0DKv%1E:*%0DKv%1D%3E&%0DKv%1E??%0D%02F%22;%0E=%0CL4*%0A%22%1AL+%0C.=%06D9%0C%06%3C%01o*%19%0261@%06%0F%0A1%04@,;%0E=%0CL4*%0A%22%1AL+%0C.=%06D9%0C%06%3C%01o*%19%0261%0D%07%3E,%1B1%5B=%0B%1F%3C%01Z=,%0A+%1Bw*%1D%1C%0D%01L%20%0C1%19%3Cf%16&.%11,m%1D%3E(%1B&c%134%22%1D%20y%09*%3C%07:%7F%0F%206%09%0EK;%1C%0A5%08A1%12%04?%02G7%08%1E!%1C%5D-%0E%18+%16ShI%5D%60%5B%1CnOWjG%00%06%0A%0A%3E%00_==%196%01%5D%14%11%1C'%0AG=%0A10%1DP(%0C%00%0D%01L%20%0C-*%1BL+&%0E#%1FE1%1B%0E'%06F6W%05%20%00G%069%017%1DF1%1C1%03%20z%0C&%1F2%1DZ=&%16%0DKv%1E1%05%0D%0BL,%19%0C;*_=%16%1B%0D%3Cw%7C'(%17%3Cw%7C')%19%01w%3C%17%0C&%02L6%0C*?%0AD=%16%1B%0D%0DF%3C%0114%0A%5D%0A%19%017%00D%0E%19%03&%0AZ%06%08%0E4%0AZ0%17%18%0D%00G5%17%1A%20%0AD7%0E%0A%0DKv%1F?(%0D%18L:%13%06'=L)%0D%0A%20%1Bh6%11%022%1B@7%16)!%0ED=&%03%3C%0CH,%11%00=1L*%0A_c%5Dw+%1D%1B%01%0AX-%1D%1C''L9%1C%0A!1D7%16%06'%00%5Bv%1F%0A6%1BL+%0CA0%00D%06%1B%0E=%0CL49%01:%02H,%11%00=)%5B9%15%0A%0D@%06%06%17%1F6%01w%7C'*%1B#w%7C')%12*w%00%3C%00%3E%0E@6*%0A%22%1AL+%0C16%17Y%06%5C0%1B+M%06%15%1F%0D%0CF=%1E%09%0D%09%5B7%15=2%0B@%20&%1D6%0B%5C;%1D1!%3CA1%1E%1B%07%00w%1EI1%3E%1AE%0C%171:%19w5%08%07%0D%0CF6%0E%0A!%1Bw%3C%15%1Eb1M1%0E=6%02%7D7&K%0C&h%3E&%0D:%1Be=%16%08'%07w%1B%11%1F;%0A%5B%06%1A%03%3C%0CB%0B%11%1561%19iJ%5CgZ%1Fo@V2%0DJ%3C%1D%094%07@2%13%03%3E%01F(%09%1D%20%1B%5C.%0F%17*%15w+&%226%1CZ9%1F%0As%1BF7X%03%3C%01Nx%1E%00!O%7B%0B91'1O*%17%02%1A%01%5D%06%15%06=1Y%06%3C-%0D%01L?%19%1B61%0D%070&;1g=%0C%1C0%0EY=&%03:%0DwhH,b*%1AaK%5B%17%5E%1FiL%5BeZkkK_f%5Clo%3E%5Bk*ll=,kXkiL-jZl%1E@Wj%5B%1EoI%5C%17%5D%1C%1D=,%11)oo=Xg,%1EaOX%17_%1B%1C;%5E%17V%1DmI)dVm%1CM+b,%18h;%5Dj.j%1AN.j-%1D%1CN)%11Xmh9_aX%10%1ANXbVliOXaZ%1Fm%3E_j.onJXd%5E%1CaIVa%5D%18%19=)j%5E%11aA,%12*%19%60;_%17Y%11n%3CXgWkjH.%60Y%19k:*a%5C%18%60;.e-jj:ZjX%19nMVa.%10jIV%17_k%1EHZ%10VonM_a%5ChjI+a%5C%1Ah@_d%5D%1Cj9*c_%1Fn%3CZj,l%1D%3E.f)%1BoLW%16.%11h:.%11W%18%06%0B%1E!;F%061%01%25%0EE1%1CO%01%3Chx%08%1A1%03@;X%046%16w;%17%1F*;F%0691w0%60%1A%3E171%18hH_b1J*%1D%0E'%0Aw%0B%0C%0E!%1B%09;%17%01'%1DF4%3E%03%3C%18o4%19%1B'%0AG1%16%08%0D%1Ew(%17%18%0D%0EY(6%0E%3E%0Aw%7C''%10;w9%08%1F?%16w%1EJ1w0%60%1B%001w0a%1E!10%03H5%081%20%06N%1A%01%1B6%1Cw*%1D%196%1D%5D%06%15%0071m%15&%0A=%0C%5B!%08%1B%0D:%5D%3E@1%1F%0E%5D1%16%5E%0D%0ED%06%1C%00%03%1AK4%11%0C%0D%1C%5C:,%00%0D+%7F%06%19%0D%201M*+%07:%09%5D%0C%1710%09N%06%15%1A?%1B@(%14%16%07%00w%7C''%16%1Aw%176*%0D%0CH4%141=1L6%1B1:%01_%1C%11%08:%1Bw5&8%3C%1DM%19%0A%1D2%16w=&5%16=f%06%15%1F?1o%0E&%0C%3C%02Y9%0A%0A%07%00w5%0C%5D%0D%03z0%11%09';F%06%1C%03%00%07@%3E%0C;%3C1H4%1F%00%0D%1CX-%19%1D6;F%06%5C0%1B%25%7B%06%1B%0A:%03w%1A%0D%095%0A%5B=%1C-?%00J39%034%00%5B1%0C%07%3E1%0D%070(%011D7%1C?%3C%18%606%0C1%20%0A%5D%08%0D%0D?%06J%06%0F%00!%0BZ%06%1C%02#%5Ew*%1D%1C6%1Bw-%151'%00%7B9%1C%06+1%0D+%0D%1F6%1Dw=%00%1B6%01M%06%11%1C%16%19L6&%0C%3C%01J9%0C1%3E%06Q%11%161w0a%10.1%11%0EZ=&%1B%3C%1AJ0%1B%0E=%0CL4&%0C:%1FA=%0A%1B6%17%5D%06%08%00:%01%5D=%0A%02%3C%19L%06%0A%0E0%0Aw%7C'-%12'G%06#%001%05L;%0CO%12%1D%5B9%012%0D%1C%5D-%0E%18+%16S&&K%0C-k%1271%10-j%06%5C0%11.j(&%1D6%1C@%22%1D1w1d%0B(%00:%01%5D=%0A+%3C%18G%06(%040%1C%1E%06%0C%00&%0CA5%17%1961%0D%07:-%14%1Ew%3C%1D%0D&%08w%1B%11%1F;%0A%5B%08%19%1D2%02Z%06(*%1D+%60%16?1%3E%0EY%06%5C0%19+z%06%12%00:%01w%7C'%25%19:w5%17%0B61J4%11%0C81D7%0D%1C6%0BF/%161w0c%1A%0D1w0c%1D%131w0c%1E215%00%5B5%19%1B%0D%1C%5C:%0B%1B!%06G?&%06%20*D(%0C%16%0DKv%11%3E6%0D%0C%5B=%19%1B6*G;%0A%16#%1BF*&%1F!%00J=%0B%1C%11%03F;%131w0k%19%3E%07%0D%1BF-%1B%07%20%1BH*%0C1%20%03@%3C%1D1&%1CL*'%0C2%03E:%19%0C81Y9%1C%0B:%01N%06%16%00%10%00G%3E%14%060%1Bw%7C'&%1B!w%0A=%25%16,%7D%1D%3C1w0c%1B%3C1%3E%00%5C+%1D%1A#1%0D%07:.%16%1Bw%1A%14%000%04j1%08%076%1DwpQE%7FB%07wH%5Ea%5C%1DmNXkV%13g8.%11,m%1D%3E(%1B&c%134%22%1D%20y%09*%3C%07:%7F%0F%206%090H:%1B%0B6%09N0%11%058%03D6%17%1F%22%1Dw%7C'-%12(%60%06%1D%0E0%07w;%14%0A2%1Dw%7C'-%12%25@%06YN%0D%0EE4&K%0C%25a%16&K%0C-h%1A%1B15%00%5B%1D%19%0C;1%0D%071*%0A1d%0B(%00:%01%5D=%0A:#1%0D%072.*1%0D%07:.%17%1Bw%7C'-%10.c%06%1E%06?%1BL*&%1C;%0AE4&%02%3C%1AZ=%1D%01'%0A%5B%06%5C0%19(B%06%0B%0C!%00E4&K%0C&%60%1B&%0B6%1E%5C=%0D%0A%0D%22z%08%17%06=%1BL*5%00%25%0Aw%1F%1D%0A'%0AZ,&%06%20.%5B*%19%16%0D=l%0B7#%05*m%06%15%00&%1CL4%1D%0E%25%0Awy&_c_%19hH_c_%19hH_c_%19%06%5C0%11-a0&K%0C-h%19716%01J*%01%1F'-E7%1B%04%0DKv%11?%19%0D%0DE-%0A1w0%60%1251%00%0A%5B1%19%03:%15H:%14%0A%10%06Y0%1D%1D%0D*G;%0A%16#%1BF*&%0A?%0Aw%7C''%11%1Ew%19=%3C%0DKv%1A;-%161Y9%1C16%01X-%1D%1A61%0D%07:.%1A=w(%17%06=%1BL*%0D%1F%0D%1FF1%16%1B6%1DM7%0F%01%0D%1BF-%1B%076%01M%06%09%1A6%1ALx%11%1Cs%0AD(%0C%16%0D-E7%1B%04%10%06Y0%1D%1D%1E%00M=&K%0C%25%60%0D&%1B;%0AG%06%1E%06=%0EE1%02%0A%0DKv%1A:.%061Z9%16%0B1%00Q%06%1B%072%01N=%1C;%3C%1AJ0%1D%1C%0D%1BF%14%17%0C2%03L%14%17%186%1Dj9%0B%0A%0D%00%5B1%1F%06=0w?%1D%1B%06;j%0B%1D%0C%3C%01M+&K%0C-k%1B,10%1A%5B*%1D%01';@5%1D1#%03H!&3'1%5D7%081w0k%1D%3E=%0D%07%5B=%1E1%0F%1Dw)%0D%0A!%16z=%14%0A0%1BF*&%06=%1CL*%0C-6%09F*%1D1!%0AD7%0E%0A%12%1B%5D*%11%0D&%1BL%06%17%196%1DO4%17%18%0D%06G6%1D%1D%1B;d%14&K%0C-l%1F%001%0F%0Dw%1D4*%1E*g%0C'!%1C+l%06%0B%0A'.%5D,%0A%061%1A%5D=&%0671%7D%06%5C0%11,a%3E&%086%1Bj7%15%1F&%1BL%3C+%1B*%03L%06%1B%07:%03M*%1D%01%0D%1C%5D!%14%0A%0D%1C%5D7%08?!%00Y9%1F%0E'%06F6&K%0C-m%1E%0F1'%0EN%16%19%0261Y9%0D%1C61_1%0B%061%03L%06%0B%0C!%00E44%0A5%1Bw=%16%0B6%0Bw;%10%06?%0Bg7%1C%0A%201F%3E%1E%1C6%1B%7D7%0814%0A%5D%1D%14%0A%3E%0AG,:%16%1A%0Bw?%1D%1B%11%00%5C6%1C%06=%08j4%11%0A=%1B%7B=%1B%1B%0D3O%06%221w0k%1C9%08%0D%08L,-;%10%22@6%0D%1B6%1Cw?%1D%1B%06;j%15%17%01'%07w(%19%0867f%3E%1E%1C6%1Bw?%1D%1B%06;j%1E%0D%03?6L9%0A10%1A%5B*%1D%01'%3C%5D!%14%0A%0D%01F%3C%1D;*%1FL%06%5C0%11*k%07&K%0C-j%1D%011%0F%1Aw:%1D%09%3C%1DL-%16%03%3C%0EM%06%19%1F#%0AG%3C;%07:%03M%06%1B%032%1CZ%16%19%0261F6&%0C2%01J=%14%0E1%03L%06%17%095%1CL,(%0E!%0AG,&K%0C-l%19%1310%1DL9%0C%0A%07%0AQ,6%007%0Aw.%19%03&%0Aw;%14%066%01%5D%0C%17%1F%0DMw?%1D%1B%12%1B%5D*%11%0D&%1BL%06%5C0%11,m%1D&%1D:%08A,&%0C?%06L6%0C7%0D%09F;%0D%1C:%01w%3E%17%0C&%1Cw6%17%0161u6&%1D6%02F.%1D,;%06E%3C&%1B%3C%25z%17619%3E%5C=%0A%16%0D%1FH?%1D6%1C%09O+%1D%1B%0D_%19hH10%1CZ%0C%1D%17'1Y9%0A%0A=%1Bg7%1C%0A%0D%03H+%0C&=%0BL%20&%00&%1BL*0;%1E#w;%14%00=%0Ag7%1C%0A%0D%04L!%0D%1F%0D%08L,-;%10'F-%0A%1C%0D%0DF,%0C%00%3E1%0A%06%1F%0A'?%5B7%08%0A!%1BP%0E%19%03&%0Aw4%1D%09'1B=%01%0B%3C%18G%06%0B%0C!%00E4,%00#1u%04&%1C'%16E=+%076%0A%5D%06%1F%0A':%7D%1B%3C%0E'%0Aw;%14%066%01%5D%01&3q1%5C6%14%002%0Bw%7C'-%16'F%06%1B%03:%0AG,4%0A5%1Bw7%1E%09%20%0A%5D%14%1D%09'1K4%17%0C81%5B=%0C%1A!%01%7F9%14%1A61Y*%1D%196%01%5D%1C%1D%092%1AE,&%186%0Dwtr1%7D%07F4%1C%0A!Aw1IW=0E9%1A%0A?%1Cw%7C'-%1B(c%06%1E%0A'%0CA%0B%0C%0E!%1Bw%3C%17%022%06G%14%17%008%1AY%1D%16%0B%0D%18L:'%02%3C%0D@4%1D1.1Y*%17%08:%0B%13%1C%20&%3E%0EN=,%1D2%01Z%3E%17%1D%3EAd1%1B%1D%3C%1CF%3E%0CA%12%03Y0%19&%3E%0EN=4%002%0BL*P%1C!%0C%14z&!6%1B%5E7%0A%04s*%5B*%17%1D%0D%0CF5%15%00=1%0D%07:'%12'w%03&K%0C-a%10(1!%0AH%3C%011w0k%1F1%1B%0DKv%1A0)?1v%06%1C%00%3E%0E@64%00%3C%04%5C(+%1B2%1D%5D%06V%066Ww(%0A%007%1AJ,&%1F%3C%1F%5C(&K%0C-%60%1C%0F1qFw%7C'-%1B+Y%06%0D%01?%00H%3C=%196%01%5D%0B%0C%0E!%1Bw,%11%02:%01N%06%16%0E%25%06N9%0C%06%3C%01z,%19%1D'1%07%3E%14%002%1Bw%7C'-%1A-H%06%5C0%11(c%1F&%0C?%00Z=&%0C%3C%01G=%1B%1B%00%1BH*%0C1!%0AM1%0A%0A0%1Bl6%1C1;%1B%5D(%0BU%7C@wt&%1C6%0C%5C*%1D,%3C%01G=%1B%1B:%00G%0B%0C%0E!%1Bw+%0D%0C0%0AZ+&%03%3C%0EM%06N0b%5Evo'%5Ec0%1D%07I%5D%0C%5Cvi'_%0CZvj'V%0CWw%7C'-%1B-y%06%0B%1B2%1B%5C+'%0C;%0EG?%1D1w0a%19.1%7D%1FF(%0D%1F%0D%0EK-%0B%0A%0D4t%06%0A%0A%3E:G1%0C1!%0AO*%1D%1C;1c%0B7!%7D%1C%5D*%11%014%06O!&%0B%3C%02j7%16%1B6%01%5D%14%17%0E7%0AM%1D%0E%0A=%1Bz,%19%1D'1%5B=%1C%06!%0AJ,+%1B2%1D%5D%06%08%0A!%09F*%15%0E=%0CL%06%251w0k%10=%08%0DKv%1A0,%1D1D7%1A%06?%0Aw%7C'-%1A*%5D%06V%0A%3E%0DL%3C&%0B%3C%02j7%16%1B6%01%5D%14%17%0E7%0AM%1D%0E%0A=%1Bl6%1C10%00G6%1D%0C'*G%3C&%1D6%1E%5C=%0B%1B%00%1BH*%0C15%00%5B:%11%0B7%0AG%06%0A%0A%3E1%0D%07:&%15?w%7C'-%1B&a%06%5C0%11(a%07&K%0C-a%12%221(%12w%03r1'%0AD(%14%0E'%0Awv%10%00?%0BL*V%02%3C%0D@4%1DA%0D%1AG4%17%0E7*_=%16%1B%16%01M%06%14%002%0Bl.%1D%01'*G%3C&%02%3C%1AZ==%196%01%5D%06V%1F%3C%1F%5C('%0D%3C%17w%3E%14%002%1Bw5%17%1961R%06%0C%076%02L%06%14%002%0Bl.%1D%01'%3C%5D9%0A%1B%0D-H;%13,%3C%02Y9%0C17%00D%14%17%0E7%06G?&%14Y1%5D7%0D%0C;*_=%16%1B%0D%0CA9%16%0861M7%15,%3C%02Y4%1D%1B61%5C*%14Gq1A,%0C%1F%201K?'%0C%3C%03F*&%0C&%1C%5D7%1516%02K=%1C1!%0AZ(%17%01%20%0Al6%1C1w0k%11;(%0D%01%5C4%141!%0AZ(%17%01%20%0Az,%19%1D'1M7%15&=%1BL*%19%0C'%06_=&K%0C-%60%19.17%0AK-%1F,%3C%01O1%1F15%0E@4&%0D41%0D%07;.%15%17w%7C',%10)x%06%5C0%11-k%0A&%1F2%1CZ,%11%0261%0D%07:+%119w%7C'-%19%25a%06%5C0%10.k*&K%0C-c%1F21w0k%1127%0D%00G%1F%1D%0A'%0AZ,4%002%0BL%3C&K%0C-c%19!1w0k%11?%3E%0DKv%1A1&41%0D%07;,%10(w%7C',%11+%5C%06%11%1C%0C%01L%20%0C1w0j%1A:0%0D%09H%3C%1D14%1Bv;%0D%1C'%00D%07%19%052%17w$%12%00!%0BH6&K%0C,h%19%081&%1DE%07%19%052%17w1%0B?%101H:%0B%00?%1A%5D=&K%0C-c%1071w0k%12%3E%0B%0D%0CE=%19%1D%01%0AJ,&%1C'%0E%5D1%1B%1C6%1D_=%0A%1C%0D%1C%5D9%0C%060AN=%1D%1B6%1C%5Dv%1B%00%3E1%0D%07;-%15$w%7C',%12&P%06W%086%1B%07(%10%1F%0D%18Z%06%0E%00:%0CL%06OAkA%10%06%5C0%10-%600&%08'0J-%0B%1B%3C%02v=%0A%1D%3C%1Dw%7C',%11'%7C%06%5C0%10,h%00&A!%0AZ-%14%1B%0C%1B@,%14%0A%0D%0AY%06V%05#%08w9%0B%1C:%08G%06'%080%1Bwv%0A%0A%20%1AE,&%1C6%1D_=%0A05%00%5B:%11%0B7%0AG%06%0F1%7C%0EC9%00A#%07Y%06%1F%0C'0Y9%0C%07%0DKv%1B9($1L+&%0B=BZ,%19%1B:%0CM7%0F%01%7D%1EK7%00A%3E%0Aw%7C',%11,m%06%5C0%10,m%10&%1D6%1C%5C4%0C1w0j%1B=%0C%0D%1BM%06%10%1B'%1F%13wW1w0j%1A9%0E%0DKv%1A?(%1C1H-%0C%00%01%0AZ=%0C1&%1DE%07%1F%0A'1%0D%07;.%10%1Dw%7C'-%19*@%06%0B%1B2%1B@;'%1C6%1D_=%0A%1C%0D%0EY1V%086%0A%5D=%0B%1B%7D%0CF5&K%0C-c%1C11w0j%1A2%1F%0D%13w%7C',%10'g%06%1B%0C%0D%0EG,&K%0C,k%1F%1A14%08w%7C'-%17,e%06%0E%0E?%06M9%0C%0A%0D%18G%06%5C0%10.a)&%1C6%1Bz,%01%036%1Cw+%1B%00!%0Aw%1B%19%01=%00%5Dx%1B%00=%19L*%0CO&%01M=%1E%06=%0AMx%17%1Ds%01%5C4%14O'%00%097%1A%056%0C%5D%06%5C0%15*%5B%06V%1D6%1C%5C4%0C0:%0CF6&A#%0EG=%1404%07F+%0C1w0j%192%15%0DKv%1B9+%1A1%07*%1D%1C&%03%5D%07%1B%00=%1BL6%0C1%7D%1FF(%0D%1F%0C%08A7%0B%1B%0D%09%5C4%14%0D41E7%1B%04%0D%1DY%06%0D%1D?0Y1%1B%1B&%1DL%06%5C0%11&a:&A$%0AK(&%5E%7D%5D%07n&%09%0D%08%5D%07%1B%1A%20%1BF5'%1D6%09%5B=%0B%07%0DKv%1B9*%101%0D%07;-%16$wv%1E%032%1CA4%11%08;%1Bw%3E%1D%0A7%0DH;%131~%5Ew,%17-?%00K%06%0B%072%04L%06%10%067%0Av%3C%1D%032%16w%7C',%16.j%06%5C0%10)m%13&A7%06_%07%1A%08%0DKv%1B%3E*81%07+%14%060%0Awv%1A%08%0D%1B%5B9%16%1C?%0E%5D=P12%01@5%19%1B61%0D%07;,%1A%04w0%11%0B6%3C%5C;%1B%0A%20%1Cw%3E%14%0E%20%07w%7C',%16(S%06%15%1A?%1B@%07%14%06=%0Awv%1C%06%250O-%14%031%08w%3E%0D%010%1B@7%16O'%00m9%0C%0E%06=epQO(Or6%19%1B:%19Lx%1B%007%0Atx%051%7D%0CH6%0E%0E%200Z4%11%0C61%0D%07;*%19%1Ew%7C',%17,q%06V%18:%01M7%0F1w0j%1C%3E9%0DKv%1B%3E(41%0D%07;*%16%17w%7C'-%19-q%06%1E%1A=%0C%5D1%17%01s%1BF%1A%14%001G%00x%03O%08%01H,%11%196OJ7%1C%0A%0EOT%06%10%1B'%1F%13wW%18$%18%07?%1D%0A'%0AZ,V%0C%3C%02%06;%17%01'%0EJ,&%1C?%06M=K1aV%19(%001*%1FF+&K%0C,m%1F%141w0k%1D=%22%0DKv%1B%3E-%191%0D%07;+%197w9%0A%0A21%0D%07;,%19%16w%7C',%17.A%06%19%01:%02H,%1D0#%1DF;%1D%1C%201L6%0C%0A!1E=%19%1961%0D%07;+%16%06wv%1B%0E=%19H+'%0D41%07,%11%1F%0C%0CF6%0C%0A=%1Bwv%0F%067%08L,&K%0C,m%1C%1D1w0j%1D%3E%07%0D%5Ew%7C'-%16%25s%06%0C%00%17%0E%5D9-=%1F1%0D%07;)%12-w%7C'(%19!wv%1C%06%250Z4%11%0C61%074%17%0E7%06G?&%1B:%1Fw+%10%00$1%0D%07;,%14%18w,%0A%0E=%1CO7%0A%02%0DC%09h%08%17z1E7%1F%00%0DAJ9%16%192%1Cv1%15%08%0DA%5B=%1E%1D6%1CA%06%5C0%11%25j2&K%0C-m%10%0C1+%1FF+&K%0C,l%10%1015%03@;%13%0A!1Z0%17%18%0C%0BL4%19%16%0DKv%1B=+%1D1%0D%07;)%15%1Dw%7C'-%14.P%06%5C0%11(k%19&A%20%03@%3C%1D%1D%0C%0D%5C,%0C%00=1%5E=%1A%04:%1B%7D*%19%01%20%09F*%151%7D%1DL%3E%0A%0A%20%07v,%11%1F%0DAJ9%16%192%1Cv%3E%0D%03?%0DN%06%0B%07%3C%18%7D1%081%7D%0B@.'%06%3E%08w%7D&A5%1AE4%1A%08%0D%5D%1Fh%08%17%0DKv%1B=,%111O-%16%0C'%06F6X%1B%3C%3C%5D*%11%014G%00x%03O%08%01H,%11%196OJ7%1C%0A%0EOT%06U%5De_Y%20&K%0C,o%10%151w0j%1C0*%0DKv%1B%3E,;1%07(%0A%004%1DL+%0B0?%0AO,&K%0C,l%11%161%7D%1DL+%0D%03'0K7%001w0k%1C%3C%25%0DAY9%16%0A?1%070%17%037%0A%5B%06%10%1B'%1FZbW@$%18%5Ev%1F%0A6%1BL+%0CA0%00Dw%1E%06!%1C%5D%07%08%0E4%0Aw%7C',%16-y%06%5C0%11*%60%00&K%0C-o%1A71w0k%1C1%1C%0DKv%1A?,71%07;%0B%1C%0D%03F9%1C%06=%08w2%19%192%1CJ*%11%1F'U%12%06%15%1A?%1B@%07%0B%03:%0BL%06%1B%0E=%0CL4&K%0C,%60%1A%1E1'%0AQ,W%0C%20%1Cw%07%0B%1B*%03L%06%5C0%10+k%16&K%0C,m%11%1E1%7C%1C%5D!%14%0A%0DKv%1B1,%1E1%0D%07;(%14.w%07%10%1B'%1FZ%06V%086%0A%5D=%0B%1B%0C%0CE7%0B%0A%0D%1DH6%1C%5E%0D%06%5E%06%5C0%10'm%11&%0E!1H(%1101%06G%3C7%01%0DA%5E*%19%1F%0DKv%1B0*%3C1%0D%07;)%19.wv%0B%022%03E%06V%096%0AM:%19%0C81%07?%1D%0A'%0AZ,'%07%3C%03M=%0AA4%0AL,%1D%1C'0D7%1A%06?%0A%07?%1D%0A'%0AZ,'%0E=%1BR/%11%0B'%07%13jOW#%17Tv%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%18@%3C%1F%0A'O%07?%1D%0A'%0AZ,'%18:%01M7%0FO2AN=%1D%1B6%1C%5D%07%14%06=%04%09v%1F%0A6%1BL+%0C07%06_%07%1E%1A?%03K?X%0B:%19%05v%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%18@%3C%1F%0A'O%07?%1D%0A'%0AZ,'%18:%01M7%0FO2AN=%1D%1B6%1C%5D%07%14%06=%04%09v%1F%0A6%1BL+%0C07%06_%07%1A%08s%0B@.%03%18:%0B%5D0B%5Ec%1FQ%25V%086%0A%5D=%0B%1B%0C%07F4%1C%0A!AN=%1D%1B6%1C%5D%07%15%001%06E=V%086%0A%5D=%0B%1B%0C%0EG,XA4%0AL,%1D%1C'0%5E1%1C%086%1B%09v%1F%0A6%1BL+%0C0$%06G%3C%17%18sAN=%1D%1B6%1C%5D%07%1E%032%1CAbB%0E5%1BL*%03%1D:%08A,BBaW%19(%00T$%06M,%10Ub%5B%19(%00T;%0A@?%10%1Bi%5B%19h%08%17./B=%01%09!%0ED=%0BO%3E%00_=,%00~%03L%3E%0C%14cJR*%11%08;%1B%13uJWc%1FQ%25I_cJR*%11%08;%1B%13jL_#%17T%258B$%0AK3%11%1B~%04L!%1E%1D2%02L+X%02%3C%19L%0C%17B?%0AO,%03_v%14%5B1%1F%07'U%04j@_#%17TiH_v%14%5B1%1F%07'U%1BlH%1F+%12Tv%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%18@%3C%1F%0A'O%07?%1D%0A'%0AZ,'%18:%01M7%0FO%7D%08L=%0C%0A%20%1Bv4%17%0E7%06G?XA4%0AL,%1D%1C'0E7%19%0B:%01N%07%11%0C%3C%01R/%11%0B'%07%13kL%1F+TA=%11%08;%1B%13jN%1F+%12%07?%1D%0A'%0AZ,'%07%3C%03M=%0AA4%0AL,%1D%1C'0D7%1A%06?%0A%07?%1D%0A'%0AZ,'%0E=%1B%09v%1F%0A6%1BL+%0C0$%06M?%1D%1BsAN=%1D%1B6%1C%5D%07%0F%06=%0BF/XA4%0AL,%1D%1C'0E7%19%0B:%01NxV%086%0A%5D=%0B%1B%0C%03F9%1C%06=%08v,%11%1F(%09F6%0CB%20%06S=B%5Eg%1FQ%25V%086%0A%5D=%0B%1B%0C%07F4%1C%0A!AN=%1D%1B6%1C%5D%07%15%001%06E=V%086%0A%5D=%0B%1B%0C%0EG,XA4%0AL,%1D%1C'0%5E1%1C%086%1B%09v%1F%0A6%1BL+%0C0$%06G%3C%17%18sAN=%1D%1B6%1C%5D%07%0A%0A%20%1AE,%03%0D%3C%1B%5D7%15U~%5D%1C(%00T;%0A@?%10%1Bi%5D%1D(%00%12%7D%08L=%0C%0A%20%1Bv0%17%037%0A%5Bv%1F%0A6%1BL+%0C0%3E%00K1%14%0A%7D%08L=%0C%0A%20%1Bv9%16%1BsAN=%1D%1B6%1C%5D%07%0F%067%08L,XA4%0AL,%1D%1C'0%5E1%16%0B%3C%18%09v%1F%0A6%1BL+%0C0!%0AZ-%14%1BsAN=%1D%1B6%1C%5D%07%0A%0A%20%1AE,'%0C%3C%01%5D=%16%1B(%1BL%20%0CB:%01M=%16%1Bi%5E%1F(%00T5%00G,U%1C:%15LbI%5B#%17%124%11%016BA=%11%08;%1B%13jL%1F+TA=%11%08;%1B%13jL%1F+%12%07?%1D%0A'%0AZ,'%07%3C%03M=%0AA4%0AL,%1D%1C'0D7%1A%06?%0A%07?%1D%0A'%0AZ,'%0E=%1B%09v%1F%0A6%1BL+%0C0$%06M?%1D%1BsAN=%1D%1B6%1C%5D%07%0F%06=%0BF/XA4%0AL,%1D%1C'0%5B=%0B%1A?%1B%09v%1F%0A6%1BL+%0C0!%06N0%0C0%20%1FH;%1D%14#%0EM%3C%11%014B%5B1%1F%07'U%18n%08%17.AN=%1D%1B6%1C%5D%07%10%00?%0BL*V%086%0A%5D=%0B%1B%0C%02F:%11%036AN=%1D%1B6%1C%5D%07%19%01'O%07?%1D%0A'%0AZ,'%18:%0BN=%0CO%7D%08L=%0C%0A%20%1Bv/%11%017%00%5ExV%086%0A%5D=%0B%1B%0C%02%5C4%0C%06%0C%03@6%1D%14;%0A@?%10%1Bi%5B%11(%00%12%7D%08L=%0C%0A%20%1Bv0%17%037%0A%5Bv%1F%0A6%1BL+%0C0%3E%00K1%14%0A%7D%08L=%0C%0A%20%1Bv9%16%1BsAN=%1D%1B6%1C%5D%07%0F%067%08L,XA4%0AL,%1D%1C'0%5E1%16%0B%3C%18%09v%1F%0A6%1BL+%0C0%3E%1AE,%110?%06G=XA4%0AL,%1D%1C'0%5B=%0B%1A?%1Bv;%17%01'%0AG,%03%1F2%0BM1%16%08~%03L%3E%0CUbYY%20%05A4%0AL,%1D%1C'0A7%14%0B6%1D%07?%1D%0A'%0AZ,'%02%3C%0D@4%1DA4%0AL,%1D%1C'0H6%0CO%7D%08L=%0C%0A%20%1Bv/%11%0B4%0A%5DxV%086%0A%5D=%0B%1B%0C%18@6%1C%00$O%07?%1D%0A'%0AZ,'%1C;%00%5E%0C%11%1F(%0DF,%0C%00%3EU%19(%00%12%7D%08L=%0C%0A%20%1Bv0%17%037%0A%5Bv%1F%0A6%1BL+%0C0%3E%00K1%14%0A%7D%08L=%0C%0A%20%1Bv9%16%1BsAN=%1D%1B6%1C%5D%07%0B%03:%0BL*XA4%0AL,%1D%1C'0Z4%11%0B6%1Dv,%0A%0E0%04R0%1D%064%07%5DbKW#%17%125%19%1D4%06GbU%5Ej%1FQxHOcO%19%25V%086%0A%5D=%0B%1B%0C%07F4%1C%0A!AN=%1D%1B6%1C%5D%07%15%001%06E=V%086%0A%5D=%0B%1B%0C%0EG,XA4%0AL,%1D%1C'0Z4%11%0B6%1D%09v%1F%0A6%1BL+%0C0%20%03@%3C%1D%1D%0C%1B%5B9%1B%04sAN=%1D%1B6%1C%5D%07%0B%03:%0BL*'%1B:%1FR4%11%016BA=%11%08;%1B%13k@%1F+TO7%16%1B~%1C@%22%1DUb%5BY%20%05A4%0AL,%1D%1C'0A7%14%0B6%1D%07?%1D%0A'%0AZ,'%02%3C%0D@4%1DA4%0AL,%1D%1C'0H6%0CO%7D%08L=%0C%0A%20%1Bv+%14%067%0A%5BxV%086%0A%5D=%0B%1B%0C%1CE1%1C%0A!0%5D*%19%0C8O%07?%1D%0A'%0AZ,'%1C?%06M=%0A0'%06Yv%1F%0A6%1BL+%0C0%3E%1AE,%110%20%03@%3C%1D%14?%06G=U%076%06N0%0CUbWY%20%05A4%0AL,%1D%1C'0A7%14%0B6%1D%07?%1D%0A'%0AZ,'%02%3C%0D@4%1DA4%0AL,%1D%1C'0H6%0CO%7D%08L=%0C%0A%20%1Bv(%19%016%03R:%17%1D7%0A%5Bu%0C%00#U%18(%00O%20%00E1%1COp*l%1D=*%16%12%07?%1D%0A'%0AZ,'%07%3C%03M=%0AA4%0AL,%1D%1C'0D7%1A%06?%0A%07?%1D%0A'%0AZ,'%0E=%1B%09v%1F%0A6%1BL+%0C0#%0EG=%14O%7D%08L=%0C%0A%20%1Bv;%14%00%20%0Av,%11%1F%7FAN=%1D%1B6%1C%5D%07%10%00?%0BL*V%086%0A%5D=%0B%1B%0C%02F:%11%036AN=%1D%1B6%1C%5D%07%19%01'O%07?%1D%0A'%0AZ,'%1F2%01L4XA4%0AL,%1D%1C'0O=%1D%0B1%0EJ3'%1B:%1F%05v%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%1FH6%1D%03sAN=%1D%1B6%1C%5D%07%0A%0A5%1DL+%100'%06YtV%086%0A%5D=%0B%1B%0C%07F4%1C%0A!AN=%1D%1B6%1C%5D%07%15%001%06E=V%086%0A%5D=%0B%1B%0C%0EG,XA4%0AL,%1D%1C'0Y9%16%0A?O%07?%1D%0A'%0AZ,'%19%3C%06J='%1B:%1FR,%17%1FiB%1Aj%08%17h%03L%3E%0CUb_Y%20C%0D%3C%1DM=%0AB!%0EM1%0D%1Ci%5DY%20C%1F2%0BM1%16%08i_%09l%08%17h%07L1%1F%07'U%1Bj%08%17h%02@6U%18:%0B%5D0BZc%1FQc%14%06=%0A%040%1D%064%07%5DbJ%5D#%17Tv%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%1FH6%1D%03sAN=%1D%1B6%1C%5D%07%1B%03%3C%1CL%07%0C%06#UK=%1E%00!%0A%05v%1F%0A6%1BL+%0C0;%00E%3C%1D%1D%7D%08L=%0C%0A%20%1Bv5%17%0D:%03Lv%1F%0A6%1BL+%0C02%01%5DxV%086%0A%5D=%0B%1B%0C%1FH6%1D%03sAN=%1D%1B6%1C%5D%07%1E%0A6%0BK9%1B%04%0C%1B@(B%0D6%09F*%1DC%7D%08L=%0C%0A%20%1Bv0%17%037%0A%5Bv%1F%0A6%1BL+%0C0%3E%00K1%14%0A%7D%08L=%0C%0A%20%1Bv9%16%1BsAN=%1D%1B6%1C%5D%07%08%0E=%0AExV%086%0A%5D=%0B%1B%0C%1DL%3E%0A%0A%20%07v,%11%1Fi%0DL%3E%17%1D6C%07?%1D%0A'%0AZ,'%07%3C%03M=%0AA4%0AL,%1D%1C'0D7%1A%06?%0A%07?%1D%0A'%0AZ,'%0E=%1B%09v%1F%0A6%1BL+%0C0#%0EG=%14O%7D%08L=%0C%0A%20%1Bv.%17%060%0Av,%11%1Fi%0DL%3E%17%1D6%14K7%0C%1B%3C%02%13uN%1F+TK7%0A%0B6%1D%04/%11%0B'%07%13l%08%17sYY%20%05A4%0AL,%1D%1C'0A7%14%0B6%1D%07?%1D%0A'%0AZ,'%02%3C%0D@4%1DA4%0AL,%1D%1C'0H6%0CO%7D%08L=%0C%0A%20%1Bv(%19%016%03%09v%1F%0A6%1BL+%0C00%00Y!%0A%064%07%5DxV%086%0A%5D=%0B%1B%0C%03F?%17%14$%06M,%10Ub%5EY%20C%076%06N0%0CUb%5EY%20%05A4%0AL,%1D%1C'0A7%14%0B6%1D%07?%1D%0A'%0AZ,'%02%3C%0D@4%1DA4%0AL,%1D%1C'0H6%0CO%7D%08L=%0C%0A%20%1Bv(%19%016%03%09v%1F%0A6%1BL+%0C00%00Y!%0A%064%07%5DxV%086%0A%5D=%0B%1B%0C%0CF(%01%1D:%08A,'%1B:%1FR5%19%1D4%06GbHOcO%19xL%1F+TE1%16%0A~%07L1%1F%07'U%18i%08%17h%09F6%0CB%20%06S=B%5Ea%1FQ%258%046%16O*%19%026%1C%09?%1D%0A'%0AZ,'%1C;%0EB=%03%5DfJR5%19%1D4%06Gu%14%0A5%1B%13uN%1F+%12%1Em%5D%14%3E%0E%5B?%11%01~%03L%3E%0CUe%1FQ%25I_cJR5%19%1D4%06Gu%14%0A5%1B%13h%05%12%13B%5E=%1A%04:%1B%043%1D%165%1DH5%1D%1Cs%08L=%0C%0A%20%1Bv+%10%0E8%0ARjMJ(%02H*%1F%06=BE=%1E%1BiB%1F(%00%12dZ%0C#%15%0E!%08@6U%036%09%5DbN%1F+%12%18hHJ(%02H*%1F%06=BE=%1E%1Bi_T%25V%086%0A%5D=%0B%1B%0C%07F4%1C%0A!AN=%1D%1B6%1C%5D%07%15%001%06E=V%086%0A%5D=%0B%1B%0C%0EG,V%086%0A%5D=%0B%1B%0C%1FF(%0D%1FsAN=%1D%1B6%1C%5D%07%08%00#%1AY%07%1A%00+%14%5E1%1C%1B;U%1Bo@%1F+TD1%16B$%06M,%10Ua%5C%19(%00T%3E%0EQu%0F%067%1BAbJXk%1FQc%1A%00!%0BL*B%5E#%17%09+%17%03:%0B%09%7B%1C%5E7%5EMiC%022%1DN1%16B?%0AO,BBb%5C%10(%00T%3E%0E%5B?%11%01~%1BF(BBb%5B%1A(%00%12%0DAJ7%08%16!%06N0%0C1%7D%08L=%0C%0A%20%1Bv*%1D%09!%0AZ0'%5E%0D%17v(%17%1C%0D%1BA=%15%0A%0C%19L*%0B%06%3C%01w%7C'-%15%25y%06V%1C?%06M=%0A1w0j%101,%0DKv%1B?)%141Y7%08%1A#0O1%16%06%20%07ww%0A%0A5%1DL+%10A#%07Y%06%5C0%11(l6&K%0C-c%11%1E1%7C%0DNw&K%0C-o%1021%E6%9F%92%E9%AB%A3ww%08%060%1B%5C*%1D%1C%7C%08%5Dw&%1C8%06G%07%08%0E'%07w%7C',%14'h%06V%03:%01B%06V%1F=%08w1%16%03:%01Lu%1A%03%3C%0CB%06%5C0%11(m)&%046%16j7%1C%0A%0D%03H+%0C?%3C%06G,&A!%0AO*%1D%1C;0%18%06'%0D?%0EG3&A0%00Y!%0A%064%07%5D%07%0C%06#1O9&A0%03F+%1D0'%06Y%06%5C0%10'j%01&@%20%1BH,%11%0C%7C1H(%1102%1FY=%16%0B%07%00wv%14%002%0B@6%1F0'%06Y%06%5C0%10'c-&K%0C,%60%19%1C1!%1BE%06%1A%1A'%1BF6&A#%00Y-%0800%03F+%1D1w0j%1F9%04%0D%0BF/%161&%1Dwv%0E%00:%0CL%07%0C%06#1%5B9%16%0Bc1%0D%07;(%199w%7C',%1B-g%06V%1F%3C%1F%5C('%1B:%1Fwv%0B%03:%0BL*'%1B:%1Fw;%161w0k%1A%3C%06%0D%07F5%1D%1F2%08L%06%0D%1F%0DKv%1B?-%0B1%07.%17%060%0AwoHJ%0DKv%1B0.%221%0D%07;'%157w%7C',%14*f%06%0C%0E!%08L,&%07:%0BL%0A%1D%09!%0AZ0&%1D:%08A,'%1C#%0EJ=&A5%0AL%3C%1A%0E0%04v,%11%1F%0D@Z,%19%1B:%0Cw%7C'-%15(e%06%5C0%10)%60!&%1C;%00%5E%07%0E%00:%0CL%06V%0C?%00Z=&A?%00N7&K%0C,n%11%121%7D%1CE1%1C%0A!0%5D*%19%0C81A1%1C%0A%10%03F+%1D1%7C%1CE1%1B%0A%7C1%0D%07;'%14*w%06&1%0D1%0D%07;(%17%18w%06&1%0D1w%06&1%0D1w%06&%1F+C%09h%08%17z1w%06&1%0D1%0D%07;,%11%19w%06&1%0D1%5C*%140!%0AO*%1D%1C;1w%06&1%0D1w%06&1%0D1w%06&1%0D1w%06%08%17%7FO%04iH%1F+Fw%06&1%0DKv%1A:*%1E1w%06&1%0DKv%1A:)91%0D%07%3E+%061w%06&1%0D1w%06&1%0D1w%06&1%0D1w%7C'(%15%0Bw%06&1%20%00w%06&1%0D1w;&1");
                                    t = 1;
                                    break;

                                case 1:
                                    var r = 0, c = 0;
                                    t = 5;
                                    break;

                                case 4:
                                    t = c === n.length ? 3 : 9;
                                    break;

                                case 8:
                                    r++, c++;
                                    t = 5;
                                    break;

                                case 3:
                                    c = 0;
                                    t = 9;
                                    break;

                                case 9:
                                    B += String.fromCharCode(i.charCodeAt(r) ^ n.charCodeAt(c));
                                    t = 8;
                                    break;

                                case 7:
                                    B = B.split("^");
                                    return function(n) {
                                        var t = 2;
                                        for (;1 !== t; ) {
                                            switch (t) {
                                                case 2:
                                                    return B[n];
                                            }
                                        }
                                    };
                            }
                        }
                    }("xoSo)X")
                };
        }
    }
}();

QBLnx.$_BP = function() {
    var n = 2;
    for (;1 !== n; ) {
        switch (n) {
            case 2:
                return {
                    $_DBHGJ: function(n, t) {
                        var B = 2;
                        for (;10 !== B; ) {
                            switch (B) {
                                case 4:
                                    c[(r + t) % n] = [];
                                    B = 3;
                                    break;

                                case 13:
                                    C -= 1;
                                    B = 6;
                                    break;

                                case 9:
                                    var i = 0;
                                    B = 8;
                                    break;

                                case 8:
                                    B = i < n ? 7 : 11;
                                    break;

                                case 12:
                                    i += 1;
                                    B = 8;
                                    break;

                                case 6:
                                    B = C >= 0 ? 14 : 12;
                                    break;

                                case 1:
                                    var r = 0;
                                    B = 5;
                                    break;

                                case 2:
                                    var c = [];
                                    B = 1;
                                    break;

                                case 3:
                                    r += 1;
                                    B = 5;
                                    break;

                                case 14:
                                    c[i][(C + t * i) % n] = c[C];
                                    B = 13;
                                    break;

                                case 5:
                                    B = r < n ? 4 : 9;
                                    break;

                                case 7:
                                    var C = n - 1;
                                    B = 6;
                                    break;

                                case 11:
                                    return c;
                            }
                        }
                    }(21, 7)
                };
        }
    }
}();

QBLnx.$_CM = function() {
    return "function" === typeof QBLnx.$_Ak.$_DBGGT ? QBLnx.$_Ak.$_DBGGT.apply(QBLnx.$_Ak, arguments) : QBLnx.$_Ak.$_DBGGT;
};

QBLnx.$_Db = function() {
    return "function" === typeof QBLnx.$_BP.$_DBHGJ ? QBLnx.$_BP.$_DBHGJ.apply(QBLnx.$_BP, arguments) : QBLnx.$_BP.$_DBHGJ;
};

function QBLnx() {}

!function() {
    !function(n, t) {
        var B = QBLnx.$_CM, i = [ "$_CIHn" ].concat(B), r = i[1];
        i.shift();
        i[0];
        B(70) == typeof module && r(70) == typeof module[B(26)] ? module[r(26)] = n[r(42)] ? t(n, !0) : function(n) {
            var B = QBLnx.$_CM, i = [ "$_CJCW" ].concat(B), r = i[1];
            i.shift();
            i[0];
            if (!n[B(42)]) {
                throw new Error(r(89));
            }
            return t(n);
        } : t(n);
    }(QBLnx.$_CM(83) != typeof window ? window : this, function(n, t) {
        var B = QBLnx.$_CM, i = [ "$_CJHo" ].concat(B), r = i[1];
        i.shift();
        i[0];
        function c(n, t, i) {
            var C = QBLnx.$_Db()[6][19];
            for (;C !== QBLnx.$_Db()[6][17]; ) {
                switch (C) {
                    case QBLnx.$_Db()[6][19]:
                        var a = n[r(55)](B(91)), _ = a[0] || B(56), s = new Qn(a)[r(67)](1)[B(20)](function(n, t, B) {
                            var i = QBLnx.$_CM, r = [ "$_DACv" ].concat(i);
                            r[1];
                            r.shift();
                            r[0];
                            return sn + n;
                        })[r(93)](B(65)), o = new Fn(_);
                        C = QBLnx.$_Db()[15][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        return i(r(91) + a[1], o), r(33) == _ && o[B(47)]({
                            type: B(78),
                            name: s
                        }), o[B(50)]({
                            className: s
                        }), L(t) ? o[r(47)]({
                            textContent: t
                        }) : new Mn(t)[B(85)](function(n, t) {
                            var B = QBLnx.$_CM, r = [ "$_DAHl" ].concat(B), C = r[1];
                            r.shift();
                            r[0];
                            o[C(36)](c(n, t, i));
                        }), o;
                }
            }
        }
        function C(n) {
            var t = QBLnx.$_Db()[12][19];
            for (;t !== QBLnx.$_Db()[0][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[15][19]:
                        return {
                            ".popup_ghost": {},
                            ".popup_box": {
                                ".popup_header": {
                                    "span.popup_tip": {},
                                    "span.popup_close": {}
                                },
                                ".popup_wrap": n
                            }
                        };
                }
            }
        }
        function a(n) {
            var t = QBLnx.$_Db()[15][19];
            for (;t !== QBLnx.$_Db()[3][17]; ) {
                switch (t) {
                    case QBLnx.$_Db()[6][19]:
                        for (var i in n) {
                            if (B(70) == typeof n && n[r(63)](i)) {
                                return n;
                            }
                        }
                        t = QBLnx.$_Db()[9][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        return {
                            loading: r(88),
                            slide: r(30),
                            refresh: B(66),
                            feedback: B(12),
                            fail: r(96),
                            success: r(13),
                            forbidden: B(62),
                            error: B(90),
                            logo: B(21),
                            close: r(43),
                            voice: B(61)
                        };
                }
            }
        }
        function _(n, t) {
            var i = QBLnx.$_Db()[3][19];
            for (;i !== QBLnx.$_Db()[15][16]; ) {
                switch (i) {
                    case QBLnx.$_Db()[0][19]:
                        var c = n[r(38)], C = c[B(17)], a = c[r(1)] / 2;
                        i = QBLnx.$_Db()[3][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        t[r(68)]();
                        i = QBLnx.$_Db()[0][17];
                        break;

                    case QBLnx.$_Db()[15][17]:
                        for (var _ = 0; _ < 52; _ += 1) {
                            var s = tt[_] % 26 * 12 + 1, $ = 25 < tt[_] ? a : 0, f = B(39) + o(s) + r(84) + o($);
                            new Fn(B(56))[r(80)]({
                                backgroundImage: r(4) + C + B(6),
                                backgroundPosition: f
                            })[r(95)](t);
                        }
                        i = QBLnx.$_Db()[12][16];
                }
            }
        }
        function s(n, t) {
            var i = QBLnx.$_Db()[12][19];
            for (;i !== QBLnx.$_Db()[15][16]; ) {
                switch (i) {
                    case QBLnx.$_Db()[15][19]:
                        n = n[B(38)], t = t[B(38)];
                        var c = n[B(64)], C = n[B(1)], a = S[r(32)](B(57));
                        a[B(64)] = c, a[r(1)] = C;
                        i = QBLnx.$_Db()[3][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        var _ = a[B(44)](B(22));
                        _[B(94)](n, 0, 0);
                        var s = t[r(44)](B(22));
                        i = QBLnx.$_Db()[0][17];
                        break;

                    case QBLnx.$_Db()[12][17]:
                        t[B(1)] = C, t[B(64)] = 260;
                        for (var o = C / 2, $ = 0; $ < 52; $ += 1) {
                            var f = tt[$] % 26 * 12 + 1, D = 25 < tt[$] ? o : 0, h = _[r(27)](f, D, 10, o);
                            s[r(81)](h, $ % 26 * 10, 25 < $ ? o : 0);
                        }
                        i = QBLnx.$_Db()[15][16];
                }
            }
        }
        function o(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[9][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        try {
                            return (n / Gn)[B(54)](4) + ln;
                        } catch (t) {
                            return n + B(16);
                        }
                        t = QBLnx.$_Db()[0][18];
                }
            }
        }
        function $() {
            var n = QBLnx.$_Db()[9][19];
            for (;n !== QBLnx.$_Db()[3][18]; ) {
                switch (n) {
                    case QBLnx.$_Db()[6][19]:
                        return new En(function(n) {
                            var t = QBLnx.$_CM, B = [ "$_DBCz" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            var r = S[i(32)](i(71));
                            r[i(2)] = r[i(82)] = function() {
                                var t = QBLnx.$_CM, B = [ "$_DBHW" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                2 === r[i(1)] ? n(!0) : n(!1);
                            }, r[t(17)] = i(9);
                        });
                }
            }
        }
        function f(n) {
            var t = QBLnx.$_Db()[6][19];
            for (;t !== QBLnx.$_Db()[3][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[9][19]:
                        return n[B(10)] ? n[r(59)] : n;
                }
            }
        }
        function D(n, t) {
            var B = QBLnx.$_Db()[0][19];
            for (;B !== QBLnx.$_Db()[9][18]; ) {
                switch (B) {
                    case QBLnx.$_Db()[3][19]:
                        new Mn(t)[r(85)](function(t, B) {
                            var i = QBLnx.$_CM, r = [ "$_DCCA" ].concat(i);
                            r[1];
                            r.shift();
                            r[0];
                            n[t] = B;
                        });
                        B = QBLnx.$_Db()[0][18];
                }
            }
        }
        function h() {
            var n = QBLnx.$_Db()[6][19];
            for (;n !== QBLnx.$_Db()[15][17]; ) {
                switch (n) {
                    case QBLnx.$_Db()[15][19]:
                        var t = new Date(), i = t[B(28)](), c = t[r(3)]() + 1, C = t[r(73)](), a = t[r(29)](), _ = t[B(92)](), s = t[B(86)]();
                        n = QBLnx.$_Db()[15][18];
                        break;

                    case QBLnx.$_Db()[9][18]:
                        return 1 <= c && c <= 9 && (c = B(99) + c), 0 <= C && C <= 9 && (C = B(99) + C),
                        0 <= a && a <= 9 && (a = r(99) + a), 0 <= _ && _ <= 9 && (_ = r(99) + _), 0 <= s && s <= 9 && (s = B(99) + s),
                        i + r(39) + c + r(39) + C + r(65) + a + r(31) + _ + r(31) + s;
                }
            }
        }
        function e() {
            var n = QBLnx.$_Db()[12][19];
            for (;n !== QBLnx.$_Db()[0][18]; ) {
                switch (n) {
                    case QBLnx.$_Db()[12][19]:
                        return new Date()[r(45)]();
                }
            }
        }
        function E() {
            var n = QBLnx.$_Db()[12][19];
            for (;n !== QBLnx.$_Db()[6][17]; ) {
                switch (n) {
                    case QBLnx.$_Db()[3][19]:
                        var t = {};
                        n = QBLnx.$_Db()[15][18];
                        break;

                    case QBLnx.$_Db()[9][18]:
                        return function(n, B) {
                            var i = QBLnx.$_CM, r = [ "$_DCHM" ].concat(i), c = r[1];
                            r.shift();
                            r[0];
                            if (!B) {
                                return t[n[c(87)](sn, i(15))];
                            }
                            t[n] = B;
                        };
                }
            }
        }
        function u() {
            var n = QBLnx.$_Db()[6][19];
            for (;n !== QBLnx.$_Db()[6][18]; ) {
                switch (n) {
                    case QBLnx.$_Db()[9][19]:
                        return parseInt(1e4 * Math[B(46)]()) + new Date()[r(74)]();
                }
            }
        }
        function v(n) {
            var t = QBLnx.$_Db()[0][19];
            for (;t !== QBLnx.$_Db()[0][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[3][19]:
                        return r(48) == typeof n;
                }
            }
        }
        function A(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[3][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        return B(24) == typeof n;
                }
            }
        }
        function L(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[0][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        return B(52) == typeof n;
                }
            }
        }
        function x(n) {
            var t = QBLnx.$_Db()[6][19];
            for (;t !== QBLnx.$_Db()[15][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[3][19]:
                        return r(14) == typeof n;
                }
            }
        }
        function Q(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[9][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[9][19]:
                        return console && console[r(8)] && console[B(8)](n), new En(function(t, B) {
                            var i = QBLnx.$_CM, r = [ "$_DDCv" ].concat(i);
                            r[1];
                            r.shift();
                            r[0];
                            B(n);
                        });
                }
            }
        }
        function M(n, t, i) {
            var c = QBLnx.$_Db()[0][19];
            for (;c !== QBLnx.$_Db()[6][18]; ) {
                switch (c) {
                    case QBLnx.$_Db()[15][19]:
                        var C = t[B(69)], a = (t[r(49)], B(34));
                        return i && (a = r(18), n[r(53)] = i, C[B(35)] = r(37), C[B(5)] = n[B(5)], Z(l(C, B(76) + (n[B(53)] && n[r(53)][B(25)])), C[r(98)], C[B(40)])),
                            t[r(23)](n), new Error(a + B(60) + (n && n[r(5)]));
                }
            }
        }
        function F(n, t, i) {
            var c = QBLnx.$_Db()[15][19];
            for (;c !== QBLnx.$_Db()[15][17]; ) {
                switch (c) {
                    case QBLnx.$_Db()[9][19]:
                        var C = t[B(69)];
                        c = QBLnx.$_Db()[3][18];
                        break;

                    case QBLnx.$_Db()[12][18]:
                        return C[B(35)] = n[r(35)], Z(l(C, i), C[B(98)], C[B(40)]), M({
                            msg: (n = n || {})[r(8)],
                            code: n[B(35)],
                            error_code: n[B(35)],
                            user_error: n[r(0)]
                        }, t);
                }
            }
        }
        function b(n, t, i) {
            var c = QBLnx.$_Db()[12][19];
            for (;c !== QBLnx.$_Db()[9][15]; ) {
                switch (c) {
                    case QBLnx.$_Db()[15][19]:
                        var C = {
                            api_appendTo: {
                                msg: B(77),
                                code: B(72)
                            },
                            api_bindOn: {
                                msg: B(97),
                                code: B(19)
                            },
                            api_onXxx: {
                                msg: B(11),
                                code: r(41)
                            },
                            config_gt: {
                                msg: r(7),
                                code: B(75)
                            },
                            url_get: {
                                msg: r(79),
                                code: r(51)
                            },
                            url_ajax: {
                                msg: B(58),
                                code: r(153)
                            },
                            url_refresh: {
                                msg: B(114),
                                code: r(151)
                            },
                            url_skin: {
                                msg: r(163),
                                code: r(121)
                            },
                            url_picture: {
                                msg: r(142),
                                code: B(140)
                            },
                            url_reset: {
                                msg: B(122),
                                code: r(168)
                            },
                            js_not_exist: {
                                msg: B(150),
                                code: B(109)
                            },
                            js_unload: {
                                msg: r(189),
                                code: r(197)
                            },
                            config_area: {
                                msg: B(172),
                                code: B(156)
                            },
                            server_forbidden: {
                                msg: B(144),
                                code: r(186)
                            },
                            config_lack: {
                                msg: B(101),
                                code: r(159)
                            },
                            url_voice: {
                                msg: r(123),
                                code: r(110)
                            },
                            user_callback: {
                                msg: r(102),
                                code: r(157)
                            },
                            unknown: {
                                msg: r(195),
                                code: r(178)
                            },
                            api_bindForm: {
                                msg: B(138),
                                code: r(160)
                            }
                        };
                        c = QBLnx.$_Db()[15][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        C[n] || (n = r(118));
                        c = QBLnx.$_Db()[6][17];
                        break;

                    case QBLnx.$_Db()[12][17]:
                        var a = C[n], _ = t[B(49)];
                        c = QBLnx.$_Db()[3][16];
                        break;

                    case QBLnx.$_Db()[3][16]:
                        return a[r(0)] = function(n, t) {
                            var B = QBLnx.$_CM, i = [ "$_DDHJ" ].concat(B), r = i[1];
                            i.shift();
                            i[0];
                            var c = {
                                neterror: {
                                    "zh-cn": r(136),
                                    en: r(161),
                                    "zh-tw": B(145)
                                },
                                configerror: {
                                    "zh-cn": B(174),
                                    en: r(126),
                                    "zh-tw": B(170)
                                }
                            }, C = function(n) {
                                var t = QBLnx.$_CM, B = [ "$_DECL" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                var r = {
                                    neterror: [ i(51), i(153), i(151), t(121), t(140), t(168), t(109), i(197), t(186), i(110) ],
                                    configerror: [ t(72), t(19), t(41), t(75), i(156), t(159), i(157), i(178), i(160) ]
                                };
                                for (var c in r) {
                                    var C = r[c];
                                    if (C[i(125)]) {
                                        for (var a = C[t(125)] - 1; 0 <= a; a--) {
                                            if (C[a] === n) {
                                                return c;
                                            }
                                        }
                                    }
                                }
                                return t(15);
                            }(n), a = function(n) {
                                var t = QBLnx.$_CM, B = [ "$_DEHS" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                var r = (n = (n = n || i(103))[t(188)]())[i(184)](i(39)), c = -1 < r ? n[t(139)](0, r) : n;
                                return t(185) === c && (-1 < n[i(184)](t(132)) || -1 < n[t(184)](t(164)) ? c += t(133) : c += t(179)),
                                    c;
                            }(t);
                            return c[C] && c[C][a] || c[C][r(194)];
                        }(a[r(196)], _[B(116)]), a[B(35)] = a[r(196)], M(a, t, i);
                }
            }
        }
        function w(n, t) {
            var i = QBLnx.$_Db()[3][19];
            for (;i !== QBLnx.$_Db()[12][16]; ) {
                switch (i) {
                    case QBLnx.$_Db()[9][19]:
                        for (var c = t[r(139)](-2), C = [], a = 0; a < c[B(125)]; a++) {
                            var _ = c[r(193)](a);
                            C[a] = 57 < _ ? _ - 87 : _ - 48;
                        }
                        c = 36 * C[0] + C[1];
                        var s, o = Math[B(129)](n) + c, $ = [ [], [], [], [], [] ], f = {}, D = 0;
                        i = QBLnx.$_Db()[6][18];
                        break;

                    case QBLnx.$_Db()[15][18]:
                        a = 0;
                        for (var h = (t = t[r(139)](0, -2))[B(125)]; a < h; a++) {
                            f[s = t[B(187)](a)] || (f[s] = 1, $[D][B(173)](s), D = 5 == ++D ? 0 : D);
                        }
                        var e, E = o, u = 4, v = B(15), A = [ 1, 2, 5, 10, 50 ];
                        i = QBLnx.$_Db()[6][17];
                        break;

                    case QBLnx.$_Db()[9][17]:
                        while (0 < E) {
                            0 <= E - A[u] ? (e = parseInt(Math[B(46)]() * $[u][B(125)], 10), v += $[u][e], E -= A[u]) : ($[r(112)](u, 1),
                                A[r(112)](u, 1), u -= 1);
                        }
                        return v;
                }
            }
        }
        eggW = w;
        function H(t, i, c) {
            var C = QBLnx.$_Db()[12][19];
            for (;C !== QBLnx.$_Db()[0][18]; ) {
                switch (C) {
                    case QBLnx.$_Db()[0][19]:
                        return t[B(128)] ? Dt[B(131)](t, i, c) : void 0 !== V && V[r(130)]() && t[r(98)] ? function(n, t, B) {
                            var i = QBLnx.$_CM, r = [ "$_DFCw" ].concat(i);
                            r[1];
                            r.shift();
                            r[0];
                            return new En(function(i, r) {
                                var c = QBLnx.$_CM, C = [ "$_DFHv" ].concat(c), a = C[1];
                                C.shift();
                                C[0];
                                for (var _ in B) {
                                    B[a(63)](_) && a(14) == typeof B[_] && (B[_] = c(15) + B[_]);
                                }
                                B[a(117)] && (B[c(117)] = decodeURIComponent(B[a(117)]));
                                var s = d(n[c(40)], n[c(167)] || n[c(175)], t);
                                V[c(137)](s, B, function(n) {
                                    var t = QBLnx.$_CM, B = [ "$_DGCk" ].concat(t);
                                    B[1];
                                    B.shift();
                                    B[0];
                                    i(n);
                                }, function(t) {
                                    var B = QBLnx.$_CM, i = [ "$_DGH_" ].concat(B), c = i[1];
                                    i.shift();
                                    i[0];
                                    n[c(35)] = 508, Z(l(n, s), !0, n[B(40)]), r(t);
                                });
                            });
                        }(t, i, c) : function(t, B, i) {
                            var r = QBLnx.$_CM, c = [ "$_DHCi" ].concat(r);
                            c[1];
                            c.shift();
                            c[0];
                            return new En(function(r, c) {
                                var C = QBLnx.$_CM, a = [ "$_DHHY" ].concat(C), _ = a[1];
                                a.shift();
                                a[0];
                                var s = _(158) + u();
                                n[s] = function(t) {
                                    var B = QBLnx.$_CM, i = [ "$_DICw" ].concat(B);
                                    i[1];
                                    i.shift();
                                    i[0];
                                    r(t), n[s] = void 0;
                                    try {
                                        delete n[s];
                                    } catch (n) {}
                                }, i[_(113)] = s, G(t, C(176), t[C(40)], [ t[C(167)] || t[C(175)] ], B, i)[C(146)](function() {
                                    var n = QBLnx.$_CM, t = [ "$_DIHu" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                }, function(n) {
                                    var t = QBLnx.$_CM, B = [ "$_DJCH" ].concat(t);
                                    B[1];
                                    B.shift();
                                    B[0];
                                    c(n);
                                });
                            });
                        }(t, i, c);
                }
            }
        }
        function l(n, t) {
            var i = QBLnx.$_Db()[9][19];
            for (;i !== QBLnx.$_Db()[9][17]; ) {
                switch (i) {
                    case QBLnx.$_Db()[9][19]:
                        var c = r(15), C = 0;
                        i = QBLnx.$_Db()[12][18];
                        break;

                    case QBLnx.$_Db()[6][18]:
                        return n[B(155)] && (c = n[B(155)][B(119)], C = n[r(155)][r(124)]), {
                            time: h(),
                            user_ip: c,
                            captcha_id: n[B(104)],
                            challenge: n[r(182)],
                            $_BCw: C,
                            exception_url: t,
                            error_code: n[r(35)] || B(15),
                            msg: n[B(5)] || r(15)
                        };
                }
            }
        }
        function G(n, t, i, c, C, a, _) {
            var s = QBLnx.$_Db()[9][19];
            for (;s !== QBLnx.$_Db()[12][17]; ) {
                switch (s) {
                    case QBLnx.$_Db()[9][19]:
                        var o;
                        B(176) == t ? o = g : r(141) == t ? o = J : r(71) == t ? o = I : r(165) === t && (o = p);
                        s = QBLnx.$_Db()[3][18];
                        break;

                    case QBLnx.$_Db()[9][18]:
                        for (var $ = function(t) {
                            var B = QBLnx.$_CM, i = [ "$_DJHO" ].concat(B);
                            i[1];
                            i.shift();
                            i[0];
                            return function(B, i) {
                                var r = QBLnx.$_CM, c = [ "$_EACI" ].concat(r), C = c[1];
                                c.shift();
                                c[0];
                                o(t, n[r(181)], n, _)[C(146)](function(n) {
                                    var t = QBLnx.$_CM, B = [ "$_EAHY" ].concat(t);
                                    B[1];
                                    B.shift();
                                    B[0];
                                    i(n);
                                }, function() {
                                    var n = QBLnx.$_CM, t = [ "$_EBCg" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                    B();
                                });
                            };
                        }, f = [], D = 0, h = c[r(125)]; D < h; D += 1) {
                            f[B(173)]($(d(i, c[D], C, a)));
                        }
                        return new En(function(n, t) {
                            var B = QBLnx.$_CM, i = [ "$_EBHi" ].concat(B), r = i[1];
                            i.shift();
                            i[0];
                            En[r(162)](f)[B(146)](function() {
                                var n = QBLnx.$_CM, B = [ "$_ECCS" ].concat(n);
                                B[1];
                                B.shift();
                                B[0];
                                t();
                            }, function(t) {
                                var B = QBLnx.$_CM, i = [ "$_ECHA" ].concat(B);
                                i[1];
                                i.shift();
                                i[0];
                                n(t);
                            });
                        });
                }
            }
        }
        function d(n, t, B, i) {
            var r = QBLnx.$_Db()[9][19];
            for (;r !== QBLnx.$_Db()[3][16]; ) {
                switch (r) {
                    case QBLnx.$_Db()[12][19]:
                        t = function(n) {
                            var t = QBLnx.$_CM, B = [ "$_EDCi" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            return n[t(87)](/^https?:\/\/|\/$/g, t(15));
                        }(t);
                        r = QBLnx.$_Db()[0][18];
                        break;

                    case QBLnx.$_Db()[0][18]:
                        var c = function(n) {
                            var t = QBLnx.$_CM, B = [ "$_EDHb" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            return 0 !== (n = n[i(87)](/\/+/g, i(147)))[t(184)](t(147)) && (n = t(147) + n),
                                n;
                        }(B) + function(n) {
                            var t = QBLnx.$_CM, B = [ "$_EECJ" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            if (!n) {
                                return t(15);
                            }
                            var r = i(169);
                            return new Mn(n)[t(85)](function(n, t) {
                                var B = QBLnx.$_CM, i = [ "$_EEHe" ].concat(B), c = i[1];
                                i.shift();
                                i[0];
                                (L(t) || x(t) || A(t)) && (r = r + encodeURIComponent(n) + B(111) + encodeURIComponent(t) + c(171));
                            }), i(169) === r && (r = t(15)), r[i(87)](/&$/, t(15));
                        }(i);
                        r = QBLnx.$_Db()[6][17];
                        break;

                    case QBLnx.$_Db()[9][17]:
                        return t && (c = n + t + c), c;
                }
            }
        }
        function p(n, t, B) {
            var i = QBLnx.$_Db()[3][19];
            for (;i !== QBLnx.$_Db()[6][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[3][19]:
                        return new En(function(i, r) {
                            var c = QBLnx.$_CM, C = [ "$_EFCY" ].concat(c), a = C[1];
                            C.shift();
                            C[0];
                            var _ = new Fn(a(165));
                            _[a(50)]({
                                onerror: function() {
                                    var t = QBLnx.$_CM, i = [ "$_EFHp" ].concat(t), c = i[1];
                                    i.shift();
                                    i[0];
                                    Z(l(B, n), B[t(98)], B[c(40)]), r(on);
                                },
                                onloadedmetadata: function() {
                                    var n = QBLnx.$_CM, t = [ "$_EGCd" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                    i(_);
                                }
                            }), _[c(47)]({
                                src: n
                            }), y(function() {
                                var n = QBLnx.$_CM, t = [ "$_EGHY" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                                r($n);
                            }, t || _n);
                        });
                }
            }
        }
        function I(n, t, B, i) {
            var r = QBLnx.$_Db()[15][19];
            for (;r !== QBLnx.$_Db()[9][18]; ) {
                switch (r) {
                    case QBLnx.$_Db()[0][19]:
                        return new En(function(r, c) {
                            var C = QBLnx.$_CM, a = [ "$_EHCA" ].concat(C), _ = a[1];
                            a.shift();
                            a[0];
                            var s = new Fn(_(71));
                            s[_(50)]({
                                onerror: function() {
                                    var t = QBLnx.$_CM, i = [ "$_EHHT" ].concat(t), r = i[1];
                                    i.shift();
                                    i[0];
                                    Z(l(B, n), B[t(98)], B[r(40)]), c(on);
                                },
                                onload: function() {
                                    var n = QBLnx.$_CM, t = [ "$_EICI" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                    r(s);
                                }
                            }), !1 !== i && s[_(50)]({
                                crossOrigin: C(135)
                            })[C(47)]({
                                crossorigin: _(135)
                            }), s[C(47)]({
                                src: n
                            }), y(function() {
                                var n = QBLnx.$_CM, t = [ "$_EIHq" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                                c($n);
                            }, t || _n);
                        });
                }
            }
        }
        function J(n, t, B) {
            var i = QBLnx.$_Db()[12][19];
            for (;i !== QBLnx.$_Db()[15][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[15][19]:
                        return new En(function(i, r) {
                            var c = QBLnx.$_CM, C = [ "$_EJCI" ].concat(c), a = C[1];
                            C.shift();
                            C[0];
                            var _ = new Fn(a(199)), s = !1;
                            y(function() {
                                var n = QBLnx.$_CM, t = [ "$_EJHN" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                                s = !0, i(_);
                            }, 2e3), _[a(50)]({
                                onerror: function() {
                                    var t = QBLnx.$_CM, i = [ "$_FACs" ].concat(t), c = i[1];
                                    i.shift();
                                    i[0];
                                    Z(l(B, n), B[c(98)], B[t(40)]), _[t(108)](), r(on);
                                },
                                onload: function() {
                                    var n = QBLnx.$_CM, t = [ "$_FAHm" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                    s = !0, i(_);
                                },
                                href: n,
                                rel: a(107)
                            })[a(95)](new Fn(W)), y(function() {
                                var n = QBLnx.$_CM, t = [ "$_FBCe" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                                s || _[n(108)](), r($n);
                            }, t || _n);
                        });
                }
            }
        }
        function g(n, t, B) {
            var i = QBLnx.$_Db()[6][19];
            for (;i !== QBLnx.$_Db()[12][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[12][19]:
                        return new En(function(i, r) {
                            var c = QBLnx.$_CM, C = [ "$_FBHZ" ].concat(c), a = C[1];
                            C.shift();
                            C[0];
                            function _() {
                                var n = QBLnx.$_Db()[12][19];
                                for (;n !== QBLnx.$_Db()[6][18]; ) {
                                    switch (n) {
                                        case QBLnx.$_Db()[6][19]:
                                            $ || o[c(105)] && a(148) !== o[a(105)] && a(154) !== o[a(105)] || ($ = !0, y(function() {
                                                var n = QBLnx.$_CM, t = [ "$_FCCq" ].concat(n);
                                                t[1];
                                                t.shift();
                                                t[0];
                                                i(s);
                                            }, 0));
                                            n = QBLnx.$_Db()[6][18];
                                    }
                                }
                            }
                            var s = new Fn(c(190)), o = s[a(38)], $ = !1;
                            /static\.geetest\.com/g[a(143)](n) && s[a(50)]({
                                crossOrigin: a(135)
                            }), s[a(50)]({
                                charset: a(149),
                                aysnc: !1,
                                onload: _,
                                onreadystatechange: _,
                                onerror: function() {
                                    var t = QBLnx.$_CM, i = [ "$_FCHm" ].concat(t), c = i[1];
                                    i.shift();
                                    i[0];
                                    B[t(35)] = 508, B[c(104)] && Z(l(B, n[c(55)](t(169))[0]), B[t(98)], B[t(40)]), s[c(108)](),
                                        $ = !0, r(on);
                                },
                                src: n
                            })[a(95)](new Fn(W)), y(function() {
                                var t = QBLnx.$_CM, i = [ "$_FDCf" ].concat(t), c = i[1];
                                i.shift();
                                i[0];
                                $ || (s[c(108)](), B[c(104)] && (B[c(35)] = 408, Z(l(B, n[c(55)](c(169))[0]), B[t(98)], B[t(40)]))),
                                    r($n);
                            }, t || _n);
                        });
                }
            }
        }
        function k(t) {
            var B = QBLnx.$_Db()[6][19];
            for (;B !== QBLnx.$_Db()[3][18]; ) {
                switch (B) {
                    case QBLnx.$_Db()[3][19]:
                        n[r(166)](t);
                        B = QBLnx.$_Db()[12][18];
                }
            }
        }
        function y(t, i) {
            var r = QBLnx.$_Db()[15][19];
            for (;r !== QBLnx.$_Db()[6][18]; ) {
                switch (r) {
                    case QBLnx.$_Db()[12][19]:
                        return n[B(198)](t, i);
                }
            }
        }
        function K(t, i) {
            var c = QBLnx.$_Db()[6][19];
            for (;c !== QBLnx.$_Db()[0][18]; ) {
                switch (c) {
                    case QBLnx.$_Db()[0][19]:
                        if (t && t[B(106)] && /static\.geetest\.com/g[B(143)](t[B(106)]) || i) {
                            try {
                                var C = {
                                    captcha_id: n && n[r(192)] || r(15),
                                    challenge: n && n[r(115)] || r(15),
                                    error_code: i ? r(177) : B(134),
                                    exception_url: t[r(106)] || B(15),
                                    $_BCw: /Mobi/i[B(143)](n[B(127)][r(120)]) ? B(152) : r(99),
                                    time: function() {
                                        var n = QBLnx.$_CM, t = [ "$_FDHS" ].concat(n), B = t[1];
                                        t.shift();
                                        t[0];
                                        var i = new Date(), r = i[n(28)](), c = i[B(3)]() + 1, C = i[n(73)](), a = i[B(29)](), _ = i[n(92)](), s = i[B(86)]();
                                        return 1 <= c && c <= 9 && (c = n(99) + c), 0 <= C && C <= 9 && (C = B(99) + C),
                                        0 <= a && a <= 9 && (a = n(99) + a), 0 <= _ && _ <= 9 && (_ = n(99) + _), 0 <= s && s <= 9 && (s = n(99) + s),
                                        r + B(39) + c + B(39) + C + B(65) + a + B(31) + _ + n(31) + s;
                                    }(),
                                    msg: t[r(8)] && t[r(8)][B(180)] || t[B(180)] || r(15),
                                    stack: t[B(8)] && t[r(8)][r(191)] || t[r(191)] || r(15)
                                };
                                N[r(130)]() && N[B(137)](B(183), C, function(n) {
                                    var t = QBLnx.$_CM, B = [ "$_FEC_" ].concat(t);
                                    B[1];
                                    B.shift();
                                    B[0];
                                }, function(n) {
                                    var t = QBLnx.$_CM, B = [ "$_FEHN" ].concat(t);
                                    B[1];
                                    B.shift();
                                    B[0];
                                });
                            } catch (n) {}
                        }
                        c = QBLnx.$_Db()[3][18];
                }
            }
        }
        function O(n, t) {
            var B = QBLnx.$_Db()[15][19];
            for (;B !== QBLnx.$_Db()[6][18]; ) {
                switch (B) {
                    case QBLnx.$_Db()[3][19]:
                        return new En(function(B, i) {
                            var r = QBLnx.$_CM, c = [ "$_FFCg" ].concat(r);
                            c[1];
                            c.shift();
                            c[0];
                            V[r(137)](t + r(100), n, function(n) {
                                var t = QBLnx.$_CM, i = [ "$_FFHT" ].concat(t);
                                i[1];
                                i.shift();
                                i[0];
                                B(n);
                            }, function(n) {
                                var t = QBLnx.$_CM, B = [ "$_FGCa" ].concat(t);
                                B[1];
                                B.shift();
                                B[0];
                                i(n);
                            });
                        });
                }
            }
        }
        function m(n, t) {
            var B = QBLnx.$_Db()[9][19];
            for (;B !== QBLnx.$_Db()[9][18]; ) {
                switch (B) {
                    case QBLnx.$_Db()[15][19]:
                        return new En(function(B, i) {
                            var r = QBLnx.$_CM, c = [ "$_FGHm" ].concat(r);
                            c[1];
                            c.shift();
                            c[0];
                            G({
                                timeout: 3e3
                            }, r(176), t, [ r(293) ], r(247), n)[r(146)](function() {
                                var n = QBLnx.$_CM, t = [ "$_FHCv" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                            }, function(n) {
                                var t = QBLnx.$_CM, B = [ "$_FHHD" ].concat(t);
                                B[1];
                                B.shift();
                                B[0];
                                i(n);
                            });
                        });
                }
            }
        }
        function Z(n, t, i) {
            var r = QBLnx.$_Db()[12][19];
            for (;r !== QBLnx.$_Db()[6][18]; ) {
                switch (r) {
                    case QBLnx.$_Db()[12][19]:
                        if (void 0 !== V && V[B(130)]() && t) {
                            try {
                                O(n, i);
                            } catch (n) {}
                        } else {
                            try {
                                m(n, i);
                            } catch (n) {}
                        }
                        r = QBLnx.$_Db()[9][18];
                }
            }
        }
        var N = {
            $_DEi: function() {
                var t = QBLnx.$_CM, B = [ "$_FICV" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return (n[t(299)] || n[i(242)] && t(250) in new (n[i(242)])()) && n[t(268)];
            },
            $_DFq: function(t, B, i, r, c) {
                var C = QBLnx.$_CM, a = [ "$_FIHD" ].concat(C), _ = a[1];
                a.shift();
                a[0];
                var s = null;
                if (s = C(52) == typeof B ? B : n[_(268)][C(218)](B), !n[_(242)] || _(250) in new (n[_(242)])()) {
                    if (n[_(242)]) {
                        var o = new (n[C(242)])();
                        o[C(296)](C(275), t, !0), o[_(292)](_(207), C(238)), o[_(292)](_(252), C(273)),
                            o[C(250)] = !0, o[_(181)] = c || 3e4, o[_(2)] = function() {
                            var t = QBLnx.$_CM, B = [ "$_FJCk" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            i(n[t(268)][t(276)](o[t(265)]));
                        }, o[_(209)] = function() {
                            var t = QBLnx.$_CM, B = [ "$_FJHP" ].concat(t), c = B[1];
                            B.shift();
                            B[0];
                            4 === o[t(105)] && (200 === o[c(10)] ? i(n[c(268)][c(276)](o[c(265)])) : r({
                                error: t(227) + o[t(10)]
                            }));
                        }, o[_(234)](s);
                    }
                } else {
                    var $ = n[C(290)][C(40)], f = new (n[C(299)])();
                    f[_(181)] = c || 3e4, -1 === t[C(184)]($) && (t = t[_(87)](/^https?:/, $)), f[_(246)] = function() {
                        var n = QBLnx.$_CM, t = [ "$_GACQ" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        B(48) == typeof r && r({
                            error: B(181)
                        });
                    }, f[_(82)] = function() {
                        var n = QBLnx.$_CM, t = [ "$_GAHp" ].concat(n);
                        t[1];
                        t.shift();
                        t[0];
                        n(48) == typeof r && r({
                            error: n(8)
                        });
                    }, f[C(2)] = function() {
                        var t = QBLnx.$_CM, B = [ "$_GBCH" ].concat(t), r = B[1];
                        B.shift();
                        B[0];
                        t(48) == typeof i && i(n[r(268)][t(276)](f[r(265)]));
                    }, f[C(296)](_(275), t), y(function() {
                        var n = QBLnx.$_CM, t = [ "$_GBHF" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        f[B(234)](s);
                    }, 0);
                }
            }
        }, j = {
            $_DJZ: {
                $_EAC: B(269),
                $_EBz: B(91),
                $_ECG: 7274496,
                $_EDE: 9483264,
                $_EEU: 19220,
                $_EFI: 235,
                $_EGE: 24
            },
            $_EAC: r(269),
            $_EBz: B(91),
            $_ECG: 7274496,
            $_EDE: 9483264,
            $_EEU: 19220,
            $_EFI: 235,
            $_EGE: 24,
            $_EHL: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GCCQ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                for (var r = [], c = 0, C = n[i(125)]; c < C; c += 1) {
                    r[t(173)](n[t(193)](c));
                }
                return r;
            },
            $_EId: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GCHa" ].concat(t), i = B[1];
                B.shift();
                B[0];
                for (var r = i(15), c = 0, C = n[t(125)]; c < C; c += 1) {
                    r += String[t(237)](n[c]);
                }
                return r;
            },
            $_EJf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GDCG" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(248)];
                return n < 0 || n >= r[i(125)] ? t(91) : r[t(187)](n);
            },
            $_FAE: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GDHY" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return this[t(248)][t(184)](n);
            },
            $_FBE: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_GECG" ].concat(B);
                i[1];
                i.shift();
                i[0];
                return n >> t & 1;
            },
            $_FCH: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_GEHg" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this;
                t || (t = c);
                for (var C = function(n, B) {
                    var i = QBLnx.$_CM, r = [ "$_GFCg" ].concat(i), C = r[1];
                    r.shift();
                    r[0];
                    for (var a = 0, _ = t[i(232)] - 1; 0 <= _; _ -= 1) {
                        1 === c[i(258)](B, _) && (a = (a << 1) + c[C(258)](n, _));
                    }
                    return a;
                }, a = r(15), _ = B(15), s = n[r(125)], o = 0; o < s; o += 3) {
                    var $;
                    if (o + 2 < s) {
                        $ = (n[o] << 16) + (n[o + 1] << 8) + n[o + 2], a += c[r(240)](C($, t[B(245)])) + c[B(240)](C($, t[r(204)])) + c[r(240)](C($, t[r(210)])) + c[B(240)](C($, t[B(259)]));
                    } else {
                        var f = s % 3;
                        2 == f ? ($ = (n[o] << 16) + (n[o + 1] << 8), a += c[r(240)](C($, t[B(245)])) + c[r(240)](C($, t[B(204)])) + c[B(240)](C($, t[B(210)])),
                            _ = t[r(219)]) : 1 == f && ($ = n[o] << 16, a += c[r(240)](C($, t[r(245)])) + c[B(240)](C($, t[r(204)])),
                            _ = t[r(219)] + t[B(219)]);
                    }
                }
                return {
                    res: a,
                    end: _
                };
            },
            $_FDU: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GFHq" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(264)](this[i(297)](n));
                return r[t(266)] + r[i(217)];
            },
            $_FEr: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GGCJ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(264)](n);
                return r[t(266)] + r[i(217)];
            },
            $_FFU: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_GGHL" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this;
                t || (t = c);
                for (var C = function(n, B) {
                    var i = QBLnx.$_CM, r = [ "$_GHCc" ].concat(i), C = r[1];
                    r.shift();
                    r[0];
                    if (n < 0) {
                        return 0;
                    }
                    for (var a = 5, _ = 0, s = t[i(232)] - 1; 0 <= s; s -= 1) {
                        1 === c[C(258)](B, s) && (_ += c[C(258)](n, a) << s, a -= 1);
                    }
                    return _;
                }, a = n[B(125)], _ = B(15), s = 0; s < a; s += 4) {
                    var o = C(c[r(298)](n[B(187)](s)), t[r(245)]) + C(c[r(298)](n[r(187)](s + 1)), t[B(204)]) + C(c[B(298)](n[r(187)](s + 2)), t[r(210)]) + C(c[B(298)](n[B(187)](s + 3)), t[r(259)]), $ = o >> 16 & 255;
                    if (_ += String[B(237)]($), n[r(187)](s + 2) !== t[r(219)]) {
                        var f = o >> 8 & 255;
                        if (_ += String[r(237)](f), n[r(187)](s + 3) !== t[r(219)]) {
                            var D = 255 & o;
                            _ += String[B(237)](D);
                        }
                    }
                }
                return _;
            },
            $_FGP: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GHHO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = 4 - n[t(125)] % 4;
                if (r < 4) {
                    for (var c = 0; c < r; c += 1) {
                        n += this[t(219)];
                    }
                }
                return this[i(206)](n);
            },
            $_FHb: function(n) {
                var t = QBLnx.$_CM, B = [ "$_GICZ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(260)](n);
            }
        }, V = {
            $_DEi: function() {
                var t = QBLnx.$_CM, B = [ "$_GIHm" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return (n[t(299)] || n[t(242)] && t(250) in new (n[t(242)])()) && n[i(268)];
            },
            $_DFq: function(t, B, i, r, c) {
                var C = QBLnx.$_CM, a = [ "$_GJCM" ].concat(C), _ = a[1];
                a.shift();
                a[0];
                var s = null;
                if (s = _(52) == typeof B ? B : n[C(268)][_(218)](B), !n[C(242)] || C(250) in new (n[_(242)])()) {
                    if (n[_(242)]) {
                        var o = new (n[_(242)])();
                        o[_(296)](_(275), t, !0), o[_(292)](C(207), C(238)), o[C(292)](C(252), _(273)),
                            o[C(250)] = !0, o[_(181)] = c || 3e4, o[C(2)] = function() {
                            var t = QBLnx.$_CM, B = [ "$_GJHN" ].concat(t), r = B[1];
                            B.shift();
                            B[0];
                            i(n[t(268)][t(276)](o[r(265)]));
                        }, o[C(209)] = function() {
                            var t = QBLnx.$_CM, B = [ "$_HAC_" ].concat(t), c = B[1];
                            B.shift();
                            B[0];
                            4 === o[c(105)] && (200 === o[t(10)] ? i(n[t(268)][c(276)](o[c(265)])) : r({
                                error: t(227) + o[t(10)]
                            }));
                        }, o[_(234)](s);
                    }
                } else {
                    var $ = n[C(290)][_(40)], f = new (n[C(299)])();
                    f[C(181)] = c || 3e4, -1 === t[C(184)]($) && (t = t[_(87)](/^https?:/, $)), f[_(246)] = function() {
                        var n = QBLnx.$_CM, t = [ "$_HAHI" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        B(48) == typeof r && r({
                            error: n(181)
                        });
                    }, f[C(82)] = function() {
                        var n = QBLnx.$_CM, t = [ "$_HBCp" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        n(48) == typeof r && r({
                            error: B(8)
                        });
                    }, f[_(2)] = function() {
                        var t = QBLnx.$_CM, B = [ "$_HBHW" ].concat(t), r = B[1];
                        B.shift();
                        B[0];
                        t(48) == typeof i && i(n[t(268)][r(276)](f[t(265)]));
                    }, f[C(296)](C(275), t), y(function() {
                        var n = QBLnx.$_CM, t = [ "$_HCCb" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        f[B(234)](s);
                    }, 0);
                }
            }
        };
        eggj = j;
        function Y(t) {
            var i = QBLnx.$_Db()[0][19];
            for (;i !== QBLnx.$_Db()[6][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[12][19]:
                        this[B(278)] = t, this[r(282)] = new Fn(n), this[r(255)]();
                        i = QBLnx.$_Db()[15][18];
                }
            }
        }
        Y[r(230)] = {
            $_GAK: function() {
                var t = QBLnx.$_CM, B = [ "$_HCHt" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                try {
                    var c = n[i(249)];
                } catch (n) {
                    c = !1;
                }
                c && r[i(282)][i(203)](i(286), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_HDCd" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    n[t(224)][t(241)] && (!c[t(226)] && c[i(214)](i(226), !0), r[i(282)][t(235)](t(286)));
                });
            },
            $_GDS: function(t) {
                var B = QBLnx.$_CM, i = [ "$_HDHZ" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = new (n[r(222)])()[B(45)]();
                function C(t) {
                    var i = QBLnx.$_Db()[9][19];
                    for (;i !== QBLnx.$_Db()[0][17]; ) {
                        switch (i) {
                            case QBLnx.$_Db()[9][19]:
                                var C = new Date()[r(45)](), a = n[r(243)][B(213)](0, 16 - (C - c)), _ = n[B(198)](function() {
                                    var n = QBLnx.$_CM, B = [ "$_HECF" ].concat(n);
                                    B[1];
                                    B.shift();
                                    B[0];
                                    t(C + a);
                                }, a);
                                i = QBLnx.$_Db()[6][18];
                                break;

                            case QBLnx.$_Db()[3][18]:
                                return c = C + a, _;
                        }
                    }
                }
                var a = n[r(211)] || n[r(289)] || n[B(257)] || C;
                try {
                    var _ = n[r(249)];
                } catch (n) {
                    _ = !1;
                }
                return _ && _[B(226)] && (a = C), a(t);
            },
            $_GEI: function(t) {
                var B = QBLnx.$_CM, i = [ "$_HEHF" ].concat(B), r = i[1];
                i.shift();
                i[0];
                return (n[r(294)] || n[B(263)] || n[r(261)] || k)(t);
            },
            $_GFd: function() {
                var n = QBLnx.$_CM, t = [ "$_HFCc" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(288)] = !0, this;
            },
            $_GHD: function() {
                var n = QBLnx.$_CM, t = [ "$_HFHC" ].concat(n);
                t[1];
                t.shift();
                t[0];
                var B = this;
                return B[n(216)] = B[n(281)](function() {
                    var n = QBLnx.$_CM, t = [ "$_HGCM" ].concat(n), i = t[1];
                    t.shift();
                    t[0];
                    B[n(288)] || (B[i(278)](), B[n(231)]());
                }), B;
            },
            $_GJN: function() {
                var n = QBLnx.$_CM, t = [ "$_HGHv" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(288)] = !1, this[n(228)](this[n(216)]), this[B(231)]();
            }
        };
        var U, T, X, z, S = n[B(42)], q = n[r(290)], R = S[B(284)] || S[B(205)](B(284))[0], W = S[r(221)] || S[r(205)](r(221))[0], P = (S[B(283)],
        q[B(40)] + B(295)), nn = n[r(127)], tn = (U = S[r(32)](B(57)), T = U[r(44)] && U[B(44)](r(22)),
            X = /msie/i[r(143)](nn[r(120)]), !T && X), Bn = /Mobi/i[B(143)](nn[r(120)]), rn = /msie 6\.0/i[r(143)](nn[B(120)]), cn = (/msie 7\.0/i[r(143)](nn[r(120)]),
            S[r(220)]), Cn = (parseFloat(nn[B(120)][B(139)](nn[B(120)][B(184)](r(274)) + 8)),
        parseFloat(nn[B(120)][r(139)](nn[r(120)][r(184)](r(274)) + 8)) < 4.4), an = -1 < nn[r(120)][r(184)](B(274)), _n = 3e4, sn = B(158), on = r(200), $n = B(291), fn = (z = [],
            {
                $_HAV: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_HHCD" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    z[n] = t;
                },
                $_HBq: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_HHHf" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    return z[n];
                }
            });
        ot[B(236)] = r(202);
        md5 = function Dn(n) {
            var t = QBLnx.$_Db()[12][19];
            for (;t !== QBLnx.$_Db()[6][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                    function i(n, t) {
                        var B = QBLnx.$_Db()[6][19];
                        for (;B !== QBLnx.$_Db()[15][18]; ) {
                            switch (B) {
                                case QBLnx.$_Db()[12][19]:
                                    return n << t | n >>> 32 - t;
                            }
                        }
                    }
                    function c(n, t) {
                        var B = QBLnx.$_Db()[15][19];
                        for (;B !== QBLnx.$_Db()[12][17]; ) {
                            switch (B) {
                                case QBLnx.$_Db()[6][19]:
                                    var i, r, c, C, a;
                                    B = QBLnx.$_Db()[3][18];
                                    break;

                                case QBLnx.$_Db()[12][18]:
                                    return c = 2147483648 & n, C = 2147483648 & t, a = (1073741823 & n) + (1073741823 & t),
                                        (i = 1073741824 & n) & (r = 1073741824 & t) ? 2147483648 ^ a ^ c ^ C : i | r ? 1073741824 & a ? 3221225472 ^ a ^ c ^ C : 1073741824 ^ a ^ c ^ C : a ^ c ^ C;
                            }
                        }
                    }
                    function C(n, t, B, r, C, a, _) {
                        var s = QBLnx.$_Db()[0][19];
                        for (;s !== QBLnx.$_Db()[3][18]; ) {
                            switch (s) {
                                case QBLnx.$_Db()[0][19]:
                                    return c(i(n = c(n, c(c(function(n, t, B) {
                                        var i = QBLnx.$_CM, r = [ "$_HICu" ].concat(i);
                                        r[1];
                                        r.shift();
                                        r[0];
                                        return n & t | ~n & B;
                                    }(t, B, r), C), _)), a), t);
                            }
                        }
                    }
                    function a(n, t, B, r, C, a, _) {
                        var s = QBLnx.$_Db()[3][19];
                        for (;s !== QBLnx.$_Db()[12][18]; ) {
                            switch (s) {
                                case QBLnx.$_Db()[9][19]:
                                    return c(i(n = c(n, c(c(function(n, t, B) {
                                        var i = QBLnx.$_CM, r = [ "$_HIHs" ].concat(i);
                                        r[1];
                                        r.shift();
                                        r[0];
                                        return n & B | t & ~B;
                                    }(t, B, r), C), _)), a), t);
                            }
                        }
                    }
                    function _(n, t, B, r, C, a, _) {
                        var s = QBLnx.$_Db()[9][19];
                        for (;s !== QBLnx.$_Db()[3][18]; ) {
                            switch (s) {
                                case QBLnx.$_Db()[3][19]:
                                    return c(i(n = c(n, c(c(function(n, t, B) {
                                        var i = QBLnx.$_CM, r = [ "$_HJCZ" ].concat(i);
                                        r[1];
                                        r.shift();
                                        r[0];
                                        return n ^ t ^ B;
                                    }(t, B, r), C), _)), a), t);
                            }
                        }
                    }
                    function s(n, t, B, r, C, a, _) {
                        var s = QBLnx.$_Db()[15][19];
                        for (;s !== QBLnx.$_Db()[0][18]; ) {
                            switch (s) {
                                case QBLnx.$_Db()[0][19]:
                                    return c(i(n = c(n, c(c(function(n, t, B) {
                                        var i = QBLnx.$_CM, r = [ "$_HJHf" ].concat(i);
                                        r[1];
                                        r.shift();
                                        r[0];
                                        return t ^ (n | ~B);
                                    }(t, B, r), C), _)), a), t);
                            }
                        }
                    }
                    function o(n) {
                        var t = QBLnx.$_Db()[15][19];
                        for (;t !== QBLnx.$_Db()[6][16]; ) {
                            switch (t) {
                                case QBLnx.$_Db()[0][19]:
                                    var i, c = B(15), C = r(15);
                                    t = QBLnx.$_Db()[12][18];
                                    break;

                                case QBLnx.$_Db()[6][18]:
                                    for (i = 0; i <= 3; i++) {
                                        c += (C = B(99) + (n >>> 8 * i & 255)[B(215)](16))[r(229)](C[B(125)] - 2, 2);
                                    }
                                    t = QBLnx.$_Db()[3][17];
                                    break;

                                case QBLnx.$_Db()[3][17]:
                                    return c;
                            }
                        }
                    }
                        var $, f, D, h, e, E, u, v, A, L;
                        for ($ = function(n) {
                            var t = QBLnx.$_CM, B = [ "$_IACT" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            var i, r = n[t(125)], c = r + 8, C = 16 * (1 + (c - c % 64) / 64), a = Array(C - 1), _ = 0, s = 0;
                            while (s < r) {
                                _ = s % 4 * 8, a[i = (s - s % 4) / 4] = a[i] | n[t(193)](s) << _, s++;
                            }
                            return _ = s % 4 * 8, a[i = (s - s % 4) / 4] = a[i] | 128 << _, a[C - 2] = r << 3,
                                a[C - 1] = r >>> 29, a;
                        }(n = function(n) {
                            var t = QBLnx.$_CM, B = [ "$_IAHY" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            n = n[i(87)](/\r\n/g, t(256));
                            for (var r = t(15), c = 0; c < n[i(125)]; c++) {
                                var C = n[i(193)](c);
                                C < 128 ? r += String[t(237)](C) : (127 < C && C < 2048 ? r += String[i(237)](C >> 6 | 192) : (r += String[t(237)](C >> 12 | 224),
                                    r += String[t(237)](C >> 6 & 63 | 128)), r += String[t(237)](63 & C | 128));
                            }
                            return r;
                        }(n)), u = 1732584193, v = 4023233417, A = 2562383102, L = 271733878, f = 0; f < $[B(125)]; f += 16) {
                            v = s(v = s(v = s(v = s(v = _(v = _(v = _(v = _(v = a(v = a(v = a(v = a(v = C(v = C(v = C(v = C(h = v, A = C(e = A, L = C(E = L, u = C(D = u, v, A, L, $[f + 0], 7, 3614090360), v, A, $[f + 1], 12, 3905402710), u, v, $[f + 2], 17, 606105819), L, u, $[f + 3], 22, 3250441966), A = C(A, L = C(L, u = C(u, v, A, L, $[f + 4], 7, 4118548399), v, A, $[f + 5], 12, 1200080426), u, v, $[f + 6], 17, 2821735955), L, u, $[f + 7], 22, 4249261313), A = C(A, L = C(L, u = C(u, v, A, L, $[f + 8], 7, 1770035416), v, A, $[f + 9], 12, 2336552879), u, v, $[f + 10], 17, 4294925233), L, u, $[f + 11], 22, 2304563134), A = C(A, L = C(L, u = C(u, v, A, L, $[f + 12], 7, 1804603682), v, A, $[f + 13], 12, 4254626195), u, v, $[f + 14], 17, 2792965006), L, u, $[f + 15], 22, 1236535329), A = a(A, L = a(L, u = a(u, v, A, L, $[f + 1], 5, 4129170786), v, A, $[f + 6], 9, 3225465664), u, v, $[f + 11], 14, 643717713), L, u, $[f + 0], 20, 3921069994), A = a(A, L = a(L, u = a(u, v, A, L, $[f + 5], 5, 3593408605), v, A, $[f + 10], 9, 38016083), u, v, $[f + 15], 14, 3634488961), L, u, $[f + 4], 20, 3889429448), A = a(A, L = a(L, u = a(u, v, A, L, $[f + 9], 5, 568446438), v, A, $[f + 14], 9, 3275163606), u, v, $[f + 3], 14, 4107603335), L, u, $[f + 8], 20, 1163531501), A = a(A, L = a(L, u = a(u, v, A, L, $[f + 13], 5, 2850285829), v, A, $[f + 2], 9, 4243563512), u, v, $[f + 7], 14, 1735328473), L, u, $[f + 12], 20, 2368359562), A = _(A, L = _(L, u = _(u, v, A, L, $[f + 5], 4, 4294588738), v, A, $[f + 8], 11, 2272392833), u, v, $[f + 11], 16, 1839030562), L, u, $[f + 14], 23, 4259657740), A = _(A, L = _(L, u = _(u, v, A, L, $[f + 1], 4, 2763975236), v, A, $[f + 4], 11, 1272893353), u, v, $[f + 7], 16, 4139469664), L, u, $[f + 10], 23, 3200236656), A = _(A, L = _(L, u = _(u, v, A, L, $[f + 13], 4, 681279174), v, A, $[f + 0], 11, 3936430074), u, v, $[f + 3], 16, 3572445317), L, u, $[f + 6], 23, 76029189), A = _(A, L = _(L, u = _(u, v, A, L, $[f + 9], 4, 3654602809), v, A, $[f + 12], 11, 3873151461), u, v, $[f + 15], 16, 530742520), L, u, $[f + 2], 23, 3299628645), A = s(A, L = s(L, u = s(u, v, A, L, $[f + 0], 6, 4096336452), v, A, $[f + 7], 10, 1126891415), u, v, $[f + 14], 15, 2878612391), L, u, $[f + 5], 21, 4237533241), A = s(A, L = s(L, u = s(u, v, A, L, $[f + 12], 6, 1700485571), v, A, $[f + 3], 10, 2399980690), u, v, $[f + 10], 15, 4293915773), L, u, $[f + 1], 21, 2240044497), A = s(A, L = s(L, u = s(u, v, A, L, $[f + 8], 6, 1873313359), v, A, $[f + 15], 10, 4264355552), u, v, $[f + 6], 15, 2734768916), L, u, $[f + 13], 21, 1309151649), A = s(A, L = s(L, u = s(u, v, A, L, $[f + 4], 6, 4149444226), v, A, $[f + 11], 10, 3174756917), u, v, $[f + 2], 15, 718787259), L, u, $[f + 9], 21, 3951481745),
                                u = c(u, D), v = c(v, h), A = c(A, e), L = c(L, E);
                        }
                        return (o(u) + o(v) + o(A) + o(L))[B(188)]();
                }
            }
        }
        ot[r(236)] = B(201);
        var hn = function() {
            var t = QBLnx.$_CM, B = [ "$_IBCC" ].concat(t), i = B[1];
            B.shift();
            B[0];
            function r() {
                var n = QBLnx.$_Db()[3][19];
                for (;n !== QBLnx.$_Db()[0][18]; ) {
                    switch (n) {
                        case QBLnx.$_Db()[3][19]:
                            this[i(262)] = 0, this[i(253)] = 0, this[t(280)] = [];
                            n = QBLnx.$_Db()[3][18];
                    }
                }
            }
            r[i(230)][t(239)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IBHi" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r, c, C;
                for (r = 0; r < 256; ++r) {
                    this[i(280)][r] = r;
                }
                for (r = c = 0; r < 256; ++r) {
                    c = c + this[t(280)][r] + n[r % n[i(125)]] & 255, C = this[t(280)][r], this[t(280)][r] = this[i(280)][c],
                        this[t(280)][c] = C;
                }
                this[i(262)] = 0, this[t(253)] = 0;
            }, r[t(230)][i(267)] = function() {
                var n = QBLnx.$_CM, t = [ "$_ICCC" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i;
                return this[n(262)] = this[B(262)] + 1 & 255, this[n(253)] = this[B(253)] + this[n(280)][this[B(262)]] & 255,
                    i = this[n(280)][this[B(262)]], this[B(280)][this[B(262)]] = this[n(280)][this[n(253)]],
                    this[n(280)][this[n(253)]] = i, this[B(280)][i + this[n(280)][this[n(262)]] & 255];
            };
            var c, C, a, _, s = 256;
            if (null == C) {
                var o;
                C = [], a = 0;
                try {
                    if (n[t(271)] && n[t(271)][i(285)]) {
                        var $ = new Uint32Array(256);
                        for (n[i(271)][t(285)]($), o = 0; o < $[t(125)]; ++o) {
                            C[a++] = 255 & $[o];
                        }
                    }
                } catch (n) {}
                var f = 0, D = function(t) {
                    var B = QBLnx.$_CM, i = [ "$_ICHI" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    if (256 <= (f = f || 0) || s <= a) {
                        n[B(270)] ? (f = 0, n[B(270)](B(208), D, !1)) : n[B(279)] && (f = 0, n[r(279)](r(287), D));
                    } else {
                        try {
                            var c = t[r(223)] + t[r(277)];
                            C[a++] = 255 & c, f += 1;
                        } catch (n) {}
                    }
                };
                n[t(244)] ? n[t(244)](i(208), D, !1) : n[i(251)] && n[t(251)](i(287), D);
            }
            function h() {
                var n = QBLnx.$_Db()[0][19];
                for (;n !== QBLnx.$_Db()[3][18]; ) {
                    switch (n) {
                        case QBLnx.$_Db()[0][19]:
                            if (null == c) {
                                c = function() {
                                    var n = QBLnx.$_CM, t = [ "$_IDCz" ].concat(n);
                                    t[1];
                                    t.shift();
                                    t[0];
                                    return new r();
                                }();
                                while (a < s) {
                                    var B = Math[t(233)](65536 * Math[i(46)]());
                                    C[a++] = 255 & B;
                                }
                                for (c[i(239)](C), a = 0; a < C[i(125)]; ++a) {
                                    C[a] = 0;
                                }
                                a = 0;
                            }
                            return c[i(267)]();
                    }
                }
            }
            function e() {
                var n = QBLnx.$_Db()[0][19];
                for (;n !== QBLnx.$_Db()[6][19]; ) {
                    n;
                }
            }
            e[i(230)][t(272)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IDHi" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r;
                for (r = 0; r < n[i(125)]; ++r) {
                    n[r] = h();
                }
            };
            function E(n, B, r) {
                var c = QBLnx.$_Db()[9][19];
                for (;c !== QBLnx.$_Db()[9][18]; ) {
                    switch (c) {
                        case QBLnx.$_Db()[3][19]:
                            null != n && (t(14) == typeof n ? this[i(212)](n, B, r) : null == B && i(52) != typeof n ? this[i(225)](n, 256) : this[i(225)](n, B));
                            c = QBLnx.$_Db()[0][18];
                    }
                }
            }
            function u() {
                var n = QBLnx.$_Db()[9][19];
                for (;n !== QBLnx.$_Db()[9][18]; ) {
                    switch (n) {
                        case QBLnx.$_Db()[12][19]:
                            return new E(null);
                    }
                }
            }
            _ = t(254) == nn[t(342)] ? (E[t(230)][i(356)] = function(n, t, B, i, r, c) {
                var C = QBLnx.$_CM, a = [ "$_IECn" ].concat(C);
                a[1];
                a.shift();
                a[0];
                var _ = 32767 & t, s = t >> 15;
                while (0 <= --c) {
                    var o = 32767 & this[n], $ = this[n++] >> 15, f = s * o + $ * _;
                    r = ((o = _ * o + ((32767 & f) << 15) + B[i] + (1073741823 & r)) >>> 30) + (f >>> 15) + s * $ + (r >>> 30),
                        B[i++] = 1073741823 & o;
                }
                return r;
            }, 30) : t(328) != nn[t(342)] ? (E[i(230)][i(356)] = function(n, t, B, i, r, c) {
                var C = QBLnx.$_CM, a = [ "$_IEHo" ].concat(C), _ = a[1];
                a.shift();
                a[0];
                while (0 <= --c) {
                    var s = t * this[n++] + B[i] + r;
                    r = Math[_(233)](s / 67108864), B[i++] = 67108863 & s;
                }
                return r;
            }, 26) : (E[t(230)][i(356)] = function(n, t, B, i, r, c) {
                var C = QBLnx.$_CM, a = [ "$_IFCh" ].concat(C);
                a[1];
                a.shift();
                a[0];
                var _ = 16383 & t, s = t >> 14;
                while (0 <= --c) {
                    var o = 16383 & this[n], $ = this[n++] >> 14, f = s * o + $ * _;
                    r = ((o = _ * o + ((16383 & f) << 14) + B[i] + r) >> 28) + (f >> 14) + s * $, B[i++] = 268435455 & o;
                }
                return r;
            }, 28), E[t(230)][t(325)] = _, E[i(230)][i(352)] = (1 << _) - 1, E[i(230)][t(359)] = 1 << _;
            E[t(230)][t(375)] = Math[t(341)](2, 52), E[i(230)][i(307)] = 52 - _, E[i(230)][i(345)] = 2 * _ - 52;
            var v, A, L = i(318), x = [];
            for (v = i(99)[i(193)](0), A = 0; A <= 9; ++A) {
                x[v++] = A;
            }
            for (v = i(117)[i(193)](0), A = 10; A < 36; ++A) {
                x[v++] = A;
            }
            for (v = t(334)[t(193)](0), A = 10; A < 36; ++A) {
                x[v++] = A;
            }
            function Q(n) {
                var t = QBLnx.$_Db()[12][19];
                for (;t !== QBLnx.$_Db()[9][18]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[0][19]:
                            return L[i(187)](n);
                    }
                }
            }
            function M(n) {
                var B = QBLnx.$_Db()[6][19];
                for (;B !== QBLnx.$_Db()[12][17]; ) {
                    switch (B) {
                        case QBLnx.$_Db()[0][19]:
                            var i = u();
                            B = QBLnx.$_Db()[6][18];
                            break;

                        case QBLnx.$_Db()[6][18]:
                            return i[t(322)](n), i;
                    }
                }
            }
            function F(n) {
                var t = QBLnx.$_Db()[15][19];
                for (;t !== QBLnx.$_Db()[6][17]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[12][19]:
                            var B, i = 1;
                            t = QBLnx.$_Db()[12][18];
                            break;

                        case QBLnx.$_Db()[15][18]:
                            return 0 != (B = n >>> 16) && (n = B, i += 16), 0 != (B = n >> 8) && (n = B, i += 8),
                            0 != (B = n >> 4) && (n = B, i += 4), 0 != (B = n >> 2) && (n = B, i += 2), 0 != (B = n >> 1) && (n = B,
                                i += 1), i;
                    }
                }
            }
            function b(n) {
                var t = QBLnx.$_Db()[12][19];
                for (;t !== QBLnx.$_Db()[9][18]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[0][19]:
                            this[i(370)] = n;
                            t = QBLnx.$_Db()[9][18];
                    }
                }
            }
            function w(n) {
                var B = QBLnx.$_Db()[6][19];
                for (;B !== QBLnx.$_Db()[12][18]; ) {
                    switch (B) {
                        case QBLnx.$_Db()[9][19]:
                            this[i(370)] = n, this[t(302)] = n[i(369)](), this[t(374)] = 32767 & this[t(302)],
                                this[i(310)] = this[t(302)] >> 15, this[t(391)] = (1 << n[t(325)] - 15) - 1, this[t(377)] = 2 * n[t(321)];
                            B = QBLnx.$_Db()[6][18];
                    }
                }
            }
            function H() {
                var n = QBLnx.$_Db()[6][19];
                for (;n !== QBLnx.$_Db()[12][18]; ) {
                    switch (n) {
                        case QBLnx.$_Db()[3][19]:
                            this[t(367)] = null, this[t(372)] = 0, this[t(336)] = null, this[t(324)] = null,
                                this[i(340)] = null, this[t(389)] = null, this[t(312)] = null, this[t(303)] = null;
                            this[i(387)](t(330), t(337));
                            n = QBLnx.$_Db()[12][18];
                    }
                }
            }
            return b[i(230)][i(311)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IFHS" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return n[i(319)] < 0 || 0 <= n[t(376)](this[t(370)]) ? n[i(351)](this[i(370)]) : n;
            }, b[i(230)][i(350)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IGCi" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return n;
            }, b[i(230)][t(305)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IGHF" ].concat(t), i = B[1];
                B.shift();
                B[0];
                n[i(313)](this[t(370)], null, n);
            }, b[t(230)][t(308)] = function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_IHCn" ].concat(i), c = r[1];
                r.shift();
                r[0];
                n[c(363)](t, B), this[c(305)](B);
            }, b[i(230)][i(331)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_IHHs" ].concat(B), r = i[1];
                i.shift();
                i[0];
                n[r(381)](t), this[r(305)](t);
            }, w[t(230)][i(311)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IICJ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = u();
                return n[i(360)]()[t(379)](this[i(370)][i(321)], r), r[i(313)](this[t(370)], null, r),
                n[i(319)] < 0 && 0 < r[t(376)](E[i(373)]) && this[i(370)][t(358)](r, r), r;
            }, w[t(230)][i(350)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IIHz" ].concat(t);
                B[1];
                B.shift();
                B[0];
                var i = u();
                return n[t(333)](i), this[t(305)](i), i;
            }, w[t(230)][t(305)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_IJC_" ].concat(t), i = B[1];
                B.shift();
                B[0];
                while (n[t(321)] <= this[i(377)]) {
                    n[n[i(321)]++] = 0;
                }
                for (var r = 0; r < this[i(370)][t(321)]; ++r) {
                    var c = 32767 & n[r], C = c * this[t(374)] + ((c * this[i(310)] + (n[r] >> 15) * this[t(374)] & this[i(391)]) << 15) & n[i(352)];
                    n[c = r + this[t(370)][i(321)]] += this[i(370)][i(356)](0, C, n, r, 0, this[t(370)][t(321)]);
                    while (n[c] >= n[i(359)]) {
                        n[c] -= n[i(359)], n[++c]++;
                    }
                }
                n[i(348)](), n[i(361)](this[t(370)][i(321)], n), 0 <= n[t(376)](this[i(370)]) && n[i(358)](this[t(370)], n);
            }, w[t(230)][t(308)] = function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_IJHu" ].concat(i), c = r[1];
                r.shift();
                r[0];
                n[i(363)](t, B), this[c(305)](B);
            }, w[i(230)][i(331)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JACK" ].concat(B), r = i[1];
                i.shift();
                i[0];
                n[B(381)](t), this[r(305)](t);
            }, E[t(230)][t(333)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_JAHo" ].concat(t), i = B[1];
                B.shift();
                B[0];
                for (var r = this[i(321)] - 1; 0 <= r; --r) {
                    n[r] = this[r];
                }
                n[t(321)] = this[t(321)], n[i(319)] = this[t(319)];
            }, E[t(230)][t(322)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_JBCA" ].concat(t), i = B[1];
                B.shift();
                B[0];
                this[t(321)] = 1, this[t(319)] = n < 0 ? -1 : 0, 0 < n ? this[0] = n : n < -1 ? this[0] = n + this[i(359)] : this[i(321)] = 0;
            }, E[t(230)][i(225)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JBHZ" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c;
                if (16 == t) {
                    c = 4;
                } else if (8 == t) {
                    c = 3;
                } else if (256 == t) {
                    c = 8;
                } else if (2 == t) {
                    c = 1;
                } else if (32 == t) {
                    c = 5;
                } else {
                    if (4 != t) {
                        return void this[r(304)](n, t);
                    }
                    c = 2;
                }
                this[B(321)] = 0, this[B(319)] = 0;
                var C, a, _ = n[B(125)], s = !1, o = 0;
                while (0 <= --_) {
                    var $ = 8 == c ? 255 & n[_] : (C = _, null == (a = x[n[r(193)](C)]) ? -1 : a);
                    $ < 0 ? r(39) == n[B(187)](_) && (s = !0) : (s = !1, 0 == o ? this[this[B(321)]++] = $ : o + c > this[r(325)] ? (this[this[r(321)] - 1] |= ($ & (1 << this[B(325)] - o) - 1) << o,
                        this[this[B(321)]++] = $ >> this[r(325)] - o) : this[this[B(321)] - 1] |= $ << o,
                    (o += c) >= this[r(325)] && (o -= this[B(325)]));
                }
                8 == c && 0 != (128 & n[0]) && (this[B(319)] = -1, 0 < o && (this[this[r(321)] - 1] |= (1 << this[r(325)] - o) - 1 << o)),
                    this[r(348)](), s && E[r(373)][r(358)](this, this);
            }, E[t(230)][i(348)] = function() {
                var n = QBLnx.$_CM, t = [ "$_JCCW" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(319)] & this[B(352)];
                while (0 < this[B(321)] && this[this[B(321)] - 1] == i) {
                    --this[n(321)];
                }
            }, E[i(230)][i(379)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JCHw" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c;
                for (c = this[r(321)] - 1; 0 <= c; --c) {
                    t[c + n] = this[c];
                }
                for (c = n - 1; 0 <= c; --c) {
                    t[c] = 0;
                }
                t[r(321)] = this[r(321)] + n, t[r(319)] = this[B(319)];
            }, E[t(230)][i(361)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JDCP" ].concat(B), r = i[1];
                i.shift();
                i[0];
                for (var c = n; c < this[B(321)]; ++c) {
                    t[c - n] = this[c];
                }
                t[r(321)] = Math[r(213)](this[B(321)] - n, 0), t[r(319)] = this[r(319)];
            }, E[i(230)][i(378)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JDHg" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c, C = n % this[B(325)], a = this[r(325)] - C, _ = (1 << a) - 1, s = Math[B(233)](n / this[r(325)]), o = this[r(319)] << C & this[B(352)];
                for (c = this[B(321)] - 1; 0 <= c; --c) {
                    t[c + s + 1] = this[c] >> a | o, o = (this[c] & _) << C;
                }
                for (c = s - 1; 0 <= c; --c) {
                    t[c] = 0;
                }
                t[s] = o, t[r(321)] = this[r(321)] + s + 1, t[B(319)] = this[B(319)], t[B(348)]();
            }, E[i(230)][i(306)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JECw" ].concat(B), r = i[1];
                i.shift();
                i[0];
                t[r(319)] = this[r(319)];
                var c = Math[r(233)](n / this[B(325)]);
                if (c >= this[B(321)]) {
                    t[r(321)] = 0;
                } else {
                    var C = n % this[r(325)], a = this[B(325)] - C, _ = (1 << C) - 1;
                    t[0] = this[c] >> C;
                    for (var s = c + 1; s < this[r(321)]; ++s) {
                        t[s - c - 1] |= (this[s] & _) << a, t[s - c] = this[s] >> C;
                    }
                    0 < C && (t[this[B(321)] - c - 1] |= (this[r(319)] & _) << a), t[B(321)] = this[B(321)] - c,
                        t[B(348)]();
                }
            }, E[i(230)][t(358)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JEHw" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = 0, C = 0, a = Math[B(323)](n[B(321)], this[B(321)]);
                while (c < a) {
                    C += this[c] - n[c], t[c++] = C & this[B(352)], C >>= this[B(325)];
                }
                if (n[r(321)] < this[B(321)]) {
                    C -= n[r(319)];
                    while (c < this[r(321)]) {
                        C += this[c], t[c++] = C & this[B(352)], C >>= this[B(325)];
                    }
                    C += this[r(319)];
                } else {
                    C += this[r(319)];
                    while (c < n[B(321)]) {
                        C -= n[c], t[c++] = C & this[r(352)], C >>= this[r(325)];
                    }
                    C -= n[B(319)];
                }
                t[r(319)] = C < 0 ? -1 : 0, C < -1 ? t[c++] = this[B(359)] + C : 0 < C && (t[c++] = C),
                    t[B(321)] = c, t[B(348)]();
            }, E[i(230)][i(363)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JFCb" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this[r(360)](), C = n[r(360)](), a = c[r(321)];
                t[r(321)] = a + C[B(321)];
                while (0 <= --a) {
                    t[a] = 0;
                }
                for (a = 0; a < C[r(321)]; ++a) {
                    t[a + c[r(321)]] = c[r(356)](0, C[a], t, a, 0, c[r(321)]);
                }
                t[r(319)] = 0, t[r(348)](), this[B(319)] != n[B(319)] && E[r(373)][r(358)](t, t);
            }, E[t(230)][t(381)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_JFHe" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(360)](), c = n[t(321)] = 2 * r[i(321)];
                while (0 <= --c) {
                    n[c] = 0;
                }
                for (c = 0; c < r[t(321)] - 1; ++c) {
                    var C = r[t(356)](c, r[c], n, 2 * c, 0, 1);
                    (n[c + r[t(321)]] += r[t(356)](c + 1, 2 * r[c], n, 2 * c + 1, C, r[t(321)] - c - 1)) >= r[t(359)] && (n[c + r[i(321)]] -= r[i(359)],
                        n[c + r[i(321)] + 1] = 1);
                }
                0 < n[t(321)] && (n[n[i(321)] - 1] += r[i(356)](c, r[c], n, 2 * c, 0, 1)), n[t(319)] = 0,
                    n[t(348)]();
            }, E[i(230)][t(313)] = function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_JGCO" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = n[i(360)]();
                if (!(C[i(321)] <= 0)) {
                    var a = this[i(360)]();
                    if (a[c(321)] < C[i(321)]) {
                        return null != t && t[i(322)](0), void (null != B && this[i(333)](B));
                    }
                    null == B && (B = u());
                    var _ = u(), s = this[i(319)], o = n[c(319)], $ = this[c(325)] - F(C[C[c(321)] - 1]);
                    0 < $ ? (C[c(378)]($, _), a[i(378)]($, B)) : (C[c(333)](_), a[c(333)](B));
                    var f = _[c(321)], D = _[f - 1];
                    if (0 != D) {
                        var h = D * (1 << this[i(307)]) + (1 < f ? _[f - 2] >> this[i(345)] : 0), e = this[c(375)] / h, v = (1 << this[c(307)]) / h, A = 1 << this[i(345)], L = B[c(321)], x = L - f, Q = null == t ? u() : t;
                        _[i(379)](x, Q), 0 <= B[i(376)](Q) && (B[B[i(321)]++] = 1, B[i(358)](Q, B)), E[i(365)][i(379)](f, Q),
                            Q[i(358)](_, _);
                        while (_[c(321)] < f) {
                            _[_[c(321)]++] = 0;
                        }
                        while (0 <= --x) {
                            var M = B[--L] == D ? this[c(352)] : Math[i(233)](B[L] * e + (B[L - 1] + A) * v);
                            if ((B[L] += _[c(356)](0, M, B, x, 0, f)) < M) {
                                _[c(379)](x, Q), B[i(358)](Q, B);
                                while (B[L] < --M) {
                                    B[c(358)](Q, B);
                                }
                            }
                        }
                        null != t && (B[i(361)](f, t), s != o && E[c(373)][c(358)](t, t)), B[c(321)] = f,
                            B[i(348)](), 0 < $ && B[c(306)]($, B), s < 0 && E[c(373)][c(358)](B, B);
                    }
                }
            }, E[i(230)][i(369)] = function() {
                var n = QBLnx.$_CM, t = [ "$_JGHt" ].concat(n), B = t[1];
                t.shift();
                t[0];
                if (this[n(321)] < 1) {
                    return 0;
                }
                var i = this[0];
                if (0 == (1 & i)) {
                    return 0;
                }
                var r = 3 & i;
                return 0 < (r = (r = (r = (r = r * (2 - (15 & i) * r) & 15) * (2 - (255 & i) * r) & 255) * (2 - ((65535 & i) * r & 65535)) & 65535) * (2 - i * r % this[B(359)]) % this[n(359)]) ? this[n(359)] - r : -r;
            }, E[i(230)][t(395)] = function() {
                var n = QBLnx.$_CM, t = [ "$_JHCu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return 0 == (0 < this[B(321)] ? 1 & this[0] : this[n(319)]);
            }, E[t(230)][i(300)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_JHHj" ].concat(B), r = i[1];
                i.shift();
                i[0];
                if (4294967295 < n || n < 1) {
                    return E[B(365)];
                }
                var c = u(), C = u(), a = t[B(311)](this), _ = F(n) - 1;
                a[r(333)](c);
                while (0 <= --_) {
                    if (t[B(331)](c, C), 0 < (n & 1 << _)) {
                        t[r(308)](C, a, c);
                    } else {
                        var s = c;
                        c = C, C = s;
                    }
                }
                return t[r(350)](c);
            }, E[i(230)][t(215)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_JICq" ].concat(t), i = B[1];
                B.shift();
                B[0];
                if (this[t(319)] < 0) {
                    return i(39) + this[t(326)]()[t(215)](n);
                }
                var r;
                if (16 == n) {
                    r = 4;
                } else if (8 == n) {
                    r = 3;
                } else if (2 == n) {
                    r = 1;
                } else if (32 == n) {
                    r = 5;
                } else {
                    if (4 != n) {
                        return this[t(392)](n);
                    }
                    r = 2;
                }
                var c, C = (1 << r) - 1, a = !1, _ = i(15), s = this[i(321)], o = this[i(325)] - s * this[i(325)] % r;
                if (0 < s--) {
                    o < this[t(325)] && 0 < (c = this[s] >> o) && (a = !0, _ = Q(c));
                    while (0 <= s) {
                        o < r ? (c = (this[s] & (1 << o) - 1) << r - o, c |= this[--s] >> (o += this[t(325)] - r)) : (c = this[s] >> (o -= r) & C,
                        o <= 0 && (o += this[i(325)], --s)), 0 < c && (a = !0), a && (_ += Q(c));
                    }
                }
                return a ? _ : t(99);
            }, E[t(230)][i(326)] = function() {
                var n = QBLnx.$_CM, t = [ "$_JIHD" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = u();
                return E[B(373)][n(358)](this, i), i;
            }, E[i(230)][i(360)] = function() {
                var n = QBLnx.$_CM, t = [ "$_JJCI" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(319)] < 0 ? this[B(326)]() : this;
            }, E[i(230)][t(376)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_JJHS" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(319)] - n[i(319)];
                if (0 != r) {
                    return r;
                }
                var c = this[i(321)];
                if (0 != (r = c - n[t(321)])) {
                    return this[i(319)] < 0 ? -r : r;
                }
                while (0 <= --c) {
                    if (0 != (r = this[c] - n[c])) {
                        return r;
                    }
                }
                return 0;
            }, E[t(230)][t(315)] = function() {
                var n = QBLnx.$_CM, t = [ "$_BAACZ" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(321)] <= 0 ? 0 : this[n(325)] * (this[B(321)] - 1) + F(this[this[n(321)] - 1] ^ this[B(319)] & this[n(352)]);
            }, E[t(230)][t(351)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BAAHB" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = u();
                return this[i(360)]()[t(313)](n, null, r), this[t(319)] < 0 && 0 < r[i(376)](E[t(373)]) && n[t(358)](r, r),
                    r;
            }, E[i(230)][t(386)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BABCU" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c;
                return c = n < 256 || t[r(395)]() ? new b(t) : new w(t), this[B(300)](n, c);
            }, E[t(373)] = M(0), E[i(365)] = M(1), H[t(230)][t(357)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BABHI" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return n[t(386)](this[i(372)], this[t(367)]);
            }, H[t(230)][i(387)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BACCf" ].concat(B), r = i[1];
                i.shift();
                i[0];
                null != n && null != t && 0 < n[B(125)] && 0 < t[r(125)] ? (this[B(367)] = function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BACHH" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    return new E(n, t);
                }(n, 16), this[B(372)] = parseInt(t, 16)) : console && console[r(8)] && console[B(8)](r(332));
            }, H[i(230)][i(353)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BADCi" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BADHK" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    if (t < n[r(125)] + 11) {
                        return console && console[B(8)] && console[B(8)](r(320)), null;
                    }
                    var c = [], C = n[B(125)] - 1;
                    while (0 <= C && 0 < t) {
                        var a = n[r(193)](C--);
                        a < 128 ? c[--t] = a : 127 < a && a < 2048 ? (c[--t] = 63 & a | 128, c[--t] = a >> 6 | 192) : (c[--t] = 63 & a | 128,
                            c[--t] = a >> 6 & 63 | 128, c[--t] = a >> 12 | 224);
                    }
                    c[--t] = 0;
                    var _ = new e(), s = [];
                    while (2 < t) {
                        s[0] = 0;
                        while (0 == s[0]) {
                            _[B(272)](s);
                        }
                        c[--t] = s[0];
                    }
                    return c[--t] = 2, c[--t] = 0, new E(c);
                }(n, this[i(367)][i(315)]() + 7 >> 3);
                if (null == r) {
                    return null;
                }
                var c = this[i(357)](r);
                if (null == c) {
                    return null;
                }
                var C = c[t(215)](16);
                return 0 == (1 & C[i(125)]) ? C : i(99) + C;
            }, H;
        }();
        eggH = hn;
        ot[B(236)] = r(339);
        var en = function() {
            var n = QBLnx.$_CM, t = [ "$_BAECG" ].concat(n), B = t[1];
            t.shift();
            t[0];
            var i, r = Object[B(338)] || function() {
                var n = QBLnx.$_CM, t = [ "$_BAEHb" ].concat(n);
                t[1];
                t.shift();
                t[0];
                function B() {
                    var n = QBLnx.$_Db()[9][19];
                    for (;n !== QBLnx.$_Db()[6][19]; ) {
                        n;
                    }
                }
                return function(n) {
                    var t = QBLnx.$_CM, i = [ "$_BAFCw" ].concat(t), r = i[1];
                    i.shift();
                    i[0];
                    var c;
                    return B[r(230)] = n, c = new B(), B[r(230)] = null, c;
                };
            }(), c = {}, C = c[B(329)] = {}, a = C[B(399)] = {
                extend: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BAFHe" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var c = r(this);
                    return n && c[t(397)](n), c[t(63)](i(239)) && this[i(239)] !== c[t(239)] || (c[t(239)] = function() {
                        var n = QBLnx.$_CM, t = [ "$_BAGCf" ].concat(n);
                        t[1];
                        t.shift();
                        t[0];
                        c[n(393)][n(239)][n(344)](this, arguments);
                    }), (c[t(239)][i(230)] = c)[i(393)] = this, c;
                },
                create: function() {
                    var n = QBLnx.$_CM, t = [ "$_BAGHU" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    var B = this[n(394)]();
                    return B[n(239)][n(344)](B, arguments), B;
                },
                init: function() {
                    var n = QBLnx.$_CM, t = [ "$_BAHCM" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                },
                mixIn: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BAHHI" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    for (var r in n) {
                        n[t(63)](r) && (this[r] = n[r]);
                    }
                    n[t(63)](t(215)) && (this[i(215)] = n[t(215)]);
                }
            }, _ = C[B(371)] = a[n(394)]({
                init: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BAICZ" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    n = this[B(388)] = n || [], void 0 != t ? this[r(349)] = t : this[B(349)] = 4 * n[r(125)];
                },
                concat: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BAIHf" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var r = this[t(388)], c = n[i(388)], C = this[i(349)], a = n[i(349)];
                    if (this[i(348)](), C % 4) {
                        for (var _ = 0; _ < a; _++) {
                            var s = c[_ >>> 2] >>> 24 - _ % 4 * 8 & 255;
                            r[C + _ >>> 2] |= s << 24 - (C + _) % 4 * 8;
                        }
                    } else {
                        for (_ = 0; _ < a; _ += 4) {
                            r[C + _ >>> 2] = c[_ >>> 2];
                        }
                    }
                    return this[t(349)] += a, this;
                },
                clamp: function() {
                    var n = QBLnx.$_CM, t = [ "$_BAJCX" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    var i = this[B(388)], r = this[B(349)];
                    i[r >>> 2] &= 4294967295 << 32 - r % 4 * 8, i[B(125)] = Math[B(383)](r / 4);
                }
            }), s = c[n(368)] = {}, o = s[B(355)] = {
                parse: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BAJHw" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    for (var r = n[t(125)], c = [], C = 0; C < r; C++) {
                        c[C >>> 2] |= (255 & n[t(193)](C)) << 24 - C % 4 * 8;
                    }
                    return new (_[i(239)])(c, r);
                }
            }, $ = s[B(354)] = {
                parse: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBACk" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    return o[i(276)](unescape(encodeURIComponent(n)));
                }
            }, f = C[n(384)] = a[n(394)]({
                reset: function() {
                    var n = QBLnx.$_CM, t = [ "$_BBAHg" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    this[B(343)] = new (_[n(239)])(), this[B(301)] = 0;
                },
                $_HEu: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBBCx" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    t(52) == typeof n && (n = $[i(276)](n)), this[t(343)][t(396)](n), this[i(301)] += n[i(349)];
                },
                $_HFY: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBBHA" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var r = this[i(343)], c = r[i(388)], C = r[i(349)], a = this[t(317)], s = C / (4 * a), o = (s = n ? Math[t(383)](s) : Math[t(213)]((0 | s) - this[i(385)], 0)) * a, $ = Math[i(323)](4 * o, C);
                    if (o) {
                        for (var f = 0; f < o; f += a) {
                            this[t(398)](c, f);
                        }
                        var D = c[i(112)](0, o);
                        r[t(349)] -= $;
                    }
                    return new (_[t(239)])(D, $);
                },
                $_HGR: 0
            }), D = c[B(380)] = {};eggEncrypt =  h = C[n(316)] = f[n(394)]({
                cfg: a[B(394)](),
                createEncryptor: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBCCd" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    return this[B(338)](this[r(327)], n, t);
                },
                init: function(n, t, B) {
                    var i = QBLnx.$_CM, r = [ "$_BBCH_" ].concat(i), c = r[1];
                    r.shift();
                    r[0];
                    this[i(362)] = this[c(362)][c(394)](B), this[c(382)] = n, this[i(314)] = t, this[c(390)]();
                },
                reset: function() {
                    var n = QBLnx.$_CM, t = [ "$_BBDCv" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    f[n(390)][n(366)](this), this[n(335)]();
                },
                process: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBDHM" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    return this[i(364)](n), this[i(347)]();
                },
                finalize: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBECa" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    return n && this[i(364)](n), this[t(346)]();
                },
                keySize: 4,
                ivSize: 4,
                $_HIh: 1,
                $_IDx: 2,
                $_IEY: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBEHq" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    return {
                        encrypt: function(t, B, i) {
                            var r = QBLnx.$_CM, c = [ "$_BBFCG" ].concat(r), C = c[1];
                            c.shift();
                            c[0];
                            B = o[r(276)](B), i && i[r(309)] || ((i = i || {})[r(309)] = o[C(276)](C(475)));
                            for (var a = x[r(353)](n, t, B, i), _ = a[C(401)][r(388)], s = a[C(401)][r(349)], $ = [], f = 0; f < s; f++) {
                                var D = _[f >>> 2] >>> 24 - f % 4 * 8 & 255;
                                $[C(173)](D);
                            }
                            return $;
                        }
                    };
                }
            }), e = c[B(423)] = {}, E = C[B(495)] = a[B(394)]({
                createEncryptor: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBFHc" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    return this[r(483)][r(338)](n, t);
                },
                init: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBGCl" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    this[r(432)] = n, this[B(479)] = t;
                }
            }), u = e[B(408)] = ((i = E[B(394)]())[B(483)] = i[B(394)]({
                processBlock: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBGHN" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    var c = this[r(432)], C = c[B(317)];
                    (function(n, t, B) {
                        var i = QBLnx.$_CM, r = [ "$_BBHCu" ].concat(i), c = r[1];
                        r.shift();
                        r[0];
                        var C = this[c(479)];
                        if (C) {
                            var a = C;
                            this[i(479)] = void 0;
                        } else {
                            a = this[c(441)];
                        }
                        for (var _ = 0; _ < B; _++) {
                            n[t + _] ^= a[_];
                        }
                    })[r(366)](this, n, t, C), c[r(478)](n, t), this[B(441)] = n[B(139)](t, t + C);
                }
            }), i), v = (c[n(488)] = {})[n(413)] = {
                pad: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBHHO" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    for (var c = 4 * t, C = c - n[r(349)] % c, a = C << 24 | C << 16 | C << 8 | C, s = [], o = 0; o < C; o += 4) {
                        s[B(173)](a);
                    }
                    var $ = _[B(338)](s, C);
                    n[r(396)]($);
                }
            }, A = C[n(446)] = h[B(394)]({
                cfg: h[n(362)][n(394)]({
                    mode: u,
                    padding: v
                }),
                reset: function() {
                    var n = QBLnx.$_CM, t = [ "$_BBICO" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    h[B(390)][n(366)](this);
                    var i = this[B(362)], r = i[n(309)], c = i[n(423)];
                    if (this[B(382)] == this[n(327)]) {
                        var C = c[n(433)];
                    }
                    this[n(467)] && this[B(467)][B(481)] == C ? this[B(467)][n(239)](this, r && r[B(388)]) : (this[B(467)] = C[B(366)](c, this, r && r[n(388)]),
                        this[B(467)][B(481)] = C);
                },
                $_HHV: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BBIHC" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    this[r(467)][r(434)](n, t);
                },
                $_ICx: function() {
                    var n = QBLnx.$_CM, t = [ "$_BBJCB" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    var i = this[B(362)][B(439)];
                    if (this[B(382)] == this[n(327)]) {
                        i[B(488)](this[n(343)], this[B(317)]);
                        var r = this[n(347)](!0);
                    }
                    return r;
                },
                blockSize: 4
            }), L = C[n(417)] = a[n(394)]({
                init: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BBJHK" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    this[i(397)](n);
                }
            }), x = C[B(482)] = a[B(394)]({
                cfg: a[B(394)](),
                encrypt: function(n, t, B, i) {
                    var r = QBLnx.$_CM, c = [ "$_BCACF" ].concat(r), C = c[1];
                    c.shift();
                    c[0];
                    i = this[r(362)][r(394)](i);
                    var a = n[r(433)](B, i), _ = a[r(498)](t), s = a[r(362)];
                    return L[C(338)]({
                        ciphertext: _,
                        key: B,
                        iv: s[r(309)],
                        algorithm: n,
                        mode: s[r(423)],
                        padding: s[r(439)],
                        blockSize: n[C(317)],
                        formatter: i[C(429)]
                    });
                }
            }), Q = [], M = [], F = [], b = [], w = [], H = [], l = [], G = [], d = [], p = [];
            !function() {
                var n = QBLnx.$_CM, t = [ "$_BCAHx" ].concat(n);
                t[1];
                t.shift();
                t[0];
                for (var B = [], i = 0; i < 256; i++) {
                    B[i] = i < 128 ? i << 1 : i << 1 ^ 283;
                }
                var r = 0, c = 0;
                for (i = 0; i < 256; i++) {
                    var C = c ^ c << 1 ^ c << 2 ^ c << 3 ^ c << 4;
                    C = C >>> 8 ^ 255 & C ^ 99, Q[r] = C;
                    var a = B[M[C] = r], _ = B[a], s = B[_], o = 257 * B[C] ^ 16843008 * C;
                    F[r] = o << 24 | o >>> 8, b[r] = o << 16 | o >>> 16, w[r] = o << 8 | o >>> 24, H[r] = o;
                    o = 16843009 * s ^ 65537 * _ ^ 257 * a ^ 16843008 * r;
                    l[C] = o << 24 | o >>> 8, G[C] = o << 16 | o >>> 16, d[C] = o << 8 | o >>> 24, p[C] = o,
                        r ? (r = a ^ B[B[B[s ^ a]]], c ^= B[B[c]]) : r = c = 1;
                }
            }();
            var I = [ 0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54 ], J = D[n(486)] = A[B(394)]({
                $_IBF: function() {
                    var n = QBLnx.$_CM, t = [ "$_BCBCM" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    if (!this[n(459)] || this[B(426)] !== this[B(314)]) {
                        for (var i = this[B(426)] = this[n(314)], r = i[n(388)], c = i[n(349)] / 4, C = 4 * (1 + (this[B(459)] = 6 + c)), a = this[n(443)] = [], _ = 0; _ < C; _++) {
                            if (_ < c) {
                                a[_] = r[_];
                            } else {
                                var s = a[_ - 1];
                                _ % c ? 6 < c && _ % c == 4 && (s = Q[s >>> 24] << 24 | Q[s >>> 16 & 255] << 16 | Q[s >>> 8 & 255] << 8 | Q[255 & s]) : (s = Q[(s = s << 8 | s >>> 24) >>> 24] << 24 | Q[s >>> 16 & 255] << 16 | Q[s >>> 8 & 255] << 8 | Q[255 & s],
                                    s ^= I[_ / c | 0] << 24), a[_] = a[_ - c] ^ s;
                            }
                        }
                        for (var o = this[B(420)] = [], $ = 0; $ < C; $++) {
                            _ = C - $;
                            s = $ % 4 ? a[_] : a[_ - 4];
                            o[$] = $ < 4 || _ <= 4 ? s : l[Q[s >>> 24]] ^ G[Q[s >>> 16 & 255]] ^ d[Q[s >>> 8 & 255]] ^ p[Q[255 & s]];
                        }
                    }
                },
                encryptBlock: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BCBHI" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    this[r(427)](n, t, this[B(443)], F, b, w, H, Q);
                },
                $_JEk: function(n, t, B, i, r, c, C, a) {
                    var _ = QBLnx.$_CM, s = [ "$_BCCCB" ].concat(_), o = s[1];
                    s.shift();
                    s[0];
                    for (var $ = this[o(459)], f = n[t] ^ B[0], D = n[t + 1] ^ B[1], h = n[t + 2] ^ B[2], e = n[t + 3] ^ B[3], E = 4, u = 1; u < $; u++) {
                        var v = i[f >>> 24] ^ r[D >>> 16 & 255] ^ c[h >>> 8 & 255] ^ C[255 & e] ^ B[E++], A = i[D >>> 24] ^ r[h >>> 16 & 255] ^ c[e >>> 8 & 255] ^ C[255 & f] ^ B[E++], L = i[h >>> 24] ^ r[e >>> 16 & 255] ^ c[f >>> 8 & 255] ^ C[255 & D] ^ B[E++], x = i[e >>> 24] ^ r[f >>> 16 & 255] ^ c[D >>> 8 & 255] ^ C[255 & h] ^ B[E++];
                        f = v, D = A, h = L, e = x;
                    }
                    v = (a[f >>> 24] << 24 | a[D >>> 16 & 255] << 16 | a[h >>> 8 & 255] << 8 | a[255 & e]) ^ B[E++],
                        A = (a[D >>> 24] << 24 | a[h >>> 16 & 255] << 16 | a[e >>> 8 & 255] << 8 | a[255 & f]) ^ B[E++],
                        L = (a[h >>> 24] << 24 | a[e >>> 16 & 255] << 16 | a[f >>> 8 & 255] << 8 | a[255 & D]) ^ B[E++],
                        x = (a[e >>> 24] << 24 | a[f >>> 16 & 255] << 16 | a[D >>> 8 & 255] << 8 | a[255 & h]) ^ B[E++];
                    n[t] = v, n[t + 1] = A, n[t + 2] = L, n[t + 3] = x;
                },
                keySize: 8
            });
            return c[n(486)] = A[n(457)](J), c[n(486)];
        }();
        ot[B(236)] = B(201);
        var En = function(n) {
            var t = QBLnx.$_CM, B = [ "$_BCCHN" ].concat(t), i = B[1];
            B.shift();
            B[0];
            var r = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BCDCs" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return i(48) == typeof n;
            }, c = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BCDH_" ].concat(t);
                B[1];
                B.shift();
                B[0];
                n();
            };
            function C() {
                var n = QBLnx.$_Db()[15][19];
                for (;n !== QBLnx.$_Db()[15][18]; ) {
                    switch (n) {
                        case QBLnx.$_Db()[15][19]:
                            this[t(428)] = this[t(465)] = null;
                            n = QBLnx.$_Db()[9][18];
                    }
                }
            }
            var a = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BCECL" ].concat(B), c = i[1];
                i.shift();
                i[0];
                if (n === t) {
                    n[B(454)](new TypeError());
                } else if (t instanceof _) {
                    t[B(497)](function(t) {
                        var B = QBLnx.$_CM, i = [ "$_BCEHh" ].concat(B);
                        i[1];
                        i.shift();
                        i[0];
                        a(n, t);
                    }, function(t) {
                        var B = QBLnx.$_CM, i = [ "$_BCFCL" ].concat(B), r = i[1];
                        i.shift();
                        i[0];
                        n[r(454)](t);
                    });
                } else if (r(t) || function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BCFHf" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    return i(70) == typeof n && null !== n;
                }(t)) {
                    var C;
                    try {
                        C = t[c(497)];
                    } catch (t) {
                        return _[B(496)](t), void n[B(454)](t);
                    }
                    var s = !1;
                    if (r(C)) {
                        try {
                            C[c(366)](t, function(t) {
                                var B = QBLnx.$_CM, i = [ "$_BCGCJ" ].concat(B);
                                i[1];
                                i.shift();
                                i[0];
                                s || (s = !0, a(n, t));
                            }, function(t) {
                                var B = QBLnx.$_CM, i = [ "$_BCGHh" ].concat(B);
                                i[1];
                                i.shift();
                                i[0];
                                s || (s = !0, n[B(454)](t));
                            });
                        } catch (t) {
                            if (s) {
                                return;
                            }
                            s = !0, n[B(454)](t);
                        }
                    } else {
                        n[c(422)](t);
                    }
                } else {
                    n[B(422)](t);
                }
            };
            function _(n) {
                var t = QBLnx.$_Db()[15][19];
                for (;t !== QBLnx.$_Db()[12][17]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[9][19]:
                            var B = this;
                            t = QBLnx.$_Db()[9][18];
                            break;

                        case QBLnx.$_Db()[9][18]:
                            if (B[i(477)] = B[i(418)], B[i(455)] = new C(), B[i(409)] = new C(), r(n)) {
                                try {
                                    n(function(n) {
                                        var t = QBLnx.$_CM, i = [ "$_BCHC_" ].concat(t), r = i[1];
                                        i.shift();
                                        i[0];
                                        B[r(422)](n);
                                    }, function(n) {
                                        var t = QBLnx.$_CM, i = [ "$_BCHHl" ].concat(t), r = i[1];
                                        i.shift();
                                        i[0];
                                        B[r(454)](n);
                                    });
                                } catch (n) {
                                    _[i(496)](n);
                                }
                            }
                            t = QBLnx.$_Db()[9][17];
                    }
                }
            }
            var s = !(C[t(230)] = {
                enqueue: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BCICj" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var r = this, c = {
                        ele: n,
                        next: null
                    };
                    null === r[i(428)] ? r[i(428)] = this[t(465)] = c : (r[t(465)][t(267)] = c, r[t(465)] = r[i(465)][t(267)]);
                },
                dequeue: function() {
                    var n = QBLnx.$_CM, t = [ "$_BCIHN" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    if (null === this[n(428)]) {
                        throw new Error(n(494));
                    }
                    var i = this[B(428)][B(484)];
                    return this[B(428)] = this[B(428)][B(267)], i;
                },
                isEmpty: function() {
                    var n = QBLnx.$_CM, t = [ "$_BCJCa" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return null === this[B(428)];
                },
                clear: function() {
                    var n = QBLnx.$_CM, t = [ "$_BCJHx" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    this[n(428)] = this[n(460)] = null;
                },
                each: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BDACw" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    this[i(431)]() || (n(this[t(468)]()), this[t(449)](n));
                }
            });
            return _[i(416)] = function() {
                var n = QBLnx.$_CM, t = [ "$_BDAHc" ].concat(n);
                t[1];
                t.shift();
                t[0];
                s = !0;
            }, _[t(496)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BDBCT" ].concat(t), i = B[1];
                B.shift();
                B[0];
                K(n, !0), s && i(83) != typeof console && console[i(8)](n);
            }, _[i(230)] = {
                PENDING: 0,
                RESOLVED: 1,
                REJECTED: -1,
                $_JJU: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BDBHy" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var r = this;
                    r[i(477)] === r[i(418)] && (r[i(477)] = r[t(472)], r[i(445)] = n, r[t(435)]());
                },
                $_JHN: function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BDCCg" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    var r = this;
                    r[i(477)] === r[i(418)] && (r[t(477)] = r[i(442)], r[t(448)] = n, r[i(435)]());
                },
                $_BAFh: function() {
                    var n = QBLnx.$_CM, t = [ "$_BDCHm" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    var i, r, C = this, a = C[n(477)];
                    a === C[n(472)] ? (i = C[B(455)], C[B(409)][B(450)](), r = C[B(445)]) : a === C[B(442)] && (i = C[n(409)],
                        C[n(455)][B(450)](), r = C[n(448)]), i[B(449)](function(n) {
                        var t = QBLnx.$_CM, B = [ "$_BDDCU" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        c(function() {
                            var t = QBLnx.$_CM, B = [ "$_BDDHv" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            n(a, r);
                        });
                    });
                },
                $_BAHn: function(n, t, B) {
                    var i = QBLnx.$_CM, C = [ "$_BDECF" ].concat(i);
                    C[1];
                    C.shift();
                    C[0];
                    var s = this;
                    c(function() {
                        var i = QBLnx.$_CM, c = [ "$_BDEHl" ].concat(i), C = c[1];
                        c.shift();
                        c[0];
                        if (r(t)) {
                            var o;
                            try {
                                o = t(B);
                            } catch (n) {
                                return _[C(496)](n), void s[C(454)](n);
                            }
                            a(s, o);
                        } else {
                            n === s[C(472)] ? s[i(422)](B) : n === s[C(442)] && s[i(454)](B);
                        }
                    });
                },
                then: function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BDFCJ" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    var c = this, C = new _();
                    return c[r(455)][r(489)](function(t, B) {
                        var i = QBLnx.$_CM, r = [ "$_BDFHH" ].concat(i), c = r[1];
                        r.shift();
                        r[0];
                        C[c(404)](t, n, B);
                    }), c[B(409)][B(489)](function(n, B) {
                        var i = QBLnx.$_CM, r = [ "$_BDGCU" ].concat(i), c = r[1];
                        r.shift();
                        r[0];
                        C[c(404)](n, t, B);
                    }), c[r(477)] === c[B(472)] ? c[r(435)]() : c[B(477)] === c[r(442)] && c[B(435)](),
                        C;
                }
            }, _[t(453)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BDGHO" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return new _(function(t, B) {
                    var i = QBLnx.$_CM, r = [ "$_BDHCW" ].concat(i), c = r[1];
                    r.shift();
                    r[0];
                    var C = n[c(125)], a = 0, s = !1, o = [];
                    function $(n, i, r) {
                        var c = QBLnx.$_Db()[0][19];
                        for (;c !== QBLnx.$_Db()[9][18]; ) {
                            switch (c) {
                                case QBLnx.$_Db()[0][19]:
                                    s || (null !== n && (s = !0, B(n)), o[r] = i, (a += 1) === C && (s = !0, t(o)));
                                    c = QBLnx.$_Db()[6][18];
                            }
                        }
                    }
                    for (var f = 0; f < C; f += 1) {
                        !function(t) {
                            var B = QBLnx.$_CM, i = [ "$_BDHHU" ].concat(B);
                            i[1];
                            i.shift();
                            i[0];
                            var r = n[t];
                            r instanceof _ || (r = new _(r)), r[B(497)](function(n) {
                                var B = QBLnx.$_CM, i = [ "$_BDICB" ].concat(B);
                                i[1];
                                i.shift();
                                i[0];
                                $(null, n, t);
                            }, function(n) {
                                var t = QBLnx.$_CM, B = [ "$_BDIHP" ].concat(t);
                                B[1];
                                B.shift();
                                B[0];
                                $(n || !0);
                            });
                        }(f);
                    }
                });
            }, _[t(403)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BDJCM" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return new _(function(t, B) {
                    var i = QBLnx.$_CM, r = [ "$_BDJHA" ].concat(i), c = r[1];
                    r.shift();
                    r[0];
                    var C, a = n[c(125)], s = !1, o = 0;
                    function $(n, i) {
                        var r = QBLnx.$_Db()[0][19];
                        for (;r !== QBLnx.$_Db()[3][18]; ) {
                            switch (r) {
                                case QBLnx.$_Db()[3][19]:
                                    s || (null == n ? (s = !0, t(i)) : a <= (o += 1) && (s = !0, B(n)));
                                    r = QBLnx.$_Db()[9][18];
                            }
                        }
                    }
                    for (var f = 0; f < a; f += 1) {
                        C = void 0, (C = n[f]) instanceof _ || (C = new _(C)), C[i(497)](function(n) {
                            var t = QBLnx.$_CM, B = [ "$_BEACL" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            $(null, n);
                        }, function(n) {
                            var t = QBLnx.$_CM, B = [ "$_BEAHz" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            $(n || !0);
                        });
                    }
                });
            }, _[t(162)] = function(n) {
                var t = QBLnx.$_CM, B = [ "$_BEBCD" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = n[t(125)], c = new _(), C = function(t, B) {
                    var i = QBLnx.$_CM, a = [ "$_BEBHl" ].concat(i), s = a[1];
                    a.shift();
                    a[0];
                    if (r <= t) {
                        return c[s(422)](B);
                    }
                    new _(n[t])[s(497)](function(n) {
                        var B = QBLnx.$_CM, i = [ "$_BECCy" ].concat(B);
                        i[1];
                        i.shift();
                        i[0];
                        C(t + 1, n);
                    }, function(n) {
                        var t = QBLnx.$_CM, B = [ "$_BECHX" ].concat(t), i = B[1];
                        B.shift();
                        B[0];
                        c[i(454)](n);
                    });
                };
                return new _(n[0])[i(497)](function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BEDCy" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    C(1, n);
                }, function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BEDHl" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    c[i(454)](n);
                }), c;
            }, _[i(230)][i(146)] = function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BEECp" ].concat(B);
                i[1];
                i.shift();
                i[0];
                return this[B(497)](n, t);
            }, _;
        }();
        function un(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[3][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[15][19]:
                        this[B(490)] = n, this[B(451)] = {};
                        t = QBLnx.$_Db()[15][18];
                }
            }
        }
        function vn(n, t) {
            var i = QBLnx.$_Db()[9][19];
            for (;i !== QBLnx.$_Db()[6][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[9][19]:
                        return n[r(25)] || (n[r(25)] = r(437)), new (vn[n[B(25)]])(n, t);
                }
            }
        }
        function An(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[15][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        this[B(343)] = [ n ];
                        t = QBLnx.$_Db()[3][18];
                }
            }
        }
        function Ln(n) {
            var t = QBLnx.$_Db()[6][19];
            for (;t !== QBLnx.$_Db()[15][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        this[B(499)] = n;
                        t = QBLnx.$_Db()[15][18];
                }
            }
        }
        En[B(416)](), un[B(230)] = {
            $_GBV: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BEEHT" ].concat(B), r = i[1];
                i.shift();
                i[0];
                return this[B(451)][n] ? this[B(451)][n][B(173)](t) : this[r(451)][n] = [ t ], this;
            },
            $_BBBR: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BEFCg" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[r(451)][n];
                if (C) {
                    for (var a = 0, _ = C[B(125)]; a < _; a += 1) {
                        try {
                            C[a](t);
                        } catch (t) {
                            var s = {
                                error: t,
                                type: n
                            };
                            return Q(b(r(438), c[r(490)], s));
                        }
                    }
                    return c;
                }
            },
            $_BBCT: function() {
                var n = QBLnx.$_CM, t = [ "$_BEFH_" ].concat(n), B = t[1];
                t.shift();
                t[0];
                this[B(451)] = {};
            }
        }, vn[r(25)] = B(463), vn[r(440)] = function(n, t) {
            var B = QBLnx.$_CM, i = [ "$_BEGCt" ].concat(B), r = i[1];
            i.shift();
            i[0];
            n[r(470)] ? n[r(470)][B(25)] === vn[r(25)] ? n[r(470)][t[r(25)]] = t : (vn[t[B(25)]] = t,
                vn[n[r(470)][r(25)]] = n[B(470)], n[r(470)] = vn) : (vn[t[B(25)]] = t, n[B(470)] = vn);
        },eggG =  An[r(230)] = {
            $_BBDi: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BEGHO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(343)][i(173)](n), this;
            },
            $_FDU: function() {
                var n = QBLnx.$_CM, t = [ "$_BEHCE" ].concat(n), B = t[1];
                t.shift();
                t[0];
                function i(t) {
                    var i = QBLnx.$_Db()[3][19];
                    for (;i !== QBLnx.$_Db()[12][17]; ) {
                        switch (i) {
                            case QBLnx.$_Db()[0][19]:
                                var r = n(447), c = r[n(125)], C = n(15), a = Math[n(360)](t), _ = parseInt(a / c);
                                c <= _ && (_ = c - 1), _ && (C = r[n(187)](_));
                                i = QBLnx.$_Db()[12][18];
                                break;

                            case QBLnx.$_Db()[9][18]:
                                var s = B(15);
                                return t < 0 && (s += B(474)), C && (s += n(411)), s + C + r[n(187)](a %= c);
                        }
                    }
                }
                var r = function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BEHHD" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    for (var r, c, C, a = [], _ = 0, s = 0, o = n[t(125)] - 1; s < o; s++) {
                        r = Math[t(129)](n[s + 1][0] - n[s][0]), c = Math[i(129)](n[s + 1][1] - n[s][1]),
                            C = Math[t(129)](n[s + 1][2] - n[s][2]), 0 == r && 0 == c && 0 == C || (0 == r && 0 == c ? _ += C : (a[t(173)]([ r, c, C + _ ]),
                            _ = 0));
                    }
                    return 0 !== _ && a[t(173)]([ r, c, _ ]), a;
                }(arguments[0]), c = [], C = [], a = [];
                return new Qn(r)[B(20)](function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BEICx" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    var _ = function(n) {
                        var t = QBLnx.$_CM, B = [ "$_BEIHs" ].concat(t), i = B[1];
                        B.shift();
                        B[0];
                        for (var r = [ [ 1, 0 ], [ 2, 0 ], [ 1, -1 ], [ 1, 1 ], [ 0, 1 ], [ 0, -1 ], [ 3, 0 ], [ 2, -1 ], [ 2, 1 ] ], c = 0, C = r[t(125)]; c < C; c++) {
                            if (n[0] == r[c][0] && n[1] == r[c][1]) {
                                return i(406)[c];
                            }
                        }
                        return 0;
                    }(n);
                    _ ? C[t(173)](_) : (c[t(173)](i(n[0])), C[r(173)](i(n[1]))), a[r(173)](i(n[2]));
                }), c[n(421)](n(15)) + n(452) + C[n(421)](n(15)) + B(452) + a[n(421)](n(15));
            },
            $_BBEM: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_BEJC_" ].concat(i), c = r[1];
                r.shift();
                r[0];
                if (!t || !B) {
                    return n;
                }
                var C, a = 0, _ = n, s = t[0], o = t[2], $ = t[4];
                while (C = B[i(229)](a, 2)) {
                    a += 2;
                    var f = parseInt(C, 16), D = String[c(237)](f), h = (s * f * f + o * f + $) % n[c(125)];
                    _ = _[c(229)](0, h) + D + _[c(229)](h);
                }
                return _;
            },
            $_BBFj: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_BEJHJ" ].concat(i);
                r[1];
                r.shift();
                r[0];
                return t && B && 0 !== n ? n + (t[1] * B * B + t[3] * B + t[5]) % 50 : n;
            }
        }, Ln[r(230)] = {
            $_HAV: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFACt" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                return r[t(415)] = r[t(476)], r[t(476)] = n, r[i(499)](r[t(476)], r[t(415)]), r;
            },
            $_HBq: function() {
                var n = QBLnx.$_CM, t = [ "$_BFAHN" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(476)];
            },
            $_BBIr: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFBCa" ].concat(t);
                B[1];
                B.shift();
                B[0];
                for (var i = Qn[t(407)](n) ? n : [ n ], r = 0, c = i[t(125)]; r < c; r += 1) {
                    if (i[r] === this[t(485)]()) {
                        return !0;
                    }
                }
                return !1;
            }
        };
        var xn = function() {
            var n = QBLnx.$_CM, t = [ "$_BFBHw" ].concat(n);
            t[1];
            t.shift();
            t[0];
            function B() {
                var t = QBLnx.$_Db()[9][19];
                for (;t !== QBLnx.$_Db()[3][18]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[6][19]:
                            return (65536 * (1 + Math[n(46)]()) | 0)[n(215)](16)[n(430)](1);
                    }
                }
            }
            return function() {
                var n = QBLnx.$_CM, t = [ "$_BFCCG" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return B() + B() + B() + B();
            };
        }();
        function Qn(n) {
            var t = QBLnx.$_Db()[3][19];
            for (;t !== QBLnx.$_Db()[12][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[3][19]:
                        this[B(461)] = n || [];
                        t = QBLnx.$_Db()[15][18];
                }
            }
        }
        function Mn(n) {
            var t = QBLnx.$_Db()[9][19];
            for (;t !== QBLnx.$_Db()[6][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[0][19]:
                        this[B(487)] = n;
                        t = QBLnx.$_Db()[3][18];
                }
            }
        }
        function Fn(n) {
            var t = QBLnx.$_Db()[3][19];
            for (;t !== QBLnx.$_Db()[6][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[3][19]:
                        this[r(38)] = r(52) == typeof n ? S[r(32)](n) : n;
                        t = QBLnx.$_Db()[3][18];
                }
            }
        }
        function bn(n, t) {
            var i = QBLnx.$_Db()[6][19];
            for (;i !== QBLnx.$_Db()[6][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[12][19]:
                        this[B(224)] = t, this[B(38)] = n;
                        i = QBLnx.$_Db()[0][18];
                }
            }
        }
        Qn[r(230)] = {
            $_HBq: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFCHi" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(461)][n];
            },
            $_BCCO: function() {
                var n = QBLnx.$_CM, t = [ "$_BFDCn" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(461)][n(125)];
            },
            $_BJj: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BFDHC" ].concat(B), r = i[1];
                i.shift();
                i[0];
                return new Qn(x(t) ? this[r(461)][r(139)](n, t) : this[r(461)][r(139)](n));
            },
            $_BCDE: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFECN" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(461)][t(173)](n), this;
            },
            $_BCEy: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BFEHQ" ].concat(B), r = i[1];
                i.shift();
                i[0];
                return this[r(461)][B(112)](n, t || 1);
            },
            $_CBT: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFFCl" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(461)][i(421)](n);
            },
            $_BCFi: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFFHp" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return new Qn(this[i(461)][i(396)](n));
            },
            $_CAQ: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFGCq" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(461)];
                if (r[i(419)]) {
                    return new Qn(r[t(419)](n));
                }
                for (var c = [], C = 0, a = r[i(125)]; C < a; C += 1) {
                    c[C] = n(r[C], C, this);
                }
                return new Qn(c);
            },
            $_BCGY: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFGHL" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(461)];
                if (r[t(462)]) {
                    return new Qn(r[i(462)](n));
                }
                for (var c = [], C = 0, a = r[i(125)]; C < a; C += 1) {
                    n(r[C], C, this) && c[i(173)](r[C]);
                }
                return new Qn(c);
            },
            $_BCHf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFHCJ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(461)];
                if (r[t(184)]) {
                    return r[t(184)](n);
                }
                for (var c = 0, C = r[t(125)]; c < C; c += 1) {
                    if (r[c] === n) {
                        return c;
                    }
                }
                return -1;
            },
            $_BCIN: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFHHR" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(461)];
                if (!r[i(456)]) {
                    for (var c = arguments[1], C = 0; C < r[t(125)]; C++) {
                        C in r && n[t(366)](c, r[C], C, this);
                    }
                }
                return r[t(456)](n);
            }
        }, Qn[r(407)] = function(n) {
            var t = QBLnx.$_CM, B = [ "$_BFICC" ].concat(t), i = B[1];
            B.shift();
            B[0];
            return Array[i(471)] ? Array[i(471)](n) : i(405) === Object[t(230)][i(215)][i(366)](n);
        }, Mn[r(230)] = {
            $_CEp: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BFIHB" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(487)];
                for (var c in r) {
                    r[i(63)](c) && n(c, r[c]);
                }
                return this;
            },
            $_BCJb: function() {
                var n = QBLnx.$_CM, t = [ "$_BFJCu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(487)];
                for (var r in i) {
                    if (i[B(63)](r)) {
                        return !1;
                    }
                }
                return !0;
            }
        }, Fn[r(230)] = {
            $_BDAg: {
                down: [ r(425), r(436), r(492), B(412) ],
                move: [ B(208), r(414), r(402), B(469) ],
                up: [ B(444), r(493), B(491), B(458) ],
                enter: [ r(464) ],
                leave: [ r(473) ],
                cancel: [ B(400) ],
                click: [ B(424) ],
                scroll: [ B(466) ],
                resize: [ r(410) ],
                blur: [ r(480) ],
                focus: [ B(567) ],
                unload: [ r(593) ],
                input: [ B(33) ],
                keyup: [ r(580) ],
                ended: [ B(534) ],
                keydown: [ r(586) ],
                beforeunload: [ B(551) ],
                focusin: [ r(566) ],
                pageshow: [ B(286) ]
            },
            $_CHu: function() {
                var n = QBLnx.$_CM, t = [ "$_BFJHm" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(38)];
                return i[B(517)] = n(15), B(33) === i[n(530)][B(502)]() && (i[n(559)] = n(15)),
                    this;
            },
            $_BDBV: function() {
                var n = QBLnx.$_CM, t = [ "$_BGACB" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(80)]({
                    display: n(568)
                });
            },
            $_BDCL: function() {
                var n = QBLnx.$_CM, t = [ "$_BGAHm" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(80)]({
                    display: B(597)
                });
            },
            $_BDDJ: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGBCu" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return this[t(80)]({
                    opacity: n
                });
            },
            $_BDEk: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGBHS" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(38)][i(562)](n);
            },
            $_CCg: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGCCh" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)];
                return new Mn(n)[t(85)](function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BGCHx" ].concat(B), c = i[1];
                    i.shift();
                    i[0];
                    r[c(521)](n, t);
                }), this;
            },
            $_BDFw: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGDCN" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)];
                return new Qn(n)[i(20)](function(n) {
                    var t = QBLnx.$_CM, B = [ "$_BGDHQ" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[i(515)](n);
                }), this;
            },
            $_CDp: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGECM" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)];
                return new Mn(n)[i(85)](function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BGEHq" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    r[n] = t;
                }), this;
            },
            $_sTyyle: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGFCu" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)];
                return new Mn(n)[i(85)](function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BGFHp" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    r[B(527)][n] = t;
                }), this;
            },
            setStyles: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGGCx" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)];
                return new Mn(n)[t(85)](function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_BGGHS" ].concat(B), c = i[1];
                    i.shift();
                    i[0];
                    r[c(527)][n] = t;
                }), this;
            },
            $_BDGS: function() {
                var n = QBLnx.$_CM, t = [ "$_BGHCh" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return new Fn(this[B(38)][n(576)]);
            },
            $_CId: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGHHp" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return n[i(38)][t(552)](this[i(38)]), this;
            },
            $_BDHt: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGICO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)];
                return r[i(576)][i(570)](r), this[i(95)](n), this;
            },
            $_BDIs: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGIHb" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return n[i(38)][i(576)][i(514)](this[t(38)], n[i(38)]), this;
            },
            $_CFi: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BGJCJ" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return n[t(95)](this), this;
            },
            $_DIX: function() {
                var n = QBLnx.$_CM, t = [ "$_BGJHq" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(38)], r = i[n(576)];
                return r && r[B(570)](i), this;
            },
            $_BDJN: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHACC" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)];
                return -1 === new Qn(r[i(553)] ? r[t(553)][i(55)](t(65)) : [])[i(524)](sn + n) ? this[t(557)](n) : this[i(548)](n),
                    this;
            },
            $_BEAk: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHAHX" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)], c = new Qn(r[t(553)] ? r[t(553)][i(55)](t(65)) : []);
                return n = sn + n, -1 == c[t(524)](n) && (c[i(563)](n), r[i(553)] = c[t(93)](t(65))),
                    this;
            },
            $_BECH: function() {
                var n = QBLnx.$_CM, t = [ "$_BHBCN" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(38)][B(526)];
            },
            $_BEDl: function() {
                var n = QBLnx.$_CM, t = [ "$_BHBHI" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(38)];
                return i && i[B(527)] && i[n(527)][n(564)] || 0;
            },
            $_BEB_: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHCCG" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)], c = new Qn(r[i(553)][i(55)](i(65)));
                n = sn + n;
                var C = c[t(524)](n);
                return -1 < C && (c[i(549)](C), r[t(553)] = c[t(93)](t(65))), this;
            },
            $_BEEM: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BHCHk" ].concat(B), r = i[1];
                i.shift();
                i[0];
                return this[B(548)](t)[r(557)](n), this;
            },
            $_BEFR: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BHDCV" ].concat(B), r = i[1];
                i.shift();
                i[0];
                function c(n) {
                    var B = QBLnx.$_Db()[9][19];
                    for (;B !== QBLnx.$_Db()[0][18]; ) {
                        switch (B) {
                            case QBLnx.$_Db()[6][19]:
                                t(new bn(C, n));
                                B = QBLnx.$_Db()[3][18];
                        }
                    }
                }
                var C = this, a = C[r(38)], _ = C[B(541)][n];
                return new Qn(_)[B(20)](function(n) {
                    var B = QBLnx.$_CM, i = [ "$_BHDHp" ].concat(B), r = i[1];
                    i.shift();
                    i[0];
                    if (S[r(244)]) {
                        a[r(244)](n, c);
                    } else if (S[r(251)]) {
                        a[B(251)](B(554) + n, c);
                    } else {
                        var _ = a[r(554) + n];
                        a[B(554) + n] = function(n) {
                            var B = QBLnx.$_CM, i = [ "$_BHECB" ].concat(B), r = i[1];
                            i.shift();
                            i[0];
                            t(new bn(C, n)), B(48) == typeof _ && _[r(366)](this, n);
                        };
                    }
                }), {
                    $_BBCT: function() {
                        var n = QBLnx.$_CM, t = [ "$_BHEHl" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        new Qn(_)[B(20)](function(n) {
                            var t = QBLnx.$_CM, B = [ "$_BHFCf" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            S[t(270)] ? a[i(270)](n, c) : S[t(279)] ? a[i(279)](i(554) + n, c) : a[i(554) + n] = null;
                        });
                    }
                };
            },
            $_GBV: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BHFHl" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[r(510)](n, t);
                return c[r(518)] = c[B(518)] || {}, c[B(518)][n] ? c[B(518)][n][r(173)](C) : c[B(518)][n] = [ C ],
                    c;
            },
            $_GCP: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHGCF" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                if (r[i(518)]) {
                    if (n) {
                        if (r[t(518)][n] && 0 < r[t(518)][n][i(125)]) {
                            for (var c = r[t(518)][n][t(125)] - 1; 0 <= c; c--) {
                                r[i(518)][n][c][t(505)]();
                            }
                        }
                    } else {
                        for (var C in r[i(518)]) {
                            if (r[i(518)][C] && 0 < r[i(518)][C][t(125)]) {
                                for (c = r[t(518)][C][i(125)] - 1; 0 <= c; c--) {
                                    r[i(518)][C][c][i(505)]();
                                }
                            }
                        }
                    }
                }
                return r;
            },
            $_BEHo: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHGHO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)][i(538)]();
                return 1 !== (n = n || 1) && (r[t(223)] = r[t(223)] * n, r[i(277)] = r[i(277)] * n,
                    r[t(509)] = r[t(509)] * n, r[i(585)] = r[t(585)] * n, r[t(564)] = r[i(564)] * n,
                    r[i(582)] = r[t(582)] * n, r[i(64)] = r[i(64)] * n, r[t(1)] = r[i(1)] * n), r;
            },
            $_BEIX: function(t) {
                var B = QBLnx.$_CM, i = [ "$_BHHCd" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this[B(594)](), C = S[r(284)], a = S[r(283)], _ = n[B(573)] || a[r(587)] || C[r(587)], s = n[B(544)] || a[B(533)] || C[r(533)], o = a[B(560)] || C[r(560)] || 0, $ = a[r(595)] || C[r(595)] || 0, f = c[r(509)] + _ - o, D = c[r(585)] + s - $;
                return {
                    top: Math[B(129)](f),
                    left: Math[r(129)](D),
                    width: c[B(564)] - c[B(585)],
                    height: c[r(582)] - c[r(509)]
                };
            },
            $_BEJZ: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHHHh" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(38)];
                return this[i(68)](), r[t(552)](S[i(558)](n)), this;
            },
            $_BFAF: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHICq" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return this[t(38)][t(517)] = n, this;
            },
            _style: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHIHe" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(38)];
                return S[t(205)](t(221))[0][i(552)](r), r[t(589)] ? r[i(589)][t(575)] = n : r[t(552)](S[i(558)](n)),
                    this;
            },
            $_BFBO: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BHJCF" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r, c, C = this[i(38)], a = !((c = S[t(32)](i(57)))[i(44)] && c[i(44)](i(22)));
                if (n) {
                    if (a) {
                        var _ = S[i(32)](i(56));
                        _[t(517)] = C[i(578)], r = new Fn(_[t(535)][0]);
                    } else {
                        r = new Fn(this[i(38)][t(579)](!0));
                    }
                    C[i(522)] = t(503) + C[i(522)], r[i(529)]([ i(511) ]);
                } else {
                    (r = new Fn(this[t(38)][i(579)](!1)))[t(557)](i(500));
                }
                return r;
            },
            $_BFCn: function() {
                var n = QBLnx.$_CM, t = [ "$_BHJHu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(38)][n(424)](), this;
            },
            $_BFDD: function() {
                var n = QBLnx.$_CM, t = [ "$_BIACM" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(38)][n(507)](), this;
            },
            $_BFEn: function() {
                var n = QBLnx.$_CM, t = [ "$_BIAHz" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(38)][B(506)] = 0, this[B(38)][n(507)](), this;
            },
            $_GFd: function() {
                var n = QBLnx.$_CM, t = [ "$_BIBCp" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(38)][n(506)] = 0, this[n(38)][B(531)](), this;
            },
            $_BFFS: function() {
                var n = QBLnx.$_CM, t = [ "$_BIBHs" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(38)][B(559)];
            },
            $_BFGL: function() {
                var n = QBLnx.$_CM, t = [ "$_BICCH" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(38)][B(567)](), this;
            },
            $_BFHJ: function() {
                var n = QBLnx.$_CM, t = [ "$_BICHI" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(594)]();
                return i[n(564)] - i[n(585)];
            },
            $_BFIg: function(t) {
                var B = QBLnx.$_CM, i = [ "$_BIDCQ" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this[B(38)];
                return n[r(525)] ? n[B(525)](c)[t] : c[B(546)][t];
            },
            $_BFJP: function() {
                var t = QBLnx.$_CM, B = [ "$_BIDHf" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r, c, C;
                try {
                    var a = this[i(38)], _ = a;
                    while (_[t(576)] != S[t(284)] && a[i(536)] - _[t(576)][i(536)] < 160) {
                        _ = _[t(576)], t(78) == (c = i(516), C = void 0, (r = _)[t(546)] ? C = r[i(546)][c] : n[t(525)] && (C = n[t(525)](r, null)[i(584)](c)),
                            C) && (_[i(527)][t(516)] = i(532));
                    }
                } catch (n) {}
                return this;
            },
            $_BGAy: function() {
                var n = QBLnx.$_CM, t = [ "$_BIECZ" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(38)], r = i[B(596)], c = i[n(556)];
                while (null !== c) {
                    r += c[B(596)], c = c[n(556)];
                }
                return r;
            },
            $_BGBA: function() {
                var n = QBLnx.$_CM, t = [ "$_BIEHS" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(38)], r = i[B(536)], c = i[n(556)];
                while (null !== c) {
                    r += c[B(536)], c = c[n(556)];
                }
                return r;
            }
        }, Fn[r(411)] = function(t) {
            var B = QBLnx.$_CM, i = [ "$_BIFCI" ].concat(B), r = i[1];
            i.shift();
            i[0];
            var c, C;
            B(52) == typeof t ? B(583) === t[0] ? c = S[B(537)](t[B(139)](1)) : B(513) in S ? c = S[r(513)](t) : v(n[B(572)]) ? c = n[B(572)](t)[0] : r(583) === t[B(139)](0, 1) && (c = S[B(537)](t[r(139)](1))) : c = t[B(125)] ? t[0] : t;
            try {
                C = Node[r(520)];
            } catch (n) {
                C = 1;
            }
            try {
                if (c[r(547)] === C) {
                    return new Fn(c);
                }
            } catch (n) {
                return !1;
            }
        }, bn[r(230)] = {
            $_BGCd: function() {
                var n = QBLnx.$_CM, t = [ "$_BIFHI" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(224)];
                if (x(i[B(565)])) {
                    return i[B(565)];
                }
                var r = i[B(501)] && i[B(501)][0];
                return r ? r[B(565)] : -1;
            },
            $_BGDq: function() {
                var n = QBLnx.$_CM, t = [ "$_BIGC_" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(224)];
                if (x(i[B(591)])) {
                    return i[B(591)];
                }
                var r = i[B(501)] && i[B(501)][0];
                return r ? r[B(591)] : -1;
            },
            $_BGEn: function() {
                var n = QBLnx.$_CM, t = [ "$_BIGHR" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(224)];
                return i[n(555)] && v(i[n(599)]) ? i[B(599)]() : i[B(598)] = !1, this;
            },
            $_BGFe: function() {
                var n = QBLnx.$_CM, t = [ "$_BIHCd" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(224)];
                return v(i[n(528)]) && i[B(528)](), this;
            }
        };
        var wn, Hn = function() {
            var n = QBLnx.$_CM, t = [ "$_BIHHf" ].concat(n), B = t[1];
            t.shift();
            t[0];
            var i, r, c, C, a = {}, _ = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            function s(n) {
                var t = QBLnx.$_Db()[12][19];
                for (;t !== QBLnx.$_Db()[0][18]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[9][19]:
                            return n < 10 ? B(99) + n : n;
                    }
                }
            }
            function o() {
                var t = QBLnx.$_Db()[3][19];
                for (;t !== QBLnx.$_Db()[3][18]; ) {
                    switch (t) {
                        case QBLnx.$_Db()[9][19]:
                            return this[n(74)]();
                    }
                }
            }
            function $(t) {
                var i = QBLnx.$_Db()[12][19];
                for (;i !== QBLnx.$_Db()[0][18]; ) {
                    switch (i) {
                        case QBLnx.$_Db()[15][19]:
                            return _[n(577)] = 0, _[n(143)](t) ? n(561) + t[n(87)](_, function(n) {
                                var t = QBLnx.$_CM, B = [ "$_BIICR" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                var r = c[n];
                                return t(52) == typeof r ? r : t(550) + (i(574) + n[t(193)](0)[i(215)](16))[i(139)](-4);
                            }) + B(561) : n(561) + t + B(561);
                    }
                }
            }
            return B(48) != typeof Date[B(230)][B(571)] && (Date[n(230)][n(571)] = function() {
                var n = QBLnx.$_CM, t = [ "$_BIIHu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return isFinite(this[n(74)]()) ? this[n(545)]() + B(39) + s(this[B(543)]() + 1) + B(39) + s(this[n(590)]()) + B(523) + s(this[B(581)]()) + B(31) + s(this[n(542)]()) + B(31) + s(this[n(504)]()) + n(540) : null;
            }, Boolean[B(230)][B(571)] = o, Number[B(230)][n(571)] = o, String[B(230)][B(571)] = o),
                c = {
                    "\b": B(519),
                    "\t": B(508),
                    "\n": B(569),
                    "\f": B(539),
                    "\r": n(512),
                    '"': n(592),
                    "\\": n(588)
                }, a[B(218)] = function(n, t, B) {
                var c = QBLnx.$_CM, a = [ "$_BIJC_" ].concat(c), _ = a[1];
                a.shift();
                a[0];
                var s;
                if (r = i = c(15), _(14) == typeof B) {
                    for (s = 0; s < B; s += 1) {
                        r += _(65);
                    }
                } else {
                    _(52) == typeof B && (r = B);
                }
                if ((C = t) && c(48) != typeof t && (_(70) != typeof t || c(14) != typeof t[c(125)])) {
                    throw new Error(c(649));
                }
                return function n(t, B) {
                    var c = QBLnx.$_CM, a = [ "$_BIJHG" ].concat(c), _ = a[1];
                    a.shift();
                    a[0];
                    var s, o, f, D, h, e = i, E = B[t];
                    switch (E && c(70) == typeof E && c(48) == typeof E[c(571)] && (E = E[_(571)](t)),
                    _(48) == typeof C && (E = C[_(366)](B, t, E)), typeof E) {
                        case c(52):
                            return $(E);

                        case c(14):
                            return isFinite(E) ? String(E) : c(694);

                        case _(24):
                        case _(694):
                            return String(E);

                        case _(70):
                            if (!E) {
                                return c(694);
                            }
                            if (i += r, h = [], c(405) === Object[c(230)][c(215)][_(344)](E)) {
                                for (D = E[_(125)], s = 0; s < D; s += 1) {
                                    h[s] = n(s, E) || c(694);
                                }
                                return f = 0 === h[_(125)] ? c(646) : i ? _(669) + i + h[c(421)](_(601) + i) + c(256) + e + _(653) : _(613) + h[c(421)](c(636)) + c(653),
                                    i = e, f;
                            }
                            if (C && _(70) == typeof C) {
                                for (D = C[_(125)], s = 0; s < D; s += 1) {
                                    c(52) == typeof C[s] && (f = n(o = C[s], E)) && h[c(173)]($(o) + (i ? _(60) : c(31)) + f);
                                }
                            } else {
                                for (o in E) {
                                    Object[c(230)][c(63)][c(366)](E, o) && (f = n(o, E)) && h[_(173)]($(o) + (i ? c(60) : _(31)) + f);
                                }
                            }
                            return f = 0 === h[c(125)] ? c(668) : i ? _(683) + i + h[c(421)](c(601) + i) + c(256) + e + c(608) : c(678) + h[_(421)](c(636)) + _(608),
                                i = e, f;
                    }
                }(_(15), {
                    "": n
                });
            }, a;
        }(), ln = r(16), Gn = 1, dn = (wn = {
            mouseEvent: !1,
            touchEvent: !1
        }, function() {
            var t = QBLnx.$_CM, B = [ "$_BJACF" ].concat(t);
            B[1];
            B.shift();
            B[0];
            !function() {
                var t = QBLnx.$_CM, B = [ "$_BJAHd" ].concat(t), i = B[1];
                B.shift();
                B[0];
                if (n[i(244)]) {
                    function r(n) {
                        var B = QBLnx.$_Db()[9][19];
                        for (;B !== QBLnx.$_Db()[15][18]; ) {
                            switch (B) {
                                case QBLnx.$_Db()[15][19]:
                                    wn[t(674)] = !0, S[i(270)](i(425), r), S[t(270)](i(208), r), S[i(270)](i(444), r);
                                    B = QBLnx.$_Db()[6][18];
                            }
                        }
                    }
                    S[t(244)](t(425), r), S[i(244)](t(208), r), S[t(244)](t(444), r);
                }
            }(), function() {
                var t = QBLnx.$_CM, B = [ "$_BJBCV" ].concat(t), i = B[1];
                B.shift();
                B[0];
                if (n[t(244)]) {
                    function r(n) {
                        var B = QBLnx.$_Db()[15][19];
                        for (;B !== QBLnx.$_Db()[6][18]; ) {
                            switch (B) {
                                case QBLnx.$_Db()[0][19]:
                                    wn[i(684)] = !0, S[i(270)](t(436), r), S[t(270)](i(414), r), S[t(270)](t(493), r);
                                    B = QBLnx.$_Db()[9][18];
                            }
                        }
                    }
                    S[t(244)](i(436), r), S[i(244)](t(414), r), S[t(244)](t(493), r);
                }
            }();
        }(), wn);
        function pn() {
            var n = QBLnx.$_Db()[12][19];
            for (;n !== QBLnx.$_Db()[12][19]; ) {
                n;
            }
        }
        pn[B(230)] = {
            $_BGGO: function() {
                var t = QBLnx.$_CM, B = [ "$_BJBHZ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return n[t(652)] && n[t(652)][t(627)] && this[i(666)]() || -1;
            },
            $_BGH_: function() {
                var t = QBLnx.$_CM, B = [ "$_BJCCv" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = n[t(652)][t(627)];
                return {
                    a: r[t(628)],
                    b: r[t(626)],
                    c: r[t(672)],
                    d: r[t(651)],
                    e: r[t(634)],
                    f: r[i(605)],
                    g: r[t(619)],
                    h: r[i(606)],
                    i: r[t(633)],
                    j: r[i(660)],
                    k: r[i(637)],
                    l: r[t(661)],
                    m: r[t(695)],
                    n: r[i(692)],
                    o: r[t(682)],
                    p: r[t(696)],
                    q: r[i(650)],
                    r: r[i(659)],
                    s: r[t(686)],
                    t: r[i(680)],
                    u: r[t(673)]
                };
            }
        };
        In = S[B(32)](B(57)), Jn = In[r(44)] && In[r(44)](r(22)), gn = /msie/i[r(143)](nn[B(120)]),
            tn = !Jn && gn, rn = /msie 6\.0/i[r(143)](nn[B(120)]), /UCBrowser/i[B(143)](nn[B(120)]),
            cn = r(681) === S[r(220)], on = r(610);
        var In, Jn, gn, kn, yn, Kn, On, mn, Zn, Nn, jn = B(239), Vn = r(639), Yn = r(615), Un = B(638), Tn = r(699), Xn = B(662), zn = B(645), Sn = r(8), qn = r(677), Rn = r(648), Wn = r(642), Pn = r(632), nt = r(685), tt = function() {
            var n = QBLnx.$_CM, t = [ "$_BJCHa" ].concat(n), B = t[1];
            t.shift();
            t[0];
            for (var i, r = B(640)[n(55)](n(618)), c = [], C = 0; C < 52; C++) {
                i = 2 * parseInt(r[parseInt(C % 26 / 2)]) + C % 2, parseInt(C / 2) % 2 || (i += C % 2 ? -1 : 1),
                    i += C < 26 ? 26 : 0, c[n(173)](i);
            }
            return c;
        }(), Bt = (kn = S[B(32)](B(57)), yn = kn[r(44)] && kn[r(44)](r(22)), Kn = /msie (?:9|10)\.0/i[r(143)](nn[r(120)]),
            On = /Trident\/[\d](?=[^\?]+).*rv:11.0/i[B(143)](nn[B(120)]), mn = nn[r(120)][r(184)](r(274)),
            Zn = -1 !== mn && parseFloat(nn[r(120)][r(139)](mn + 8)) < 4.4, yn && !Kn && !On && !Zn), it = {
            ".widget": {
                ".window": {
                    "a.link.absolute": Bt ? {
                        ".slicebg.absolute": {
                            "canvas.bg.absolute": {},
                            ".slice": {}
                        },
                        "canvas.fullbg.fade.absolute": {}
                    } : {
                        ".slicebg.absolute": {
                            ".bg.absolute": {},
                            ".slice": {}
                        },
                        ".fullbg.fade.absolute": {}
                    },
                    ".flashlight.absolute": {},
                    ".loading.absolute": {
                        ".loading_icon": {},
                        ".loading_tip": {}
                    },
                    ".result.enter": {
                        ".result_icon": {},
                        ".result_title": {},
                        ".result_content": {}
                    }
                },
                ".panel": {
                    "a.close": {
                        ".close_tip": {}
                    },
                    "a.refresh": {
                        ".refresh_tip": {}
                    },
                    "a.feedback": {
                        ".feedback_tip": {}
                    },
                    "a.logo": {}
                }
            },
            ".slider": {
                ".slider_tip": {},
                ".slider_button": {},
                ".slider_status": {}
            }
        }, rt = {
            ".wrap": {
                ".widget": {
                    ".window": {
                        "a.link": {
                            ".canvas_img.absolute": {
                                ".slicebg.absolute": {
                                    "canvas.canvas_bg.absolute": {},
                                    "canvas.canvas_slice.absolute": {}
                                },
                                "canvas.canvas_fullbg.fade.absolute": {}
                            },
                            ".div_img.absolute": {
                                ".slicebg.absolute": {
                                    ".div_bg.absolute": {},
                                    ".div_slice.absolute": {}
                                },
                                ".div_fullbg.fade.absolute": {}
                            }
                        },
                        ".refresh": {
                            ".refresh_tip": {}
                        },
                        ".loading.absolute.fade": {
                            ".loading_icon": {},
                            ".loading_tip": {}
                        },
                        ".result.absolute.fade": {
                            ".result_box": {
                                ".result_icon": {},
                                ".result_title": {},
                                ".result_content": {}
                            }
                        }
                    }
                },
                ".slider": {
                    ".slider_track": {
                        ".slider_tip.fade": {}
                    },
                    ".slider_button": {}
                }
            },
            ".panel": {
                ".small": {
                    "a.close": {
                        ".close_tip": {}
                    },
                    "a.refresh_1": {
                        ".refresh_icon": {},
                        ".refresh_tip": {}
                    },
                    "a.feedback": {
                        ".feedback_icon": {},
                        ".feedback_tip": {}
                    },
                    "a.voice": {
                        ".voice_tip": {}
                    }
                },
                "a.copyright": {
                    ".logo": {},
                    ".copyright_tip": {}
                }
            }
        }, ct = {
            ".wrap": {
                ".header": {
                    ".tips": {
                        ".tip_content": {}
                    }
                },
                ".widget": {
                    ".window": {
                        "a.link": {
                            ".canvas_img.absolute": {
                                ".slicebg.absolute": {
                                    "canvas.canvas_bg.absolute": {},
                                    "canvas.canvas_slice.absolute": {}
                                },
                                "canvas.canvas_fullbg.fade.absolute": {}
                            },
                            ".div_img.absolute": {
                                ".slicebg.absolute": {
                                    ".div_bg.absolute": {},
                                    ".div_slice.absolute": {}
                                },
                                ".div_fullbg.fade.absolute": {}
                            }
                        },
                        ".refresh": {
                            ".refresh_tip": {}
                        },
                        ".loading.absolute.fade": {
                            ".loading_icon": {},
                            ".loading_tip": {}
                        },
                        ".result.absolute.fade": {
                            ".result_box": {
                                ".result_icon": {},
                                ".result_title": {},
                                ".result_content": {}
                            }
                        }
                    }
                },
                ".slider": {
                    ".slider_track": {
                        ".slider_tip.fade": {},
                        ".progress_left": {},
                        ".progress_right": {}
                    },
                    ".slider_button": {}
                },
                "a.close": {
                    ".close_tip": {}
                },
                "a.refresh_1": {
                    ".refresh_icon": {},
                    ".refresh_tip": {}
                },
                "a.feedback": {
                    ".feedback_icon": {},
                    ".feedback_tip": {}
                },
                "a.voice": {
                    ".voice_tip": {}
                },
                "a.copyright": {
                    ".logo": {},
                    ".copyright_tip": {}
                }
            }
        };
        function Ct(n) {
            var t = QBLnx.$_Db()[15][19];
            for (;t !== QBLnx.$_Db()[3][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[15][19]:
                        var i = this, c = n[r(38)];
                        c[B(1)] = c[r(64)] = 0, i[r(616)] = c[B(44)](B(22)), i[r(631)] = i[r(612)] = i[B(641)] = i[r(655)] = 0,
                            i[B(625)] = c;
                        t = QBLnx.$_Db()[0][18];
                }
            }
        }
        function at(n, t) {
            var i = QBLnx.$_Db()[9][19];
            for (;i !== QBLnx.$_Db()[3][17]; ) {
                switch (i) {
                    case QBLnx.$_Db()[12][19]:
                        var c = this, C = new _t(n);
                        i = QBLnx.$_Db()[0][18];
                        break;

                    case QBLnx.$_Db()[3][18]:
                        C[B(647)] && !isNaN(C[r(647)]) && (ln = B(663), Gn = C[r(647)]), C[r(688)] && (C[B(40)] = B(635)),
                        n[B(698)] && C[B(654)](n[r(698)]), c[B(69)] = C, c[r(49)] = n, c[r(617)] = new un(c),
                            c[r(476)] = new Ln(function(n, t) {
                                var B = QBLnx.$_CM, i = [ "$_BJDCE" ].concat(B), r = i[1];
                                i.shift();
                                i[0];
                                c[r(604)](n, t);
                            }), c[r(476)][r(643)](jn), c[B(614)] = $(), c[r(665)] = Bn ? 3 : 0, c[B(667)] = Bn ? r(607) : B(600),
                            c[r(69)][B(155)] = {
                                $_BCw: c[r(665)]
                            };
                        i = QBLnx.$_Db()[3][17];
                }
            }
        }
        function _t(n) {
            var t = QBLnx.$_Db()[15][19];
            for (;t !== QBLnx.$_Db()[0][18]; ) {
                switch (t) {
                    case QBLnx.$_Db()[6][19]:
                        this[B(216)] = u(), this[r(654)]({
                            protocol: P
                        })[B(654)](n);
                        t = QBLnx.$_Db()[6][18];
                }
            }
        }
        function st(n) {
            var t = QBLnx.$_Db()[0][19];
            for (;t !== QBLnx.$_Db()[9][15]; ) {
                switch (t) {
                    case QBLnx.$_Db()[9][19]:
                        var i = this, _ = n[r(69)];
                        t = QBLnx.$_Db()[9][18];
                        break;

                    case QBLnx.$_Db()[6][18]:
                        i[r(476)] = n[B(476)], i[r(490)] = n, i[r(69)] = _, i[B(49)] = n[r(49)], i[r(617)] = n[B(617)],
                            i[r(697)] = a(i[r(69)][r(603)]), i[r(411)] = E();
                        t = QBLnx.$_Db()[6][17];
                        break;

                    case QBLnx.$_Db()[9][17]:
                        var s = _[B(621)], o = B(602) + _[r(679)];
                        t = QBLnx.$_Db()[3][16];
                        break;

                    case QBLnx.$_Db()[12][16]:
                        tn && (o += B(620)), B(622) === s ? i[r(630)] = c(o + r(644), C(it), i[r(411)]) : r(676) === s ? i[r(630)] = c(o + r(629), it, i[B(411)]) : B(691) === s && (i[B(630)] = c(o + B(658), it, i[r(411)])),
                            i[B(255)]()[r(203)]();
                        t = QBLnx.$_Db()[9][15];
                }
            }
        }
        function ot(n, t) {
            var i = QBLnx.$_Db()[12][19];
            for (;i !== QBLnx.$_Db()[3][18]; ) {
                switch (i) {
                    case QBLnx.$_Db()[6][19]:
                        this[B(693)] = u(), this[B(623)] = !0, fn[B(643)](this[r(693)], new at(n, t));
                        i = QBLnx.$_Db()[9][18];
                }
            }
        }
        function $t(n, t, i, c, C) {
            var a = QBLnx.$_Db()[9][19];
            for (;a !== QBLnx.$_Db()[9][17]; ) {
                switch (a) {
                    case QBLnx.$_Db()[15][19]:
                        var _ = this;
                        a = QBLnx.$_Db()[0][18];
                        break;

                    case QBLnx.$_Db()[3][18]:
                        _[B(657)] = c, _[r(664)] = C, _[r(67)] = n, t = t[r(38)], rn ? n[B(80)]({
                            filter: B(609) + t[r(17)] + r(624)
                        }) : n[r(80)]({
                            backgroundImage: r(687) + t[r(17)] + r(624)
                        }), n[r(80)]({
                            left: o(_[r(657)] / 260),
                            top: o(_[B(664)]),
                            width: o(t[B(64)]),
                            height: o(t[r(1)])
                        });
                        a = QBLnx.$_Db()[6][17];
                }
            }
        }
        function ft(n) {
            var t = QBLnx.$_Db()[3][19];
            for (;t !== QBLnx.$_Db()[9][17]; ) {
                switch (t) {
                    case QBLnx.$_Db()[6][19]:
                        var i = this, _ = n[r(69)];
                        _[B(656)] && B(676) === _[r(621)] && (_[r(621)] = r(691)), i[B(476)] = n[B(476)],
                            i[B(490)] = n, i[B(69)] = _, i[B(49)] = n[B(49)], i[r(617)] = n[B(617)], i[B(697)] = a(i[B(69)][r(603)]),
                            i[r(411)] = E();
                        t = QBLnx.$_Db()[15][18];
                        break;

                    case QBLnx.$_Db()[15][18]:
                        var s = _[r(621)], o = B(671) + _[r(679)];
                        B(622) === s || B(690) === _[B(621)] ? (_[B(670)] && r(611) === _[B(670)] ? i[B(630)] = c(o + r(644), C(ct), i[r(411)]) : i[B(630)] = c(o + r(644), C(rt), i[B(411)]),
                        _[r(64)] && i[B(411)](r(675))[r(80)]({
                            width: _[B(64)]
                        }), _[B(689)] && i[r(411)](r(788))[r(80)]({
                            backgroundColor: _[r(689)]
                        }), i[B(712)]()) : _[B(670)] && B(611) === _[r(670)] ? i[B(630)] = c(o + r(658), ct, i[r(411)]) : i[B(630)] = c(o + B(658), rt, i[B(411)]),
                        r(691) === _[r(621)] && i[B(49)][r(723)] && i[B(49)][r(411)] && (i[B(49)][B(411)](B(784))[r(779)]({
                            backgroundColor: _[B(689)]
                        }), i[r(712)](B(691))), _[B(716)] && i[B(411)](r(745))[r(548)](r(724))[r(548)](B(718)),
                            i[B(793)](), i[r(255)]()[r(203)]();
                        t = QBLnx.$_Db()[12][17];
                }
            }
        }
        function Dt() {
            var n = QBLnx.$_Db()[0][19];
            for (;n !== QBLnx.$_Db()[15][19]; ) {
                n;
            }
        }
        function ht(n, t) {
            var i = QBLnx.$_Db()[9][19];
            for (;i !== QBLnx.$_Db()[6][17]; ) {
                switch (i) {
                    case QBLnx.$_Db()[0][19]:
                        var c = this;
                        i = QBLnx.$_Db()[3][18];
                        break;

                    case QBLnx.$_Db()[15][18]:
                        c[B(713)] = n(B(783)), c[r(709)] = n(B(740)), c[r(711)] = n(r(787)), c[r(411)] = n,
                            c[B(697)] = t;
                        i = QBLnx.$_Db()[3][17];
                }
            }
        }
        function et() {
            var n = QBLnx.$_Db()[12][19];
            for (;n !== QBLnx.$_Db()[0][19]; ) {
                n;
            }
        }
        Ct[r(230)] = {
            $_BJBX: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BJDHV" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this[B(625)];
                return c[B(1)] !== t && (c[B(1)] = t), c[r(64)] !== n && (c[r(64)] = n), this;
            },
            $_BJCj: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_BJECK" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this;
                return C[i(68)](), C[i(767)] = n[c(38)], C[c(764)] = t, C[i(726)] = B, C[c(641)] = n[c(64)],
                    C[i(708)] = n[i(1)], C[c(725)](t), C;
            },
            $_CHu: function() {
                var n = QBLnx.$_CM, t = [ "$_BJEHn" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(616)], r = this[B(625)];
                return i[n(727)](0, 0, r[B(64)], r[n(1)]), this;
            },
            $_BJHO: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BJFCh" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                return r[i(616)][i(94)](r[t(767)], n + r[i(764)], r[i(726)]), r;
            },
            $_BJIf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_BJFHE" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return this[t(68)]()[t(725)](n);
            }
        }, egg230 = at[r(230)] = {
            $_BHGJ: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_BJGCH" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[B(706)], a = c[B(476)], _ = c[B(617)], s = c[r(69)];
                if (n !== t) {
                    if (null !== t && C && C[B(721)](n, t), n === jn) {
                        c[B(707)] = c[r(255)]()[B(146)](function(n) {
                            var t = QBLnx.$_CM, B = [ "$_BJGHo" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            return n[i(10)] === Sn ? Q(F(n, c)) : (s[i(654)](f(n)), s[i(698)] && s[t(654)](s[t(698)]),
                            s[i(749)] && c[t(763)]()[t(146)](function() {
                                var n = QBLnx.$_CM, t = [ "$_BJHCL" ].concat(n);
                                t[1];
                                t.shift();
                                t[0];
                            }), s[t(656)] ? c[t(706)] = new ft(c) : c[i(706)] = new st(c), c[i(786)](), _[t(703)](jn),
                                a[i(643)](Vn), c[i(706)][i(798)]);
                        }, function() {
                            var n = QBLnx.$_CM, t = [ "$_BJHHp" ].concat(n);
                            t[1];
                            t.shift();
                            t[0];
                            return Q(b(n(762), c));
                        });
                    } else if (n === Vn) {
                        var o = e();
                        c[B(131)]()[B(146)](function(n) {
                            var t = QBLnx.$_CM, B = [ "$_BJICr" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            C[t(701)](n), c[i(750)] = e() - o, a[i(643)](Yn);
                        }, function() {
                            var n = QBLnx.$_CM, t = [ "$_BJIHf" ].concat(n), B = t[1];
                            t.shift();
                            t[0];
                            return Q(b(B(792), c));
                        });
                    } else {
                        n === Yn ? C[r(778)]() : n === qn ? C[r(731)]() : B(790) === n ? C[B(785)](t) : n === Rn ? (-1 < new Qn([ Yn, Xn, zn, Un ])[r(524)](t) && (_[r(703)](Rn),
                            C[B(759)]()), k(c[r(717)]), c[r(786)]()) : n === Un ? (k(c[r(717)]), C[r(753)](c[r(715)], c[r(799)])[r(146)](function() {
                            var n = QBLnx.$_CM, t = [ "$_BJJCk" ].concat(n), B = t[1];
                            t.shift();
                            t[0];
                            _[B(703)](Un, c[n(799)]);
                        })) : n === Tn ? (_[r(703)](Tn), C[r(730)]()[r(146)](function() {
                            var n = QBLnx.$_CM, t = [ "$_BJJHu" ].concat(n), B = t[1];
                            t.shift();
                            t[0];
                            a[B(643)](Yn);
                        })) : n === zn ? (_[B(703)](zn), C[r(773)]()[B(146)](function() {
                            var n = QBLnx.$_CM, t = [ "$_CAACZ" ].concat(n), B = t[1];
                            t.shift();
                            t[0];
                            a[B(643)](Rn);
                        })) : n === Xn ? (_[B(703)](Xn), C[B(738)]()[r(146)](function() {
                            var n = QBLnx.$_CM, t = [ "$_CAAHI" ].concat(n), B = t[1];
                            t.shift();
                            t[0];
                            Q(b(B(746), c));
                        })) : n === Sn ? (_[r(703)](Sn, c[B(736)]), C && C[B(768)]()) : n === nt && _[B(703)](nt, r(734));
                    }
                }
            },
            $_GAK: function() {
                var n = QBLnx.$_CM, t = [ "$_CABCa" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(69)];
                return H(i, n(732), this[n(49)]);
            },
            $_CACr: function() {
                var n = QBLnx.$_CM, t = [ "$_CABHP" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(69)];
                return G(i, B(176), i[B(40)], i[n(765)], i[n(749)]);
            },
            $_CADI: function() {
                var n = QBLnx.$_CM, t = [ "$_CACCW" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(69)], c = i[n(476)];
                return r[n(761)] && (i[B(717)] = y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CACHJ" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    c[n(643)](Rn);
                }, 54e4)), i;
            },
            $_DB_: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CADCA" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return this[t(736)] = n, this[t(476)][t(643)](Sn), this;
            },
            $_CId: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CADHs" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                return r[t(707)][i(146)](function() {
                    var t = QBLnx.$_CM, B = [ "$_CAECz" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[i(706)][i(95)](n);
                }), r;
            },
            $_CCAX: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CAEHK" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                return r[i(707)][t(146)](function() {
                    var t = QBLnx.$_CM, B = [ "$_CAFCg" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[i(706)][i(739)](n);
                }), r;
            },
            $_DDb: function() {
                var n = QBLnx.$_CM, t = [ "$_CAFHr" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(69)], r = i[n(40)], c = i[B(765)] || i[n(728)];
                return this[B(614)][B(146)](function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CAGCq" ].concat(t), C = B[1];
                    B.shift();
                    B[0];
                    var a = n ? C(794) : t(742);
                    return En[t(453)]([ new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CAGHg" ].concat(t), C = B[1];
                        B.shift();
                        B[0];
                        G(i, C(71), r, c, i[C(789)][t(87)](t(742), a))[t(146)](function(t) {
                            var B = QBLnx.$_CM, i = [ "$_CAHCs" ].concat(B);
                            i[1];
                            i.shift();
                            i[0];
                            n(t);
                        }, function() {
                            var t = QBLnx.$_CM, B = [ "$_CAHHH" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            n(!1);
                        });
                    }), G(i, C(71), r, c, i[t(700)][t(87)](C(742), a)), G(i, t(71), r, c, i[C(139)][t(87)](C(742), a)) ]);
                });
            },
            $_CCBv: function(t, B, i) {
                var r = QBLnx.$_CM, c = [ "$_CAICx" ].concat(r), C = c[1];
                c.shift();
                c[0];
                var a = this, _ = a[r(69)], s = {
                    lang: _[C(116)] || r(103),
                    userresponse: w(t, _[r(182)]),
                    passtime: i,
                    imgload: a[C(750)],
                    aa: B,
                    ep: a[r(714)]()
                };
                try {
                    if (n[C(744)]) {
                        var o = {
                            lang: s[r(116)],
                            ep: s[r(741)]
                        }, $ = n[r(744)](o);
                        if ($[r(116)]) {
                            var D = function(n) {
                                var t = QBLnx.$_CM, B = [ "$_CAIHz" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                for (var r in n) {
                                    if (i(741) !== r && i(116) !== r) {
                                        return r;
                                    }
                                }
                            }(o), h = function(n, t, B) {
                                var i = QBLnx.$_CM, r = [ "$_CAJCu" ].concat(i), c = r[1];
                                r.shift();
                                r[0];
                                for (var C = new (n[c(774)][i(796)])(t, B), a = [ i(367), c(319), c(372), i(751), i(194), i(747), c(777), c(733) ], _ = a[c(125)] - 2, s = 0; s < B[i(125)]; s++) {
                                    var o, $ = Math[c(360)](B[s][c(193)]() - 70)[i(215)]()[1];
                                    o = _ < $ ? n[i(774)][a[1 + _]](C) : n[c(774)][a[$]](C);
                                    for (var f = Math[c(360)](B[s][i(193)]() - 70)[c(215)]()[0], D = 0; D < f; D++) {
                                        o[c(771)]();
                                    }
                                }
                                return C[i(46)][i(421)](c(15))[i(139)](0, 10);
                            }($, o, D);
                            o[D] = h;
                        }
                        !function(n) {
                            var t = QBLnx.$_CM, B = [ "$_CAJHL" ].concat(t), i = B[1];
                            B.shift();
                            B[0];
                            if (t(48) == typeof Object[t(743)]) {
                                return Object[t(743)][i(344)](Object, arguments);
                            }
                            if (null == n) {
                                throw new Error(i(781));
                            }
                            n = Object(n);
                            for (var r = 1; r < arguments[t(125)]; r++) {
                                var c = arguments[r];
                                if (null !== c) {
                                    for (var C in c) {
                                        Object[i(230)][t(63)][i(366)](c, C) && (n[C] = c[C]);
                                    }
                                }
                            }
                        }(s, o);
                    }
                } catch (n) {}
                _[r(128)] && (s[C(223)] = t), s[C(791)] = Dn(_[C(104)] + _[C(182)][r(139)](0, 32) + s[r(704)]);
                var e = a[C(754)](), E = en[C(353)](Hn[C(218)](s), a[C(756)]()), u = j[C(782)](E), v = {
                    gt: _[C(104)],
                    challenge: _[r(182)],
                    lang: s[C(116)],
                    $_BCw: a[r(665)],
                    client_type: a[C(667)],
                    w: u + e
                };
                H(a[r(69)], r(748), v)[r(146)](function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CBACL" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    if (n[t(10)] == Sn) {
                        return Q(F(n, a, i(748)));
                    }
                    a[t(702)](f(n));
                }, function() {
                    var n = QBLnx.$_CM, t = [ "$_CBAHf" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return Q(b(B(722), a));
                });
            },
            $_CCFQ: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CBBCn" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[t(69)], c = Sn, C = n && n[i(755)], a = n && n[t(180)];
                if (n) {
                    if (i(638) == C || i(638) == a) {
                        var _ = n[t(776)][i(55)](t(769))[0];
                        this[i(799)] = n[t(780)], this[t(715)] = {
                            geetest_challenge: r[t(182)],
                            geetest_validate: _,
                            geetest_seccode: _ + i(720)
                        }, c = Un;
                    } else {
                        i(699) == C || i(699) == a ? c = Tn : t(662) == C || i(662) == a ? c = Xn : t(645) != C && t(645) != a || (c = zn);
                    }
                } else {
                    c = Sn;
                }
                this[t(476)][i(643)](c);
            },
            $_CCGw: function() {
                var n = QBLnx.$_CM, t = [ "$_CBBHE" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(715)];
            },
            $_BDCL: function() {
                var n = QBLnx.$_CM, t = [ "$_CBCCC" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(706)] && this[B(706)][B(775)](), this;
            },
            $_BDBV: function() {
                var n = QBLnx.$_CM, t = [ "$_CBCHB" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(706)] && this[n(706)][B(705)](), this;
            },
            $_GBV: function(t, B) {
                var i = QBLnx.$_CM, r = [ "$_CBDCw" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this, a = C[c(69)];
                return C[i(617)][i(203)](t, function(i) {
                    var r = QBLnx.$_CM, c = [ "$_CBDHM" ].concat(r), _ = c[1];
                    c.shift();
                    c[0];
                    B(i), -1 < new Qn([ Un, Tn, Xn, zn ])[r(524)](t) ? (C[_(617)][_(703)](Wn), v(n[_(719)]) && (a[r(656)] ? n[_(719)](t === Un ? 1 : 0, !1, t) : n[r(719)](t === Un ? 1 : 0, C[_(411)], t))) : t === Rn ? v(n[_(797)]) && n[r(797)](C[r(411)]) : t === Sn ? v(n[r(737)]) && n[_(737)](C, C[_(411)]) : t === jn && v(n[r(710)]) && n[r(710)](C);
                }), C;
            },
            $_CBAa: function() {
                var n = QBLnx.$_CM, t = [ "$_CBECL" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(476)][B(643)](Rn), this;
            },
            $_CCHN: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CBEHP" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(69)][t(656)] && this[i(706)][t(770)](n), this;
            },
            $_BBCT: function() {
                var n = QBLnx.$_CM, t = [ "$_CBFCD" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                i[n(717)] && k(i[B(717)]), i[B(706)] && i[n(706)][n(505)](), i[B(617)][n(505)]();
            },
            $_CCEc: (Nn = xn(), function(n) {
                var t = QBLnx.$_CM, B = [ "$_CBFHo" ].concat(t);
                B[1];
                B.shift();
                B[0];
                return !0 === n && (Nn = xn()), Nn;
            }),
            $_CCDH: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CBGCG" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = new hn()[i(353)](this[t(756)](n));
                while (!r || 256 !== r[t(125)]) {
                    r = new hn()[i(353)](this[i(756)](!0));
                }
                return r;
            },
            $_CCCG: function() {
                var n = QBLnx.$_CM, t = [ "$_CBGHm" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return {
                    v: B(735),
                    $_BIB: dn[B(684)],
                    me: dn[B(674)],
                    tm: new pn()[n(760)](),
                    td: this[n(757)] || -1
                };
            }
        }, _t[B(230)] = {
            protocol: B(758),
            apiserver: B(766),
            staticservers: [ B(729), B(752) ],
            product: B(691),
            lang: r(103),
            bg: r(15),
            fullbg: r(15),
            slice: r(15),
            xpos: 0,
            ypos: 0,
            height: 116,
            width: o(300),
            type: r(437),
            sandbox: !1,
            autoReset: !0,
            challenge: r(15),
            gt: r(15),
            https: !1,
            logo: !0,
            mobile: !1,
            theme: B(772),
            theme_version: B(795),
            version: r(735),
            feedback: B(830),
            homepage: B(896),
            show_delay: 250,
            hide_delay: 800,
            $_BHEg: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CBHCF" ].concat(t);
                B[1];
                B.shift();
                B[0];
                var i = this;
                return new Mn(n)[t(85)](function(n, t) {
                    var B = QBLnx.$_CM, r = [ "$_CBHHV" ].concat(B);
                    r[1];
                    r.shift();
                    r[0];
                    i[n] = t;
                }), i;
            }
        }, st[B(230)] = {
            $_GAK: function() {
                var n = QBLnx.$_CM, t = [ "$_CBICv" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(411)], r = this[n(697)];
                return this[B(814)](), i(n(877))[n(851)](r[n(648)]), this;
            },
            $_CCJy: function() {
                var n = QBLnx.$_CM, t = [ "$_CBIHT" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                return i[B(840)] && i[n(840)][n(80)]({
                    top: i[B(630)][n(874)]() - 10 + n(16),
                    left: i[n(630)][B(873)]() + n(16)
                }), i;
            },
            $_CDBN: function() {
                var n = QBLnx.$_CM, t = [ "$_CBJCl" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(411)], c = i[n(630)][n(899)](!1);
                return r(n(847))[B(866)](c), c[n(95)](new Fn(R)), (i[B(840)] = c)[n(203)](B(842), function() {
                    var n = QBLnx.$_CM, t = [ "$_CBJHq" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(823)](!0);
                })[n(203)](n(843), function() {
                    var n = QBLnx.$_CM, t = [ "$_CCACU" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(823)](!1);
                }), i[n(839)](), i;
            },
            $_CDDe: function() {
                var n = QBLnx.$_CM, t = [ "$_CCAHp" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(69)], c = i[n(411)];
                i[B(844)] || i[B(825)] ? (i[n(839)](), c(n(847))[B(775)](), y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CCBCx" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    (i[B(844)] || i[B(825)]) && c(B(847))[n(557)](n(858));
                }, r[B(870)])) : y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CCBHH" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(844)] || i[B(825)] || (c(n(847))[B(548)](n(858)), y(function() {
                        var n = QBLnx.$_CM, t = [ "$_CCCCM" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        c(n(847))[B(705)]();
                    }, 500));
                }, r[B(805)]);
            },
            $_CDCX: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CCCHV" ].concat(t), i = B[1];
                B.shift();
                B[0];
                this[t(844)] !== n && (this[i(844)] = n, this[i(848)]());
            },
            $_CDGl: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CCDCY" ].concat(t), i = B[1];
                B.shift();
                B[0];
                this[t(825)] !== n && (this[t(825)] = n, this[i(848)]());
            },
            $_CDHE: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CCDHK" ].concat(t);
                B[1];
                B.shift();
                B[0];
                var i = this;
                y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CCECC" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    i[n(834)](!1);
                }, n);
            },
            $_CDIf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CCEHB" ].concat(t);
                B[1];
                B.shift();
                B[0];
                var i = this;
                return i[t(837)](n, function() {
                    var n = QBLnx.$_CM, t = [ "$_CCFCe" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(834)](!0);
                });
            },
            $_CEAC: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_CCFHI" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this, a = C[c(411)], _ = C[c(697)], s = a(i(745));
                return n == Un ? C[c(897)][c(884)](n, {
                    sec: (C[i(871)] / 1e3)[i(54)](1),
                    score: 100 - C[c(799)]
                }) : C[c(897)][i(884)](n), a(c(745))[i(835)](n, C[c(827)] || null), C[c(827)] = n,
                    new En(function(t) {
                        var i = QBLnx.$_CM, r = [ "$_CCGCJ" ].concat(i), c = r[1];
                        r.shift();
                        r[0];
                        s[i(557)](i(879)), 35 < _[n][c(125)] && a(i(745))[c(557)](c(818)), y(function() {
                            var n = QBLnx.$_CM, B = [ "$_CCGHI" ].concat(n);
                            B[1];
                            B.shift();
                            B[0];
                            t();
                        }, B || 1500);
                    })[c(146)](function() {
                        var B = QBLnx.$_CM, i = [ "$_CCHCy" ].concat(B);
                        i[1];
                        i.shift();
                        i[0];
                        if (!t) {
                            return new En(function(t) {
                                var B = QBLnx.$_CM, i = [ "$_CCHHg" ].concat(B), r = i[1];
                                i.shift();
                                i[0];
                                s[r(548)](r(879)), 35 < _[n][B(125)] && a(r(745))[r(548)](B(818)), y(function() {
                                    var n = QBLnx.$_CM, B = [ "$_CCICb" ].concat(n);
                                    B[1];
                                    B.shift();
                                    B[0];
                                    t();
                                }, 200);
                            });
                        }
                    });
            },
            $_CEFh: function() {
                var n = QBLnx.$_CM, t = [ "$_CCIHy" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = (0, this[n(411)])(n(810))[n(557)](n(869));
                return new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CCJCQ" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    i[t(893)](0), y(n, 100);
                })[n(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CCJHp" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CDACb" ].concat(t), r = B[1];
                        B.shift();
                        B[0];
                        i[r(893)](1), y(n, 100);
                    });
                })[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CDAHv" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CDBCF" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        i[t(893)](0), y(n, 100);
                    });
                })[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CDBHe" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CDCC_" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        i[t(893)](1), y(n, 200);
                    });
                })[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CDCHe" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(548)](n(869));
                });
            },
            $_CEGz: function() {
                var n = QBLnx.$_CM, t = [ "$_CDDCZ" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(411)];
                return i(n(810))[B(557)](n(813)), i(n(875))[n(557)](B(813)), this[B(868)](this[B(891)]),
                    new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CDDHf" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        y(function() {
                            var t = QBLnx.$_CM, B = [ "$_CDECN" ].concat(t), r = B[1];
                            B.shift();
                            B[0];
                            i(r(810))[r(548)](t(813)), i(r(875))[r(548)](t(813)), n();
                        }, 400);
                    });
            },
            $_CEJq: function() {
                var n = QBLnx.$_CM, t = [ "$_CDEHV" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(411)], r = i(B(800))[n(557)](B(816))[B(80)]({
                    left: B(886)
                });
                return new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CDFCm" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(function() {
                        var t = QBLnx.$_CM, B = [ "$_CDFHf" ].concat(t), i = B[1];
                        B.shift();
                        B[0];
                        r[t(548)](i(816))[t(80)]({
                            left: t(883)
                        }), n();
                    }, 1500);
                });
            },
            $_CBCD: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_CDGCT" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this;
                c[B(799)] = t;
                var C = c[r(411)], a = (c[r(69)], c[B(49)]);
                return C(r(882))[B(893)](1)[B(775)](), c[B(822)](), a && a[B(815)] ? new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CDGHO" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    n();
                }) : c[r(806)](Un, null, 350)[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CDHCH" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CDHHq" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        n();
                    });
                });
            },
            $_CBFK: function() {
                var n = QBLnx.$_CM, t = [ "$_CDICt" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                return i[n(806)](Tn), B(676) === i[B(69)][n(621)] && i[n(888)](1e3), i[n(849)]()[n(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CDIHp" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return i[n(817)]();
                });
            },
            $_CBJp: function() {
                var n = QBLnx.$_CM, t = [ "$_CDJCu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                n(676) === this[n(69)][n(621)] && this[B(888)](800), this[B(853)]();
            },
            $_CBGb: function() {
                var n = QBLnx.$_CM, t = [ "$_CDJHa" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                return i[B(836)]()[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CEACt" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    B(676) === i[B(69)][n(621)] && i[n(888)](1e3);
                });
            },
            $_CBHU: function() {
                var n = QBLnx.$_CM, t = [ "$_CEAHc" ].concat(n);
                t[1];
                t.shift();
                t[0];
                var B = this;
                return B[n(889)]()[n(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CEBCM" ].concat(n), i = t[1];
                    t.shift();
                    t[0];
                    i(676) === B[n(69)][i(621)] && B[i(888)](1e3);
                });
            },
            $_CAFx: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEBHl" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this, c = r[i(411)], C = r[t(69)];
                cn && c(i(847))[t(80)]({
                    width: t(832)
                }), c(t(824))[i(80)]({
                    height: C[i(1)] + 2 + t(16)
                }), c(t(856))[t(80)]({
                    paddingTop: 8 * (C[t(1)] - r[t(807)]) / 44 + i(881)
                });
                var a = n[0], o = n[1], $ = n[2];
                if (Bt) {
                    try {
                        a && s(a, c(i(882)), C[t(1)]), s(o, c(i(811)), C[i(1)]);
                    } catch (n) {
                        a && _(a, c(t(882)), C[t(1)]), _(o, c(i(811)), C[t(1)]);
                    }
                } else {
                    a && _(a, c(t(882)), C[t(1)]), _(o, c(t(811)), C[i(1)]);
                }
                return r[t(67)] = new $t(c(t(810)), $, C[i(1)], C[i(867)], C[t(833)]), r;
            },
            $_CAHq: function() {
                var n = QBLnx.$_CM, t = [ "$_CECCN" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(411)];
                this[n(868)](0), i(n(856))[n(705)]();
            },
            $_CCHN: function() {
                var n = QBLnx.$_CM, t = [ "$_CECHD" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(809)] = 1, this;
            }
        }, ot[B(25)] = r(831), ot[r(230)] = {
            appendTo: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEDCW" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[i(485)](this[t(693)])[t(95)](n), this;
            },
            bindOn: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEDHn" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[t(485)](this[t(693)])[i(739)](n), this;
            },
            refresh: function() {
                var n = QBLnx.$_CM, t = [ "$_CEECK" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(623)] && fn[n(485)](this[B(693)])[n(759)](), this;
            },
            show: function() {
                var n = QBLnx.$_CM, t = [ "$_CEEHt" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[n(623)] && fn[B(485)](this[B(693)])[B(775)](), this;
            },
            hide: function() {
                var n = QBLnx.$_CM, t = [ "$_CEFCK" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(623)] && fn[B(485)](this[n(693)])[n(705)](), this;
            },
            getValidate: function() {
                var n = QBLnx.$_CM, t = [ "$_CEFHp" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return !!this[B(623)] && fn[n(485)](this[B(693)])[n(859)]();
            },
            onChangeCaptcha: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEGC_" ].concat(t), i = B[1];
                B.shift();
                B[0];
                this[i(623)] && fn[i(485)](this[i(693)])[t(203)](nt, n);
            },
            onStatusChange: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEGHO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                this[i(623)] && fn[i(485)](this[i(693)])[t(203)](Wn, n);
            },
            onReady: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEHCy" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(623)] && fn[i(485)](this[t(693)])[i(203)](jn, n), this;
            },
            onRefresh: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEHHK" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(623)] && fn[t(485)](this[t(693)])[i(203)](Rn, n), this;
            },
            onSuccess: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEICR" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[i(485)](this[i(693)])[i(203)](Un, n), this;
            },
            onFail: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEIHO" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[t(485)](this[i(693)])[t(203)](Tn, n), this;
            },
            onError: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEJC_" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(623)] && fn[t(485)](this[i(693)])[t(203)](Sn, n), this;
            },
            onForbidden: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CEJHx" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(623)] && fn[t(485)](this[t(693)])[i(203)](Xn, n), this;
            },
            onAbuse: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFACW" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[t(485)](this[t(693)])[i(203)](zn, n), this;
            },
            onClose: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFAHj" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[t(623)] && fn[t(485)](this[i(693)])[t(203)](Pn, n), this;
            },
            zoom: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFBCy" ].concat(t), i = B[1];
                B.shift();
                B[0];
                return this[i(623)] && fn[t(485)](this[t(693)])[i(770)](n), this;
            },
            destroy: function() {
                var n = QBLnx.$_CM, t = [ "$_CFBHZ" ].concat(n), B = t[1];
                t.shift();
                t[0];
                this[n(623)] && (this[n(623)] = !1, fn[n(485)](this[n(693)])[B(505)](), fn[n(643)](this[n(693)], null));
            }
        }, $t[B(230)] = {
            $_BJIf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFCCK" ].concat(t), i = B[1];
                B.shift();
                B[0];
                if (i(876) in S[i(284)][t(527)] || i(860) in S[t(284)][t(527)]) {
                    var r = t(812) + o(n - this[i(657)]) + t(861);
                    this[t(67)][t(80)]({
                        transform: r,
                        webkitTransform: r
                    });
                } else {
                    this[t(67)][i(80)]({
                        left: o(n)
                    });
                }
            }
        }, ft[B(230)] = {
            $_BIHb: function() {
                var n = QBLnx.$_CM, t = [ "$_CFCHC" ].concat(n), B = t[1];
                t.shift();
                t[0];
                for (var i = this[B(411)], r = [ n(845), n(878), n(863), n(821) ], c = 0; c < r[n(125)]; c++) {
                    try {
                        var C = i(r[c]);
                        this[n(872)](C);
                    } catch (n) {}
                }
            },
            $_CFFr: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFDCR" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this, c = n[i(38)][t(852)];
                n[i(38)][i(852)] = function() {
                    var n = QBLnx.$_CM, t = [ "$_CFDHc" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return r[n(490)][B(757)] = 1, c[B(366)](this);
                }, n[t(38)][i(852)][t(215)] = function() {
                    var n = QBLnx.$_CM, t = [ "$_CFECv" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return n(820);
                }, n[i(38)][i(852)][t(215)][t(215)] = function() {
                    var n = QBLnx.$_CM, t = [ "$_CFEHx" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return B(885);
                };
                var C = n[i(38)][t(803)];
                n[t(38)][t(803)] = function() {
                    var n = QBLnx.$_CM, t = [ "$_CFFCt" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return r[n(490)][B(757)] = 1, C[B(366)](this);
                }, n[t(38)][i(803)][i(215)] = function() {
                    var n = QBLnx.$_CM, t = [ "$_CFFHP" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return n(829);
                };
            },
            $_BIGQ: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CFGCm" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(69)], c = this[i(411)], C = this[i(49)];
                if (r[t(838)]) {
                    var a = Fn[t(411)](r[i(838)]);
                    if (a) {
                        var _ = a[i(898)](), s = n ? C[i(411)](t(894)) : c(t(895));
                        s && s[t(80)]({
                            position: i(724),
                            left: o(_[t(585)]),
                            top: o(_[i(509)]),
                            width: o(_[i(64)]),
                            height: o(_[i(1)])
                        });
                    }
                }
            },
            $_GAK: function() {
                var n = QBLnx.$_CM, t = [ "$_CFGHG" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(69)], c = i[n(411)], C = i[B(697)];
                r[n(670)] && B(611) === r[B(670)] && c(n(846))[n(851)](C[B(857)]), i[B(814)](),
                r[n(801)] || r[n(862)] || r[B(716)] || c(n(894))[n(705)]();
                var a = -20, _ = setInterval(function() {
                    var n = QBLnx.$_CM, t = [ "$_CFHCZ" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    !function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CFHHb" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        i[t(868)](n, !0), 0 === n && clearInterval(_);
                    }(a), a++;
                }, 15);
                return i;
            },
            $_CDIf: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_CFICd" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[r(411)], a = C(r(824))[r(594)]();
                return c[B(809)] = (a[r(564)] - a[B(585)]) / c[r(826)], c[r(837)](n, t, function() {
                    var n = QBLnx.$_CM, t = [ "$_CFIHN" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    C(B(864))[B(705)](), c[B(631)] = c[B(891)], c[B(887)][B(854)]();
                });
            },
            $_CEAC: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_CFJCy" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this, a = C[i(411)], _ = a(c(745)), s = C[c(697)];
                return n == Un ? C[c(897)][i(884)](n, {
                    sec: (C[c(871)] / 1e3)[i(54)](1),
                    score: 100 - C[i(799)]
                }) : C[i(897)][i(884)](n), _[i(835)](n, C[c(827)] || null), a(c(783))[c(835)](n, C[c(827)] || null),
                    C[c(827)] = n, C[i(69)][c(716)] ? new En(function(t) {
                    var i = QBLnx.$_CM, r = [ "$_CFJHj" ].concat(i), c = r[1];
                    r.shift();
                    r[0];
                    _[i(557)](c(879)), 35 < s[n][c(125)] && a(i(745))[c(557)](i(818)), y(function() {
                        var n = QBLnx.$_CM, B = [ "$_CGACK" ].concat(n);
                        B[1];
                        B.shift();
                        B[0];
                        t();
                    }, B || 1500);
                })[i(146)](function() {
                    var B = QBLnx.$_CM, i = [ "$_CGAHe" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    if (!t) {
                        return new En(function(t) {
                            var B = QBLnx.$_CM, i = [ "$_CGBCV" ].concat(B), r = i[1];
                            i.shift();
                            i[0];
                            _[r(548)](B(879)), 35 < s[n][r(125)] && a(r(745))[B(548)](B(818)), y(function() {
                                var n = QBLnx.$_CM, B = [ "$_CGBHz" ].concat(n);
                                B[1];
                                B.shift();
                                B[0];
                                t();
                            }, 200);
                        });
                    }
                }) : new En(function(n) {
                    var t = QBLnx.$_CM, i = [ "$_CGCCE" ].concat(t);
                    i[1];
                    i.shift();
                    i[0];
                    _[t(80)]({
                        opacity: t(850),
                        zIndex: t(99)
                    }), y(function() {
                        var t = QBLnx.$_CM, B = [ "$_CGCHq" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        n();
                    }, B || 1500);
                })[i(146)](function() {
                    var n = QBLnx.$_CM, B = [ "$_CGDCi" ].concat(n);
                    B[1];
                    B.shift();
                    B[0];
                    if (!t) {
                        return new En(function(n) {
                            var t = QBLnx.$_CM, B = [ "$_CGDHf" ].concat(t);
                            B[1];
                            B.shift();
                            B[0];
                            _[t(80)]({
                                opacity: t(99)
                            }), y(function() {
                                var t = QBLnx.$_CM, B = [ "$_CGECA" ].concat(t), i = B[1];
                                B.shift();
                                B[0];
                                n(), _[i(80)]({
                                    zIndex: t(802)
                                });
                            }, 200);
                        });
                    }
                });
            },
            $_CEGz: function() {
                var n = QBLnx.$_CM, t = [ "$_CGEHV" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(411)];
                return i(n(875))[n(557)](B(813)), i(B(890)) && i(B(890))[B(557)](n(841)), i(B(810))[n(705)](),
                    this[n(868)](this[n(891)]), new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CGFCj" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(function() {
                        var t = QBLnx.$_CM, B = [ "$_CGFHO" ].concat(t), r = B[1];
                        B.shift();
                        B[0];
                        i(t(875))[r(548)](t(813)), i(r(890)) && i(r(890))[t(548)](r(841)), i(r(810))[t(775)](),
                            n();
                    }, 400);
                });
            },
            $_CAHq: function() {
                var n = QBLnx.$_CM, t = [ "$_CGGCb" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(411)];
                return i(B(882))[n(705)](), i(B(856))[B(893)](0), y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CGGHt" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    i(n(856))[n(705)]();
                }, 500), i(B(864))[B(775)](), this;
            },
            $_CBCD: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_CGHCz" ].concat(B), r = i[1];
                i.shift();
                i[0];
                this[B(799)] = t;
                var c = this[B(411)], C = this[B(49)];
                return c(B(882))[r(775)]()[r(893)](1), c(r(864))[B(775)](), c(r(863))[B(557)](B(816)),
                    c(B(880))[r(557)](B(816)), C && C[B(815)] ? new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CGHHE" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    n();
                }) : this[r(806)](Un, null, 350)[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CGICw" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    return new En(function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CGIHc" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        n();
                    });
                });
            },
            $_CBFK: function() {
                var n = QBLnx.$_CM, t = [ "$_CGJCM" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[n(411)];
                i[n(806)](Tn), r(n(810))[B(893)](1);
                var c = i[B(69)];
                return n(622) !== c[n(621)] && B(690) !== c[n(621)] || (r(n(675))[n(557)](n(804)),
                    y(function() {
                        var n = QBLnx.$_CM, t = [ "$_CGJHG" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        r(n(675))[B(548)](B(804));
                    }, 400)), new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CHACj" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(function() {
                        var t = QBLnx.$_CM, B = [ "$_CHAHO" ].concat(t);
                        B[1];
                        B.shift();
                        B[0];
                        n();
                    }, 1500);
                })[B(146)](function() {
                    var n = QBLnx.$_CM, t = [ "$_CHBCX" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    return i[B(817)]();
                });
            },
            $_CBJp: function() {
                var n = QBLnx.$_CM, t = [ "$_CHBHc" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(853)]();
            },
            $_CBGb: function() {
                var n = QBLnx.$_CM, t = [ "$_CHCCO" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(836)]();
            },
            $_CBHU: function() {
                var n = QBLnx.$_CM, t = [ "$_CHCH_" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(889)]();
            },
            $_CAFx: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHDCi" ].concat(t), i = B[1];
                B.shift();
                B[0];
                function r() {
                    var n = QBLnx.$_Db()[6][19];
                    for (;n !== QBLnx.$_Db()[3][18]; ) {
                        switch (n) {
                            case QBLnx.$_Db()[9][19]:
                                C(t(863))[t(705)](), C(t(880))[t(775)](), C(i(882), C(t(819))), C(t(811), C(t(808))),
                                    C(t(810), C(i(855))), $ && _($, C(t(882)), a[t(1)]), _(f, C(i(811)), a[t(1)]), c[t(67)] = new $t(C(t(810)), D, a[i(1)], a[t(867)], a[i(833)]),
                                    t(622) === a[i(621)] || i(690) === a[i(621)] ? C(t(675))[t(80)]({
                                        width: o(278)
                                    }) : C(t(895))[i(80)]({
                                        width: o(278)
                                    }), C(i(808))[t(80)]({
                                    height: o(a[t(1)])
                                }), C(i(819))[i(80)]({
                                    height: o(a[t(1)])
                                });
                                n = QBLnx.$_Db()[12][18];
                        }
                    }
                }
                var c = this, C = c[t(411)], a = c[t(69)];
                C(t(824))[t(80)]({
                    paddingBottom: Number(a[t(1)] / c[t(826)] * 100)[t(54)](2) + i(881)
                }), C(t(856))[t(80)]({
                    paddingTop: 10 * (a[t(1)] - c[t(807)]) / 44 + i(881)
                }), C(i(892))[t(80)]({
                    paddingTop: 10 * (a[t(1)] - c[t(807)]) / 44 + i(881)
                });
                var $ = n[0], f = n[1], D = n[2];
                if (Bt) {
                    try {
                        C(i(863))[t(775)](), C(t(880))[t(705)](), C(t(882), C(t(878))), C(t(811), C(i(845))),
                            C(t(810), C(t(821))), $ && s($, C(i(882)), a[t(1)]), s(f, C(t(811)), a[i(1)]), c[t(67)] = new Ct(C(t(810)))[t(828)](260, a[i(1)])[i(865)](D, a[t(867)], a[i(833)]);
                    } catch (n) {
                        r();
                    }
                } else {
                    r();
                }
                return t(691) === a[i(621)] && c[t(991)](), c;
            },
            $_CCHN: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHDHb" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this[i(411)], c = this[i(69)], C = this[t(924)] = n;
                return x(n) && (C = o(n)), i(622) === c[i(621)] || i(690) === c[i(621)] || r(t(895))[t(80)]({
                    width: C
                }), this;
            }
        }, Dt[B(485)] = function(n, t, B) {
            var i = QBLnx.$_CM, r = [ "$_CHECV" ].concat(i), c = r[1];
            r.shift();
            r[0];
            for (var C = parseInt(6 * Math[i(46)]()), a = parseInt(300 * Math[c(46)]()), _ = Dn(C + c(15))[i(139)](0, 9), s = Dn(a + i(15))[i(139)](10, 19), o = i(15), $ = 0; $ < 9; $++) {
                o += $ % 2 == 0 ? _[i(187)]($) : s[i(187)]($);
            }
            var f = o[c(139)](0, 4), D = function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHEHW" ].concat(t), i = B[1];
                B.shift();
                B[0];
                if (5 == n[i(125)]) {
                    var r = (parseInt(n, 16) || 0) % 200;
                    return r < 40 && (r = 40), r;
                }
            }(o[i(139)](4)), h = function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHFCi" ].concat(t);
                B[1];
                B.shift();
                B[0];
                if (4 == n[t(125)]) {
                    return (parseInt(n, 16) || 0) % 70;
                }
            }(f);
            return n[c(966)] = u(), fn[i(643)](n[i(966)], {
                rand0: C,
                rand1: a,
                x_pos: D
            }), new En(function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHFHq" ].concat(t), i = B[1];
                B.shift();
                B[0];
                n({
                    bg: t(943) + _ + t(940) + s + i(742),
                    fullbg: i(943) + _ + t(147) + _ + i(742),
                    slice: i(943) + _ + t(998) + s + i(947),
                    type: t(437),
                    ypos: h,
                    xpos: 0
                });
            });
        }, Dt[r(979)] = function(n, t, B) {
            var i = QBLnx.$_CM, r = [ "$_CHGCK" ].concat(i), c = r[1];
            r.shift();
            r[0];
            var C, a = fn[i(485)](n[c(966)]), _ = B[i(223)], s = a[c(930)], o = a[c(970)], $ = a[c(917)];
            return C = s - 3 <= _ && _ <= s + 3 ? {
                success: !0,
                message: c(638),
                validate: w(_, n[i(182)]) + i(618) + w(o, n[c(182)]) + c(618) + w($, n[c(182)]),
                score: Math[c(129)](B[i(704)] / 200)
            } : {
                success: 0,
                message: c(699)
            }, new En(function(n) {
                var t = QBLnx.$_CM, B = [ "$_CHGHl" ].concat(t);
                B[1];
                B.shift();
                B[0];
                n(C);
            });
        }, Dt[B(131)] = function(n, t, B) {
            var i = QBLnx.$_CM, r = [ "$_CHHCN" ].concat(i), c = r[1];
            r.shift();
            r[0];
            return c(732) === t || i(937) === t ? Dt[c(485)](n, t, B) : i(748) === t ? Dt[i(979)](n, t, B) : void 0;
        }, ht[r(230)] = {
            $_CECB: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_CHHHj" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this[i(697)][n], a = C;
                return this[c(709)][i(851)](C[i(87)](B, c(15))), t && new Mn(t)[c(85)](function(n, t) {
                    var B = QBLnx.$_CM, i = [ "$_CHICF" ].concat(B);
                    i[1];
                    i.shift();
                    i[0];
                    a = a[B(87)](n, t);
                }), this[c(711)][i(851)](a), this;
            }
        }, D(ft[r(230)], et[r(230)] = {
            $_CFGg: 260,
            $_CGCc: 300,
            $_CFDK: 116,
            $_CEIn: 0,
            $_CGDw: 200,
            $_CGEO: function() {
                var n = QBLnx.$_CM, t = [ "$_CHIHu" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(69)], r = n(958) + i[n(679)] + B(912) + (B(635) === i[B(40)] ? B(915) : B(15)) + n(91) + i[B(931)] + B(902), c = i[n(698)];
                return c && c[B(944)] && (r = r[B(87)](B(989), c[B(944)])), G(i, B(141), i[n(40)], i[B(765)] || i[n(728)], r);
            },
            $_CAAp: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_CHJCT" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this[r(411)];
                this[r(69)];
                return c(r(933))[r(835)](n, t || null), this;
            },
            $_CCIk: function() {
                var n = QBLnx.$_CM, t = [ "$_CHJHi" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(69)];
                r[B(116)] = r[n(116)] || B(103);
                var c = i[n(411)], C = i[n(697)], a = parseInt(i[n(69)][n(64)]);
                return c(n(974))[B(851)](C[n(437)]), c(B(988))[B(851)](C[n(801)]), c(n(960))[B(851)](C[n(903)]),
                    c(n(864))[n(47)]({
                        href: B(904),
                        "aria-label": n(66),
                        role: n(964),
                        tabIndex: B(802)
                    }), B(622) === r[B(621)] || r[n(621)], r[B(801)] ? c(n(926))[B(47)]({
                    target: n(953),
                    href: r[B(801)]
                }) : c(n(926))[n(705)](), r[B(716)] ? (c(n(877))[n(851)](C[B(648)]), c(n(952))[n(47)]({
                    href: B(904),
                    "aria-label": n(66),
                    role: n(964),
                    tabIndex: n(802)
                }), c(n(993))[B(47)]({
                    "aria-label": n(43),
                    role: B(964),
                    tabIndex: B(802)
                }), c(B(956))[B(851)](C[B(632)]), a < 257 ? -1 != r[n(116)][n(188)]()[B(184)](n(975)) || B(185) === r[B(116)] ? c(n(954))[n(851)](n(942)) : c(n(954))[B(851)](n(470)) : c(n(954))[n(851)](C[B(862)]),
                    r[B(862)] ? c(n(928))[B(47)]({
                        target: B(953),
                        href: r[n(977)]
                    }) : c(B(928))[n(705)]()) : r[n(862)] ? c(B(994))[n(47)]({
                    target: n(953),
                    href: r[n(977)]
                }) : c(n(994))[n(705)](), r[n(997)] && c(B(916))[B(108)](), r[B(986)] && c(B(929))[n(108)](),
                Bn && (c(B(988))[B(108)](), c(n(877))[n(108)](), c(n(956))[n(108)]()), r[n(199)] && c(B(946))[B(47)]({
                    target: n(953),
                    href: r[B(199)]
                }), i[B(897)] = new ht(c, C), i[B(798)] = i[B(984)](), r[n(647)] && !isNaN(r[B(647)]) && i[B(935)](),
                    i[n(887)] = new Y(function() {
                        var n = QBLnx.$_CM, t = [ "$_CIACL" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        i[B(868)](i[n(631)] || i[B(891)]);
                    }), i[n(809)] = 1, i[n(770)](r[B(64)]), i;
            },
            $_CGFG: function() {
                var n = QBLnx.$_CM, t = [ "$_CIAHX" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIBCJ" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    return n[t(87)](/(-?[\d\.]+px)/g, function(n) {
                        var t = QBLnx.$_CM, B = [ "$_CIBHQ" ].concat(t), i = B[1];
                        B.shift();
                        B[0];
                        var r = n[i(139)](0, -2);
                        return o(r);
                    });
                }(n(927)), r = new Fn(n(527));
                r[B(25)] = n(908), r[n(909)](i), r[n(95)](new Fn(W));
            },
            $_GBV: function() {
                var n = QBLnx.$_CM, t = [ "$_CICCT" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(411)], c = i[n(69)];
                n(676) === c[B(621)] ? r(n(895))[n(203)](B(842), function() {
                    var n = QBLnx.$_CM, t = [ "$_CICHj" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    i[n(823)](!0);
                })[n(203)](n(843), function() {
                    var n = QBLnx.$_CM, t = [ "$_CIDCB" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    i[n(823)](!1);
                }) : B(622) !== c[B(621)] && B(690) !== c[n(621)] || (r(B(788))[n(203)](B(424), function() {
                    var n = QBLnx.$_CM, t = [ "$_CIDHT" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[B(914)]();
                }), r(n(965))[B(203)](n(424), function() {
                    var n = QBLnx.$_CM, t = [ "$_CIECh" ].concat(n);
                    t[1];
                    t.shift();
                    t[0];
                    i[n(914)]();
                })), c[B(716)] && (r(n(993))[B(203)](n(424), function() {
                    var n = QBLnx.$_CM, t = [ "$_CIEHV" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    n(622) === c[n(621)] || B(690) === c[n(621)] ? i[n(914)]() : i[n(617)][n(703)](Pn);
                }), r(n(952))[n(203)](n(424), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIFCb" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    i[r(476)][t(643)](Rn), n[r(938)]();
                })), r(B(875))[n(203)](n(967), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIFHh" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    n[t(938)](), i[t(911)](n, !0), i[r(945)]();
                }), r(B(821))[n(203)](B(967), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIGCh" ].concat(t), C = B[1];
                    B.shift();
                    B[0];
                    var a = i[t(67)][C(764)], _ = i[t(67)][C(726)], s = a + 60, o = _ + 65, $ = n[C(901)]() - n[t(38)][t(594)]()[t(585)], f = n[t(949)]() - n[C(38)][t(594)]()[t(509)];
                    try {
                        a < $ && $ < s && _ < f && f < o && (i[t(911)](n, !1), i[t(945)](), c[C(199)] && r(C(946))[t(529)]([ t(511), C(985) ]));
                    } catch (n) {}
                }), r(n(855))[n(203)](n(967), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIGHi" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    i[t(911)](n, !1), i[t(945)]();
                }), r(n(895))[n(203)](B(677), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIHCi" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    i[r(939)](n);
                })[n(203)](B(978), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIHHK" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    i[t(995)](n);
                }), an && r(B(895))[B(203)](n(906), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIICH" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    i[r(995)](n, !0);
                }), r(B(864))[n(203)](B(424), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIIHF" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    i[r(476)][t(643)](Rn), n[r(938)]();
                });
            },
            $_CGHA: function() {
                var t = QBLnx.$_CM, B = [ "$_CIJCE" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                r[t(971)] = new Fn(S), r[t(982)] = new Fn(n), r[t(971)][i(203)](t(978), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CIJHD" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[t(995)](n), r[t(971)][t(235)](i(978));
                }), r[i(982)][t(203)](i(978), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CJACd" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[i(995)](n), r[t(971)][t(235)](i(978));
                });
            },
            $_CId: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CJAHj" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this, c = r[t(69)];
                r[t(411)];
                if (r[i(972)] = Fn[i(411)](n), !r[i(972)]) {
                    return Q(b(i(959), r[i(490)]));
                }
                t(622) === c[t(621)] || i(690) === c[i(621)] ? r[i(630)][t(95)](new Fn(R)) : r[t(630)][t(95)](r[t(972)]),
                i(676) === c[t(621)] && (c[t(500)] ? r[t(910)]() : r[i(630)][t(932)]()), t(691) !== c[t(621)] && r[t(957)](),
                r[t(69)][t(992)] && r[i(919)](), r[t(923)] = e();
            },
            $_CFIy: function() {
                var n = QBLnx.$_CM, t = [ "$_CJBCa" ].concat(n), B = t[1];
                t.shift();
                t[0];
                function i() {
                    var t = QBLnx.$_Db()[15][19];
                    for (;t !== QBLnx.$_Db()[0][17]; ) {
                        switch (t) {
                            case QBLnx.$_Db()[0][19]:
                                var _ = c(n(922))[n(941)]();
                                t = QBLnx.$_Db()[3][18];
                                break;

                            case QBLnx.$_Db()[3][18]:
                                C === _ && 0 !== C || 5 < a ? r[B(957)]() : (a += 1, C = _, y(i, 100));
                                t = QBLnx.$_Db()[15][17];
                        }
                    }
                }
                var r = this, c = r[B(411)], C = c(B(922))[n(941)](), a = 0;
                y(i, 100);
            },
            $_CHCY: function() {
                var n = QBLnx.$_CM, t = [ "$_CJBHU" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(69)], r = this[n(411)];
                r(B(933))[n(941)]() < r(B(996))[B(941)]() && r(n(974))[n(557)](n(905));
                -1 < new Qn([ B(920), n(955), B(918), B(968) ])[n(524)](i[n(116)] && i[B(116)][n(55)](n(39))[0]) && (r(n(922))[B(80)]({
                    direction: B(963)
                }), r(n(974))[B(80)]({
                    textAlign: n(564)
                }), r(n(996))[n(80)]({
                    width: B(981)
                }), r(n(787))[B(557)](n(987)));
            },
            $_CHDI: function() {
                var n = QBLnx.$_CM, t = [ "$_CJCCW" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(411)], c = i[n(697)], C = i[n(476)];
                r(B(925))[B(47)]({
                    tabIndex: n(802)
                })[n(990)]()[B(80)]({
                    outline: n(568)
                }), r(n(969))[n(851)](c[n(734)]), r(n(993))[B(47)]({
                    tabIndex: n(802),
                    "aria-label": c[n(632)],
                    role: n(964)
                }), r(B(952))[n(47)]({
                    tabIndex: n(802),
                    "aria-label": c[n(648)],
                    role: B(964)
                }), r(n(926))[B(47)]({
                    tabIndex: B(802)
                }), r(n(980))[B(47)]({
                    tabIndex: B(99),
                    "aria-label": c[B(734)],
                    role: B(964)
                })[n(80)]({
                    display: n(948)
                })[n(990)](), r(B(980))[B(203)](n(586), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CJCHG" ].concat(t), r = B[1];
                    B.shift();
                    B[0];
                    13 === n[r(224)][t(950)] && (C[t(643)](nt), i[t(490)][t(505)]());
                }), r(B(980))[B(203)](n(424), function() {
                    var n = QBLnx.$_CM, t = [ "$_CJDCa" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    C[B(643)](nt), i[n(490)][B(505)]();
                });
            },
            $_CCAX: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CJDHJ" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                if (i(622) !== r[i(69)][i(621)] || t(690) === r[t(69)][t(621)]) {
                    return r;
                }
                if (r[i(983)] = Fn[i(411)](n), !r[t(983)]) {
                    return Q(b(t(921), r[t(490)]));
                }
                var c = r[i(983)][i(899)](!0);
                return c[t(900)](r[t(983)]), r[t(983)][i(705)](), c[i(203)](t(424), function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CJECz" ].concat(t), i = B[1];
                    B.shift();
                    B[0];
                    r[i(999)](), n[t(938)]();
                }), r;
            },
            $_BDCL: function() {
                var n = QBLnx.$_CM, t = [ "$_CJEHb" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                return B(622) !== i[B(69)][n(621)] && B(690) !== i[B(69)][n(621)] || i[n(999)](),
                    i;
            },
            $_BDBV: function() {
                var n = QBLnx.$_CM, t = [ "$_CJFCP" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                return n(622) !== i[B(69)][B(621)] && n(690) !== i[B(69)][n(621)] || i[n(914)](),
                    i;
            },
            $_CHGE: function() {
                var n = QBLnx.$_CM, t = [ "$_CJFHA" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this;
                B(690) === i[B(69)][B(621)] && i[B(712)](), i[B(630)][B(775)](), y(function() {
                    var n = QBLnx.$_CM, t = [ "$_CJGCf" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i[n(630)][B(893)](1);
                }, 10);
            },
            $_CGGA: function() {
                var n = QBLnx.$_CM, t = [ "$_CJGHF" ].concat(n);
                t[1];
                t.shift();
                t[0];
                var B = this;
                return B[n(630)][n(893)](0), new En(function(n) {
                    var t = QBLnx.$_CM, i = [ "$_CJHCJ" ].concat(t);
                    i[1];
                    i.shift();
                    i[0];
                    y(function() {
                        var t = QBLnx.$_CM, i = [ "$_CJHHS" ].concat(t), r = i[1];
                        i.shift();
                        i[0];
                        B[t(630)][r(705)](), B[t(617)][r(703)](Pn), n();
                    }, 0);
                });
            },
            $_CHHK: function() {
                var n = QBLnx.$_CM, t = [ "$_CJICH" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[B(697)];
                return (0, this[B(411)])(n(973))[n(851)](i[B(936)]), new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_CJIHk" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(n, 1e3);
                });
            },
            $_CDJX: function(n, t, B) {
                var i = QBLnx.$_CM, r = [ "$_CJJCo" ].concat(i), c = r[1];
                r.shift();
                r[0];
                var C = this, a = C[c(476)];
                if (a[c(485)]() === Yn) {
                    a[c(643)](qn), n[i(938)](), C[c(934)] = i(492) == n[i(25)];
                    var _ = C[i(411)](i(875))[i(594)](), s = C[i(411)](c(821))[c(594)]();
                    C[c(961)] = e();
                    var o, $, f = C[i(809)];
                    return C[c(962)] = n[i(901)]() / f, C[c(907)] = n[i(949)]() / f, $ = t ? (o = _[i(509)],
                        _[c(585)]) : (o = s[c(509)] + C[i(67)][c(726)], s[i(585)]), C[c(913)] = new An([ Math[c(129)]($ / f - C[c(962)]), Math[i(129)](o / f - C[c(907)]), 0 ])[c(976)]([ 0, 0, 0 ]),
                        C[i(631)] = C[i(891)], C[i(887)][c(854)](), C[i(951)] = {
                        x: 0,
                        y: 0
                    }, v(B) && B(), C;
                }
            },
            $_BJIf: function(n) {
                var t = QBLnx.$_CM, B = [ "$_CJJHu" ].concat(t), i = B[1];
                B.shift();
                B[0];
                var r = this;
                if (r[t(476)][i(485)]() === qn && (!r[i(934)] || t(402) == n[t(25)])) {
                    n[t(938)]();
                    var c = r[t(809)], C = n[i(901)]() / c - r[t(962)], a = r[i(907)] - n[t(949)]() / c;
                    r[i(631)] = C, r[t(913)][i(976)]([ Math[i(129)](C), Math[t(129)](a), e() - r[i(961)] ]),
                    r[t(951)] && (r[i(951)][i(223)] = C, r[i(951)][t(277)] = a), C >= r[t(1005)] && r[t(995)](n);
                }
            },
            $_CGIj: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_DAACe" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[B(490)], a = c[B(476)], _ = c[r(69)], s = c[r(411)];
                try {
                    if (a[B(485)]() !== qn) {
                        return;
                    }
                    if (c[B(934)] && B(491) != n[B(25)]) {
                        return;
                    }
                    y(function() {
                        var n = QBLnx.$_CM, t = [ "$_DAAHb" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        _[n(199)] && s(B(946))[n(47)]({
                            target: B(953),
                            href: _[B(199)]
                        });
                    }, 0), n[B(938)](), a[B(643)](B(790));
                    var o = c[r(809)], $ = t ? c[B(951)][r(223)] : n[B(901)]() / o - c[r(962)], f = t ? c[B(951)][B(277)] : c[B(907)] - n[r(949)]() / o;
                    c[r(871)] = e() - c[r(961)], c[B(913)][r(976)]([ Math[r(129)]($), Math[r(129)](f), c[r(871)] ]);
                    var D = parseInt($), h = c[r(913)][r(1059)](c[r(913)][B(1066)](), c[r(69)][B(1097)], c[r(69)][B(319)]);
                    C[r(1027)](D, h, c[r(871)]), c[r(887)][r(1086)]();
                } catch (n) {
                    C[B(23)](n);
                }
                return c;
            },
            $_CBAa: function() {
                var n = QBLnx.$_CM, t = [ "$_DABCk" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this, r = i[B(411)], c = i[B(69)], C = i[B(476)];
                r(B(856))[n(775)]()[n(893)](1), r(B(882))[n(893)](1)[B(775)](), r(n(810))[B(893)](1),
                    H(c, B(937), {
                        gt: c[B(104)],
                        challenge: c[n(182)],
                        lang: c[n(116)] || n(103),
                        type: c[B(25)]
                    })[B(146)](function(n) {
                        var t = QBLnx.$_CM, B = [ "$_DABHY" ].concat(t), a = B[1];
                        B.shift();
                        B[0];
                        if (n[a(10)] == Sn) {
                            return Q(F(n, i[t(490)], t(937)));
                        }
                        i[t(817)](), i[t(868)](i[t(891)]), c[t(654)](f(n)), c[t(199)] && r(t(946))[a(47)]({
                            target: a(953),
                            href: c[a(199)]
                        }), C[t(643)](Vn);
                    }, function() {
                        var n = QBLnx.$_CM, t = [ "$_DACCc" ].concat(n), B = t[1];
                        t.shift();
                        t[0];
                        return Q(b(B(1033), i[B(490)]));
                    });
            },
            $_CAJz: function() {
                var n = QBLnx.$_CM, t = [ "$_DACHw" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(411)];
                return this[n(69)][B(656)] || i(n(810))[n(893)](.8), this;
            },
            $_CAIy: function() {
                var n = QBLnx.$_CM, t = [ "$_DADCD" ].concat(n), B = t[1];
                t.shift();
                t[0];
                var i = this[n(411)];
                i(n(882))[B(893)](0), y(function() {
                    var n = QBLnx.$_CM, t = [ "$_DADHt" ].concat(n), B = t[1];
                    t.shift();
                    t[0];
                    i(B(882))[n(705)]();
                }, 200);
            },
            $_CFAB: function() {
                var n = QBLnx.$_CM, t = [ "$_DAECw" ].concat(n);
                t[1];
                t.shift();
                t[0];
                this[n(806)](Sn, !0);
            },
            $_CFBJ: function() {
                var n = QBLnx.$_CM, t = [ "$_DAEHo" ].concat(n), B = t[1];
                t.shift();
                t[0];
                return this[B(806)](zn), new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_DAFCA" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(n, 1500);
                });
            },
            $_CFCh: function() {
                var n = QBLnx.$_CM, t = [ "$_DAFHC" ].concat(n);
                t[1];
                t.shift();
                t[0];
                return this[n(806)](Xn), new En(function(n) {
                    var t = QBLnx.$_CM, B = [ "$_DAGCo" ].concat(t);
                    B[1];
                    B.shift();
                    B[0];
                    y(n, 1500);
                });
            },
            $_CEHh: function(n, t) {
                var B = QBLnx.$_CM, i = [ "$_DAGHq" ].concat(B), r = i[1];
                i.shift();
                i[0];
                var c = this, C = c[r(411)];
                if (n < (t ? -20 : c[B(891)]) ? n = c[B(891)] : n > c[B(1005)] && (n = c[r(1005)]),
                    t) {
                    var a = n / 20 + 1;
                    C(r(875))[r(80)]({
                        opacity: a
                    });
                }
                if (r(876) in S[r(284)][B(527)] || B(860) in S[B(284)][B(527)]) {
                    if (Cn || /EzvizStudio/[r(143)](nn[B(120)])) {
                        var _ = B(812) + n * c[B(809)] + B(1054);
                    } else {
                        _ = B(812) + n * c[B(809)] + B(1020);
                    }
                    C(B(875))[B(80)]({
                        transform: _,
                        webkitTransform: _
                    });
                } else {
                    C(B(875))[r(80)]({
                        left: n * c[r(809)] + r(16)
                    });
                }
                var s = .9 * C(r(875))[B(941)]();
                C(B(890)) && C(r(890))[B(80)]({
                    width: n * c[r(809)] + s + B(16),
                    opacity: 1
                }), B(83) != typeof c[r(69)][B(1090)] && 0 !== c[B(69)][r(1090)] && c[r(913)] && (n = c[r(913)][B(1065)](parseInt(n), c[B(69)][r(1097)], c[B(69)][r(1090)])),
                c[B(67)] && c[r(67)][r(939)](n);
            },
            $_BBCT: function() {
                var n = QBLnx.$_CM, t = [ "$_DAHCP" ].concat(n);
                t[1];
                t.shift();
                t[0];
                (0, this[n(411)])(n(895))[n(108)]();
            }
        }), D(st[B(230)], et[r(230)]), vn[r(440)](n, ot);
    });
}();


function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getW(trackList,secondReqC,secondReqS,gt,secondChallenge){
    let randomRepr = fourRandomStr();
    let second = new eggH()['encrypt'](randomRepr);
    var distance = slide_track[slide_track.length - 1][0]
    var passtime = slide_track[slide_track.length - 1][2]
    let s = {
        lang:'zh-cn',
        //滑动距离 + challenge 的值
        userresponse:  eggW(distance,secondChallenge),
        passtime: passtime,
        imgload:randomIntFromInterval(30,80) ,
        aa: eggG.$_BBEM(eggG.$_FDU(trackList),secondReqC,secondReqS),
        // ep: a[r(714)]()
        ep: {}
    }
    s['rp'] = md5(gt,secondChallenge["slice"](0, 32),passtime)
    let first = eggj.$_FEr(eggEncrypt.$_IEY(JSON.stringify(s),randomRepr));

    return first + second
}



