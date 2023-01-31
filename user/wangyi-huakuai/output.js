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
eggvm.config.json = false; // 是否格式化输出
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
!function () {
    // 创建pluginArray
    eggvm.toolsFunc.createPluginArray = function createPluginArray() {
        let pluginArray = {};
        pluginArray = eggvm.toolsFunc.createProxyObj(pluginArray, PluginArray, "pluginArray");
        eggvm.toolsFunc.setProtoArr.call(pluginArray, "length", 0);
        return pluginArray;
    }
    // 添加Plugin
    eggvm.toolsFunc.addPlugin = function addPlugin(plugin) {
        let pluginArray = eggvm.memory.globalVar.pluginArray;
        if (pluginArray === undefined) {
            pluginArray = eggvm.toolsFunc.createPluginArray();
        }
        let index = pluginArray.length;
        pluginArray[index] = plugin;
        Object.defineProperty(pluginArray, plugin.name, {
            value: plugin,
            writable: false,
            enumerable: false,
            configurable: true
        });
        eggvm.toolsFunc.setProtoArr.call(pluginArray, "length", index + 1);
        eggvm.memory.globalVar.pluginArray = pluginArray;
        return pluginArray;
    }
    // 创建MimeTypeArray对象
    eggvm.toolsFunc.createMimeTypeArray = function createMimeTypeArray() {
        let mimeTypeArray = {};
        mimeTypeArray = eggvm.toolsFunc.createProxyObj(mimeTypeArray, MimeTypeArray, "mimeTypeArray");
        eggvm.toolsFunc.setProtoArr.call(mimeTypeArray, "length", 0);
        return mimeTypeArray;
    }
    // 添加MimeType
    eggvm.toolsFunc.addMimeType = function addMimeType(mimeType) {
        let mimeTypeArray = eggvm.memory.globalVar.mimeTypeArray;
        if (mimeTypeArray === undefined) {
            mimeTypeArray = eggvm.toolsFunc.createMimeTypeArray();
        }
        let index = mimeTypeArray.length;
        let flag = true;
        for (let i = 0; i < index; i++) {
            if (mimeTypeArray[i].type === mimeType.type) {
                flag = false;
            }
        }
        if (flag) {
            mimeTypeArray[index] = mimeType;
            Object.defineProperty(mimeTypeArray, mimeType.type, {
                value: mimeType,
                writable: false,
                enumerable: false,
                configurable: true
            });
            eggvm.toolsFunc.setProtoArr.call(mimeTypeArray, "length", index + 1);
        }
        eggvm.memory.globalVar.mimeTypeArray = mimeTypeArray;
        return mimeTypeArray;
    }

    // 创建MimeType
    eggvm.toolsFunc.createMimeType = function createMimeType(mimeTypeJson, plugin) {
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
    eggvm.toolsFunc.createPlugin = function createPlugin(data) {
        let mimeTypes = data.mimeTypes;
        let plugin = {};
        plugin = eggvm.toolsFunc.createProxyObj(plugin, Plugin, "plugin");
        eggvm.toolsFunc.setProtoArr.call(plugin, "description", data.description);
        eggvm.toolsFunc.setProtoArr.call(plugin, "filename", data.filename);
        eggvm.toolsFunc.setProtoArr.call(plugin, "name", data.name);
        eggvm.toolsFunc.setProtoArr.call(plugin, "length", mimeTypes.length);
        for (let i = 0; i < mimeTypes.length; i++) {
            let mimeType = eggvm.toolsFunc.createMimeType(mimeTypes[i], plugin);
            plugin[i] = mimeType;
            Object.defineProperty(plugin, mimeTypes[i].type, {
                value: mimeType,
                writable: false,
                enumerable: false,
                configurable: true
            });
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
        urlJson[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) urlJson[o.q.name][$1] = $2;
        });
        delete urlJson["queryKey"];
        delete urlJson["userInfo"];
        delete urlJson["user"];
        delete urlJson["password"];
        delete urlJson["relative"];
        delete urlJson["directory"];
        delete urlJson["file"];
        urlJson["protocol"] += ":";
        urlJson["origin"] = urlJson["protocol"] + "//" + urlJson["host"];
        urlJson["search"] = urlJson["search"] && "?" + urlJson["search"];
        urlJson["hash"] = urlJson["hash"] && "#" + urlJson["hash"];
        return urlJson;
    }

    // 单标签字符串解析
    eggvm.toolsFunc.getTagJson = function getTagJson(tagStr) {
        let arrList = tagStr.match("<(.*?)>")[1].split(" ");
        let tagJson = {};
        tagJson["type"] = arrList[0];
        tagJson["prop"] = {};
        for (let i = 1; i < arrList.length; i++) {
            let item = arrList[i].split("=");
            let key = item[0];
            let value = item[1].replace(/["']/g, "");
            tagJson["prop"][key] = value;
        }
        return tagJson;
    }

    // 获取type类型的集合
    eggvm.toolsFunc.getCollection = function getCollection(type) {
        let collection = [];
        for (let i = 0; i < eggvm.memory.tag.length; i++) {
            let tag = eggvm.memory.tag[i];
            if (eggvm.toolsFunc.getType(tag) === type) {
                collection.push(tag);
            }
        }
        return collection;
    }

    // 获取原型对象上自身属性值
    eggvm.toolsFunc.getProtoArr = function getProtoArr(key) {
        return this[eggvm.memory.symbolData] && this[eggvm.memory.symbolData][key];
    }
    // 设置原型对象上自身属性值
    eggvm.toolsFunc.setProtoArr = function setProtoArr(key, value) {
        if (!(eggvm.memory.symbolData in this)) {
            Object.defineProperty(this, eggvm.memory.symbolData, {
                enumerable: false,
                configurable: false,
                writable: true,
                value: {}
            });
        }
        this[eggvm.memory.symbolData][key] = value;
    }

    // 获取一个自增的ID
    eggvm.toolsFunc.getID = function getID() {
        if (eggvm.memory.ID === undefined) {
            eggvm.memory.ID = 0;
        }
        eggvm.memory.ID += 1;
        return eggvm.memory.ID;
    }

    // 代理原型对象
    eggvm.toolsFunc.createProxyObj = function createProxyObj(obj, proto, name) {
        Object.setPrototypeOf(obj, proto.prototype);
        return eggvm.toolsFunc.proxy(obj, `${name}_ID(${eggvm.toolsFunc.getID()})`);
    }
    // hook 插件
    eggvm.toolsFunc.hook = function hook(func, funcInfo, isDebug = false, onEnter, onLeave, isExec = true) {
        // func ： 原函数，需要hook的函数
        // funcInfo: 是一个对象，objName，funcName属性
        // isDebug: 布尔类型, 是否进行调试，关键点定位，回溯调用栈
        // onEnter：函数， 原函数执行前执行的函数，改原函数入参，或者输出入参
        // onLeave： 函数，原函数执行完之后执行的函数，改原函数的返回值，或者输出原函数的返回值
        // isExec ： 布尔， 是否执行原函数，比如无限debuuger函数
        if (typeof func !== 'function') {
            return func;
        }
        if (funcInfo === undefined) {
            funcInfo = {};
            funcInfo.objName = "globalThis";
            funcInfo.funcName = func.name || '';
        }
        if (!onEnter) {
            onEnter = function (obj) {
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用，参数是${JSON.stringify(obj.args)}}`);
            }
        }
        if (!onLeave) {
            onLeave = function (obj) {
                console.log(`{hook|${funcInfo.objName}[${funcInfo.funcName}]正在调用，返回值是[${obj.result}]}`);
            }
        }
        // 替换的函数
        let hookFunc = function () {
            if (isDebug) {
                debugger;
            }
            let obj = {};
            obj.args = [];
            for (let i = 0; i < arguments.length; i++) {
                obj.args[i] = arguments[i];
            }
            // 原函数执行前
            onEnter.call(this, obj); // onEnter(obj);
            // 原函数正在执行
            let result;
            if (isExec) {
                result = func.apply(this, obj.args);
            }
            obj.result = result;
            // 原函数执行后
            onLeave.call(this, obj); // onLeave(obj);
            // 返回结果
            return obj.result;
        }
        // hook 后的函数进行native
        eggvm.toolsFunc.safeFunc(hookFunc, funcInfo.funcName);
        return hookFunc;
    }
    // hook 对象的属性，本质是替换属性描述符
    eggvm.toolsFunc.hookObj = function hookObj(obj, objName, propName, isDebug = false) {
        // obj :需要hook的对象
        // objName: hook对象的名字
        // propName： 需要hook的对象属性名
        // isDubug: 是否需要debugger
        let oldDescriptor = Object.getOwnPropertyDescriptor(obj, propName);
        let newDescriptor = {};
        if (!oldDescriptor.configurable) { // 如果是不可配置的，直接返回
            return;
        }
        // 必须有的属性描述
        newDescriptor.configurable = true;
        newDescriptor.enumerable = oldDescriptor.enumerable;
        if (oldDescriptor.hasOwnProperty("writable")) {
            newDescriptor.writable = oldDescriptor.writable;
        }
        if (oldDescriptor.hasOwnProperty("value")) {
            let value = oldDescriptor.value;
            if (typeof value !== "function") {
                return;
            }
            let funcInfo = {
                "objName": objName,
                "funcName": propName
            }
            newDescriptor.value = eggvm.toolsFunc.hook(value, funcInfo, isDebug);
        }
        if (oldDescriptor.hasOwnProperty("get")) {
            let get = oldDescriptor.get;
            let funcInfo = {
                "objName": objName,
                "funcName": `get ${propName}`
            }
            newDescriptor.get = eggvm.toolsFunc.hook(get, funcInfo, isDebug);
        }
        if (oldDescriptor.hasOwnProperty("set")) {
            let set = oldDescriptor.set;
            let funcInfo = {
                "objName": objName,
                "funcName": `set ${propName}`
            }
            newDescriptor.set = eggvm.toolsFunc.hook(set, funcInfo, isDebug);
        }
        Object.defineProperty(obj, propName, newDescriptor);
    }
    // hook 原型对象的所有属性
    eggvm.toolsFunc.hookProto = function hookProto(proto, isDebug) {
        // proto :函数原型
        // isDebug: 是否debugger
        let protoObj = proto.prototype;
        let name = proto.name;
        for (const prop in Object.getOwnPropertyDescriptors(protoObj)) {
            eggvm.toolsFunc.hookObj(protoObj, `${name}.prototype`, prop, isDebug);
        }
        console.log(`hook ${name}.prototype`);
    }
    // 获取对象类型
    eggvm.toolsFunc.getType = function getType(obj) {
        return Object.prototype.toString.call(obj);
    }

    // 过滤代理属性
    eggvm.toolsFunc.filterProxyProp = function filterProxyProp(prop) {
        for (let i = 0; i < eggvm.memory.filterProxyProp.length; i++) {
            if (eggvm.memory.filterProxyProp[i] === prop) {
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
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}], type:[${type.toString()}]}`);
                    }else if(typeof result === "symbol"){
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}] result:[${result.toString()}]}`);
                    }else{
                        console.log(`{apply|function:[${objName}], args:[${argumentsList}] result:[${result.toString()}]}`);
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
    eggvm.toolsFunc.dispatch = function dispatch(self, obj, objName, funcName, argList, defaultValue) {
        let name = `${objName}_${funcName}`; // EventTarget_addEventListener
        if (Object.getOwnPropertyDescriptor(obj, "constructor") !== undefined) {
            if (Object.getOwnPropertyDescriptor(self, "constructor") !== undefined) {
                // self 不是实例对象
                return eggvm.toolsFunc.throwError('TypeError', 'Illegal invocation');
            }
        }
        try {
            return eggvm.envFunc[name].apply(self, argList);
        } catch (e) {
            if (defaultValue === undefined) {
                console.log(`[${name}]正在执行，错误信息: ${e.message}`);
            }
            return defaultValue;
        }
    }
    // 定义对象属性defineProperty
    eggvm.toolsFunc.defineProperty = function defineProperty(obj, prop, oldDescriptor) {
        let newDescriptor = {};
        newDescriptor.configurable = eggvm.config.proxy || oldDescriptor.configurable;// 如果开启代理必须是true
        newDescriptor.enumerable = oldDescriptor.enumerable;
        if (oldDescriptor.hasOwnProperty("writable")) {
            newDescriptor.writable = eggvm.config.proxy || oldDescriptor.writable;// 如果开启代理必须是true
        }
        if (oldDescriptor.hasOwnProperty("value")) {
            let value = oldDescriptor.value;
            if (typeof value === "function") {
                eggvm.toolsFunc.safeFunc(value, prop);
            }
            newDescriptor.value = value;
        }
        if (oldDescriptor.hasOwnProperty("get")) {
            let get = oldDescriptor.get;
            if (typeof get === "function") {
                eggvm.toolsFunc.safeFunc(get, `get ${prop}`);
            }
            newDescriptor.get = get;
        }
        if (oldDescriptor.hasOwnProperty("set")) {
            let set = oldDescriptor.set;
            if (typeof set === "function") {
                eggvm.toolsFunc.safeFunc(set, `set ${prop}`);
            }
            newDescriptor.set = set;
        }
        Object.defineProperty(obj, prop, newDescriptor);
    }
    // 函数native化
    !function () {
        const $toString = Function.prototype.toString;
        const symbol = Symbol(); // 独一无二的属性
        const myToString = function () {
            return typeof this === 'function' && this[symbol] || $toString.call(this);
        }

        function set_native(func, key, value) {
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
    eggvm.toolsFunc.reNameObj = function reNameObj(obj, name) {
        Object.defineProperty(obj.prototype, Symbol.toStringTag, {
            configurable: true,
            enumerable: false,
            value: name,
            writable: false
        });
    }
    // 函数重命名
    eggvm.toolsFunc.reNameFunc = function reNameFunc(func, name) {
        Object.defineProperty(func, "name", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: name
        });
    }
    // 函数保护方法
    eggvm.toolsFunc.safeFunc = function safeFunc(func, name) {
        eggvm.toolsFunc.setNative(func, name);
        eggvm.toolsFunc.reNameFunc(func, name);
    }
    // 原型保护方法
    eggvm.toolsFunc.safeProto = function safeProto(obj, name) {
        eggvm.toolsFunc.setNative(obj, name);
        eggvm.toolsFunc.reNameObj(obj, name);
    }
    // 抛错函数
    eggvm.toolsFunc.throwError = function throwError(name, message) {
        let e = new Error();
        e.name = name;
        e.message = message;
        e.stack = `${name}: ${message}\n    at snippet://`;
        throw e;
    }
    // 去JSON重复引用
    eggvm.toolsFunc.decycle = function decycle(object, replacer) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

        var objects = new WeakMap();     // object to path mappings

        return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

            var old_path;   // The path of an earlier occurance of value
            var nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

            if (replacer !== undefined) {
                value = replacer(value);
            }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

            if (
                typeof value === "object"
                && value !== null
                && !(value instanceof Boolean)
                && !(value instanceof Date)
                && !(value instanceof Number)
                && !(value instanceof RegExp)
                && !(value instanceof String)
            ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {$ref: old_path};
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    Object.keys(value).forEach(function (name) {
                        nu[name] = derez(
                            value[name],
                            path + "[" + JSON.stringify(name) + "]"
                        );
                    });
                }
                return nu;
            }
            return value;
        }(object, "$"));
    };
    // JSON恢复重复引用
    eggvm.toolsFunc.retrocycle = function retrocycle($) {
        "use strict";

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function (element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function (name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        }($));
        return $;
    };
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
    eggvm.envFunc.Document_documentElement_get = function Document_documentElement_get(){
        let html = document.createElement("html");
        let head = document.createElement("head");
        let body = document.createElement("body");
        let collection = [];
        collection.push(head);
        collection.push(body);
        collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
        eggvm.toolsFunc.setProtoArr.call(html, "children", collection);
        return html
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
    eggvm.envFunc.HTMLIFrameElement_contentWindow_get = function HTMLIFrameElement_contentWindow_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "contentWindow");
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
    eggvm.envFunc.HTMLIFrameElement_src_set = function HTMLIFrameElement_src_set(){
        let value = arguments[0];
        return eggvm.toolsFunc.setProtoArr.call(this, "src", value);
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
            case "iframe":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLIFrameElement,`Document_createElement_${tagName}`);
                eggvm.memory.tag.push(tag);
                break;
            case "html":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLHtmlElement,`Document_createElement_${tagName}`);
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

// Performance对象
Performance = function Performance(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(Performance, "Performance");
Object.setPrototypeOf(Performance.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(Performance.prototype, "timeOrigin", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "timeOrigin_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Performance.prototype, "onresourcetimingbufferfull", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "onresourcetimingbufferfull_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "onresourcetimingbufferfull_set", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "clearMarks", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "clearMarks", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "clearMeasures", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "clearMeasures", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "clearResourceTimings", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "clearResourceTimings", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "getEntries", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "getEntries", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "getEntriesByName", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "getEntriesByName", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "getEntriesByType", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "getEntriesByType", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "mark", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "mark", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "measure", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "measure", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "now", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "now", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "setResourceTimingBufferSize", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "setResourceTimingBufferSize", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "toJSON", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "toJSON", arguments)}});
eggvm.toolsFunc.defineProperty(Performance.prototype, "timing", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "timing_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Performance.prototype, "navigation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "navigation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Performance.prototype, "memory", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "memory_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Performance.prototype, "eventCounts", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Performance.prototype, "Performance", "eventCounts_get", arguments)}, set:undefined});
// performance
performance = {}
Object.setPrototypeOf(performance, Performance.prototype);
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

// HTMLHtmlElement对象
HTMLHtmlElement = function HTMLHtmlElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLHtmlElement, "HTMLHtmlElement");
Object.setPrototypeOf(HTMLHtmlElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLHtmlElement.prototype, "version", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLHtmlElement.prototype, "HTMLHtmlElement", "version_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLHtmlElement.prototype, "HTMLHtmlElement", "version_set", arguments)}});

// HTMLIFrameElement对象
HTMLIFrameElement = function HTMLIFrameElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLIFrameElement, "HTMLIFrameElement");
Object.setPrototypeOf(HTMLIFrameElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "src", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "src_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "src_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "srcdoc", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "srcdoc_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "srcdoc_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "name_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "name_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "sandbox", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "sandbox_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "sandbox_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "allowFullscreen", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allowFullscreen_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allowFullscreen_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "width", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "width_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "width_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "height", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "height_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "height_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "contentDocument", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "contentDocument_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "contentWindow_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "referrerPolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "referrerPolicy_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "referrerPolicy_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "csp", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "csp_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "csp_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "allow", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allow_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allow_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "featurePolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "featurePolicy_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "align", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "align_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "align_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "scrolling", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "scrolling_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "scrolling_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "frameBorder", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "frameBorder_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "frameBorder_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "longDesc", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "longDesc_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "longDesc_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "marginHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "marginHeight_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "marginHeight_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "marginWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "marginWidth_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "marginWidth_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "getSVGDocument", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "getSVGDocument", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "loading", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "loading_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "loading_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLIFrameElement.prototype, "allowPaymentRequest", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allowPaymentRequest_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLIFrameElement.prototype, "HTMLIFrameElement", "allowPaymentRequest_set", arguments)}});

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
function N(a, b, c) {
    var e = a.productNumber
        , d = a.merged
        , f = a.pn || e;
    if (!f)
        throw Error("[NEWatchman] required product number");
    e = location.protocol.replace(":", "");
    a = v(v({
        onload: b,
        onerror: c
    }, a), {
        protocol: e,
        auto: !0,
        onload: r,
        onerror: r,
        timeout: 6E3,
        pn: f
    });
    "http" !== a.protocol && "https" !== a.protocol && (a.protocol = "https");
    if (!d)
        return z(a);
    var g = window.initWatchman.__instances__;
    if (g[f])
        g[f].callback.push(a.onload),
        g[f].instance && (g[f].callback.forEach(function(a) {
            return a(g[f].instance)
        }),
            g[f].callback.length = 0);
    else
        return g[f] = {
            instance: null,
            callback: [a.onload]
        },
            z(a)
}
window.initWatchman || (window.initWatchman = window.initNEWatchman = N,
window.initWatchman.version = 7,
window.initWatchman.__instances__ = {},
window.initWatchman.__supportCaptcha__ = !0)
// 需要代理的对象
// window = new Proxy(window, {});
localStorage = eggvm.toolsFunc.proxy(localStorage, "localStorage");
sessionStorage = eggvm.toolsFunc.proxy(sessionStorage, "sessionStorage");
location = eggvm.toolsFunc.proxy(location, "location");
document = eggvm.toolsFunc.proxy(document, "document");
window = eggvm.toolsFunc.proxy(window, "window");
(function() {
        function ba() {
            var g = "MPjtU7rDmCRQIec9".split("");
            this.G = function(c) {
                if (null == c || void 0 == c)
                    return c;
                if (0 != c.length % 2)
                    throw Error("1100");
                for (var b = [], a = 0; a < c.length; a++) {
                    0 == a % 2 && b.push("%");
                    for (var p = g, h = 0; h < p.length; h++)
                        if (c.charAt(a) == p[h]) {
                            b.push(h.toString(16));
                            break
                        }
                }
                return decodeURIComponent(b.join(""))
            }
        }
        var p = (new ba).G
            , n = (new ba).G
            , k = (new ba).G
            , h = (new ba).G
            , g = (new ba).G;
        (function() {
                var x = [p("DUr7DmDUUjrPDtr7rIrCrcr7"), n("jttMtrtC"), k("7979"), g("rer9Drr7"), n("r9DjrCr7rcDUrPDUrCr9rc"), g("rer9DUrCr9rc"), p("DMrmrPrcDUr9rerRDt"), k("7979Dtr7rIr7rcrCD7re79D7rcDDDjrPDMDMr7rU"), g("rerPDUrtrm"), n("rtrmrPDjrDrCrcrD"), g("D7rcr7DtrtrPDMr7"), p("Djr7DtDMr9rcDtr77tDUrPDjDU"), h("UIU77P77UPUI"), n("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), k("UUrPDUr7"), h("rUr7rtr9rUr7777jUCUtr9reDMr9rcr7rcDU"), n("rPDtDCrcrt"), k("DMr7Djrrr9DjrerPrcrtr7"), k("rjr9r9rIr7rPrc"), n("rCrcrIrCrcr7"), g("Dtr7DjrCrr"), h("7rU7UcUUU97j"), g("UtUP7U79UtUPUc7rUP7t"), p("Djr7rUD7rtDUrCr9rc"), n("r7rerCDU"), n("rDr7DUUtr9rcDUr7DmDU"), g("D7rcrCrrr9Djretjrr"), p("DDr7rjrDrIjMrPrIDMrmrPjMrjrCDUDttR")]
                    , c = [n(""), k("DMrPDjr7rcDU"), k("DtDUrPrtrQ"), k("DMrID7rDrCrcDt"), k("rDr7DUUCDUr7re"), p("rDr7DUUcrUUCrcrrr9"), g("rCU97t"), g("UerCrtDjr9Dtr9rrDUjMUCrcDUr7Djrcr7DUjMU7DmDMrIr9Djr7Dj"), k("rer9D7Dtr7D7DM"), h("rDr7DU7tD7DMDMr9DjDUr7rUU7DmDUr7rcDtrCr9rcDt"), g("tUtMrjt7tCrjtPtM"), h("79rjrPDUDUr7DjDC"), g("rPDMDMr7rcrUUtrmrCrIrU"), h("r7Drr7rcr9rUrU"), k("DDr7rjrDrIjMrerPDmjMDrr7DjDUr7DmjMD7rcrCrrr9DjrejMDrr7rtDUr9DjDttR"), p("jj"), g("rCrcrcr7Dj7Ur7DmDU"), p("jU"), g("j7"), p("jr"), p("rPrUDtrjr9Dm"), h("jD"), k("jm"), k("jC"), g("DjrDrjjmtjt7t7jItjt7t7jItMjC"), k("rDr7DU7trmrPrUr7Dj7MDjr7rtrCDtrCr9rcUrr9DjrerPDU"), g("DUr7DmDUUtr9rcDUr7rcDU"), n("jQ"), k("jI"), p("rCU9Dt"), n("DDrCrcrUDrrPrcr7"), p("Drr7DjDtrCr9rc"), h("rtrIrCrtrQ"), k("jc"), g("79rjrID7Dj"), g("j9"), p("tPtmDMDUjMUPDjrCrPrI"), g("tM"), g("tP"), p("tj"), k("rDr7DUUtrmrPrcrcr7rIUUrPDUrP"), k("tt"), h("rDr7DUUtr9rcDUr7DmDUUPDUDUDjrCrjD7DUr7Dt"), k("tU"), h("79rrr9rtD7Dt"), h("DtDUr9DM"), n("t7"), h("rIr7rrDU"), h("tr"), n("tD"), g("rUr9rerPrCrc"), k("tm"), h("tC"), n("tR"), k("tQ"), h("te"), h("rer9D7Dtr7rUr9DDrc"), h("r9rjrRr7rtDU"), p("t9"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), n("7979rrDmrUDjrCDrr7Dj79D7rcDDDjrPDMDMr7rU"), n("UP"), k("Uj"), k("rcDtDUr9r9rIjcrcr7DUr7rPDtr7jcrtr9rej9rCrcrrr9jcrRDt"), h("UeUP7m797rU77j7UU77m79UP7U7U7jUCUj7t"), g("Ut"), h("UU"), n("U7"), n("Ur"), p("UD"), g("Um"), p("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), n("UC"), k("rjrID7Dj"), h("UR"), n("UQ"), p("rPDMDMUerCrcr9Dj7rr7DjDtrCr9rc"), h("UI"), n("Ue"), p("Uc"), g("U9"), g("7M"), p("7P"), g("7j"), h("UtDDrejMrrrRr9DjrUrjrPrcrQjMrDrIDCDMrmDtjMDrr7DmDUjMDPD7rCDRjIjM9MC9Cmm79MC9CmR79MC9CPQr9MC9Cmmt"), k("7t"), h("Dtr7rIr7rcrCD7re"), g("7U"), h("77"), n("rUrcDt79rCDtDM"), n("7r"), k("7D"), p("7m"), n("7C"), n("UIU97D79UCUc7U"), g("7R"), n("7Q"), n("rrr7DUrtrm7tDUrPDjDU"), p("rDr7DUU7rIr7rer7rcDUDtUjDC7UrPrDUcrPrer7"), n("7e"), g("rtr9rcrcr7rtDU"), p("7c"), k("rtrj"), p("rP"), g("UtU9UIU97j79Uj77UrUrU77j79UjUC7U"), h("rj"), p("7979DDr7rjrUDjrCDrr7Dj79DtrtDjrCDMDU79rrrc"), n("rt"), g("Djrer9rtDmjc7jr7rPrI7MrIrPDCr7DjjMUDtjjMUtr9rcDUDjr9rIjctP"), h("rU"), n("7trtDjrCDMDUrCrcrDjcUUrCrtDUrCr9rcrPDjDC"), g("r7"), h("rjr7rDrCrc7MrPDUrm"), p("rtr9D7rtrmrRDt"), k("rr"), p("rD"), h("rm"), k("tPtMtPtM"), h("rC"), n("rR"), h("rQ"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), p("rI"), h("re"), g("DDr7rjrDrIjMDrr7DjDtrCr9rctR"), n("rc"), h("r9"), p("DM"), g("rUr9Ucr9DU7UDjrPrtrQ"), n("DP"), h("rtrmrPDjrDrCrcrDDUrCrer7rtrmrPrcrDr7"), k("Dtr7DU7UrCrer7r9D7DU"), h("Dj"), k("tPtMtMt7"), g("rDr7DU7UrCrer7DRr9rcr7U9rrrrDtr7DU"), h("rtrmrPrcrDr7rU7Ur9D7rtrmr7Dt"), n("Dt"), h("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), p("DU"), k("tPtMtMtt"), g("D7"), g("Dr"), k("tPtMtMtP"), h("DD"), h("Dm"), h("7UrmrCDtjMrjDjr9DDDtr7DjjDDtjMrCreDMrIr7rer7rcDUrPDUrCr9rcjMr9rrjMU9rjrRr7rtDUjcrtDjr7rPDUr7jMrCDtjMrPjMDtrmrCrejMrPrcrUjMrUr9r7DtrcjDDUjMDtD7DMDMr9DjDUjMjDrcD7rIrIjDjMrPDtjMDUrmr7jMrrrCDjDtDUjMrPDjrDD7rer7rcDUjc"), p("rUDjrPDDUPDjDjrPDCDt"), h("DC"), n("DUr97tDUDjrCrcrD"), n("DR"), k("Dc"), k("tPtMtMtC"), k("rrr9rcDU"), k("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), h("DtD7rrrrrCDmr7Dt"), n("7MU97t7U"), p("7trmr7rIrIjc77UCUmr7rIDMr7Dj"), h("Dtr7DU7jr7DPD7r7DtDUUmr7rPrUr7Dj"), h("DUr9UUrPDUrP777jUI"), h("7trPrrrPDjrC"), p("7Ur9D7rtrmU7Drr7rcDU"), g("rIrPrcrDD7rPrDr7"), g("rUr9DDrc"), g("rCrcDtr7DjDUUjr7rrr9Djr7"), k("rUrCDr"), h("rPrtrtr7rIr7DjrPDUrCr9rc"), n("rPrtrtr7rIr7DjrPDUrCr9rcUCrcrtrID7rUrCrcrDUDDjrPDrrCDUDC"), g("UCrcDUr7Djrcr7DUjMU7DmDMrIr9Djr7Dj"), k("UeUP7m79Ut77UjU779UeUP7M797UU77m7U777jU7797tUC7RU7"), g("DUr7DmDUj9rRrPDrrPDtrtDjrCDMDU"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), n("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), k("DDr7rjrUDjrCDrr7Dj"), h("UeU97R79U77m7U79DUr7DmDUD7Djr779rrrCrIDUr7Dj79rPrcrCDtr9DUDjr9DMrCrt"), k("7DU7UjUDUI79rUr7rjD7rD79Djr7rcrUr7Djr7Dj79rCrcrrr9"), n("rtrmrPDjrDrCrcrDrtrmrPrcrDr7"), g("DDr7rjrDrIjMDtrmrPrUrCrcrDjMrIrPrcrDD7rPrDr7jMDrr7DjDtrCr9rctR"), p("Djr7Dt"), n("7jr7rPrI7MrIrPDCr7Dj"), p("rtrmDjr9rer7"), k("7jr7rDU7DmDM"), g("rtrmrPDjrDrCrcrD7UrCrer7"), h("rtDjr7rPDUr7U7rIr7rer7rcDU"), n("DMDjr9rUD7rtDUUcD7rerjr7Dj"), g("DMrPDjr7rcDUUcr9rUr7"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), p("DDr7rjrDrIjMrerPDmjMDrrPDjDCrCrcrDjMDrr7rtDUr9DjDttR"), g("rtrPrcDrrPDtjMDDrCrcrUrCrcrDtR"), g("DjrDrjjmtjt7t7jItMjItjt7t7jC"), k("Utr9rcDUr7rcDUjeDUDCDMr7"), g("UUU77M7UUm797UU77t7U"), h("r7DmDUr7DjrcrPrI"), g("r7DrrPrI"), g("D7rcrQrcr9DDrcjMr7DjDjr9Dj"), p("UIrCrcD7Dm"), p("rUrCDtrtrmrPDjrDrCrcrDDUrCrer7rtrmrPrcrDr7"), p("79DtrtDjr9rIrI"), n("7PD7rCrtrQ7UrCrer7Utrmr7rtrQU9rjrRr7rtDUjc7PD7rCrtrQ7UrCrer7Utrmr7rtrQjctP"), g("7jr7DPD7r7DtDUjMDUrCrer7rUjMr9D7DU"), k("Djr7rer9Drr7UCDUr7re"), n("rPDUDUrPrtrm7trmrPrUr7Dj"), h("DDr7rjrDrIjMDjr7rcrUr7Djr7DjtR"), g("DtDUrPDjDU7jr7rcrUr7DjrCrcrD"), n("rDr7DU7UrCrer7"), n("rtrPrIrI7tr7rIr7rcrCD7re"), p("Djr7DtDMr9rcDtr77Ur7DmDU"), k("DjrPrcrDr7UerCrc"), k("rCrcrCDU7DrPDUrtrmrerPrc"), n("Djr7DPD7r7DtDUjMrPDMrCjMr7DjDjr9Dj"), h("tPjctMtP"), g("DDr7rjrDrIjMrUr7DMDUrmjMrjrCDUDttR"), p("rcr9rUr7rRDt"), g("DDr7rjrDrIjMrerPDmjMrtD7rjr7jMrerPDMjMDUr7DmDUD7Djr7jMDtrCDRr7tR"), k("DUrCDUrIr7"), k("j9Drttj9rU"), g("7979DDrerRDtr9rcDM79"), g("rUr7DrrCrtr77MrCDmr7rI7jrPDUrCr9"), g("DMr9rCrcDUr7DjD7DM"), k("DjrPrcrUr9re"), k("Dtr7DUUPDUDUDjrCrjD7DUr7"), p("79Dtr7rIr7rcrCD7re"), g("rer7rer9DjDC7tDUr9DjrPrDr7"), k("rrDM79"), g("rPrIDMrmrP"), p("DDr7rjrDrIjMDrr7rcrUr9DjtR"), k("7979DDr7rjrUDjrCDrr7Dj79r7DrrPrID7rPDUr7"), k("reD7rIDUrCDMrIDC"), p("rPDUDUDjrCrjD7DUr7jMDrr7rttjjMrPDUDUDj7rr7DjDUr7DmDrrPDjDCrCrcrDjMDrr7rttjjMDrrPDjDCrCrc7Ur7DmUtr9r9DjrUrCrcrPDUr7D7rcrCrrr9DjrejMDrr7rttjjMD7rcrCrrr9DjreU9rrrrDtr7DUDrr9rCrUjMrerPrCrcjmjCDQDrrPDjDCrCrc7Ur7DmUtr9r9DjrUrCrcrPDUr7terPDUDUDj7rr7DjDUr7DmjQD7rcrCrrr9DjreU9rrrrDtr7DUrDrI797Mr9DtrCDUrCr9rcteDrr7rttUjmrPDUDUDj7rr7DjDUr7DmjItMjItPjCDe"), h("j7rt"), h("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), g("DMDjr7rtrCDtrCr9rcjMrer7rUrCD7reDMjMrrrIr9rPDUDrrPDjDCrCrcrDjMDrr7rttjjMDrrPDjDCrCrc7Ur7DmUtr9r9DjrUrCrcrPDUr7Drr9rCrUjMrerPrCrcjmjCjMDQrDrI79UrDjrPrDUtr9rIr9DjteDrr7rttUjmDrrPDjDCrCrc7Ur7DmUtr9r9DjrUrCrcrPDUr7jItMjItPjCDe"), g("jDjI"), k("DDrCrcrUr9DDDtjMDMrmr9rcr7"), h("rPDMDMUcrPrer7"), p("rtDMD7UtrIrPDtDt"), k("Dtr7DUUtD7DtDUr9re7UDjrPrtrQUCrU"), g("DMrPDjDtr7"), k("rCDM79rCDtDM"), g("tDjIrUjItUjItrjIt7jItDjIttjItr"), p("rQr7DCrUr9DDrc"), p("r9rcrIr9rPrU"), p("Djr7rer9Drr7U7Drr7rcDUUIrCDtDUr7rcr7Dj"), n("rrr9Djre"), h("UeDtDmrerItjjcUUU9UeUUr9rtD7rer7rcDU"), p("j9DUr9r9rIjcrerCrcjcrRDt"), p("tjjctDjct779r7tjtmtCtPtMtmtU"), k("DDr7rjrQrCDUU9rrrrrIrCrcr7UPD7rUrCr9Utr9rcDUr7DmDU"), g("tQr7DmDMrCDjr7Dtte7UD7r7jIjMtPtCjMURrPrcjMtjtMtttmjMtMtttRtPtUtRtMtDjMUDUe7UtQDMrPDUrmtej9tQ"), g("DDr7rjrDrIjMrPrcDUrCrPrIrCrPDtrCrcrDtR"), p("rIr7Drr7rIrtrmrPrcrDr7"), p("DDr7rjrDrIjMD7rcrerPDtrQr7rUjMDrr7rcrUr9DjtR"), k("rPrUrUU7Drr7rcDUUIrCDtDUr7rcr7Dj"), k("UmUC"), p("U9rjrRr7rtDUjcrQr7DCDtjMrtrPrIrIr7rUjMr9rcjMrcr9rcjer9rjrRr7rtDU"), h("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), n("tPtPDMDUjMUPDjrCrPrI")]
                    , b = [g("rtrIr9Dtr77MrPDUrm"), h("Djr7rIr7rPDtr7"), p("7Dr7rjUDUI7jr7rcrUr7DjrCrcrDUtr9rcDUr7DmDU"), h("rrr9rtD7Dt"), k("rCDMr9rU"), h("79r9DjrCr7rcDUrPDUrCr9rc"), h("777MUUUP7UU779Ur77UcUt797UUCUeUCUcUD"), n("rcD7rerjr7Dj"), h("rcrPDrrCrDrPDUrCr9rc"), k("rPrIDMrmrPrjr7DUrCrt"), n("reDtDMr9rCrcDUr7DjD7DM"), h("79rer9DUrCr9rc"), h("rDr7DUU9DDrc7MDjr9DMr7DjDUDCUUr7DtrtDjrCDMDUr9Dj"), p("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), g("7979DDr7rjrUDjrCDrr7Dj79D7rcDDDjrPDMDMr7rU"), g("r7tjtmtCtPtMtmtU"), n("rPDUDUDj7rr7DjDUr7Dm"), p("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), n("rtr9r9rQrCr7"), n("j7tjtj"), p("jCjc"), k("DDr7rjrDrIjMrerPDmjMDjr7rcrUr7DjjMrjD7rrrrr7DjjMDtrCDRr7tR"), k("DMrCrQr7"), g("rCDM"), p("rUrcDt"), h("j7tjtr"), n("DtrtDjrCDMDU"), n("UerPrt"), n("DjrDrjjmtMjItjt7t7jItjt7t7jC"), h("rUDjrCDrr7Dj"), p("UUU77M7UUm79UjUC7U7t"), n("rrr9rcDU7trCDRr7"), h("rrrCrIrI7tDUDCrIr7"), h("7MUUUrjc7MrUrrUtDUDjrI"), g("rCrcDUr7DjDrrPrI"), p("UPUI7MUmUP79UjUC7U7t"), n("DtDUrPDUD7Dt"), n("UCrcDUr7DjDrrPrI"), p("rtrmrPDjDtr7DU"), p("DDr7rjrDrIjMrerPDmjMDrr7DjDUr7DmjMrPDUDUDjrCrjDttR"), h("DDr7rjrDrIjMDjr7rUjMrjrCDUDttR"), h("UerPDm"), n("7DU7UjUQUC7U79U77m7U79DUr7DmDUD7Djr779rrrCrIDUr7Dj79rPrcrCDtr9DUDjr9DMrCrt"), g("UeUP7m79Ur7jUPUDUeU7Uc7U7977UcUCUrU97jUe797rU7Ut7UU97j7t"), g("rUr7DrrCrtr7rer9DUrCr9rc"), k("Dtr7rcrUjMrUr7DrrCrtr7jMrUrPDUrPjMrrrPrCrIr7rU"), g("777MUUUP7UU779U97M7UUCU9Uc7t"), k("rerPrt"), k("7jr7rPrI7MrIrPDCr7Djjc7jr7rPrI7MrIrPDCr7DjjmDUrejCjMUPrtDUrCDrr77mjMUtr9rcDUDjr9rIjMjmtttjjerjrCDUjC"), h("DmDmDmDmDmDmDmDmDmDmDmDmtUDmDmDmDCDmDmDmDmDmDmDmDmDmDmDmDmDmDmDm"), g("DUr9DM"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), h("UeUP7m797UU77m7U777jU7797tUC7RU7"), p("UPrtDjr97MUUUrjc7MUUUr"), n("UeUP7m797rUCU77D7MU97j7U79UUUCUe7t"), p("jMDUrmrCDtjMrCDtjMrcD7rIrIjMr9DjjMrcr9DUjMrUr7rrrCrcr7rU"), k("UeUP7m797rU77j7UU77m7977UcUCUrU97jUe797rU7Ut7UU97j7t"), k("797tr7rIr7rcrCD7re79UCUUU7797jr7rtr9DjrUr7Dj"), p("rRrPDrrPjcrIrPrcrDjc7tDCDtDUr7rejcr7DmrCDU"), g("rerPDm"), p("DUr9D7rtrmDtDUrPDjDU"), g("rmrPDjrUDDrPDjr7Utr9rcrtD7DjDjr7rcrtDC"), g("rQrcr7r7"), p("rPDrrPrCrI7DrCrUDUrm"), g("rUr9rtD7rer7rcDUUer9rUr7"), k("jIjM"), k("UeUP7m797UU77m7U777jU779UeUP7m79UPUcUC7tU97U7jU97M7C79U77m7U"), p("Djrer9rtDmjc7jr7rPrI7MrIrPDCr7DjjMUDtjjMUtr9rcDUDjr9rI"), k("rDr7DU7Ur9rQr7rc"), h("rtr9reDMrIr7DUr7"), g("rPDrrPrCrIUmr7rCrDrmDU"), g("79DMrmrPrcDUr9re"), k("rPD7DUr9"), h("r9DMr7DjrP"), h("UP7j7jUP7C"), g("DDr7rjrDrI"), h("7jU7UU79UjUC7U7t"), k("DMr9rCrcDUr7DjrUr9DDrc"), k("DMDjr7rtrCDtrCr9rc"), g("DtrtDjr7r7rc"), k("cmQrm7crCDQrcUQRmr"), h("rjr9rUDC"), g("7U7jUCUPUcUDUIU7797t7U7jUC7M"), p("UeUP7m797jU7UcUUU77jUj77UrUrU77j797tUC7RU7"), p("rtrIrCr7rcDU7DrCrUDUrm"), h("r9rcDUr9D7rtrmDtDUrPDjDU"), h("rrD7rcrtDUrCr9rc"), g("rtr9rcDUr7DmDUjcrmrPDtrmUtr9rUr7"), g("Djr7rPrUDC7tDUrPDUr7"), p("rererererererererererIrIrC"), k("r9rcrtr9reDMrIr7DUr7"), p("7rU77j7UU77m797tUmUPUUU77j"), p("jjDUrmrCDtjjjMrCDtjMrcD7rIrIjMr9DjjMrcr9DUjMrUr7rrrCrcr7rU"), p("rjDjr9DDDtr7DjUIrPrcrDD7rPrDr7"), n("rIr7Drr7rI"), k("777UUrjetm"), k("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), p("7979DtD7DMDMr9DjDUUtrPDMDUrtrmrP7979"), p("UPrcrUDjr9rCrU"), k("rCrcrcr7Dj7DrCrUDUrm"), p("tjtMtM"), h("jMjejM"), k("UrrPrCrIr7rUjMDUr9jMrIr9rPrUjM"), n("777MUUUP7UU7797UUCUeU779U9UrUr7tU77U"), p("DMr9DtrCDUrCr9rc"), n("Dtr7rcrUjMrUr7DrrCrtr7rUrPDUrPjMrrrPrCrIr7rUtRjM"), p("rtrPrcrcr9DUjMrDr9DUjMDrrPrID7r7"), g("rcr9"), n("7Qr9rjrRr7rtDUjMUPDjDjrPDC7e"), p("DDr7rjrDrIjMrerPDmjMDrrCr7DDDMr9DjDUjMrUrCreDttR"), h("7DrCrcrUr9DDDt"), h("UjUI77U779UjUC7U7t"), p("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), k("rmr7rPrU"), k("Djr7rtDU"), n("rmrPDtU9DDrc7MDjr9DMr7DjDUDC"), k("Djr7rUD7rtr7jMrtrPrIrIr7rUjMr9rcjMrcD7rIrIjMr9DjjMD7rcrUr7rrrCrcr7rU"), n("UPUIUCUP7tU7UU797MU9UCUc7U797tUC7RU7797jUPUcUDU7"), k("UPrUr9rUrjjc7tDUDjr7rPre"), h("DDr7rjrDrIjMrDDjr7r7rcjMrjrCDUDttR"), h("UjrPDUDUr7DjDCUerPrcrPrDr7Dj"), g("rtrPrIrI7MrmrPrcDUr9re"), k("rrrIr9r9Dj"), g("7979rUDjrCDrr7Dj79D7rcDDDjrPDMDMr7rU"), h("rjr7DUrP"), g("r9rc"), g("7jU7UcUUU77jU77j"), n("DtDjrt"), g("UUr7DrrPrI7r7j7mUtDUDjrIjcUUr7DrrPrI7r7j7mUtDUDjrIjctP"), k("rDrIr9rjrPrIUtr9reDMr9DtrCDUr7U9DMr7DjrPDUrCr9rc"), n("rPrUrUUjr7rmrPDrrCr9Dj"), g("jrrcrjDtDMtQ"), h("DtDMrPDDrc"), k("UmUCUDUm79UCUc7U"), p("DjrPrcrDr7UerPDm"), n("rjrPDUDUr7DjDCUCrcDUr7DjDrrPrI"), n("UtUP7U797DU7UjUDUI"), n("jmrrD7rcrtDUrCr9rcjmjCDQDjr7DUD7DjrcjMtPtjtttQDejCjmjCtQ"), h("tjtMtMtttMtPtMtD"), n("DtDUDjrCrcrDrCrrDC"), h("rtr9reDMrPDUUer9rUr7"), n("7DrCrcrUr9DDDtjM7Mrmr9rcr7"), p("rCDt7MDjr9DUr9DUDCDMr7U9rr"), n("r7DmDUr7rcDtrCr9rcDttR"), p("9MC9RDR79MC9CMQr9MC9mem9cjCRQec9Qmm9cjCImj9MC9mmQj9MC9CRCDcjmICRc9Qmm9cjCeRUc9Qmm99MC9m9mPcjCrQr"), n("jMrCDtjMrcr9DUjMrPjMrrD7rcrtDUrCr9rc"), h("UcU77DrPDUrtrmrerPrcU7DjDjr9Dj"), n("tMtMtMtMtMtMtMtM"), p("Djr7rer9Drr7UtrmrCrIrU"), p("DDr7rjrDrIjMrPrIrCrPDtr7rUjMrIrCrcr7jMDDrCrUDUrmjMDjrPrcrDr7tR"), k("DDr7rjrDrIjMrerPDmjMDUr7DmDUD7Djr7jMDtrCDRr7tR"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), g("Dtr7rcrUjMrjr7rmrPDrrCr9DjrUrPDUrPjMrrrPrCrIr7rUtRjM"), g("D7Dtr77MDjr9rDDjrPre"), k("rUr9reUPD7DUr9rerPDUrCr9rc"), h("rmr9DtDUrcrPrer7"), h("7mUUr9rerPrCrc7jr7DPD7r7DtDU"), n("7DrPDUrtrmrerPrc"), n("Djr7DPD7r7DtDU7tDUrPDjDU"), k("DMrmrPrcDUr9rejcrCrcrRr7rtDUURDt"), g("rtrIr7rPDj7UrCrer7r9D7DU"), k("U77j7jU97j"), g("DUr9D7rtrmr7rcrU"), n("DtDUrPDUr7"), h("DDr7rjrDrIjMrerPDmjMrPrcrCDtr9DUDjr9DMDCtR"), n("7trmr9rtrQDDrPDrr7UrrIrPDtrmjc7trmr9rtrQDDrPDrr7UrrIrPDtrm"), h("rmr7rCrDrmDU"), n("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), n("U77m7U79DUr7DmDUD7Djr779rrrCrIDUr7Dj79rPrcrCDtr9DUDjr9DMrCrt"), p("j9Drtjj9rtr9rIrIr7rtDU"), k("UPrDUtr9rcDUDjr9rIjcUPrDUtr9rcDUDjr9rI"), g("DUr9D7rtrmrer9Drr7"), g("rUr7rtr9rUr7777jUC"), g("rtrIrCr7rcDUUmr7rCrDrmDU"), n("UrrCDjr7rrr9Dm"), p("rCrcDMD7DU"), g("tPtjtt"), h("7979DDr7rjrUDjrCDrr7Dj79DtrtDjrCDMDU79rrD7rcrt"), p("7DUe7MrIrPDCr7DjjcU9Ut7m"), p("tDtjDMDm"), n("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), p("DMDjr9DMr7DjDUDCUCDtU7rcD7rer7DjrPrjrIr7"), k("r9rcDjr7rPrUDCDtDUrPDUr7rtrmrPrcrDr7"), n("DtrPrrrPDjrC"), p("rjr7rmrPDrrCr9DjjMrPDMrCjMDjr7DtDMr9rcDtr7jMDDDjr9rcrD"), k("rUr9rtD7rer7rcDU"), k("rUrcDt79rtrCDUDC"), h("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), n("rUr7DrrCrtr7r9DjrCr7rcDUrPDUrCr9rc"), h("rjrPDUDUr7DjDC"), p("jetCtCtCtCDMDm"), n("D7Dtr7DjUIrPrcrDD7rPrDr7"), n("rjD7DtrCrcr7DtDtUQr7DCjMrCDtjMrCrIrIr7rDrPrI"), h("DMr9rCrcDUr7Djrer9Drr7"), k("rPDjrt"), k("7tUmUPUUUCUcUD79UIUPUcUD77UPUDU7797rU77j7tUCU9Uc"), n("rerCrc"), h("rPDUDUrPrtrQ"), p("UIU97D79UrUIU9UP7U"), k("Dtr7DtDtrCr9rc7tDUr9DjrPrDr7"), g("U9rjrRr7rtDUjMDMDjr9DUr9DUDCDMr7jMrerPDCjMr9rcrIDCjMrjr7jMrPrcjMU9rjrRr7rtDUtRjM"), p("rtr9reDMrCrIr77trmrPrUr7Dj"), h("rCrrDjrPrer7"), g("r7DtrtrPDMr7"), k("reDtDMr9rCrcDUr7Djrer9Drr7"), h("DtDCDtDUr7reUIrPrcrDD7rPrDr7"), k("rIrPrcrDD7rPrDr7Dt"), p("7trQDCDMr7jcUUr7DUr7rtDUrCr9rc"), h("tjrU"), n("UPrtDUrCDrr77mU9rjrRr7rtDU"), h("rPrjDtr9rID7DUr7"), n("r9rrrrDtr7DUUmr7rCrDrmDU"), n("7t7U7jUCUcUD"), p("7mUeUIUmDUDUDM7jr7DPD7r7DtDU"), n("7Urmr7jMDtr7DjDrr7DjjMrmrPDtjMr7rcrtr9D7rcDUr7Djr7rUjMrPrcjMr7DjDjr9Dj"), k("rtr9rIr9DjUUr7DMDUrm"), n("r9DMr7rc"), n("rDrPrererP"), p("rUr9rerPrCrcte"), n("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), p("DjrPDUrCr9"), p("U9DUrmr7Dj"), g("7jr7rPrI7rrCrUr7r9jc7jr7rPrI7rrCrUr7r9jmDUrejCjMUPrtDUrCDrr77mjMUtr9rcDUDjr9rIjMjmtttjjerjrCDUjC"), h("U9rrrrrIrCrcr7UPD7rUrCr9Utr9rcDUr7DmDU"), h("DDr7rjrDrIjMrjrID7r7jMrjrCDUDttR"), g("rcrPDrrCrDrPDUr9Dj"), k("reDtDMr9rCrcDUr7DjrUr9DDrc"), p("jtrrtrtM"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), n("rCDtUcrPUc"), n("rrrCrIrI7jr7rtDU"), n("rrDjr7DPD7r7rcrtDC"), p("rIr9rPrUr7rU"), p("r7rcrtr9rUr7777jUC"), h("rPDUDUrPrtrmU7Drr7rcDU"), g("DDr7rjrDrIjMrerPDmjMDrr7DjDUr7DmjMDUr7DmDUD7Djr7jMrCrerPrDr7jMD7rcrCDUDttR"), p("UeUP7m797rU77j7UU77m797UU77m7U777jU779UCUeUPUDU77977UcUC7U7t"), p("D7DM"), h("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), n("rUr7DrrCrtr7jMrPDMrCjMDjr7DtDMr9rcDtr7jMDDDjr9rcrD"), k("rtDjr7rPDUr77MDjr9rDDjrPre"), p("UD7jU7U7Uc79UjUC7U7t"), g("rCDt7UDjD7DtDUr7rU"), k("DMrPrDr77mU9rrrrDtr7DU"), p("Uc77UeUjU77j"), n("rCrcrcr7DjUmr7rCrDrmDU"), p("rer9rcr9DtDMrPrtr7"), n("rtrIrCr7rcDU7C"), g("rtrIrCr7rcDU7m"), p("rtr9rcDtDUDjD7rtDUr9Dj"), h("7t7UUP7UUCUt79UU7jUP7D"), n("DMDjr9rUD7rtDU7tD7rj"), g("UjU9U9UIU7UPUc"), n("r9DMDj"), h("UeUP7m797UU77m7U777jU779UCUeUPUDU77977UcUC7U7t"), h("rPrjr9DjDU"), h("rUUP7DDtUjrmUtDPDUU9rPUcUIUIURtjt7rmUjDR7DrjDP7D7mDDrCUQtCtC7DrU"), g("rUrcDt79DMDjr9DrrCrcrtr7"), g("DDr7rjrDrIjMrPrIrCrPDtr7rUjMDMr9rCrcDUjMDtrCDRr7jMDjrPrcrDr7tR"), k("D7rcrCrrr9DjreU9rrrrDtr7DU"), g("r7rcrtr9rUr7777jUCUtr9reDMr9rcr7rcDU"), p("DUr9UIr9rtrPrIr77tDUDjrCrcrD"), k("rUr9rtD7rer7rcDUU7rIr7rer7rcDU"), h("rjrCrcrUUjD7rrrrr7Dj"), k("r9rcr7DjDjr9Dj"), g("DtDUDjrCrcrD"), n("UeU7UUUC77Ue79UrUIU9UP7U"), h("Djr7DtDMr9rcDtr7U7rcrU"), k("UeUP7m79UtU9UeUjUCUcU7UU797UU77m7U777jU779UCUeUPUDU77977UcUC7U7t"), k("rIr9rtrPrI7tDUr9DjrPrDr7"), g("rPrcrUDjr9rCrU"), g("rtrPrcDrrPDtjMrrDMtR"), k("rUr7DtDUrCrcrPDUrCr9rc"), k("rUr7DtrtDjrCDMDUrCr9rc"), k("rCrcrUr7Dmr7rUUUUj"), g("rtDjr7rPDUr7UjD7rrrrr7Dj"), g("7979rUDjrCDrr7Dj79r7DrrPrID7rPDUr7"), h("rIrCrcrQ7MDjr9rDDjrPre"), g("rjD7DUDUr9rc"), g("rIrCrcD7Dm"), h("rtDjr7rPDUr77trmrPrUr7Dj"), p("UtrmDjr9rer7"), p("rcr9DjrerPrI"), p("DDr7rjrDrIjMDtDUr7rcrtrCrIjMrjrCDUDttR"), g("DUDjrCrUr7rcDU"), n("7jr7rUD7rtr7jMr9rrjMr7reDMDUDCjMrPDjDjrPDCjMDDrCDUrmjMrcr9jMrCrcrCDUrCrPrIjMDrrPrID7r7"), k("DCr7Dt"), p("7t7DUtDUrIjc7t7DUtDUrI"), p("DrrPrID7r7U9rr"), h("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), n("DtDUrPDjDU"), g("7Dr9r77UDM7mrcUUUU7MrmrCUPDrDtUR7777UC7Ctt7jrUUPr9tj7MUQrP7rDDrC"), k("rtDjr7rPDUr7U9DtrtrCrIrIrPDUr9Dj"), g("UUr9r7DtjMrcr9DUjMDtD7DMDMr9DjDUjMUtU97j7t"), k("rUr7DUrPrtrmU7Drr7rcDU"), k("DUrPDjrDr7DU"), h("DMrPDjDtr7UCrcDU"), p("rDrjrQ"), p("rDr7DU77rcrCrrr9DjreUIr9rtrPDUrCr9rc"), h("7DUe79UtU9UcUrUCUD"), g("7IjmjmjcjQjC7IjCjU"), g("DtrmrPrUr7Dj7tr9D7Djrtr7"), n("rIr9rtrPDUrCr9rc"), h("UmU77m"), h("DDrCrcrUr9DD"), h("rCrcrCDUUcU77DrPDUrtrmrerPrc"), h("rUrCDtrtr9rcrcr7rtDU"), g("rPDMDM7rr7DjDtrCr9rc"), p("rer9D7Dtr7rer9Drr7"), n("DUDCDMr7"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), g("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), p("r7rcrPrjrIr77rr7DjDUr7DmUPDUDUDjrCrjUPDjDjrPDC"), h("rRrPDrrPU7rcrPrjrIr7rU"), n("r9DtrtDMD7"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrer7rUrCD7rejMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), n("r9DMDUrCr9rcDt"), h("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), h("UeUP7m797rUP7j7CUCUcUD797rU7Ut7UU97j7t"), n("7DUe79UcUCUQU7"), k("r9DMr7rcUUrPDUrPrjrPDtr7"), p("rDr7DU7MrPDjrPrer7DUr7Dj"), g("UjD7rrrrr7Dj"), n("7t7UU7UcUtUCUI79UjUC7U7t"), p("rtrPrcDrrPDt"), g("UmUCUDUm79UrUIU9UP7U"), g("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrIr9DDjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), p("tRjM"), k("DtrtDjr9rIrI"), n("rjrPDUDUr7DjDCUerPDm"), p("7DUe79UcUC"), k("UUU77M7UUm79Uj77UrUrU77j79UjUC7U"), h("rtDjr7rPDUr7UUDCrcrPrerCrtDtUtr9reDMDjr7DtDtr9Dj"), n("rCDMrmr9rcr7"), h("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rctR"), g("rCDM79DMDjr9DrrCrcrtr7"), g("7979Dtr7rIr7rcrCD7re79r7DrrPrID7rPDUr7"), g("UeDtDmrerItjjc7mUeUIUm7U7U7M"), g("j9Drttj9rj"), p("DMrPrDr77CU9rrrrDtr7DU"), k("UDU77U"), h("DtDUDCrIr7"), n("rUr7DMDUrmUrD7rcrt"), g("U9DMr7DjrP"), g("UtrPrcjMrcr9DUjMrrrCrcrUjMrtr9rcrrrCrDD7DjrPDUrCr9rc"), p("tRtR"), n("DMrPDjDtr7UrrIr9rPDU"), p("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrIr9DDjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), p("rDr7DUUPDUDUDjrCrjUIr9rtrPDUrCr9rc"), h("D7DUrrtm"), g("DDr7rjrDrIjMD7rcrerPDtrQr7rUjMDjr7rcrUr7Djr7DjtR"), n("DUDjrCrPrcrDrIr7"), g("D7rcrQrcr9DDrc"), n("D7rcrUr7rrrCrcr7rU"), g("7Ijc"), k("7DUe79UUUC7r"), p("7DUe797UUCUU"), p("r7Drr7rcDU"), k("rDr7DUU7DmDUr7rcDtrCr9rc"), n("rtrPrtrmr779"), n("r9rrrrDtr7DU7DrCrUDUrm"), n("D7Dtr7DjUPrDr7rcDU"), h("7PD7rCrtrQ7UrCrer7jc7PD7rCrtrQ7UrCrer7"), h("UR7tUtr9r9rQrCr7"), p("r7DmDMr7DjrCrer7rcDUrPrIjeDDr7rjrDrI"), h("rUrCDtrtrmrPDjrDrCrcrD7UrCrer7"), h("7979rcrCrDrmDUrerPDjr7"), n("UP7j7jUP7C79Uj77UrUrU77j"), k("UeU7UUUC77Ue79UCUc7U"), k("Djr7DPD7r7DtDUjMDjr7Dtr9D7Djrtr7jMr7DjDjr9Dj"), g("DDrCDUrmUtDjr7rUr7rcDUrCrPrIDt"), g("rCDM79rtrCDUDC"), n("tetQjMr7DmDMrCDjr7Dtte7UrmD7jIjMtMtPjMURrPrcjMtPtCtDtMjMtMtMtRtMtMtRtMtMjMUDUe7UtQjMDMrPDUrmtej9"), p("UerCDtDtrCrcrDjMrjD7DtrCrcr7DtDtjMrQr7DC"), h("DDrCrUDUrm"), g("DDr7rjrDrIjMrerPDmjMrrDjrPrDrer7rcDUjMD7rcrCrrr9DjrejMDrr7rtDUr9DjDttR"), k("7rU77j7tUCU9Uc"), g("7UUUUtUtDUrIjc7UUUUtUtDUrI"), p("Dtr7rIrr"), p("rIrCrcr7Umr7rCrDrmDU"), k("r7rrtmrttCrrtMtCtUtrtUtjtUtMr7t7tCtDtUrUtttrtUtrtUttr7tPtCr7tjtD"), g("7tr7DPD7r7rcDUD7re"), p("DtDMrPrc"), h("reDtrD"), h("rCrcrcr7DjUm7UUeUI"), p("rtr9r9rQrCr7U7rcrPrjrIr7rU"), n("DjrmrCrcr9"), k("rrrCDjr7rrr9Dm"), p("DUrmDjr7Dtrmr9rIrU"), n("rPDMDMUtr9rUr7UcrPrer7"), h("Ucr7DUDtrtrPDMr7"), p("rjrjtCtCrUrjtP79tD"), p("rjrjtCtCrUrjtP79tr"), p("rjrjtCtCrUrjtP79t7"), p("DMDjr9DUr9rtr9rI"), n("rrr9rcDUUrrPrerCrIDC"), k("rjrjtCtCrUrjtP79tU"), n("DDr7rjrDrIjMrerPDmjMDUr7DmDUD7Djr7jMrCrerPrDr7jMD7rcrCDUDttR"), h("rjrjtCtCrUrjtP79tC"), n("tRj9j9"), h("DtrtDjr9rIrIUIr7rrDU"), g("rjrjtCtCrUrjtP79tt"), k("rjrjtCtCrUrjtP79tj"), k("rjrjtCtCrUrjtP79tP"), n("7979rrDmrUDjrCDrr7Dj79r7DrrPrID7rPDUr7"), g("7Qr9rjrRr7rtDUjMUrD7rcrtDUrCr9rc7e"), h("DUrCrerCrcrD"), n("DUr97tr9D7Djrtr7"), n("UtUP7U79UrU9Uc7U7t"), p("UtDDrejMrrrRr9DjrUrjrPrcrQjMrDrIDCDMrmDtjMDrr7DmDUjMDPD7rCDRjIjM9MC9Cmm79MC9CmR79MC9CPQr9MC9Cmmt9MC9RDR79MC9CMQr9MC9mem9cjCRQec9Qmm9cjCImj9MC9mmQj9MC9CRCDcjmICRc9Qmm9cjCeRUc9Qmm99MC9m9mPcjCrQr"), k("7DUe79UUUCUU"), p("rPDMDMrIrCrtrPDUrCr9rcj9DmjeDDDDDDjerrr9DjrejeD7DjrIr7rcrtr9rUr7rU"), p("7jr7DtDMr9rcDtr7jMrCDtjMr7reDMDUDC"), h("tMtPtjtttUt7trtDtmtCrPrjrtrUr7rr"), g("DtrPrcDtjeDtr7DjrCrr"), p("DDr7rjrDrIjMrerPDmjMrtr9rerjrCrcr7rUjMDUr7DmDUD7Djr7jMrCrerPrDr7jMD7rcrCDUDttR"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), k("rmrCDtDUr9DjDC"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrer7rUrCD7rejMrrrIr9rPDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), n("DDr7rjrDrIjMrrDjrPrDrer7rcDUjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerCrctR"), k("DtrtDjr9rIrI7Ur9DM"), k("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rctR"), h("Ur7jUPUDUeU7Uc7U797tUmUPUUU77j"), p("rCDMrPrU"), n("DjrDrjrPjmtPtMtjjIjMtjtMtUjIjMtMjIjMtMjctjjC"), g("UerPrtDjr9rer7rUrCrPUrrIrPDtrm7MrPDMr7DjjcUerPrtDjr9rer7rUrCrPUrrIrPDtrm7MrPDMr7Dj"), g("Dtr7rcrU"), p("rUr9reUPD7DUr9rerPDUrCr9rcUtr9rcDUDjr9rIrIr7Dj"), n("DtrtDjr7r7rc7m"), n("t9jr"), h("UPUIUCUP7tU7UU79UIUCUcU7797DUCUU7UUm797jUPUcUDU7"), k("Djr7rcrUr7Djr7rUUjD7rrrrr7Dj"), g("UrrPrCrIr7rUjMDUr9jMrIr9rPrUjMDtrtDjrCDMDUjm"), h("DMrIrPDUrrr9Djre"), k("Ut7t7ttPUtr9reDMrPDU"), h("rtrIr7rPDjUtr9rIr9Dj"), g("rDr7DUUPDUDUDjrCrjD7DUr7"), h("rPDjDjrPDC"), g("Dtr7DUUCrcDUr7DjDrrPrI"), h("7UrmrCDtjMrjDjr9DDDtr7DjjDDtjMrCreDMrIr7rer7rcDUrPDUrCr9rcjMr9rrjMU9rjrRr7rtDUjcrtDjr7rPDUr7jMrCDtjMrPjMDtrmrCrejMrPrcrUjMrUr9r7DtrcjDDUjMDtD7DMDMr9DjDUjMrPjMDtr7rtr9rcrUjMrPDjrDD7rer7rcDUjc"), k("rtDjr7rPDUr7U7Drr7rcDU"), p("rDr7DUUjrPDUDUr7DjDC"), h("DDr7rjrDrIjMDrr7DjDUr7DmjMDtrmrPrUr7DjjMrmrCrDrmjMrCrcDUjMDMDjr7rtrCDtrCr9rcjMDjrPrcrDr7UerPDmtR"), k("DrrPrID7r7"), k("DDrCrc"), p("Drr7DjDUr7DmUPDUDUDjrCrj7Mr9rCrcDUr7Dj"), g("7979DDr7rjrUDjrCDrr7Dj79DtrtDjrCDMDU79rrD7rcrtDUrCr9rc"), h("DtDjrtU7rIr7rer7rcDU")];
                (function() {
                        var a = [0, 2, 1423857449, -2, 1873313359, 3, -3, 1555261956, 4, 2847714899, -1444681467, -4, -1732584194, 5, 1163531501, -5, 2714866558, 1281953886, 6, -6, 198958881, 1141124467, 2970347812, 7, -198630844, -7, 3110523913, 8, -8, 2428444049, 1272893353, 9, -722521979, -9, 10, -10, 11, -11, 2563907772, -12, 12, 2282248934, 13, -13, 2154129355, 14, -14, 15, -15, 16, -16, 17, -17, 18, -18, -701558691, -19, 19, 20, -20, 21, -21, 22, -22, 23, -23, 24, -24, -25, 25, -26, 26, -27, 27, 28, -28, 29, -29, 30, -30, 31, -31, 32, -33, 33, -32, -35, 34, -34, 35, 37, -37, 36, -36, 39, 38, -39, -38, 40, -40, 41, -41, -176418897, -43, 43, 42, -42, 45, 44, -45, -44, -46, 47, -47, 46, 48, 49, -49, -48, 50, -50, -51, 51, 570562233, -52, -53, 52, 53, 54, 55, -55, -54, 503444072, -56, -57, 57, 56, -58, -59, 59, 58, 60, -60, -61, 61, 63, 62, -62, -63, -65, 64, 711928724, 67, -64, -67, -66, 66, 65, -68, 71, 68, 70, 69, -70, -69, -71, 75, 3686517206, -72, 72, -74, -73, 73, -75, 74, -79, -78, -76, 76, 78, 77, -77, 79, -80, 3554079995, -82, -83, 81, 83, -81, 80, 82, 84, 85, -87, -84, 87, -85, -86, 86, -89, -91, 88, -88, -90, 91, 90, 89, -92, 95, -95, -94, 92, 94, 93, -93, 99, 97, -97, 98, -96, 96, -99, -98, 1735328473, 3272380065, 100, 101, -103, -100, -101, 102, -102, 103, 105, 107, 104, -106, 106, -105, -107, -104, -110, 109, -108, -109, 111, 110, 108, -111, 251722036, 112, -115, 115, 114, -114, -112, 113, -113, -116, 118, -117, 119, 117, 116, -119, -118, 123, -120, -122, 120, 121, -121, 122, -123, 125, 127, 3412177804, -127, 124, -126, 126, -125, -124, -128, 128, -129, 130, 1843258603, 150, 3803740692, 984961486, 3939845945, 44100, 4195302755, 200, 201, 202, 203, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 221, 222, 223, 225, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 4066508878, 240, 241, 242, 243, 255, 1706088902, 256, 300, 327, 1969922972, 2097651377, 1291169091, 376229701, 400, 401, 402, 403, 404, 405, 606105819, 420, 450, 451, 470, 853044451, 500, 512, 701, 702, 703, 707, 704, 705, 706, 708, 709, 710, 711, 712, 713, 752459403, 800, 801, 802, 803, 804, 658871167, 1E3, 426522225, 1236535329, 3772115230, 615818150, 3904427059, 4167216745, 4027552580, 2E3, 3654703836, 1886057615, -145523070, 879679996, 3518719985, 3E3, 3244367275, 2013776290, 3373015174, 1390208809, 4500, -1019803690, 5E3, 1759359992, 6E3, 285281116, 1622183637, 1006888145, 1231636301, 1E4, 83908371, -155497632, 1090812512, 1732584193, 2463272603, 1373503546, 2596254646, 2321926636, 1504918807, 2181625025, 2882616665, 2747007092, -271733879, 3009837614, 6E4, 3138078467, -30611744, -2054922799, -1502002290, -42063, 397917763, 81470997, 829329135, 2657392035, 956543938, 2517215374, 2262029012, 40735498, 2394877945, 702138776, 2808555105, 38016083, 2936675148, 1258607687, 1131014506, 3218104598, 3082640443, 1404277552, -1926607734, 565507253, 4283543511, 534414190, 1541320221, 1913087877, 2053790376, -660478335, 1789927666, 3965973030, 3826175755, 4107580753, 4240017532, 1804603682, 1658658271, 3579855332, -1416354905, 3708648649, 3453421203, -358537222, 3317316542, -1560198380, -1473231341, 1873836001, 1742555852, 3608007406, 1996959894, 3747672003, -1990404162, -995338651, 3485111705, 2137656763, -2022574463, 3352799412, 213261112, 3993919788, 1.01, 3865271297, 4139329115, 4275313526, -405537848, -1094730640, 1549556828, 282753626, 1068828381, 909522486, 2768942443, 2909243462, 936918E3, -1044525330, 3183342108, 141376813, 3050360625, 654459306, 2617837225, 1454621731, 271733878, 2489596804, 76029189, 2227061214, 1591671054, 2362670323, 4294967296, 4294967295, -40341101, 1308918612, 795835527, 1181335161, 414664567, 4279200368, 1661365465, 1839030562, 1037604311, 4150417245, 3887607047, 1802195444, 4023717930, 2075208622, -165796510, 1943803523, 901097722, 568446438, 628085408, 755167117, 3322730930, 3462522015, 3736837829, 3604390888, 2366115317, -187363961, .4, 2238001368, 2512341634, 2647816111, -1120210379, -.2, 314042704, 1510334235, -1069501632, 1382605366, 31158534, 450548861, 643717713, 3020668471, 1119000684, 3160834842, 2898065728, 1256170817, 2765210733, 3060149565, 3188396048, 2932959818, 124634137, 2797360999, -373897302, -1894986606, -1530992060, 366619977, 62317068, -.26, 1200080426, 1202900863, 498536548, 1340076626, 1126891415, 2405801727, -1051523, 2265490386, 1594198024, 1466479909, 2547177864, 249268274, 2680153253, 2125561021, 3294710456, 855842277, 3423369109, .732134444, 3705015759, 3569037538, 1994146192, -45705983, 1711684554, 1852507879, 997073096, -421815835, 289559509, 733239954, 4251122042, 601450431, 4111451223, 167816743, 3855990285, 3981806797, 3988292384, 3369554304, 3233442989, 3495958263, 3624741850, 65535, 453092731, -.9, 2094854071, 1957810842, 325883990, 4057260610, 1684777152, 4189708143, 3915621685, 162941995, 1812370925, 3775830040, 783551873, 3134207493, 1172266101, 2998733608, 2724688242, 1303535960, 2852801631, 112637215, 1567103746, 444984403, 651767980, 1426400815, -1958414417, -51403784, -680876936, 906185462, 2211677639, 1047427035, -57434055, 2344532202, 2607071920, 681279174, 2466906013, 225274430, 544179635, 2176718541, 2312317920, 1483230225, 1342533948, 2567524794, 2439277719, 1088359270, 1309151649, 671266974, -343485551, 1219638859, 718787259, 953729732, 2277735313, 3099436303, 2966460450, 817233897, 2685067896, 2825379669, -35309556, 4089016648, 530742520, 4224994405, 3943577151, 3814918930, 1700485571, .25, -640364487, 476864866, 944331445, 1634467795, 335633487, 1762050814, -378558, -1, 1, 2044508324, 3401237130, 3268935591, 3524101629, 3663771856, 1770035416, 1907459465, -389564586, 3301882366];
                        (function() {
                                function g(d) {
                                    void 0 === d && (d = {});
                                    this.aa = ja(this.aa, a[0], this);
                                    this.na = [];
                                    this.sa = [];
                                    this.aa(d)
                                }
                                function p(d) {
                                    function f(d) {
                                        N(d) === b[437] || (d = [d]);
                                        d.length < a[1] && (d = d.concat(d));
                                        return d
                                    }
                                    function e(d, b) {
                                        return d || d === a[0] ? d : b
                                    }
                                    function q(a, d) {
                                        return typeof a === x[18] ? a : d
                                    }
                                    var l = d.buildVersion
                                        , u = d.lastUsedVersion
                                        , m = d.staticServer
                                        , r = d.apiServer
                                        , ra = d.apiServers
                                        , g = d.staticServers
                                        , k = d[b[72]];
                                    void 0 === k && (k = !0);
                                    var n = d.valid
                                        , t = d.sConfig
                                        , w = d.configHash
                                        , v = d[b[394]]
                                        , y = d.pn
                                        , z = d[c[183]]
                                        , B = d[c[240]]
                                        , C = d[b[264]]
                                        , E = d.merged;
                                    d = d.__serverConfig__;
                                    void 0 === d && (d = {});
                                    var A = {};
                                    if (w || t)
                                        try {
                                            var D = ja(Ac, a[1], void 0)(w || t)
                                                , A = JSON[c[236]](D)
                                        } catch (F) {
                                            c[0]
                                        }
                                    var D = N(A.bl) === b[265] ? A.bl.split(c[28]) : []
                                        , G = N(A.dl) === b[265] ? A.dl.split(c[28]) : []
                                        , H = h(G)
                                        , I = a[376] * a[141] * a[141]
                                        , J = I * a[66];
                                    return {
                                        auto: k,
                                        onload: B,
                                        onerror: C,
                                        staticServer: m,
                                        apiServer: r,
                                        staticServers: f(g || d.staticServer || m),
                                        apiServers: f(ra || d.apiServer || r),
                                        productNumber: z || y,
                                        protocol: v,
                                        domain: H,
                                        Kc: G,
                                        ic: D,
                                        buildVersion: l,
                                        lastUsedVersion: u,
                                        sConfig: t,
                                        configHash: w,
                                        valid: n,
                                        merged: E,
                                        nc: q(A.ejcd, !1),
                                        oc: q(A.ews, !1),
                                        ra: q(A.edc, !0),
                                        uc: e(A.ivp, J),
                                        mc: e(A.dtvp, I),
                                        Gc: e(A.tto, a[384]),
                                        za: e(A.ret, a[675]),
                                        moveMax: A.mem,
                                        moveInterval: A.mei,
                                        keydownMax: A.kem,
                                        keydownInterval: A.kei,
                                        clickMax: A.cem,
                                        clickInterval: A.cei,
                                        upMax: A.cem,
                                        upInterval: A.cei,
                                        downMax: A.cem,
                                        downInterval: A.cei,
                                        focusMax: A.fem,
                                        focusInterval: A.fei,
                                        blurMax: A.fem,
                                        blurInterval: A.fei,
                                        scrollMax: A.sem,
                                        scrollInterval: A.sei,
                                        orientationMax: A.otem,
                                        orientationInterval: A.otei,
                                        motionMax: A.mtem,
                                        motionInterval: A.mtei
                                    }
                                }
                                function h(d) {
                                    void 0 === d && (d = []);
                                    var f = Bb[b[155]];
                                    if (!f || !d.length)
                                        return c[0];
                                    try {
                                        for (var e = a[0]; e < d.length; e++) {
                                            var q = d[e];
                                            if (null === q || void 0 === q ? 0 : null !== /^[a-zA-Z0-9_.-]+$/.exec(q)) {
                                                var l = new Cb(d[e].replace(/\./g, b[354]) + c[17]);
                                                if (null !== f.match(l))
                                                    return d[e]
                                            }
                                        }
                                    } catch (u) {
                                        c[0]
                                    }
                                    return c[0]
                                }
                                function n() {
                                    if (Ta)
                                        return Ta;
                                    Ta = this;
                                    var d = Ua(C[b[163]][b[316]])
                                        , f = {
                                        moveMax: R ? a[226] : a[5],
                                        moveInterval: a[336],
                                        downMax: R ? a[58] : a[5],
                                        downInterval: a[336],
                                        upMax: R ? a[58] : a[5],
                                        upInterval: a[336],
                                        clickMax: R ? a[58] : a[675],
                                        clickInterval: a[336],
                                        focusMax: R ? a[58] : a[675],
                                        focusInterval: a[336],
                                        blurMax: R ? a[58] : a[675],
                                        blurInterval: a[336],
                                        keydownMax: R ? a[34] : a[1],
                                        keydownInterval: a[336],
                                        scrollMax: R ? a[58] : a[1],
                                        scrollInterval: a[336],
                                        orientationMax: R ? a[119] : a[1],
                                        orientationInterval: a[390],
                                        motionMax: R ? a[119] : a[1],
                                        motionInterval: a[390],
                                        batteryMax: R ? a[226] : a[5],
                                        batteryInterval: a[34]
                                    };
                                    Object.keys(f).forEach(function(e) {
                                        d[e] = d[e] > a[0] ? ~e.indexOf(b[41]) ? Math[b[196]](d[e], f[e]) : Math[b[59]](d[e], f[e]) : f[e]
                                    });
                                    C.h(ka, d);
                                    this.Q = new U(d);
                                    la && (this.M = new k(d))
                                }
                                function k(a) {
                                    void 0 === a && (a = {});
                                    var f = this;
                                    this.F = [c[175], c[130], c[195], c[249]];
                                    this.Y = [a[b[329]], a[b[135]]];
                                    this.ka = a;
                                    this.j = [];
                                    this.l = !1;
                                    this.D = null;
                                    this._battery = {};
                                    this.ea = function(a) {
                                        return f.O(a)
                                    }
                                }
                                function U(a) {
                                    var b = this;
                                    void 0 === a && (a = {});
                                    this.F = Object.keys(Ga);
                                    this.Z = {};
                                    this.ka = a;
                                    this.j = {};
                                    this.l = !1;
                                    this.ta = function() {
                                        for (var a = [], d = arguments.length; d--; )
                                            a[d] = arguments[d];
                                        b.rc.apply(b, a)
                                    }
                                }
                                function ba(a) {
                                    var b = a ? Db : Ha(Db, Bc)
                                        , e = [];
                                    try {
                                        wa(Object.keys(b)).forEach(function(a) {
                                            var d = b[a].f();
                                            c[0];
                                            e.push.apply(e, xa(d, ca[a]))
                                        })
                                    } catch (q) {}
                                    return e
                                }
                                _ba = ba;
                                function Cc(d) {
                                    function f() {
                                        Eb >= Va.length && (Fb = !0,
                                            Wa = Xa(wa(e), function(a, d) {
                                                a.push.apply(a, d);
                                                return a
                                            }, []),
                                            d(Wa))
                                    }
                                    var e = [];
                                    if (Fb)
                                        return d(Wa);
                                    var q = C[b[163]][b[316]]
                                        , l = q.nc;
                                    void 0 === l && (l = !1);
                                    var u = q.Lc;
                                    void 0 === u && (u = !0);
                                    var m = q.oc;
                                    void 0 === m && (m = !1);
                                    Object.keys(Ya).forEach(function(a) {
                                        var d = Ya[a]
                                            , b = d.T
                                            , f = Ya[a].Ja;
                                        d.pc = a;
                                        ca[a].a !== d.a || N(d) !== c[57] || b && (b === Gb && !u || b === Za && !l || b === Hb && !m) || (d.Ka = f ? d.f : function(a) {
                                            return a(d.f())
                                        }
                                            ,
                                            Va.push(d))
                                    });
                                    Va.forEach(function(d) {
                                        function q() {
                                            function a(b, q) {
                                                c[0];
                                                e.push(xa(b, ca[d.pc], !!q));
                                                Eb++;
                                                f()
                                            }
                                            try {
                                                d.Ka(a)
                                            } catch (l) {
                                                a([], Error(b[106]))
                                            }
                                        }
                                        d.u ? ya(q, a[0]) : q()
                                    })
                                }
                                _Cc = Cc;
                                function za(d, f) {
                                    d = d || c[150];
                                    f = f || a[0];
                                    for (var e = d.length % a[49], q = d.length - e, l = [a[0], f], u = [a[0], f], m = [a[0], a[0]], r = [a[0], a[0]], ra = [a[653], a[589]], g = [a[340], a[375]], k = a[0]; k < q; k += a[49])
                                        m = [d.charCodeAt(k + a[8]) & a[333] | (d.charCodeAt(k + a[13]) & a[333]) << a[27] | (d.charCodeAt(k + a[18]) & a[333]) << a[49] | (d.charCodeAt(k + a[23]) & a[333]) << a[66], d.charCodeAt(k) & a[333] | (d.charCodeAt(k + a[675]) & a[333]) << a[27] | (d.charCodeAt(k + a[1]) & a[333]) << a[49] | (d.charCodeAt(k + a[5]) & a[333]) << a[66]],
                                            r = [d.charCodeAt(k + a[40]) & a[333] | (d.charCodeAt(k + a[42]) & a[333]) << a[27] | (d.charCodeAt(k + a[45]) & a[333]) << a[49] | (d.charCodeAt(k + a[47]) & a[333]) << a[66], d.charCodeAt(k + a[27]) & a[333] | (d.charCodeAt(k + a[31]) & a[333]) << a[27] | (d.charCodeAt(k + a[34]) & a[333]) << a[49] | (d.charCodeAt(k + a[36]) & a[333]) << a[66]],
                                            m = Q(m, ra),
                                            m = sa(m, a[80]),
                                            m = Q(m, g),
                                            l = F(l, m),
                                            l = sa(l, a[73]),
                                            l = da(l, u),
                                            l = da(Q(l, [a[0], a[13]]), [a[0], a[394]]),
                                            r = Q(r, g),
                                            r = sa(r, a[84]),
                                            r = Q(r, ra),
                                            u = F(u, r),
                                            u = sa(u, a[80]),
                                            u = da(u, l),
                                            u = da(Q(u, [a[0], a[13]]), [a[0], a[669]]);
                                    m = [a[0], a[0]];
                                    r = [a[0], a[0]];
                                    switch (e) {
                                        case a[47]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[45])], a[115]));
                                        case a[45]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[42])], a[98]));
                                        case a[42]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[40])], a[82]));
                                        case a[40]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[36])], a[66]));
                                        case a[36]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[34])], a[49]));
                                        case a[34]:
                                            r = F(r, O([a[0], d.charCodeAt(k + a[31])], a[27]));
                                        case a[31]:
                                            r = F(r, [a[0], d.charCodeAt(k + a[27])]),
                                                r = Q(r, g),
                                                r = sa(r, a[84]),
                                                r = Q(r, ra),
                                                u = F(u, r);
                                        case a[27]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[23])], a[136]));
                                        case a[23]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[18])], a[115]));
                                        case a[18]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[13])], a[98]));
                                        case a[13]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[8])], a[82]));
                                        case a[8]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[5])], a[66]));
                                        case a[5]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[1])], a[49]));
                                        case a[1]:
                                            m = F(m, O([a[0], d.charCodeAt(k + a[675])], a[27]));
                                        case a[675]:
                                            m = F(m, [a[0], d.charCodeAt(k)]),
                                                m = Q(m, ra),
                                                m = sa(m, a[80]),
                                                m = Q(m, g),
                                                l = F(l, m)
                                    }
                                    l = F(l, [a[0], d.length]);
                                    u = F(u, [a[0], d.length]);
                                    l = da(l, u);
                                    u = da(u, l);
                                    l = Ib(l);
                                    u = Ib(u);
                                    l = da(l, u);
                                    u = da(u, l);
                                    return (b[147] + (l[0] >>> a[0]).toString(a[49])).slice(a[28]) + (b[147] + (l[1] >>> a[0]).toString(a[49])).slice(a[28]) + (b[147] + (u[0] >>> a[0]).toString(a[49])).slice(a[28]) + (b[147] + (u[1] >>> a[0]).toString(a[49])).slice(a[28])
                                }
                                function $a() {
                                    var d = C[b[163]][b[316]]
                                        , f = W().k(Ia)
                                        , e = ea().k(ta)
                                        , q = d.ma
                                        , l = d.C
                                        , u ='YD20160637306799'
                                        , d = d.lc
                                        , m = {
                                        bc: b[100],
                                        Lb: Dc(),
                                        Db: ab(),
                                        Ub: Ec(J() + (C[b[163]].Aa || a[0])),
                                        Oa: Fc,
                                        Pa: q,
                                        Ma: l,
                                        Zb: f,
                                        ab: d,
                                        cb: e,
                                        Kb: u,
                                        Wa: void 0,
                                        Xa: Gc,
                                        Ya: Hc,
                                        Za: Ic,
                                        $a: void 0
                                    }
                                        , r = [];
                                    wa(Object.keys(m)).forEach(function(d) {
                                        N(m[d]) !== b[353] && (ca[d].c >= a[370] && ca[d].c <= a[374] && (m[d] = Jc(m[d])),
                                            c[0],
                                            r.push.apply(r, xa(m[d], ca[d])))
                                    });
                                    return r
                                }
                                _a = $a;
                                function Ic() {
                                    return c[10]
                                }
                                function xa(d, f, e) {
                                    var c = f.a
                                        , l = f.e
                                        , u = [];
                                    if (!e && (c === B && (u = fa(X(d ? a[675] : a[1]), l)),
                                    c === z && (u = fa(X(d), l)),
                                    c === Y && (u = fa(Jb(d), l)),
                                    c === t && (u = Aa(fa(d, l))),
                                    c === H))
                                        for (e = a[0],
                                                 c = d.length; e < c; e++) {
                                            var m = l[e]
                                                , r = d[e];
                                            N(d[e]) === b[7] && u.push.apply(u, fa(X(r), m));
                                            N(d[e]) === b[265] && u.push.apply(u, Aa(fa(r, m)))
                                        }
                                    d = fa(X(f.c), a[1]);
                                    f = fa(X(u.length), a[1]);
                                    return d.concat(f, u)
                                }
                                function Kb(d, f) {
                                    function e(a) {
                                        var d = {}
                                            , f = null
                                            , e = null;
                                        p.concat(h).forEach(function(a) {
                                            window[a] && (d[a] = window[a])
                                        });
                                        var q = Ja(l, g);
                                        Kc(q, {
                                            charset: b[297]
                                        }, function(q, l) {
                                            if (q)
                                                return c[0],
                                                    null;
                                            l && l.parentElement[b[148]](l);
                                            f = p.map(function(a) {
                                                return window[a]
                                            }).join(c[35]);
                                            e = h.map(function(a) {
                                                return window[a]
                                            }).join(c[35]);
                                            c[0];
                                            c[0];
                                            a(f, e);
                                            for (var m in d)
                                                window[m] = d[m]
                                        })
                                    }
                                    void 0 === f && (f = a[675]);
                                    var q = C[b[163]][b[316]]
                                        , l = q[b[394]]
                                        , u = q.apiServers
                                        , m = q[c[183]];
                                    void 0 === m && (m = c[0]);
                                    var r = q.ma;
                                    void 0 === r && (r = c[0]);
                                    q = q.C;
                                    void 0 === q && (q = c[0]);
                                    var k = W().k(Ia)
                                        , g = c[63]
                                        , p = [b[23], c[237], b[335], b[371]]
                                        , h = [b[24], c[89], b[257], b[186], c[177], b[383]];
                                    (function(d) {
                                            e(function(f, e) {
                                                d.ip = f;
                                                d.dns = e;
                                                var c = Ja(l, u[u.length - a[675]], b[169]);
                                                Lb(c, {
                                                    K: d
                                                })
                                            })
                                        }
                                    )({
                                        tid: k,
                                        referrer: Bb.href || c[0],
                                        pn: m,
                                        bid: r,
                                        tid2: q,
                                        type: d.code,
                                        message: d.toString(),
                                        target: d.data.url || c[0],
                                        requestCount: f,
                                        osv: v[b[433]] || c[0],
                                        sdkv: c[245]
                                    })
                                }
                                function Kc(a, f, e) {
                                    var q = document.head || document[c[98]](b[113])[0]
                                        , l = document[c[182]](b[26]);
                                    typeof f === b[86] && (e = f,
                                        f = {});
                                    f = f || {};
                                    e = e || function() {}
                                    ;
                                    l.type = f.type || c[169];
                                    l.charset = f.charset || b[349];
                                    l.async = x[16]in f ? !!f.async : !0;
                                    l[b[127]] = a;
                                    f.hc && Lc(l, f.hc);
                                    f.text && (l.text = c[0] + f.text);
                                    (c[240]in l ? Mb : Mc)(l, e);
                                    l[c[240]] || Mb(l, e);
                                    q[c[12]](l)
                                }
                                function Nc(d, f) {
                                    function e(a, d) {
                                        l && ua(l);
                                        q && typeof q[b[255]] === b[86] && q[b[255]]();
                                        a ? g(a) : k(d)
                                    }
                                    void 0 === f && (f = {});
                                    var q, l, u = f.ba, m = f.K;
                                    void 0 === m && (m = {});
                                    var r = f.Ba;
                                    void 0 === r && (r = a[419]);
                                    var k = f.V;
                                    void 0 === k && (k = V);
                                    var g = f.U;
                                    void 0 === g && (g = V);
                                    m[c[102]] = c[215] + ab().slice(a[1], a[31]);
                                    r && (l = ya(function() {
                                        e(Error(c[198]))
                                    }, r));
                                    u === b[340] && (d += (~d.indexOf(c[58]) ? c[19] : c[58]) + bb(m));
                                    cb ? (q = new cb,
                                        b[370]in q ? (q[b[216]](u, d, !0),
                                            q[c[157]](c[189], b[411]),
                                            q[b[264]] = f[b[264]],
                                            q[b[182]] = function() {
                                                if (q[b[88]] === a[8])
                                                    if (l && ua(l),
                                                    q[b[36]] >= a[295] && q[b[36]] < a[342]) {
                                                        var d, f = new Cb(c[101] + m[c[102]] + b[300]);
                                                        try {
                                                            d = JSON[c[236]]((q[c[205]] || c[0]).match(f)[1] || c[0])
                                                        } catch (r) {}
                                                        d ? e(null, d) : e(Error(b[412]))
                                                    } else
                                                        e(Error(b[214]))
                                            }
                                            ,
                                            q[b[426]](bb(m))) : (e(Error(b[293])),
                                            c[0])) : (e(Error(b[293])),
                                        c[0]);
                                    return q && typeof q[b[255]] === b[86] && q[b[255]]
                                }
                                function ma(a) {
                                    void 0 === a && (a = {});
                                    this.R = x[2];
                                    this.w = {};
                                    this.p = a.p || c[0]
                                }
                                function Ba(a) {
                                    void 0 === a && (a = {});
                                    this.p = a.p || c[0];
                                    this.X = [Oc, Pc, Qc]
                                }
                                function va(a) {
                                    this[b[163]] = a[b[163]];
                                    this.Rb = [];
                                    var f = this
                                        , e = this.h
                                        , c = this.B;
                                    this.h = function(a, d, b) {
                                        return e.call(f, a, d, b)
                                    }
                                    ;
                                    this.B = function(a, d) {
                                        return c.call(f, a, d)
                                    }
                                    ;
                                    this.Ec(a.fc);
                                    this.Fc(a.zc)
                                }
                                function E(a) {
                                    try {
                                        return Nb[a]
                                    } catch (b) {}
                                }
                                function ab() {
                                    return b[49].replace(/[xy]/g, function(d) {
                                        var b = Math[c[218]]() * a[49] | a[0];
                                        return (d === c[144] ? b : b & a[5] | a[27]).toString(a[49])
                                    })
                                }
                                function Ec(d) {
                                    void 0 === d && (d = a[0]);
                                    d = (new Ca(d))[c[203]]();
                                    return na(d / a[376], a[34])
                                }
                                function N(d) {
                                    return null == d ? String(d) : Rc.call(d).slice(a[27], a[674]).toLowerCase()
                                }
                                function V() {}
                                function Sc(a, b) {
                                    return a.filter(b)[0]
                                }
                                function Ua(a, f) {
                                    void 0 === f && (f = []);
                                    if (null === a || typeof a !== c[57])
                                        return a;
                                    var e = Sc(f, function(b) {
                                        return b.Dc === a
                                    });
                                    if (e)
                                        return e.kc;
                                    var q = N(a) === b[437] ? [] : {};
                                    f.push({
                                        Dc: a,
                                        kc: q
                                    });
                                    Object.keys(a).forEach(function(b) {
                                        q[b] = Ua(a[b], f)
                                    });
                                    return q
                                }
                                function db() {
                                    var a;
                                    try {
                                        a = new cb
                                    } catch (f) {}
                                    return !!a && b[370]in a
                                }
                                function bb(a) {
                                    return Object.keys(a).map(function(b) {
                                        return Z(b) + c[55] + Z(a[b])
                                    }).join(c[19])
                                }
                                function Ob(a) {
                                    return a.replace(/(^\/)|(\/$)/g, c[0])
                                }
                                function Ja(a, f, e) {
                                    f = Ob(f.replace(/^https?:\/\//i, c[0]));
                                    return (e = e ? Ob(e) : c[0]) ? a + b[399] + f + c[35] + e : a + b[399] + f
                                }
                                function Ha(a, b) {
                                    for (var e in b)
                                        !b.hasOwnProperty(e) || (a[e] = b[e]);
                                    return a
                                }
                                function J() {
                                    return (new Ca)[c[203]]()
                                }
                                function wa(a) {
                                    for (var f = a.length, e, q; f; )
                                        q = Math[b[122]](Math[c[218]]() * f--),
                                            e = a[f],
                                            a[f] = a[q],
                                            a[q] = e;
                                    return a
                                }
                                function Xa(d, f) {
                                    if (null == d)
                                        throw new TypeError(b[116]);
                                    if (typeof f !== b[86])
                                        throw new TypeError(f + b[145]);
                                    var e = d.length >>> a[0], c = a[0], l;
                                    if (arguments.length === a[5])
                                        l = arguments[2];
                                    else {
                                        for (; c < e && !(c in d); )
                                            c++;
                                        if (c >= e)
                                            throw new TypeError(b[285]);
                                        l = d[c++]
                                    }
                                    for (; c < e; c++)
                                        c in d && (l = f(l, d[c], c, d));
                                    return l
                                }
                                function W() {
                                    var a = C[b[163]][b[316]].merged ? C[b[163]][b[316]][c[183]] : c[0];
                                    if (Ka[a])
                                        return Ka[a];
                                    Ka[a] = new Ba({
                                        p: a
                                    });
                                    return Ka[a]
                                }
                                function ea() {
                                    var a = C[b[163]][b[316]].merged ? C[b[163]][b[316]][c[183]] : c[0];
                                    if (La[a])
                                        return La[a];
                                    La[a] = new ma({
                                        p: a
                                    });
                                    return La[a]
                                }
                                function Lb(d, f) {
                                    function e() {
                                        if (h[c[184]])
                                            h[c[184]][b[148]](h);
                                        y[q] = V;
                                        n && ua(n)
                                    }
                                    void 0 === f && (f = {});
                                    var q = c[215] + ab().slice(a[1], a[31]) + Tc++
                                        , l = c[102]
                                        , u = Z
                                        , m = f.V;
                                    void 0 === m && (m = V);
                                    var r = f.K
                                        , k = f.U;
                                    void 0 === k && (k = V);
                                    var g = f.Ba;
                                    void 0 === g && (g = a[399]);
                                    var p = w[c[98]](b[26])[0] || w.head, h, n;
                                    g && (n = ya(function() {
                                        e();
                                        k && k(Error(c[198]))
                                    }, g));
                                    y[q] = function(a) {
                                        e();
                                        m && m(a)
                                    }
                                    ;
                                    d += (~d.indexOf(c[58]) ? c[19] : c[58]) + l + c[55] + u(q) + c[19] + bb(r);
                                    d = d.replace(b[429], c[58]);
                                    h = w[c[182]](b[26]);
                                    h[b[127]] = d;
                                    h[b[264]] = function(a) {
                                        e();
                                        k(a)
                                    }
                                    ;
                                    h[c[219]](b[38], b[95]);
                                    p[c[184]][c[163]](h, p);
                                    return function() {
                                        y[q] && e()
                                    }
                                }
                                function Pb() {}
                                function Qb(d, f) {
                                    f = Ha({
                                        ba: b[340],
                                        K: {},
                                        Ba: a[397],
                                        V: Pb,
                                        U: Pb
                                    }, f);
                                    (db() ? Nc : Lb)(d, f)
                                }
                                function Rb(d, b, e, q, l) {
                                    void 0 === e && (e = a[0]);
                                    void 0 === q && (q = Sb);
                                    void 0 === l && (l = eb);
                                    var k, m = [];
                                    switch (e) {
                                        case a[675]:
                                            e = d[b];
                                            k = a[0];
                                            m.push(q[e >>> a[1] & a[145]], q[(e << a[8] & a[115]) + (k >>> a[8] & a[47])], l, l);
                                            break;
                                        case a[1]:
                                            e = d[b];
                                            k = d[b + a[675]];
                                            d = a[0];
                                            m.push(q[e >>> a[1] & a[145]], q[(e << a[8] & a[115]) + (k >>> a[8] & a[47])], q[(k << a[1] & a[141]) + (d >>> a[18] & a[5])], l);
                                            break;
                                        case a[5]:
                                            e = d[b];
                                            k = d[b + a[675]];
                                            d = d[b + a[1]];
                                            m.push(q[e >>> a[1] & a[145]], q[(e << a[8] & a[115]) + (k >>> a[8] & a[47])], q[(k << a[1] & a[141]) + (d >>> a[18] & a[5])], q[d & a[145]]);
                                            break;
                                        default:
                                            throw Error(c[117]);
                                    }
                                    return m.join(c[0])
                                }
                                function Tb(d, b, e) {
                                    void 0 === b && (b = []);
                                    void 0 === e && (e = eb);
                                    if (!d)
                                        return null;
                                    if (d.length === a[0])
                                        return c[0];
                                    var q = a[5];
                                    try {
                                        for (var l = [], k = a[0]; k < d.length; )
                                            if (k + q <= d.length)
                                                l.push(Rb(d, k, q, b, e)),
                                                    k += q;
                                            else {
                                                l.push(Rb(d, k, d.length - k, b, e));
                                                break
                                            }
                                        return l.join(c[0])
                                    } catch (m) {
                                        throw Error(c[117]);
                                    }
                                }
                                function Ub(a) {
                                    void 0 === a && (a = []);
                                    return Tb(a, Uc, Vc)
                                }
                                function D(d) {
                                    if (d < a[284])
                                        return D(a[285] - (a[284] - d));
                                    if (d >= a[284] && d <= a[276])
                                        return d;
                                    if (d > a[276])
                                        return D(a[286] + d - a[276]);
                                    throw Error(c[142]);
                                }
                                function Wc(a, b) {
                                    return D(a + b)
                                }
                                function Vb(a, b) {
                                    return D(D(a) ^ D(b))
                                }
                                function fb(d, b) {
                                    void 0 === d && (d = []);
                                    void 0 === b && (b = []);
                                    if (d.length !== b.length)
                                        return [];
                                    for (var e = [], c = a[0], l = d.length; c < l; c++)
                                        e[c] = Vb(d[c], b[c]);
                                    return e
                                }
                                function Wb(d) {
                                    var b = [c[37], c[38], c[39], c[41], c[43], c[46], c[48], c[49], c[51], c[52], c[103], c[105], c[107], c[109], c[111], c[114]];
                                    return c[0] + b[d >>> a[8] & a[47]] + b[d & a[47]]
                                }
                                function gb(a) {
                                    void 0 === a && (a = []);
                                    return a.map(function(a) {
                                        return Wb(a)
                                    }).join(c[0])
                                }
                                function hb(d) {
                                    void 0 === d && (d = c[0]);
                                    d = typeof d === b[265] ? d : String(d);
                                    for (var f = [], e = a[0], q = a[0], l = d.length / a[1]; e < l; e++) {
                                        var k = na(d.charAt(q++), a[49]) << a[8]
                                            , m = na(d.charAt(q++), a[49]);
                                        f[e] = D(k + m)
                                    }
                                    return f
                                }
                                function Aa(d) {
                                    if (null === d || void 0 === d)
                                        return d;
                                    d = Z(d);
                                    for (var b = [], e = a[0], q = d.length; e < q; e++)
                                        if (d.charAt(e) === c[18])
                                            if (e + a[1] < q)
                                                b.push(Jb(d.charAt(++e) + c[0] + d.charAt(++e))[0]);
                                            else
                                                throw Error(c[151]);
                                        else
                                            b.push(D(d.charCodeAt(e)));
                                    return b
                                }
                                function X(d) {
                                    var b = [];
                                    b[0] = D(d >>> a[66] & a[333]);
                                    b[1] = D(d >>> a[49] & a[333]);
                                    b[2] = D(d >>> a[27] & a[333]);
                                    b[3] = D(d & a[333]);
                                    return b
                                }
                                function ga(d, b, e, q, l) {
                                    void 0 === d && (d = []);
                                    void 0 === e && (e = []);
                                    if (d.length) {
                                        if (d.length < l)
                                            throw Error(c[139]);
                                        for (var k = a[0]; k < l; k++)
                                            e[q + k] = d[b + k]
                                    }
                                }
                                function Xb() {
                                    return Array.apply(null, Array(a[34])).map(function() {
                                        return a[0]
                                    })
                                }
                                function Jb(d) {
                                    if (null === d || d.length === a[0])
                                        return [];
                                    d = typeof d === b[265] ? d : String(d);
                                    for (var f = [], e = a[0], c = a[0], l = d.length / a[1]; c < l; c++) {
                                        var k = na(d.charAt(e++), a[49]) << a[8]
                                            , m = na(d.charAt(e++), a[49]);
                                        f[c] = D(k + m)
                                    }
                                    return f
                                }
                                function ib(d) {
                                    void 0 === d && (d = []);
                                    var b = [];
                                    if (!d.length)
                                        return Xb();
                                    if (d.length >= jb) {
                                        var b = a[0]
                                            , e = jb;
                                        void 0 === d && (d = []);
                                        var q = [];
                                        if (d.length) {
                                            if (d.length < e)
                                                throw Error(c[139]);
                                            for (var l = a[0]; l < e; l++)
                                                q[l] = d[b + l]
                                        }
                                        return q
                                    }
                                    for (e = a[0]; e < jb; e++)
                                        b[e] = d[e % d.length];
                                    return b
                                }
                                function Yb(d) {
                                    void 0 === d && (d = []);
                                    if (!d.length)
                                        return [];
                                    for (var b = [], e = a[0], c = d.length; e < c; e++) {
                                        var l = d[e];
                                        b[e] = Xc[(l >>> a[8] & a[47]) * a[49] + (l & a[47])]
                                    }
                                    return b
                                }
                                function Yc(d, b) {
                                    void 0 === d && (d = []);
                                    if (!d.length)
                                        return [];
                                    b = D(b);
                                    for (var e = [], c = a[0], l = d.length; c < l; c++)
                                        e.push(Vb(d[c], b++));
                                    return e
                                }
                                function Zc(d, b) {
                                    void 0 === d && (d = []);
                                    if (!d.length)
                                        return [];
                                    b = D(b);
                                    for (var e = [], c = a[0], l = d.length; c < l; c++)
                                        e.push(D(d[c] + b));
                                    return e
                                }
                                function kb(d, b) {
                                    void 0 === d && (d = []);
                                    if (!d.length)
                                        return [];
                                    b = D(b);
                                    for (var e = [], c = a[0], l = d.length; c < l; c++)
                                        e.push(Wc(d[c], b++));
                                    return e
                                }
                                function $c(d) {
                                    return Xa([[Yc, a[68]], [kb, a[28]], [Zc, a[208]], [kb, a[216]], [kb, a[83]]], function(a, d) {
                                        return d[0](a, d[1])
                                    }, d)
                                }
                                function lb(d) {
                                    void 0 === d && (d = []);
                                    var f = b[380], e;
                                    e = [a[0], a[469], a[478], a[644], a[555], a[386], a[611], a[428], a[574], a[676], a[379], a[573], a[612], a[576], a[517], a[29], a[565], a[451], a[660], a[502], a[544], a[288], a[454], a[631], a[607], a[609], a[591], a[412], a[671], a[513], a[294], a[531], a[587], a[17], a[458], a[619], a[402], a[438], a[679], a[489], a[523], a[547], a[167], a[549], a[353], a[617], a[581], a[415], a[625], a[410], a[598], a[440], a[444], a[498], a[473], a[654], a[648], a[571], a[527], a[22], a[509], a[642], a[391], a[552], a[583], a[543], a[38], a[519], a[682], a[622], a[575], a[381], a[392], a[250], a[430], a[614], a[474], a[494], a[645], a[480], a[518], a[668], a[534], a[328], a[613], a[603], a[414], a[593], a[334], a[539], a[634], a[455], a[457], a[560], a[504], a[662], a[620], a[291], a[416], a[582], a[550], a[515], a[551], a[184], a[439], a[388], a[490], a[680], a[21], a[578], a[621], a[460], a[643], a[496], a[553], a[393], a[572], a[639], a[26], a[528], a[503], a[434], a[655], a[476], a[413], a[615], a[441], a[599], a[597], a[411], a[561], a[606], a[292], a[536], a[426], a[522], a[664], a[500], a[638], a[449], a[453], a[637], a[594], a[339], a[383], a[570], a[132], a[672], a[516], a[44], a[377], a[586], a[482], a[641], a[486], a[467], a[610], a[433], a[425], a[401], a[530], a[16], a[652], a[566], a[389], a[556], a[487], a[650], a[601], a[437], a[630], a[407], a[470], a[658], a[427], a[510], a[277], a[548], a[525], a[542], a[579], a[420], a[123], a[626], a[463], a[618], a[590], a[7], a[678], a[495], a[369], a[447], a[635], a[452], a[338], a[432], a[497], a[663], a[448], a[405], a[535], a[290], a[520], a[477], a[409], a[595], a[605], a[20], a[431], a[608], a[398], a[446], a[640], a[481], a[466], a[511], a[41], a[512], a[585], a[400], a[568], a[382], a[670], a[341], a[657], a[468], a[508], a[429], a[435], a[600], a[403], a[632], a[554], a[385], a[646], a[491], a[9], a[529], a[564], a[656], a[493], a[677], a[442], a[380], a[616], a[461], a[2], a[592], a[418], a[577], a[623], a[151], a[546], a[225], a[540], a[526]];
                                    for (var q = a[506], l = a[0], k = d.length; l < k; l++)
                                        q = q >>> a[27] ^ e[(q ^ d[l]) & a[333]];
                                    e = gb(X(q ^ a[506]));
                                    q = Aa(e);
                                    e = [];
                                    ga(d, a[0], e, a[0], d.length);
                                    ga(q, a[0], e, e.length, q.length);
                                    d = Aa(f);
                                    void 0 === e && (e = []);
                                    q = [];
                                    for (f = a[0]; f < mb; f++)
                                        l = Math[c[218]]() * a[335],
                                            l = Math[b[122]](l),
                                            q[f] = D(l);
                                    d = ib(d);
                                    d = fb(d, ib(q));
                                    f = d = ib(d);
                                    var m = e;
                                    void 0 === m && (m = []);
                                    if (m.length) {
                                        e = [];
                                        l = m.length;
                                        k = a[0];
                                        k = l % S <= S - Ma ? S - l % S - Ma : S * a[1] - l % S - Ma;
                                        ga(m, a[0], e, a[0], l);
                                        for (m = a[0]; m < k; m++)
                                            e[l + m] = a[0];
                                        ga(X(l), a[0], e, l + k, Ma)
                                    } else
                                        e = Xb();
                                    l = e;
                                    void 0 === l && (l = []);
                                    if (l.length % S !== a[0])
                                        throw Error(c[133]);
                                    e = [];
                                    for (var k = a[0], m = l.length / S, r = a[0]; r < m; r++) {
                                        e[r] = [];
                                        for (var g = a[0]; g < S; g++)
                                            e[r][g] = l[k++]
                                    }
                                    l = [];
                                    ga(q, a[0], l, a[0], mb);
                                    q = a[0];
                                    for (k = e.length; q < k; q++) {
                                        m = $c(e[q]);
                                        m = fb(m, d);
                                        r = f;
                                        void 0 === m && (m = []);
                                        void 0 === r && (r = []);
                                        for (var g = [], h = r.length, p = a[0], n = m.length; p < n; p++)
                                            g[p] = D(m[p] + r[p % h]);
                                        m = fb(g, f);
                                        f = Yb(m);
                                        f = Yb(f);
                                        ga(f, a[0], l, q * S + mb, S)
                                    }
                                    return Tb(l, Sb, eb)
                                }
                                function Ac(d) {
                                    if (!d)
                                        return c[0];
                                    var b = [a[80], a[275], a[39], a[141], a[82], a[115]]
                                        , e = a[0];
                                    d = hb(d);
                                    for (var q = [], l = a[0]; l < d.length; l++)
                                        q[l] = D(a[0] - d[l]),
                                            q[l] = D(q[l] ^ b[e++ % b.length]);
                                    b = q;
                                    void 0 === b && (b = []);
                                    e = [];
                                    for (d = a[0]; d < b.length; d++)
                                        e.push(c[18]),
                                            e.push(Wb(b[d]));
                                    return Zb(e.join(c[0]))
                                }
                                function Na(d) {
                                    if (!d)
                                        return c[0];
                                    var b = a[0]
                                        , e = [a[80], a[275], a[39], a[141], a[82], a[115]];
                                    d = Aa(d);
                                    for (var q = [], l = a[0]; l < d.length; l++)
                                        q[l] = D(d[l] ^ e[b++ % e.length]),
                                            q[l] = D(a[0] - q[l]);
                                    return gb(q)
                                }
                                function ha(d, b) {
                                    var e = (d & a[602]) + (b & a[602]);
                                    return (d >> a[49]) + (b >> a[49]) + (e >> a[49]) << a[49] | e & a[602]
                                }
                                function I(d, b, e, c, l, k) {
                                    d = ha(ha(b, d), ha(c, k));
                                    return ha(d << l | d >>> a[82] - l, e)
                                }
                                function K(a, b, e, c, l, k, m) {
                                    return I(b & e | ~b & c, a, b, l, k, m)
                                }
                                function L(a, b, e, c, l, k, m) {
                                    return I(b & c | e & ~c, a, b, l, k, m)
                                }
                                function M(a, b, e, c, l, k, m) {
                                    return I(e ^ (b | ~c), a, b, l, k, m)
                                }
                                function $b(d) {
                                    var b, e = [];
                                    e[(d.length >> a[1]) - a[675]] = void 0;
                                    for (b = a[0]; b < e.length; b += a[675])
                                        e[b] = a[0];
                                    var q = d.length * a[27];
                                    for (b = a[0]; b < q; b += a[27])
                                        e[b >> a[13]] |= (d.charCodeAt(b / a[27]) & a[333]) << b % a[82];
                                    d = d.length * a[27];
                                    e[d >> a[13]] |= a[285] << d % a[82];
                                    e[(d + a[150] >>> a[31] << a[8]) + a[45]] = d;
                                    var l, k, m = a[408], r = a[417], g = a[12], h = a[499];
                                    for (d = a[0]; d < e.length; d += a[49])
                                        b = m,
                                            q = r,
                                            l = g,
                                            k = h,
                                            m = K(m, r, g, h, e[d], a[23], a[629]),
                                            h = K(h, m, r, g, e[d + a[675]], a[40], a[683]),
                                            g = K(g, h, m, r, e[d + a[1]], a[51], a[348]),
                                            r = K(r, g, h, m, e[d + a[5]], a[62], a[492]),
                                            m = K(m, r, g, h, e[d + a[8]], a[23], a[102]),
                                            h = K(h, m, r, g, e[d + a[13]], a[40], a[563]),
                                            g = K(g, h, m, r, e[d + a[18]], a[51], a[465]),
                                            r = K(r, g, h, m, e[d + a[23]], a[62], a[584]),
                                            m = K(m, r, g, h, e[d + a[27]], a[23], a[681]),
                                            h = K(h, m, r, g, e[d + a[31]], a[40], a[627]),
                                            g = K(g, h, m, r, e[d + a[34]], a[51], a[424]),
                                            r = K(r, g, h, m, e[d + a[36]], a[62], a[471]),
                                            m = K(m, r, g, h, e[d + a[40]], a[23], a[456]),
                                            h = K(h, m, r, g, e[d + a[42]], a[40], a[507]),
                                            g = K(g, h, m, r, e[d + a[45]], a[51], a[423]),
                                            r = K(r, g, h, m, e[d + a[47]], a[62], a[378]),
                                            m = L(m, r, g, h, e[d + a[675]], a[13], a[521]),
                                            h = L(h, m, r, g, e[d + a[18]], a[31], a[541]),
                                            g = L(g, h, m, r, e[d + a[36]], a[45], a[545]),
                                            r = L(r, g, h, m, e[d], a[58], a[557]),
                                            m = L(m, r, g, h, e[d + a[13]], a[13], a[55]),
                                            h = L(h, m, r, g, e[d + a[34]], a[31], a[436]),
                                            g = L(g, h, m, r, e[d + a[47]], a[45], a[450]),
                                            r = L(r, g, h, m, e[d + a[8]], a[58], a[483]),
                                            m = L(m, r, g, h, e[d + a[31]], a[13], a[524]),
                                            h = L(h, m, r, g, e[d + a[45]], a[31], a[396]),
                                            g = L(g, h, m, r, e[d + a[5]], a[45], a[532]),
                                            r = L(r, g, h, m, e[d + a[27]], a[58], a[14]),
                                            m = L(m, r, g, h, e[d + a[42]], a[13], a[10]),
                                            h = L(h, m, r, g, e[d + a[1]], a[31], a[628]),
                                            g = L(g, h, m, r, e[d + a[23]], a[45], a[224]),
                                            r = L(r, g, h, m, e[d + a[40]], a[58], a[443]),
                                            m = I(r ^ g ^ h, m, r, e[d + a[13]], a[8], a[673]),
                                            h = I(m ^ r ^ g, h, m, e[d + a[27]], a[36], a[475]),
                                            g = I(h ^ m ^ r, g, h, e[d + a[36]], a[49], a[514]),
                                            r = I(g ^ h ^ m, r, g, e[d + a[45]], a[64], a[659]),
                                            m = I(r ^ g ^ h, m, r, e[d + a[675]], a[8], a[559]),
                                            h = I(m ^ r ^ g, h, m, e[d + a[8]], a[36], a[30]),
                                            g = I(h ^ m ^ r, g, h, e[d + a[23]], a[49], a[406]),
                                            r = I(g ^ h ^ m, r, g, e[d + a[34]], a[64], a[484]),
                                            m = I(r ^ g ^ h, m, r, e[d + a[42]], a[8], a[636]),
                                            h = I(m ^ r ^ g, h, m, e[d], a[36], a[462]),
                                            g = I(h ^ m ^ r, g, h, e[d + a[5]], a[49], a[32]),
                                            r = I(g ^ h ^ m, r, g, e[d + a[18]], a[64], a[501]),
                                            m = I(r ^ g ^ h, m, r, e[d + a[31]], a[8], a[667]),
                                            h = I(m ^ r ^ g, h, m, e[d + a[40]], a[36], a[588]),
                                            g = I(h ^ m ^ r, g, h, e[d + a[47]], a[49], a[661]),
                                            r = I(g ^ h ^ m, r, g, e[d + a[1]], a[64], a[472]),
                                            m = M(m, r, g, h, e[d], a[18], a[24]),
                                            h = M(h, m, r, g, e[d + a[23]], a[34], a[567]),
                                            g = M(g, h, m, r, e[d + a[45]], a[47], a[459]),
                                            r = M(r, g, h, m, e[d + a[13]], a[60], a[633]),
                                            m = M(m, r, g, h, e[d + a[40]], a[18], a[665]),
                                            h = M(h, m, r, g, e[d + a[5]], a[34], a[558]),
                                            g = M(g, h, m, r, e[d + a[34]], a[47], a[569]),
                                            r = M(r, g, h, m, e[d + a[675]], a[60], a[422]),
                                            m = M(m, r, g, h, e[d + a[27]], a[18], a[4]),
                                            h = M(h, m, r, g, e[d + a[47]], a[34], a[421]),
                                            g = M(g, h, m, r, e[d + a[18]], a[47], a[464]),
                                            r = M(r, g, h, m, e[d + a[42]], a[60], a[647]),
                                            m = M(m, r, g, h, e[d + a[8]], a[18], a[387]),
                                            h = M(h, m, r, g, e[d + a[36]], a[34], a[537]),
                                            g = M(g, h, m, r, e[d + a[1]], a[47], a[651]),
                                            r = M(r, g, h, m, e[d + a[31]], a[60], a[649]),
                                            m = ha(m, b),
                                            r = ha(r, q),
                                            g = ha(g, l),
                                            h = ha(h, k);
                                    e = [m, r, g, h];
                                    b = c[0];
                                    q = e.length * a[82];
                                    for (d = a[0]; d < q; d += a[27])
                                        b += String.fromCharCode(e[d >> a[13]] >>> d % a[82] & a[333]);
                                    return b
                                }
                                function ac(d) {
                                    var f = b[413], e = c[0], q, l;
                                    for (l = a[0]; l < d.length; l += a[675])
                                        q = d.charCodeAt(l),
                                            e += f.charAt(q >>> a[8] & a[47]) + f.charAt(q & a[47]);
                                    return e
                                }
                                function bc() {
                                    var d = (new Date)[c[203]]()
                                        , f = Math[b[122]](d / a[505])
                                        , e = d % a[505]
                                        , d = X(f)
                                        , e = X(e)
                                        , f = [];
                                    ga(d, a[0], f, a[0], a[8]);
                                    ga(e, a[0], f, a[8], a[8]);
                                    e = [];
                                    for (d = a[0]; d < a[27]; d++)
                                        e[d] = D(Math[b[122]](Math[c[218]]() * a[335]));
                                    for (var d = [], q = a[0]; q < f.length * a[1]; q++) {
                                        if (q % a[1] == a[0]) {
                                            var l = q / a[1];
                                            d[q] = d[q] | (e[l] & a[49]) >>> a[8] | (e[l] & a[82]) >>> a[5] | (e[l] & a[150]) >>> a[1] | (e[l] & a[285]) >>> a[675] | (f[l] & a[49]) >>> a[5] | (f[l] & a[82]) >>> a[1] | (f[l] & a[150]) >>> a[675] | (f[l] & a[285]) >>> a[0]
                                        } else
                                            l = Math[b[122]](q / a[1]),
                                                d[q] = d[q] | (e[l] & a[675]) << a[0] | (e[l] & a[1]) << a[675] | (e[l] & a[8]) << a[1] | (e[l] & a[27]) << a[5] | (f[l] & a[675]) << a[675] | (f[l] & a[1]) << a[1] | (f[l] & a[8]) << a[5] | (f[l] & a[27]) << a[8];
                                        d[q] = D(d[q])
                                    }
                                    f = gb(d);
                                    f = ac($b(cc(Z(f + b[256]))));
                                    f = hb(f.substring(a[0], a[49]));
                                    return Ub(f.concat(d))
                                }
                                function dc(Did) {
                                    var a = {
                                        "C":bc1,
                                        "la":false
                                    }
                                    var f = a.C
                                        , e = a.la
                                        , q = Did
                                        , l = C[b[163]][b[316]].za;
                                    a = {
                                        r: l,
                                        d: q || c[0],
                                        b: f
                                    };
                                    e && (f = hb(ac($b(cc(Z(l + q + f + b[291]))))),
                                        a.t = Ub(f));
                                    try {
                                        return Na(JSON[b[139]](a))
                                    } catch (g) {
                                        return Na(b[161])
                                    }
                                }
                                get_actoken = dc;
                                function nb() {
                                    var a = ea().k(ta)
                                        , f = W().k(ob)
                                        , a = {
                                        r: C[b[163]][b[316]].za,
                                        d: a || c[0],
                                        i: f
                                    };
                                    try {
                                        return Na(JSON[b[139]](a))
                                    } catch (e) {
                                        return Na(b[161])
                                    }
                                }
                                function Lc(a, b) {
                                    for (var e in b)
                                        a[c[219]](e, b[e])
                                }
                                function Mb(a, f) {
                                    a[c[240]] = function() {
                                        this[b[264]] = this[c[240]] = null;
                                        f(null, a)
                                    }
                                    ;
                                    a[b[264]] = function() {
                                        this[b[264]] = this[c[240]] = null;
                                        f(Error(b[102] + this[b[127]]), a)
                                    }
                                }
                                function Mc(a, f) {
                                    a[b[182]] = function() {
                                        if (this[b[88]] == b[69] || this[b[88]] == b[232])
                                            this[b[182]] = null,
                                                f(null, a)
                                    }
                                }
                                function fa(d, f) {
                                    return N(d) === b[265] ? d.length > f ? d.slice(a[0], f) : d : N(d) === b[437] ? d.length > f ? d.slice(-f) : d : d
                                }
                                function Dc() {
                                    var b = a[333];
                                    return ec < b ? ++ec : b
                                }
                                function Jc(a) {
                                    switch (N(a)) {
                                        case b[265]:
                                            return a.replace(/,/g, c[0]);
                                        case b[86]:
                                            return a();
                                        case b[437]:
                                            return a.join(c[0]);
                                        default:
                                            return a
                                    }
                                }
                                function da(b, f) {
                                    b = [b[0] >>> a[49], b[0] & a[602], b[1] >>> a[49], b[1] & a[602]];
                                    f = [f[0] >>> a[49], f[0] & a[602], f[1] >>> a[49], f[1] & a[602]];
                                    var e = [a[0], a[0], a[0], a[0]];
                                    e[3] += b[3] + f[3];
                                    e[2] += e[3] >>> a[49];
                                    e[3] &= a[602];
                                    e[2] += b[2] + f[2];
                                    e[1] += e[2] >>> a[49];
                                    e[2] &= a[602];
                                    e[1] += b[1] + f[1];
                                    e[0] += e[1] >>> a[49];
                                    e[1] &= a[602];
                                    e[0] += b[0] + f[0];
                                    e[0] &= a[602];
                                    return [e[0] << a[49] | e[1], e[2] << a[49] | e[3]]
                                }
                                function Q(b, f) {
                                    b = [b[0] >>> a[49], b[0] & a[602], b[1] >>> a[49], b[1] & a[602]];
                                    f = [f[0] >>> a[49], f[0] & a[602], f[1] >>> a[49], f[1] & a[602]];
                                    var e = [a[0], a[0], a[0], a[0]];
                                    e[3] += b[3] * f[3];
                                    e[2] += e[3] >>> a[49];
                                    e[3] &= a[602];
                                    e[2] += b[2] * f[3];
                                    e[1] += e[2] >>> a[49];
                                    e[2] &= a[602];
                                    e[2] += b[3] * f[2];
                                    e[1] += e[2] >>> a[49];
                                    e[2] &= a[602];
                                    e[1] += b[1] * f[3];
                                    e[0] += e[1] >>> a[49];
                                    e[1] &= a[602];
                                    e[1] += b[2] * f[2];
                                    e[0] += e[1] >>> a[49];
                                    e[1] &= a[602];
                                    e[1] += b[3] * f[1];
                                    e[0] += e[1] >>> a[49];
                                    e[1] &= a[602];
                                    e[0] += b[0] * f[3] + b[1] * f[2] + b[2] * f[1] + b[3] * f[0];
                                    e[0] &= a[602];
                                    return [e[0] << a[49] | e[1], e[2] << a[49] | e[3]]
                                }
                                function sa(b, f) {
                                    f %= a[150];
                                    if (f === a[82])
                                        return [b[1], b[0]];
                                    if (f < a[82])
                                        return [b[0] << f | b[1] >>> a[82] - f, b[1] << f | b[0] >>> a[82] - f];
                                    f -= a[82];
                                    return [b[1] << f | b[0] >>> a[82] - f, b[0] << f | b[1] >>> a[82] - f]
                                }
                                function O(b, f) {
                                    f %= a[150];
                                    return f === a[0] ? b : f < a[82] ? [b[0] << f | b[1] >>> a[82] - f, b[1] << f] : [b[1] << f - a[82], a[0]]
                                }
                                function F(a, b) {
                                    return [a[0] ^ b[0], a[1] ^ b[1]]
                                }
                                function Ib(b) {
                                    b = F(b, [a[0], b[0] >>> a[675]]);
                                    b = Q(b, [a[445], a[596]]);
                                    b = F(b, [a[0], b[0] >>> a[675]]);
                                    b = Q(b, [a[684], a[624]]);
                                    return b = F(b, [a[0], b[0] >>> a[675]])
                                }
                                function fc() {
                                    function d(d) {
                                        for (var f = !1, c = a[0]; c < e.length && !(f = d[c][b[360]] !== k[e[c]] || d[c][b[211]] !== p[e[c]]); c++)
                                            ;
                                        return f
                                    }
                                    function f() {
                                        var a = w[c[182]](b[382]);
                                        a[b[341]][b[104]] = b[210];
                                        a[b[341]][c[47]] = b[190];
                                        a[b[341]][b[31]] = l;
                                        a[b[341]][b[379]] = b[282];
                                        a[b[384]] = q;
                                        return a
                                    }
                                    if (pb)
                                        return pb;
                                    var e = [b[246], b[414], x[20]]
                                        , q = b[89]
                                        , l = b[179]
                                        , g = w[c[98]](b[81])[0]
                                        , m = w[c[182]](c[164])
                                        , h = w[c[182]](c[164])
                                        , k = {}
                                        , p = {}
                                        , n = function() {
                                        for (var d = [], l = a[0], q = e.length; l < q; l++) {
                                            var g = f();
                                            g[b[341]][b[395]] = e[l];
                                            m[c[12]](g);
                                            d.push(g)
                                        }
                                        return d
                                    }();
                                    g[c[12]](m);
                                    for (var t = a[0], v = e.length; t < v; t++)
                                        k[e[t]] = n[t][b[360]],
                                            p[e[t]] = n[t][b[211]];
                                    n = function() {
                                        for (var d = {}, l = a[0], q = fontList.length; l < q; l++) {
                                            for (var g = [], m = a[0], k = e.length; m < k; m++) {
                                                var p;
                                                p = fontList[l];
                                                var n = e[m]
                                                    , u = f();
                                                u[b[341]][b[395]] = c[21] + p + c[231] + n;
                                                p = u;
                                                h[c[12]](p);
                                                g.push(p)
                                            }
                                            d[fontList[l]] = g
                                        }
                                        return d
                                    }();
                                    g[c[12]](h);
                                    for (var t = [], v = a[0], y = fontList.length; v < y; v++)
                                        d(n[fontList[v]]) && t.push(fontList[v]);
                                    g[b[148]](h);
                                    g[b[148]](m);
                                    return pb = t
                                }
                                function ad() {
                                    var a = w[c[182]](b[324])
                                        , f = null;
                                    try {
                                        f = a[x[25]](b[75]) || a[x[25]](b[364])
                                    } catch (e) {}
                                    f || (f = null);
                                    return f
                                }
                                function bd() {
                                    function d(d) {
                                        f[b[435]](a[0], a[0], a[0], a[675]);
                                        f.enable(f[c[190]]);
                                        f[b[342]](f[x[12]]);
                                        f.clear(f[c[104]] | f[b[331]]);
                                        return c[96] + d[0] + b[65] + d[1] + c[99]
                                    }
                                    if (Da)
                                        return Da;
                                    var f;
                                    f = ad();
                                    if (!f)
                                        return Da = [];
                                    var e = [];
                                    try {
                                        var q = c[227]
                                            , l = c[230]
                                            , g = f[b[275]]();
                                        f[b[263]](f[b[367]], g);
                                        var m = new Float32Array([a[538], a[604], a[0], a[533], a[562], a[0], a[0], a[580], a[0]]);
                                        f.bufferData(f[b[367]], m, f[b[250]]);
                                        g.wc = a[5];
                                        g.Ac = a[5];
                                        var h = f[b[240]]()
                                            , k = f[b[280]](f[b[91]]);
                                        f[b[301]](k, q);
                                        f[b[201]](k);
                                        var p = f[b[280]](f[b[422]]);
                                        f[b[301]](p, l);
                                        f[b[201]](p);
                                        f[c[200]](h, k);
                                        f[c[200]](h, p);
                                        f[b[277]](h);
                                        f[b[153]](h);
                                        h.Hc = f[b[348]](h, b[16]);
                                        h.Bc = f[b[298]](h, b[259]);
                                        f[b[312]](h.Qc);
                                        f[b[445]](h.Hc, g.wc, f.FLOAT, !a[675], a[0], a[0]);
                                        f[x[26]](h.Bc, a[675], a[675]);
                                        f[c[146]](f[b[82]], a[0], g.Ac)
                                    } catch (n) {}
                                    null != f[b[324]] && e.push(f[b[324]][c[158]]());
                                    e.push(b[143] + f[c[9]]().join(c[0]));
                                    e.push(b[149] + d(f[b[321]](f[b[430]])));
                                    e.push(b[258] + d(f[b[321]](f[b[117]])));
                                    e.push(x[27] + f[b[321]](f[b[35]]));
                                    e.push(c[248] + (f[c[42]]().antialias ? b[286] : b[107]));
                                    e.push(b[224] + f[b[321]](f[b[111]]));
                                    e.push(c[210] + f[b[321]](f[b[30]]));
                                    e.push(b[119] + f[b[321]](f[b[241]]));
                                    e.push(b[164] + function(d) {
                                        var e, f = d[b[358]](b[168]) || d[b[358]](b[42]) || d[b[358]](c[173]);
                                        return f ? (e = d[b[321]](f[b[66]]),
                                        a[0] === e && (e = a[1]),
                                            e) : null
                                    }(f));
                                    e.push(b[415] + f[b[321]](f[b[268]]));
                                    e.push(c[212] + f[b[321]](f[c[168]]));
                                    e.push(b[375] + f[b[321]](f[b[43]]));
                                    e.push(b[21] + f[b[321]](f[b[83]]));
                                    e.push(b[397] + f[b[321]](f[b[254]]));
                                    e.push(b[150] + f[b[321]](f[b[52]]));
                                    e.push(c[186] + f[b[321]](f[b[318]]));
                                    e.push(b[39] + f[b[321]](f[c[64]]));
                                    e.push(b[235] + f[b[321]](f[b[236]]));
                                    e.push(c[14] + f[b[321]](f[b[56]]));
                                    e.push(b[109] + d(f[b[321]](f[b[54]])));
                                    e.push(b[40] + f[b[321]](f[b[76]]));
                                    e.push(c[201] + f[b[321]](f[b[126]]));
                                    e.push(c[176] + f[b[321]](f[b[195]]));
                                    e.push(b[283] + f[b[321]](f[b[323]]));
                                    e.push(c[224] + f[b[321]](f[x[21]]));
                                    e.push(c[124] + f[b[321]](f[b[376]]));
                                    try {
                                        var t = f[b[358]](c[174]);
                                        t && (e.push(c[250] + f[b[321]](t.UNMASKED_VENDOR_WEBGL)),
                                            e.push(b[350] + f[b[321]](t.UNMASKED_RENDERER_WEBGL)))
                                    } catch (v) {}
                                    if (!f[c[25]])
                                        return Da = e;
                                    e.push(c[170] + f[c[25]](f[b[91]], f[b[325]])[b[78]]);
                                    e.push(b[416] + f[c[25]](f[b[91]], f[b[325]])[c[206]]);
                                    e.push(c[171] + f[c[25]](f[b[91]], f[b[325]])[b[134]]);
                                    e.push(b[289] + f[c[25]](f[b[91]], f[b[266]])[b[78]]);
                                    e.push(b[219] + f[c[25]](f[b[91]], f[b[266]])[c[206]]);
                                    e.push(b[418] + f[c[25]](f[b[91]], f[b[266]])[b[134]]);
                                    e.push(b[180] + f[c[25]](f[b[91]], f[b[198]])[b[78]]);
                                    e.push(x[13] + f[c[25]](f[b[91]], f[b[198]])[c[206]]);
                                    e.push(b[317] + f[c[25]](f[b[91]], f[b[198]])[b[134]]);
                                    e.push(c[229] + f[c[25]](f[b[422]], f[b[325]])[b[78]]);
                                    e.push(b[13] + f[c[25]](f[b[422]], f[b[325]])[c[206]]);
                                    e.push(b[187] + f[c[25]](f[b[422]], f[b[325]])[b[134]]);
                                    e.push(c[185] + f[c[25]](f[b[422]], f[b[266]])[b[78]]);
                                    e.push(b[310] + f[c[25]](f[b[422]], f[b[266]])[c[206]]);
                                    e.push(c[59] + f[c[25]](f[b[422]], f[b[266]])[b[134]]);
                                    e.push(b[334] + f[c[25]](f[b[422]], f[b[198]])[b[78]]);
                                    e.push(b[347] + f[c[25]](f[b[422]], f[b[198]])[c[206]]);
                                    e.push(c[121] + f[c[25]](f[b[422]], f[b[198]])[b[134]]);
                                    e.push(b[421] + f[c[25]](f[b[91]], f[b[133]])[b[78]]);
                                    e.push(b[311] + f[c[25]](f[b[91]], f[b[133]])[c[206]]);
                                    e.push(b[442] + f[c[25]](f[b[91]], f[b[133]])[b[134]]);
                                    e.push(b[112] + f[c[25]](f[b[91]], f[b[368]])[b[78]]);
                                    e.push(b[167] + f[c[25]](f[b[91]], f[b[368]])[c[206]]);
                                    e.push(b[51] + f[c[25]](f[b[91]], f[b[368]])[b[134]]);
                                    e.push(c[254] + f[c[25]](f[b[91]], f[c[94]])[b[78]]);
                                    e.push(b[326] + f[c[25]](f[b[91]], f[c[94]])[c[206]]);
                                    e.push(b[151] + f[c[25]](f[b[91]], f[c[94]])[b[134]]);
                                    e.push(b[96] + f[c[25]](f[b[422]], f[b[133]])[b[78]]);
                                    e.push(b[419] + f[c[25]](f[b[422]], f[b[133]])[c[206]]);
                                    e.push(b[238] + f[c[25]](f[b[422]], f[b[133]])[b[134]]);
                                    e.push(b[228] + f[c[25]](f[b[422]], f[b[368]])[b[78]]);
                                    e.push(c[71] + f[c[25]](f[b[422]], f[b[368]])[c[206]]);
                                    e.push(b[315] + f[c[25]](f[b[422]], f[b[368]])[b[134]]);
                                    e.push(c[153] + f[c[25]](f[b[422]], f[c[94]])[b[78]]);
                                    e.push(b[17] + f[c[25]](f[b[422]], f[c[94]])[c[206]]);
                                    e.push(c[137] + f[c[25]](f[b[422]], f[c[94]])[b[134]]);
                                    return Da = e
                                }
                                function cd(d) {
                                    function f(a) {
                                        e(a);
                                        e = function() {}
                                    }
                                    function e(a) {
                                        return d(a)
                                    }
                                    if (gc)
                                        return d(gc);
                                    try {
                                        var q = new hc(a[675],a[293],a[293])
                                            , l = q[b[292]]();
                                        l[b[309]] = b[351];
                                        l[b[231]][b[443]] = a[404];
                                        var g = q[b[332]]();
                                        g[b[388]] && (g[b[388]][b[443]] = a[120]);
                                        g[b[62]] && (g[b[62]][b[443]] = a[98]);
                                        g[b[220]] && (g[b[220]][b[443]] = a[40]);
                                        g[x[23]] && (g[x[23]][b[443]] = a[59]);
                                        g[b[197]] && (g[b[197]][b[443]] = a[0]);
                                        g[b[1]] && (g[b[1]][b[443]] = a[666]);
                                        l[c[100]](g);
                                        g[c[100]](q[b[272]]);
                                        l[b[290]](a[0]);
                                        ya(function() {
                                            f(c[0]);
                                            q[b[90]] = function() {}
                                            ;
                                            q = null
                                        }, a[376]);
                                        q[b[90]] = function(d) {
                                            try {
                                                var e = Xa(za(d[b[431]][c[40]](a[0]).slice(a[395], a[397]), function(a, b) {
                                                    return a + Math.abs(b)
                                                }).toString());
                                                f(e);
                                                l[b[306]]();
                                                g[b[306]]()
                                            } catch (q) {
                                                f(c[0])
                                            }
                                        }
                                        ;
                                        q[c[202]]()
                                    } catch (m) {
                                        f(c[0])
                                    }
                                }
                                function ic() {
                                    var d = v[b[361]].toLowerCase();
                                    return d.indexOf(c[232]) >= a[0] ? b[141] : d.indexOf(b[444]) >= a[0] && d.indexOf(c[30]) < a[0] ? b[110] : d.indexOf(b[270]) >= a[0] ? b[98] : d.indexOf(b[279]) >= a[0] ? c[194] : d.indexOf(b[333]) >= a[0] || d.indexOf(b[423]) >= a[0] ? c[6] : d.indexOf(b[47]) >= a[0] ? b[27] : b[221]
                                }
                                function jc() {
                                    var d = []
                                        , d = [].slice.call(v[c[3]], a[0]);
                                    return d.map(function(d) {
                                        var e = [].slice.call(d, a[0]).map(function(a) {
                                            return [a.type, a[c[154]]].join(c[150])
                                        }).join(c[28]);
                                        return [d.name, d[b[273]], e].join(b[345])
                                    })
                                }
                                function dd() {
                                    var a = [];
                                    if (Object[b[12]] && Object[b[12]](y, b[209]) || b[209]in y)
                                        a = [b[53], b[118], b[170], b[128], b[425], c[243], b[337], b[33], b[362], c[197], c[178], b[48], b[222], c[110], b[287], c[156], b[165], b[207], b[377], b[178], b[67], c[108]].map(function(a) {
                                            try {
                                                return new ed(a),
                                                    a
                                            } catch (b) {
                                                return null
                                            }
                                        });
                                    v[c[3]] && (a = a.concat(jc()));
                                    return a
                                }
                                function kc() {
                                    var a = w[c[182]](b[324]);
                                    return !(!a[x[25]] || !a[x[25]](b[208]))
                                }
                                function fd() {
                                    return v[c[233]] === c[7] || v[c[233]] === b[390] && /Trident/.test(v[b[361]]) ? !0 : !1
                                }
                                function ja(a, b, e) {
                                    return function() {
                                        var c, l, g;
                                        e = e || this;
                                        l = J();
                                        c = a.apply(e, arguments);
                                        g = J();
                                        C.h(qb, {
                                            cursor: b,
                                            value: g - l
                                        });
                                        return c
                                    }
                                }
                                function gd(a, b) {
                                    var e = void 0;
                                    return function(c) {
                                        var l, g;
                                        e = e || this;
                                        l = J();
                                        a.apply(e, [function(a) {
                                            g = J();
                                            C.h(qb, {
                                                cursor: b,
                                                value: g - l
                                            });
                                            c(a)
                                        }
                                        ])
                                    }
                                }
                                _gd = gd;
                                function rb(b, f) {
                                    for (var e = f.split(c[33]), g = b, l = a[0]; l < e.length; l++) {
                                        if (void 0 == g[e[l]])
                                            return;
                                        g = g[e[l]]
                                    }
                                    return g
                                }
                                function hd() {
                                    for (var d = [b[57], b[71], b[159], b[121], c[220], c[204], b[154], b[427], b[366], b[427], b[87], b[58], b[132], b[322], x[24], c[172]], f = [b[276], c[225], b[336], b[404], b[123], b[14], x[7], c[60], b[446], b[177], c[106]], e = [c[86], c[172], b[29]], g = a[0], l = d.length; g < l; g++)
                                        if (rb(y, d[g]))
                                            return g + a[675];
                                    d = a[0];
                                    for (g = f.length; d < g; d++)
                                        if (rb(w, f[d]))
                                            return d + a[119];
                                    f = a[0];
                                    for (d = e.length; f < d; f++)
                                        if (w[b[262]][b[436]](e[f]))
                                            return f + a[226];
                                    return !0 === rb(v, c[172]) ? a[287] : a[0]
                                }
                                function Oa(b) {
                                    return w[c[98]](b) && w[c[98]](b).length || a[0]
                                }
                                function lc(d) {
                                    return N(d) === b[353] ? a[675] : d ? a[1] : a[5]
                                }
                                function mc(b) {
                                    var c = a[602];
                                    null == oa[b] && (oa[b] = a[0]);
                                    return oa[b] < c ? ++oa[b] : c
                                }
                                function id(b) {
                                    function c(m) {
                                        m >= b || (c(m * a[1] + a[675]),
                                        e === g && (h = m,
                                            g++,
                                            l = !0),
                                        l || e++,
                                            c(m * a[1] + a[1]))
                                    }
                                    var e = a[0], g = a[0], l = !1, h;
                                    return function() {
                                        g >= b && (g = a[0]);
                                        l = !1;
                                        e = a[0];
                                        c(a[0]);
                                        return h
                                    }
                                }
                                function Ea(a, b, e) {
                                    a[b] = e
                                }
                                function jd() {
                                    var a = y[nc]
                                        , f = {};
                                    if (!a)
                                        throw Error(b[344]);
                                    pa || (pa = new g(a));
                                    Ea(f, b[290], function() {
                                        pa._start()
                                    });
                                    Ea(f, c[45], function() {
                                        pa._stop()
                                    });
                                    Ea(f, b[68], function(e, c, f, g) {
                                        if (e)
                                            pa._getToken(e, c, f, g);
                                        else if (typeof a[b[264]] === b[86])
                                            a[b[264]](Error(b[373]))
                                    });
                                    Ea(f, c[5], function(a) {
                                        pa._getNdInfo(a)
                                    });
                                    Ea(f, c[235], function(a) {
                                        pa._setCustomTrackId(a)
                                    });
                                    if (typeof a[c[240]] === b[86])
                                        a[c[240]](f)
                                }
                                Array.prototype.forEach || (Array.prototype.forEach = function(d, c) {
                                        var e, g;
                                        if (null == this)
                                            throw new TypeError(b[55]);
                                        var l = Object(this)
                                            , h = l.length >>> a[0];
                                        if (typeof d !== b[86])
                                            throw new TypeError(d + b[145]);
                                        arguments.length > a[675] && (e = c);
                                        for (g = a[0]; g < h; ) {
                                            var m;
                                            g in l && (m = l[g],
                                                d.call(e, m, g, l));
                                            g++
                                        }
                                    }
                                );
                                Array.prototype.filter || (Array.prototype.filter = function(d) {
                                        if (void 0 === this || null === this)
                                            throw new TypeError;
                                        var c = Object(this)
                                            , e = c.length >>> a[0];
                                        if (typeof d !== b[86])
                                            throw new TypeError;
                                        for (var g = [], l = arguments.length >= a[1] ? arguments[1] : void 0, h = a[0]; h < e; h++)
                                            if (h in c) {
                                                var m = c[h];
                                                d.call(l, m, h, c) && g.push(m)
                                            }
                                        return g
                                    }
                                );
                                Array.prototype.map || (Array.prototype.map = function(d, c) {
                                        var e, g, l;
                                        if (null == this)
                                            throw new TypeError(b[55]);
                                        var h = Object(this)
                                            , m = h.length >>> a[0];
                                        if (Object.prototype.toString.call(d) !== b[405])
                                            throw new TypeError(d + b[145]);
                                        c && (e = c);
                                        g = Array(m);
                                        for (l = a[0]; l < m; ) {
                                            var k;
                                            l in h && (k = h[l],
                                                k = d.call(e, k, l, h),
                                                g[l] = k);
                                            l++
                                        }
                                        return g
                                    }
                                );
                                Array.prototype.indexOf || (Array.prototype.indexOf = function(d, c) {
                                        var e;
                                        if (null == this)
                                            throw new TypeError(b[92]);
                                        var g = Object(this)
                                            , l = g.length >>> a[0];
                                        if (l === a[0])
                                            return a[674];
                                        e = +c || a[0];
                                        Infinity === Math.abs(e) && (e = a[0]);
                                        if (e >= l)
                                            return a[674];
                                        for (e = Math[b[59]](e >= a[0] ? e : l - Math.abs(e), a[0]); e < l; ) {
                                            if (e in g && g[e] === d)
                                                return e;
                                            e++
                                        }
                                        return a[674]
                                    }
                                );
                                var kd = window[b[185]];
                                (function() {
                                        var d = Array.prototype.slice;
                                        try {
                                            d.call(kd[b[262]])
                                        } catch (c) {
                                            Array.prototype.slice = function(c, f) {
                                                f = typeof f !== b[353] ? f : this.length;
                                                if (Object.prototype.toString.call(this) === b[108])
                                                    return d.call(this, c, f);
                                                var g, h = [], m;
                                                g = this.length;
                                                var k = c || a[0]
                                                    , k = k >= a[0] ? k : g + k;
                                                m = f ? f : g;
                                                f < a[0] && (m = g + f);
                                                m -= k;
                                                if (m > a[0])
                                                    if (h = Array(m),
                                                        this.charAt)
                                                        for (g = a[0]; g < m; g++)
                                                            h[g] = this.charAt(k + g);
                                                    else
                                                        for (g = a[0]; g < m; g++)
                                                            h[g] = this[k + g];
                                                return h
                                            }
                                        }
                                    }
                                )();
                                Object.keys || (Object.keys = function() {
                                    var d = Object.prototype.hasOwnProperty
                                        , f = !{
                                        toString: null
                                    }.propertyIsEnumerable(c[148])
                                        , e = [c[148], b[261], b[288], b[115], b[142], b[181], b[249]]
                                        , g = e.length;
                                    return function(l) {
                                        if (typeof l !== b[86] && (typeof l !== c[57] || null === l))
                                            throw new TypeError(c[253]);
                                        var h = [], m;
                                        for (m in l)
                                            d.call(l, m) && h.push(m);
                                        if (f)
                                            for (m = a[0]; m < g; m++)
                                                d.call(l, e[m]) && h.push(e[m]);
                                        return h
                                    }
                                }());
                                typeof Object.create !== b[86] && (Object.create = function(a, f) {
                                        function e() {}
                                        if (typeof a !== c[57] && typeof a !== b[86])
                                            throw new TypeError(b[200] + a);
                                        if (null === a)
                                            throw Error(c[145]);
                                        if (typeof f !== b[353])
                                            throw Error(b[439]);
                                        e.prototype = a;
                                        return new e
                                    }
                                );
                                String.prototype.trim || (String.prototype.trim = function() {
                                        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, c[0])
                                    }
                                );
                                var nc = b[299]
                                    , Ia = b[356]
                                    , ta = b[410]
                                    , oc = b[355]
                                    , ob = b[330]
                                    , pc = b[319]
                                    , z = b[244]
                                    , t = b[212]
                                    , Y = b[303]
                                    , B = b[252]
                                    , H = b[74]
                                    , Gb = x[22]
                                    , Za = b[408]
                                    , Hb = b[136]
                                    , Nb = typeof window !== b[353] ? window : Nb
                                    , y = E(b[304])
                                    , w = E(b[185])
                                    , v = E(b[225])
                                    , Fa = E(b[79])
                                    , Bb = E(b[302])
                                    , cb = E(b[213])
                                    , ld = E(b[199])
                                    , qa = E(b[269])
                                    , md = E(c[216])
                                    , nd = E(b[274])
                                    , od = E(b[320])
                                    , qc = E(c[128])
                                    , ed = E(b[209])
                                    , pd = E(b[2])
                                    , Z = E(b[260])
                                    , Zb = E(x[15])
                                    , ya = E(c[131])
                                    , qd = E(b[438])
                                    , ua = E(b[160])
                                    , na = E(b[296])
                                    , Cb = E(c[180])
                                    , Ca = E(x[14])
                                    , cc = E(x[10])
                                    , hc = E(b[223]) || E(c[246])
                                    , Rc = {}.toString;
                                va.prototype.Fc = function(a) {
                                    this.ja = Ha(this.ja || {}, a)
                                }
                                ;
                                va.prototype.Ec = function(a) {
                                    this.da = Ha(this.da || {}, a)
                                }
                                ;
                                va.prototype.h = function(a, c, e) {
                                    if (a = this.da[a])
                                        return a({
                                            state: this[b[163]],
                                            B: this.B,
                                            h: this.h
                                        }, c, e)
                                }
                                ;
                                va.prototype.B = function(a, c) {
                                    var e = this
                                        , g = {
                                        type: a,
                                        Oc: c
                                    }
                                        , l = this.ja[a];
                                    l && (this.ec(function() {
                                        return l(e[b[163]], c)
                                    }),
                                        this.Rb.map(function(a) {
                                            return a(g, e[b[163]])
                                        }))
                                }
                                ;
                                va.prototype.ec = function(a) {
                                    var b = this.fa;
                                    this.fa = !0;
                                    a();
                                    this.fa = b
                                }
                                ;
                                var Pc = {
                                    name: b[363],
                                    m: function(a, f, e) {
                                        e = e ? b[218] + e : c[0];
                                        w[b[18]] = Z(a) + c[55] + Z(f) + c[247] + e + c[54]
                                    },
                                    k: function(d) {
                                        for (var f = (w[b[18]] || c[0]).split(c[54]), e = a[0], g = f.length; e < g; e++) {
                                            var l = f[e].split(c[55])
                                                , h = l[0]
                                                , l = l[1];
                                            void 0 === l && (l = c[0]);
                                            if (h === d)
                                                return Zb(l)
                                        }
                                        return null
                                    },
                                    W: function(a) {
                                        w[b[18]] = Z(a) + b[372]
                                    }
                                }
                                    , Qc = {
                                    name: b[269],
                                    m: function(a, c) {
                                        try {
                                            (y[b[269]] || {}).setItem(a, c)
                                        } catch (e) {}
                                    },
                                    k: function(a) {
                                        try {
                                            return (y[b[269]] || {})[c[4]](a)
                                        } catch (f) {}
                                    },
                                    W: function(a) {
                                        try {
                                            return (y[b[269]] || {})[c[199]](a)
                                        } catch (f) {}
                                    }
                                }
                                    , Pa = {}
                                    , Oc = {
                                    name: c[221],
                                    m: function(a, b) {
                                        Pa[a] = b
                                    },
                                    k: function(a) {
                                        return Pa[a]
                                    },
                                    W: function(a) {
                                        a in Pa && delete Pa[a]
                                    }
                                };
                                Ba.prototype.m = function(a, b, c) {
                                    var g = this;
                                    this.X.forEach(function(l) {
                                        return l.m(g.o(a), b, c)
                                    })
                                }
                                ;
                                Ba.prototype.k = function(b) {
                                    for (var f = a[0]; f < this.X.length; f++) {
                                        var e = this.X[f].k(this.o(b));
                                        if (e)
                                            return e
                                    }
                                    return c[0]
                                }
                                ;
                                Ba.prototype.W = function(a) {
                                    var b = this;
                                    this.X.forEach(function(c) {
                                        return c.Pc(b.o(a))
                                    })
                                }
                                ;
                                Ba.prototype.o = function(a) {
                                    return this.p ? this.p + c[53] + a : a
                                }
                                ;
                                var Ka = {};
                                ma.prototype.m = function(d, c, e) {
                                    d = this.o(d);
                                    if (c && typeof c === b[265]) {
                                        e = J() + na(e, a[34]);
                                        c = [c, e, J()].join(this.R);
                                        this.w[d] = c;
                                        try {
                                            qa.setItem(d, c)
                                        } catch (g) {}
                                    }
                                }
                                ;
                                ma.prototype.sc = function(b) {
                                    b = this.o(b);
                                    var f = this.w[b];
                                    if (!f)
                                        try {
                                            f = qa[c[4]](b)
                                        } catch (e) {}
                                    if (!f)
                                        return !1;
                                    b = J();
                                    var f = f.split(this.R)
                                        , g = +f[2] || a[0];
                                    return b <= +(+f[1] || a[0]) && b > g ? !0 : !1
                                }
                                ;
                                ma.prototype.k = function(a) {
                                    a = this.o(a);
                                    var b = this.w[a];
                                    if (!b)
                                        try {
                                            b = qa[c[4]](a),
                                                this.w[a] = b
                                        } catch (e) {}
                                    return b ? b.split(this.R)[0] || c[0] : c[0]
                                }
                                ;
                                ma.prototype.qc = function(b) {
                                    b = this.o(b);
                                    var f = this.w[b];
                                    if (!f)
                                        try {
                                            f = qa[c[4]](b),
                                                this.w[b] = f
                                        } catch (e) {}
                                    return f ? f.split(this.R)[1] || a[0] : c[0]
                                }
                                ;
                                ma.prototype.W = function(a) {
                                    a = this.o(a);
                                    delete this.w[a];
                                    try {
                                        qa[c[199]](a)
                                    } catch (b) {}
                                }
                                ;
                                ma.prototype.o = function(a) {
                                    return this.p ? this.p + c[53] + a : a
                                }
                                ;
                                var La = {}
                                    , Tc = a[0]
                                    , sb = a[675]
                                    , rc = a[1]
                                    , sc = a[5]
                                    , Qa = {};
                                Qa[sc] = c[208];
                                Qa[rc] = b[369];
                                Qa[sb] = c[193];
                                var T = function(a) {
                                    function f(e, f, g) {
                                        void 0 === g && (g = {});
                                        a.call(this);
                                        this.name = b[146];
                                        this.code = e || sb;
                                        this.message = e + c[22] + Qa[e] + c[23] + (f ? b[101] + f : c[0]);
                                        this.data = g;
                                        a.captureStackTrace ? a.captureStackTrace(this, this.constructor) : this[c[2]] = (new a)[c[2]]
                                    }
                                    a && (f.__proto__ = a);
                                    f.prototype = Object.create(a && a.prototype);
                                    f.prototype.constructor = f;
                                    f.prototype.toString = function() {
                                        return this[c[2]] ? c[0] + this[c[2]] : this.name + b[327] + this.message
                                    }
                                    ;
                                    return f
                                }(Error);
                                T.L = sc;
                                T.Jc = rc;
                                T.UNKNOWN_ERROR = sb;
                                var tc = b[6]
                                    , uc = b[103]
                                    , vc = b[46]
                                    , ka = b[403]
                                    , wc = b[402]
                                    , tb = b[401]
                                    , ub = b[396]
                                    , xc = b[393]
                                    , vb = b[392]
                                    , qb = b[391]
                                    , yc = b[398]
                                    , Sb = [c[129], c[92], c[79], c[85], c[65], c[41], c[91], c[87], c[48], c[49], c[109], c[69], c[140], c[43], c[72], c[136], c[132], c[103], c[75], c[68], c[125], c[46], c[37], c[82], c[35], c[114], c[126], c[138], c[144], c[147], c[127], c[61], c[39], c[80], c[118], c[33], c[115], c[123], c[88], c[27], c[78], c[105], c[74], c[119], c[77], c[120], c[141], c[95], c[93], c[83], c[143], c[51], c[38], c[111], c[116], c[52], c[62], c[90], c[81], c[70], c[67], c[149], c[107], c[66]]
                                    , Uc = [c[61], c[62], c[65], c[66], c[67], c[68], c[69], c[70], c[72], c[74], c[75], c[77], c[78], c[79], c[80], c[81], c[82], c[83], c[85], c[87], c[88], c[90], c[91], c[92], c[93], c[95], c[103], c[105], c[107], c[109], c[111], c[114], c[115], c[116], c[118], c[119], c[120], c[122], c[123], c[125], c[126], c[127], c[129], c[132], c[136], c[138], c[140], c[141], c[143], c[144], c[147], c[149], c[37], c[38], c[39], c[41], c[43], c[46], c[48], c[49], c[51], c[52], c[27], c[35]]
                                    , eb = c[122]
                                    , Vc = c[55]
                                    , Xc = [a[185], a[99], a[35], a[141], a[278], a[133], a[33], a[259], a[209], a[108], a[268], a[56], a[152], a[27], a[59], a[70], a[234], a[103], a[111], a[137], a[128], a[260], a[168], a[217], a[251], a[72], a[145], a[261], a[124], a[276], a[200], a[28], a[150], a[94], a[95], a[252], a[138], a[84], a[153], a[166], a[68], a[253], a[169], a[158], a[175], a[129], a[218], a[65], a[86], a[159], a[25], a[279], a[228], a[192], a[242], a[142], a[210], a[36], a[262], a[39], a[235], a[87], a[57], a[170], a[1], a[160], a[74], a[61], a[154], a[243], a[263], a[193], a[116], a[85], a[117], a[269], a[40], a[147], a[3], a[176], a[139], a[201], a[208], a[91], a[73], a[53], a[280], a[75], a[64], a[264], a[45], a[177], a[183], a[130], a[211], a[281], a[43], a[115], a[194], a[265], a[229], a[178], a[236], a[112], a[50], a[254], a[76], a[134], a[69], a[49], a[51], a[195], a[219], a[109], a[42], a[121], a[212], a[161], a[92], a[220], a[202], a[275], a[23], a[162], a[179], a[118], a[186], a[107], a[148], a[8], a[46], a[221], a[270], a[237], a[47], a[31], a[196], a[244], a[81], a[93], a[98], a[674], a[155], a[187], a[63], a[37], a[238], a[222], a[255], a[271], a[180], a[272], a[675], a[96], a[163], a[110], a[239], a[197], a[140], a[230], a[82], a[113], a[171], a[245], a[203], a[97], a[90], a[0], a[231], a[131], a[273], a[282], a[256], a[122], a[246], a[143], a[62], a[257], a[71], a[125], a[213], a[80], a[232], a[172], a[126], a[78], a[173], a[214], a[13], a[216], a[88], a[204], a[60], a[66], a[114], a[104], a[181], a[205], a[11], a[135], a[188], a[240], a[5], a[120], a[54], a[19], a[100], a[247], a[105], a[101], a[67], a[136], a[198], a[15], a[119], a[283], a[266], a[127], a[149], a[226], a[274], a[18], a[189], a[146], a[156], a[258], a[284], a[77], a[48], a[248], a[6], a[174], a[83], a[79], a[241], a[233], a[215], a[199], a[227], a[182], a[190], a[206], a[52], a[157], a[191], a[89], a[207], a[34], a[58], a[106], a[249], a[267], a[164], a[144], a[165], a[223]]
                                    , S = a[150]
                                    , jb = a[150]
                                    , Ma = a[8]
                                    , mb = a[8]
                                    , zc = b[15]
                                    , aa = {};
                                aa[ka] = function(a, b) {
                                    var c = a.B;
                                    void 0 === b && (b = {});
                                    c(vc, Ua(b))
                                }
                                ;
                                aa[wc] = function(d, f, e) {
                                    function g(d, n) {
                                        if (d >= p.length)
                                            e(n);
                                        else {
                                            var t = Ja(h, p[d], c[214]);
                                            Qb(t, {
                                                ba: c[155],
                                                K: {
                                                    d: f,
                                                    v: zc
                                                },
                                                V: function(d) {
                                                    var c = d[0]
                                                        , f = d[1]
                                                        , g = d[2]
                                                        , h = d[3]
                                                        , q = d[5];
                                                    c === a[295] || c === a[349] ? (h && l(xc, {
                                                        id: h,
                                                        xc: k * a[13] / a[18]
                                                    }),
                                                    q && l(yc, {
                                                        id: q
                                                    }),
                                                    g && l(ub, {
                                                        domain: m,
                                                        id: g
                                                    }),
                                                    c === a[349] && f && l(vb, f),
                                                        e(null, d)) : (d = new T(T.L,b[239],{
                                                        url: t
                                                    }),
                                                        e(d))
                                                },
                                                U: function(e) {
                                                    void 0 === e && (e = {});
                                                    e = new T(T.L,b[105] + (e.message ? e.message : c[0]),{
                                                        url: t
                                                    });
                                                    Kb(e, d + a[675]);
                                                    g(d + a[675], e)
                                                }
                                            })
                                        }
                                    }
                                    var l = d.h;
                                    d = d[b[163]];
                                    void 0 === e && (e = V);
                                    d = d[b[316]];
                                    var h = d[b[394]]
                                        , m = d[c[50]]
                                        , k = d.mc
                                        , p = d.apiServers;
                                    g(a[0])
                                }
                                ;
                                aa[tb] = function(d, f, e) {
                                    function g(d, p) {
                                        if (d >= k.length)
                                            e(p);
                                        else {
                                            var n = Ja(h, k[d], b[338]);
                                            Qb(n, {
                                                ba: c[155],
                                                K: {
                                                    d: f,
                                                    v: zc
                                                },
                                                V: function(d) {
                                                    var c = d[0]
                                                        , f = d[1]
                                                        , g = d[2];
                                                    c === a[295] || c === a[349] ? (g && l(ub, {
                                                        domain: m,
                                                        id: g
                                                    }),
                                                    c === a[349] && f && l(vb, f),
                                                        e(null, d)) : c === a[352] ? e(null, d) : (d = new T(T.L,b[184],{
                                                        url: n
                                                    }),
                                                        e(d))
                                                },
                                                U: function(e) {
                                                    void 0 === e && (e = {});
                                                    e = new T(T.L,b[152] + (e.message ? e.message : c[0]),{
                                                        url: n
                                                    });
                                                    Kb(e, d + a[675]);
                                                    g(d + a[675], e)
                                                }
                                            })
                                        }
                                    }
                                    var l = d.h;
                                    d = d[b[163]];
                                    void 0 === e && (e = V);
                                    d = d[b[316]];
                                    var h = d[b[394]]
                                        , m = d[c[50]]
                                        , k = d.apiServers;
                                    g(a[0])
                                }
                                ;
                                aa[ub] = function(a, b) {
                                    var e = b.id
                                        , g = b[c[50]];
                                    W().m(Ia, e, g)
                                }
                                ;
                                aa[yc] = function(a, b) {
                                    var c = b.id;
                                    W().m(ob, c);
                                    W().m(pc, nb())
                                }
                                ;
                                aa[xc] = function(a, c) {
                                    var e = a[b[163]]
                                        , g = c.id
                                        , l = c.xc;
                                    ea().m(ta, g, l);
                                    ea().m(oc, e[b[316]].buildVersion, l)
                                }
                                ;
                                aa[vb] = function(a, b) {
                                    var e = a.B;
                                    b = (new Ca(b))[c[203]]();
                                    e(uc, b - J())
                                }
                                ;
                                aa[qb] = function(a, b) {
                                    var c = a.B;
                                    c(tc, b)
                                }
                                ;
                                var Ra = {};
                                Ra[vc] = function(a, c) {
                                    a[b[316]] = c
                                }
                                ;
                                Ra[tc] = function(b, c) {
                                    b.$[c.cursor] = c.value || a[0]
                                }
                                ;
                                Ra[uc] = function(a, b) {
                                    a.Aa = b
                                }
                                ;
                                var C = new va({
                                    state: {
                                        options: {},
                                        Aa: a[0],
                                        $: [a[0], a[0], a[0], a[0], a[0], a[0]]
                                    },
                                    fc: aa,
                                    zc: Ra
                                }), ca = {
                                    bc: {
                                        c: a[0],
                                        a: t,
                                        e: a[5]
                                    },
                                    Oa: {
                                        c: a[675],
                                        a: t,
                                        e: a[58]
                                    },
                                    Pa: {
                                        c: a[1],
                                        a: t,
                                        e: a[82]
                                    },
                                    Ma: {
                                        c: a[5],
                                        a: t,
                                        e: a[82]
                                    },
                                    Db: {
                                        c: a[8],
                                        a: t,
                                        e: a[82]
                                    },
                                    Ub: {
                                        c: a[13],
                                        a: z,
                                        e: a[8]
                                    },
                                    Lb: {
                                        c: a[18],
                                        a: z,
                                        e: a[675]
                                    },
                                    Zb: {
                                        c: a[23],
                                        a: t,
                                        e: a[82]
                                    },
                                    cb: {
                                        c: a[27],
                                        a: t,
                                        e: a[82]
                                    },
                                    Kb: {
                                        c: a[31],
                                        a: t,
                                        e: a[82]
                                    },
                                    ab: {
                                        c: a[34],
                                        a: t,
                                        e: a[285]
                                    },
                                    cc: {
                                        c: a[235],
                                        a: z,
                                        e: a[8]
                                    },
                                    _move: {
                                        c: a[243],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[8], a[8]]
                                    },
                                    _down: {
                                        c: a[247],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[1], a[8], a[8]]
                                    },
                                    _up: {
                                        c: a[246],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[8], a[8]]
                                    },
                                    _click: {
                                        c: a[251],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[8], a[8], a[58]]
                                    },
                                    _keydown: {
                                        c: a[257],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[58]]
                                    },
                                    _focus: {
                                        c: a[254],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[58]]
                                    },
                                    _blur: {
                                        c: a[253],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[58]]
                                    },
                                    _scroll: {
                                        c: a[264],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[8], a[8]]
                                    },
                                    _orientation: {
                                        c: a[263],
                                        a: H,
                                        e: [a[1], a[8], a[8], a[8], a[8], a[675]]
                                    },
                                    _motion: {
                                        c: a[260],
                                        a: H,
                                        e: [a[1], a[8], a[8], a[8], a[8], a[1]]
                                    },
                                    _battery: {
                                        c: a[262],
                                        a: H,
                                        e: [a[1], a[8], a[675], a[675], a[8]]
                                    },
                                    $b: {
                                        c: a[295],
                                        a: t,
                                        e: a[342]
                                    },
                                    zb: {
                                        c: a[296],
                                        a: t,
                                        e: a[58]
                                    },
                                    Ta: {
                                        c: a[297],
                                        a: z,
                                        e: a[675]
                                    },
                                    bb: {
                                        c: a[298],
                                        a: z,
                                        e: a[675]
                                    },
                                    Vb: {
                                        c: a[299],
                                        a: z,
                                        e: a[675]
                                    },
                                    Pb: {
                                        c: a[300],
                                        a: B,
                                        e: a[675]
                                    },
                                    Cb: {
                                        c: a[301],
                                        a: B,
                                        e: a[675]
                                    },
                                    tb: {
                                        c: a[302],
                                        a: B,
                                        e: a[675]
                                    },
                                    Ea: {
                                        c: a[303],
                                        a: B,
                                        e: a[675]
                                    },
                                    Fb: {
                                        c: a[304],
                                        a: B,
                                        e: a[675]
                                    },
                                    Va: {
                                        c: a[305],
                                        a: t,
                                        e: a[34]
                                    },
                                    Ib: {
                                        c: a[306],
                                        a: t,
                                        e: a[34]
                                    },
                                    eb: {
                                        c: a[307],
                                        a: t,
                                        e: a[47]
                                    },
                                    Jb: {
                                        c: a[308],
                                        a: Y,
                                        e: a[49]
                                    },
                                    Qa: {
                                        c: a[309],
                                        a: Y,
                                        e: a[49]
                                    },
                                    dc: {
                                        c: a[310],
                                        a: Y,
                                        e: a[49]
                                    },
                                    Da: {
                                        c: a[311],
                                        a: B,
                                        e: a[675]
                                    },
                                    pb: {
                                        c: a[312],
                                        a: B,
                                        e: a[675]
                                    },
                                    ob: {
                                        c: a[313],
                                        a: B,
                                        e: a[675]
                                    },
                                    Yb: {
                                        c: a[314],
                                        a: B,
                                        e: a[675]
                                    },
                                    Mb: {
                                        c: a[315],
                                        a: z,
                                        e: a[675]
                                    },
                                    Ua: {
                                        c: a[316],
                                        a: B,
                                        e: a[675]
                                    },
                                    xb: {
                                        c: a[317],
                                        a: B,
                                        e: a[675]
                                    },
                                    Fa: {
                                        c: a[318],
                                        a: t,
                                        e: a[58]
                                    },
                                    Ga: {
                                        c: a[319],
                                        a: t,
                                        e: a[34]
                                    },
                                    Ha: {
                                        c: a[320],
                                        a: t,
                                        e: a[58]
                                    },
                                    Ia: {
                                        c: a[321],
                                        a: t,
                                        e: a[289]
                                    },
                                    Ab: {
                                        c: a[322],
                                        a: t,
                                        e: a[34]
                                    },
                                    Sb: {
                                        c: a[323],
                                        a: t,
                                        e: a[34]
                                    },
                                    ac: {
                                        c: a[324],
                                        a: t,
                                        e: a[34]
                                    },
                                    Na: {
                                        c: a[325],
                                        a: t,
                                        e: a[34]
                                    },
                                    Gb: {
                                        c: a[326],
                                        a: t,
                                        e: a[98]
                                    },
                                    fb: {
                                        c: a[327],
                                        a: t,
                                        e: a[58]
                                    },
                                    jb: {
                                        c: a[329],
                                        a: Y,
                                        e: a[49]
                                    },
                                    ib: {
                                        c: a[330],
                                        a: z,
                                        e: a[1]
                                    },
                                    Nb: {
                                        c: a[331],
                                        a: H,
                                        e: [a[1], a[1], a[1], a[1]]
                                    },
                                    mb: {
                                        c: a[332],
                                        a: z,
                                        e: a[675]
                                    },
                                    nb: {
                                        c: a[343],
                                        a: B,
                                        e: a[675]
                                    },
                                    hb: {
                                        c: a[344],
                                        a: t,
                                        e: a[34]
                                    },
                                    Eb: {
                                        c: a[345],
                                        a: z,
                                        e: a[675]
                                    },
                                    gb: {
                                        c: a[346],
                                        a: z,
                                        e: a[675]
                                    },
                                    Qb: {
                                        c: a[347],
                                        a: B,
                                        e: a[675]
                                    },
                                    Xb: {
                                        c: a[350],
                                        a: z,
                                        e: a[675]
                                    },
                                    wb: {
                                        c: a[351],
                                        a: B,
                                        e: a[675]
                                    },
                                    sb: {
                                        c: a[356],
                                        a: z,
                                        e: a[675]
                                    },
                                    kb: {
                                        c: a[357],
                                        a: z,
                                        e: a[675]
                                    },
                                    vb: {
                                        c: a[358],
                                        a: z,
                                        e: a[675]
                                    },
                                    Ob: {
                                        c: a[360],
                                        a: z,
                                        e: a[13]
                                    },
                                    qb: {
                                        c: a[361],
                                        a: z,
                                        e: a[675]
                                    },
                                    Wb: {
                                        c: a[362],
                                        a: t,
                                        e: a[34]
                                    },
                                    yb: {
                                        c: a[359],
                                        a: t,
                                        e: a[49]
                                    },
                                    Tb: {
                                        c: a[363],
                                        a: z,
                                        e: a[1]
                                    },
                                    rb: {
                                        c: a[364],
                                        a: z,
                                        e: a[1]
                                    },
                                    ub: {
                                        c: a[365],
                                        a: z,
                                        e: a[1]
                                    },
                                    lb: {
                                        c: a[366],
                                        a: H,
                                        e: [a[5], a[5], a[5], a[5], a[5]]
                                    },
                                    Hb: {
                                        c: a[367],
                                        a: H,
                                        e: [a[675], a[5], a[5]]
                                    },
                                    Sa: {
                                        c: a[368],
                                        a: H,
                                        e: [a[8], a[8]]
                                    },
                                    Wa: {
                                        c: a[370],
                                        a: t,
                                        e: a[27]
                                    },
                                    Xa: {
                                        c: a[371],
                                        a: t,
                                        e: a[27]
                                    },
                                    Ya: {
                                        c: a[372],
                                        a: t,
                                        e: a[27]
                                    },
                                    Za: {
                                        c: a[373],
                                        a: t,
                                        e: a[27]
                                    },
                                    $a: {
                                        c: a[374],
                                        a: t,
                                        e: a[27]
                                    },
                                    La: {
                                        c: a[337],
                                        a: t,
                                        e: a[82]
                                    }
                                }, ec = a[0], Fc = c[245], Gc = [c[107], c[109], c[114], c[109], c[43], c[114], c[48], c[37]], Hc = c[238], pb, wb, Da, gc, G = ic(), rd = function() {
                                    var d = ic();
                                    return d === b[141] || d === b[98] || d === c[6] ? a[5] : d === c[194] || d === b[110] || d === b[27] ? a[1] : a[675]
                                }(), P = function() {
                                    var d = v[b[361]].toLowerCase();
                                    return d.indexOf(b[387]) >= a[0] ? b[174] : d.indexOf(b[73]) >= a[0] || d.indexOf(b[253]) >= a[0] ? b[343] : d.indexOf(c[179]) >= a[0] ? b[281] : d.indexOf(b[183]) >= a[0] ? c[159] : d.indexOf(b[284]) >= a[0] ? c[167] : b[221]
                                }(), Ya = {
                                    $b: {
                                        f: function() {
                                            return v[b[361]] || c[0]
                                        },
                                        a: t
                                    },
                                    zb: {
                                        f: function() {
                                            return v[c[161]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ta: {
                                        f: function() {
                                            return Fa[b[215]] || a[0]
                                        },
                                        a: z
                                    },
                                    bb: {
                                        f: function() {
                                            return md || a[0]
                                        },
                                        a: z
                                    },
                                    Vb: {
                                        f: function() {
                                            return Math[b[122]]((new Ca)[c[134]]() / a[141] * a[674] + a[40])
                                        },
                                        a: z
                                    },
                                    Pb: {
                                        f: function() {
                                            return !!ld
                                        },
                                        a: B
                                    },
                                    Cb: {
                                        f: function() {
                                            return !!qa
                                        },
                                        a: B
                                    },
                                    tb: {
                                        f: function() {
                                            return !!nd
                                        },
                                        a: B
                                    },
                                    Ea: {
                                        f: function() {
                                            var a = w[b[81]];
                                            return a && !!a[b[130]]
                                        },
                                        a: B
                                    },
                                    Fb: {
                                        f: function() {
                                            return !!od
                                        },
                                        a: B
                                    },
                                    Va: {
                                        f: function() {
                                            return v[c[234]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ib: {
                                        f: function() {
                                            return v[b[433]] || c[0]
                                        },
                                        a: t
                                    },
                                    eb: {
                                        f: function() {
                                            return v[c[128]] ? v[c[128]] : v.yc ? v.yc : qc ? qc : b[352]
                                        },
                                        a: t
                                    },
                                    Jb: {
                                        f: function() {
                                            var a = fd ? dd() : jc();
                                            return za(a.join(c[150]))
                                        },
                                        u: !0,
                                        a: Y
                                    },
                                    Qa: {
                                        f: function() {
                                            var d;
                                            if (kc()) {
                                                if (wb)
                                                    d = wb;
                                                else {
                                                    d = [];
                                                    try {
                                                        var f = w[c[182]](b[324]);
                                                        f[b[374]] = a[354];
                                                        f[b[166]] = a[295];
                                                        f[b[341]].display = x[19];
                                                        var e = f[x[25]](b[208]);
                                                        e[b[114]](a[0], a[0], a[34], a[34]);
                                                        e[b[114]](a[1], a[1], a[18], a[18]);
                                                        d.push(c[187] + (!1 === e.isPointInPath(a[13], a[13], c[13]) ? b[286] : b[107]));
                                                        e[x[0]] = b[9];
                                                        e[b[32]] = b[227];
                                                        e[b[230]](a[275], a[675], a[146], a[58]);
                                                        e[b[32]] = x[1];
                                                        e[c[152]] = c[255];
                                                        e.fillText(b[409], a[1], a[47]);
                                                        e[b[32]] = b[424];
                                                        e[c[152]] = c[36];
                                                        e.fillText(c[84], a[8], a[107]);
                                                        e.fillText(b[144], a[8], a[166]);
                                                        e[b[129]] = c[226];
                                                        e[b[32]] = c[188];
                                                        e[c[112]]();
                                                        e[b[194]](a[119], a[119], a[119], a[0], Math.PI * a[1], !0);
                                                        e[b[0]]();
                                                        e.fill();
                                                        e[b[32]] = b[28];
                                                        e[c[112]]();
                                                        e[b[194]](a[226], a[119], a[119], a[0], Math.PI * a[1], !0);
                                                        e[b[0]]();
                                                        e.fill();
                                                        e[b[32]] = c[24];
                                                        e[c[112]]();
                                                        e[b[194]](a[166], a[226], a[119], a[0], Math.PI * a[1], !0);
                                                        e[b[0]]();
                                                        e.fill();
                                                        e[b[32]] = c[188];
                                                        e[b[194]](a[166], a[166], a[166], a[0], Math.PI * a[1], !0);
                                                        e[b[194]](a[166], a[166], a[69], a[0], Math.PI * a[1], !0);
                                                        e.fill(c[13]);
                                                        d.push(b[271] + f[c[158]]())
                                                    } catch (g) {
                                                        d.push(g)
                                                    }
                                                    d = wb = d
                                                }
                                                d = za(d.join(c[150]))
                                            } else
                                                d = c[0];
                                            return d
                                        },
                                        a: Y,
                                        u: !0,
                                        T: Gb
                                    },
                                    dc: {
                                        f: function() {
                                            var a;
                                            if (kc()) {
                                                a = w[c[182]](b[324]);
                                                var f;
                                                try {
                                                    f = a[x[25]] && (a[x[25]](b[75]) || a[x[25]](b[364]))
                                                } catch (e) {
                                                    f = !1
                                                }
                                                a = !!pd && !!f
                                            } else
                                                a = !1;
                                            return a ? za(bd().join(c[150])) : c[0]
                                        },
                                        a: Y,
                                        u: !0,
                                        T: Hb
                                    },
                                    Da: {
                                        f: function() {
                                            var d = w[c[182]](c[164])
                                                , f = c[222] + new Ca;
                                            d[b[384]] = b[131];
                                            d.className = c[20];
                                            d.id = f;
                                            var e = !1;
                                            try {
                                                w[b[81]][c[12]](d),
                                                    e = w.getElementById(f)[b[211]] === a[0],
                                                    w[b[81]][b[148]](d)
                                            } catch (g) {
                                                e = !1
                                            }
                                            return e
                                        },
                                        a: B,
                                        u: !0
                                    },
                                    pb: {
                                        f: function() {
                                            var d = v[b[433]]
                                                , f = v[b[314]];
                                            return (b[85]in y || v.ua > a[0] || v.va > a[0]) && G !== b[141] && G !== b[98] && G !== c[29] && G !== b[221] || typeof f !== b[353] && (f = f.toLowerCase(),
                                            ~f.indexOf(b[444]) && G !== b[110] && G !== c[6] && G !== b[221] || ~f.indexOf(b[279]) && G !== c[194] && G !== b[98] || ~f.indexOf(b[47]) && G !== b[27] && G !== c[6] || (f.indexOf(b[444]) === a[674] && f.indexOf(b[279]) === a[674] && f.indexOf(b[47] === a[674])) !== (G === b[221])) ? !0 : d.indexOf(b[444]) >= a[0] && G !== b[110] && G !== b[141] || (d.indexOf(b[279]) >= a[0] || d.indexOf(b[270]) >= a[0] || d.indexOf(b[22]) >= a[0]) && G !== c[194] && G !== b[98] || (d.indexOf(b[47]) >= a[0] || d.indexOf(b[423]) >= a[0] || d.indexOf(b[4]) >= a[0] || d.indexOf(b[333]) >= a[0]) && G !== b[27] && G !== c[6] || (d.indexOf(b[444]) === a[674] && d.indexOf(b[279]) === a[674] && d.indexOf(b[47]) === a[674]) !== (G === b[221]) ? !0 : typeof v[c[3]] === b[353] && G !== b[110] && G !== b[141] ? !0 : !1
                                        },
                                        a: B
                                    },
                                    ob: {
                                        f: function() {
                                            var d = v[b[251]];
                                            if ((P === b[281] || P === c[159] || P === b[343]) && d !== b[138])
                                                return !0;
                                            d = eval.toString().length;
                                            if (d === a[90] && P !== c[159] && P !== b[174] && P !== b[221] || d === a[94] && P !== c[167] && P !== b[221] || d === a[84] && P !== b[281] && P !== b[343] && P !== b[221])
                                                return !0;
                                            var f;
                                            try {
                                                throw Error(c[103]);
                                            } catch (e) {
                                                try {
                                                    e[b[407]](),
                                                        f = !0
                                                } catch (g) {
                                                    f = !1
                                                }
                                            }
                                            return f && P !== b[174] && P !== b[221] ? !0 : !1
                                        },
                                        a: B
                                    },
                                    Yb: {
                                        f: function() {
                                            var d = a[0]
                                                , f = !1;
                                            typeof v.ua !== b[353] ? d = v.ua : typeof v.va !== b[353] && (d = v.va);
                                            try {
                                                w[b[440]](c[160]),
                                                    f = !0
                                            } catch (e) {}
                                            var g = b[85]in y;
                                            return d > a[0] || f || g
                                        },
                                        a: B
                                    },
                                    Mb: {
                                        f: function() {
                                            return rd
                                        },
                                        a: z
                                    },
                                    Ua: {
                                        f: function() {
                                            return !!v[b[385]]
                                        },
                                        a: B
                                    },
                                    xb: {
                                        f: function() {
                                            try {
                                                return !!v[b[313]]()
                                            } catch (a) {
                                                return !1
                                            }
                                        },
                                        a: B
                                    },
                                    Fa: {
                                        f: function() {
                                            return v[b[389]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ga: {
                                        f: function() {
                                            return v[c[76]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ha: {
                                        f: function() {
                                            return v[c[233]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ia: {
                                        f: function() {
                                            return v[b[307]] || c[0]
                                        },
                                        a: t
                                    },
                                    Ab: {
                                        f: function() {
                                            return v[b[206]] || c[0]
                                        },
                                        a: t
                                    },
                                    Sb: {
                                        f: function() {
                                            return v[b[205]] || c[0]
                                        },
                                        a: t
                                    },
                                    ac: {
                                        f: function() {
                                            return v[b[191]] || c[0]
                                        },
                                        a: t
                                    },
                                    Na: {
                                        f: function() {
                                            return v[b[93]] || c[0]
                                        },
                                        a: t
                                    },
                                    Gb: {
                                        f: function() {
                                            return v[b[314]] || c[0]
                                        },
                                        a: t
                                    },
                                    fb: {
                                        f: function() {
                                            return w[b[64]] || w[b[140]] || c[0]
                                        },
                                        a: t
                                    },
                                    jb: {
                                        f: function() {
                                            return za(fc().join(c[150]))
                                        },
                                        a: Y,
                                        u: !0,
                                        T: Za
                                    },
                                    ib: {
                                        f: function() {
                                            return fc().length || a[0]
                                        },
                                        a: z,
                                        u: !0,
                                        T: Za
                                    },
                                    mb: {
                                        f: function() {
                                            return v[b[61]] || a[0]
                                        },
                                        a: z
                                    },
                                    Nb: {
                                        f: function() {
                                            var d = Fa[b[374]];
                                            void 0 === d && (d = a[0]);
                                            var c = Fa[b[166]];
                                            void 0 === c && (c = a[0]);
                                            var e = Fa[b[63]];
                                            void 0 === e && (e = a[0]);
                                            var g = Fa[b[70]];
                                            return [d > c ? d : c, d > c ? c : d, e > g ? e : g, e > g ? g : e]
                                        },
                                        a: H
                                    },
                                    La: {
                                        f: function(a) {
                                            return hc ? cd(a) : a(c[0])
                                        },
                                        a: t,
                                        Ja: !0,
                                        u: !0
                                    }
                                }, Wa = [], Eb = a[0], Va = [], Fb = !1, Sa = /./;
                                try {
                                    Sa.toString = function() {
                                        return Sa.Cc = !0
                                    }
                                        ,
                                        console.log(c[228], Sa)
                                } catch (sd) {}
                                var Db = {
                                    nb: {
                                        f: function() {
                                            return !!Sa.Cc
                                        },
                                        a: B
                                    },
                                    hb: {
                                        f: function() {
                                            var a;
                                            try {
                                                null[0]()
                                            } catch (f) {
                                                a = f
                                            }
                                            return a && typeof a[c[2]] === b[265] ? [x[6], b[386], c[211], c[113], c[86]].filter(function(b) {
                                                return ~a[c[2]].indexOf(b)
                                            })[0] || c[0] : c[0]
                                        },
                                        a: t
                                    },
                                    Eb: {
                                        f: function() {
                                            for (var d = [b[185], b[225], b[302], b[417], c[0], c[0], b[79], c[1], b[50], b[378], {
                                                q: b[346],
                                                n: function() {
                                                    try {
                                                        return y[b[346]](c[209]) === a[479] && y[b[229]](y[b[346]](c[252]))
                                                    } catch (d) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: b[296],
                                                n: function() {
                                                    try {
                                                        return y[b[296]](b[176]) === a[267] && y[b[229]](y[b[346]](c[252]))
                                                    } catch (d) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: b[172],
                                                n: function() {
                                                    try {
                                                        return y[b[172]](b[19]) === c[15]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: x[15],
                                                n: function() {
                                                    try {
                                                        return y[x[15]](b[25]) === c[19]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: b[233],
                                                n: function() {
                                                    try {
                                                        return y[b[233]](c[15]) === b[19]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: b[260],
                                                n: function() {
                                                    try {
                                                        return y[b[260]](c[19]) === b[25]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: b[203],
                                                n: function() {
                                                    try {
                                                        return y[b[203]](c[19]) === b[25]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: x[10],
                                                n: function() {
                                                    try {
                                                        return y[x[10]](b[25]) === c[19]
                                                    } catch (a) {
                                                        return !1
                                                    }
                                                }
                                            }, {
                                                q: c[192],
                                                n: function() {
                                                    try {
                                                        return y[c[192]](b[137]) === a[267]
                                                    } catch (d) {
                                                        return !1
                                                    }
                                                }
                                            }, b[304]], f = a[0], e = d.length; f < e; f++) {
                                                if (d[f].n)
                                                    if (d[f].n())
                                                        continue;
                                                    else
                                                        return f + a[675];
                                                if (d[f] && !y[d[f]])
                                                    return f + a[675]
                                            }
                                            return a[0]
                                        },
                                        a: z
                                    },
                                    gb: {
                                        f: function() {
                                            var d;
                                            if (!(d = ja(hd, a[13], void 0)()))
                                                a: {
                                                    for (var f in w)
                                                        if (w[f]) {
                                                            try {
                                                                if (w[f][b[359]] && f[x[8]] && f[x[8]](/\$[a-z]dc_/)) {
                                                                    d = a[295];
                                                                    break a
                                                                }
                                                            } catch (e) {}
                                                            d = a[0];
                                                            break a
                                                        }
                                                    d = void 0
                                                }
                                            if (!d)
                                                try {
                                                    d = y[c[191]] && ~y[c[191]].toString().indexOf(b[381]) && a[296]
                                                } catch (g) {
                                                    d = a[0]
                                                }
                                            return d
                                        },
                                        a: z
                                    },
                                    Xb: {
                                        f: function() {
                                            return y[c[207]][c[31]] || y[b[305]][c[31]] || a[0]
                                        },
                                        a: z
                                    },
                                    wb: {
                                        f: function() {
                                            for (var d = !1, f = w[c[98]](b[26]), e = a[0], g = f.length; e < g; e++) {
                                                var l = f[e][b[127]];
                                                if (l && ~l.indexOf(c[244])) {
                                                    d = !0;
                                                    break
                                                }
                                            }
                                            return d
                                        },
                                        a: B
                                    }
                                }, Bc = {
                                    sb: {
                                        f: function() {
                                            return Oa(b[202])
                                        },
                                        a: z
                                    },
                                    kb: {
                                        f: function() {
                                            return Oa(c[242])
                                        },
                                        a: z
                                    },
                                    vb: {
                                        f: function() {
                                            return Oa(b[175])
                                        },
                                        a: z
                                    },
                                    Ob: {
                                        f: function() {
                                            return Oa(b[26])
                                        },
                                        a: z
                                    },
                                    qb: {
                                        f: function() {
                                            return y.history.length || a[0]
                                        },
                                        a: z
                                    },
                                    Wb: {
                                        f: function() {
                                            return w[c[213]] || c[0]
                                        },
                                        a: t
                                    },
                                    yb: {
                                        f: function() {
                                            return w.Nc || c[0]
                                        },
                                        a: t
                                    },
                                    Tb: {
                                        f: function() {
                                            return (w[b[262]][c[26]] || w[b[262]][c[16]]).length || a[0]
                                        },
                                        a: z
                                    },
                                    rb: {
                                        f: function() {
                                            return w[b[262]][b[384]].length || a[0]
                                        },
                                        a: z
                                    },
                                    ub: {
                                        f: function() {
                                            return C[b[163]].$[0]
                                        },
                                        a: z
                                    },
                                    lb: {
                                        f: function() {
                                            return C[b[163]].$.slice(a[675])
                                        },
                                        a: H
                                    },
                                    Hb: {
                                        f: function() {
                                            var d = y[x[17]];
                                            if (d) {
                                                var f = d[b[406]];
                                                return [d[b[8]].type, f[x[11]] - f[b[158]], f[b[267]] - f[c[97]]]
                                            }
                                            return [a[0], a[0], a[0]]
                                        },
                                        a: H
                                    },
                                    Sa: {
                                        f: function() {
                                            return [y[b[99]] || w[b[262]][b[84]] || w[b[81]][b[84]], y[b[245]] || w[b[262]][b[173]] || w[b[81]][b[173]]]
                                        },
                                        a: H
                                    },
                                    Qb: {
                                        f: function() {
                                            return db() ? a[675] : a[1]
                                        },
                                        a: z
                                    },
                                    cc: {
                                        f: function() {
                                            return C[b[163]][b[316]].Ic
                                        },
                                        a: z
                                    }
                                }, Ga = {
                                    _move: [b[308], b[171], b[193], b[204]],
                                    _click: [c[32]],
                                    _down: [c[56], b[60], b[77], b[226]],
                                    _up: [c[8], b[162], c[217], b[10]],
                                    _keydown: [c[239]],
                                    _focus: [b[3]],
                                    _blur: [c[73]],
                                    _scroll: [b[328]],
                                    _orientation: [b[188]],
                                    _motion: [b[44]]
                                }, ia = {}, xb, yb;
                                w[c[182]](c[164])[c[251]] ? (xb = function(a, b, e) {
                                        a[c[251]](b, e, !0)
                                    }
                                        ,
                                        yb = function(a, b, e) {
                                            a[c[241]](b, e, !0)
                                        }
                                ) : (xb = function(a, c, e) {
                                        a[b[234]](b[125] + c, e)
                                    }
                                        ,
                                        yb = function(a, c, e) {
                                            a[b[294]](b[125] + c, e)
                                        }
                                );
                                ia.xa = function(a, b, c) {
                                    xb(a, b, c);
                                    return ia
                                }
                                ;
                                ia.wa = function(a, b, c) {
                                    yb(a, b, c);
                                    return ia
                                }
                                ;
                                var zb = Object.keys(Ga), Ab = {}, la;
                                try {
                                    la = !!v.Mc()
                                } catch (td) {
                                    la = !1
                                }
                                var oa = {};
                                U.prototype._start = function() {
                                    this.l || (this.l = !0,
                                        this.gc())
                                }
                                ;
                                U.prototype._stop = function() {
                                    this.l = !1;
                                    this.ya();
                                    this.A()
                                }
                                ;
                                U.prototype.A = function() {
                                    oa = {};
                                    if (this.j)
                                        for (var a in this.j)
                                            this.j[a] && (this.j[a] = [])
                                }
                                ;
                                U.prototype.rc = function(d) {
                                    if (!this.l)
                                        return this.ya();
                                    d = d || y[b[357]];
                                    var f;
                                    a: if (f = d.type,
                                        Ab[f])
                                        f = Ab[f];
                                    else {
                                        for (var e = a[0], g = zb.length; e < g; e++)
                                            for (var l = Ga[zb[e]], h = a[0], k = l.length; h < k; h++)
                                                if (f === l[h]) {
                                                    f = Ab[f] = zb[e];
                                                    break a
                                                }
                                        f = c[0]
                                    }
                                    this.O(d, f)
                                }
                                ;
                                U.prototype.J = function() {
                                    var a = this
                                        , c = [];
                                    wa(Object.keys(this.j)).forEach(function(e) {
                                        N(a.j[e]) === b[437] && wa(a.j[e]).forEach(function(a) {
                                            return c.push.apply(c, a)
                                        })
                                    });
                                    this.A();
                                    return c
                                }
                                ;
                                U.prototype.gc = function() {
                                    var a = this;
                                    this.F.forEach(function(f) {
                                        var e = ~[c[44], c[34], c[196], b[5], b[11]].indexOf(f) ? y : w;
                                        a.Z[f] = e;
                                        a.ga(e, f, !0)
                                    })
                                }
                                ;
                                U.prototype.ya = function() {
                                    var a = this;
                                    this.F.forEach(function(b) {
                                        var c = a.Z[b];
                                        c && a.ga(c, b)
                                    });
                                    this.Z = {}
                                }
                                ;
                                U.prototype.ga = function(a, b, c) {
                                    var g = this;
                                    Ga[b].forEach(function(b) {
                                        c ? ia.xa(a, b, g.ta) : ia.wa(a, b, g.ta)
                                    })
                                }
                                ;
                                U.prototype.O = function(d, f) {
                                    var e, g, h, k, m = f.slice(a[675]), p = this.ka;
                                    g = p[m + b[37]];
                                    e = p[m + b[41]];
                                    (p = this.j[f]) || (p = this.j[f] = []);
                                    var n = p.length;
                                    g = n < e ? a[34] : g;
                                    h = J();
                                    if (h - (p.Ca || a[0]) <= g)
                                        return this;
                                    p.Ca = h;
                                    p.ca || (p.ca = id(e));
                                    n >= e && (e = p.ca(),
                                        p.splice(e, a[675]));
                                    n = d;
                                    void 0 === n && (n = {});
                                    k = n[c[135]] && n[c[135]].length ? n[c[135]][0] : n;
                                    e = typeof n[b[242]] === b[353] ? a[675] : n[b[242]] ? a[1] : a[5];
                                    g = n[b[278]] || a[0];
                                    h = k[b[248]] || k[b[428]];
                                    k = k[b[247]] || k[b[248]];
                                    var t = n[b[295]] || n[b[447]]
                                        , n = C[b[163]][b[316]].S;
                                    void 0 === n && (n = a[0]);
                                    n = [mc(m), J() - n];
                                    switch (m) {
                                        case c[162]:
                                            n.push(e, g, h << a[0], k << a[0]);
                                            break;
                                        case x[3]:
                                            n.push(e, h << a[0], k << a[0]);
                                            break;
                                        case b[237]:
                                            n.push(e, h << a[0], k << a[0]);
                                            break;
                                        case c[32]:
                                            n.push(e, h << a[0], k << a[0], t.id || c[0]);
                                            break;
                                        case c[239]:
                                        case b[3]:
                                        case c[73]:
                                            n.push(e, t && t.id || c[0]);
                                            break;
                                        case b[328]:
                                            m = b[243]in y;
                                            g = (w[b[140]] || c[0]) === b[434];
                                            m = [m ? y[b[243]] : g ? w[b[262]][b[400]] : w[b[81]][b[400]], m ? y[b[339]] : g ? w[b[262]][b[420]] : w[b[81]][b[420]]];
                                            n.push(e, m[0] << a[0], m[1] << a[0]);
                                            break;
                                        case x[4]:
                                            if (null == d[c[223]] || null == d[b[124]] || null == d[b[217]])
                                                return;
                                            n.push(Math.round(d[c[223]]), Math.round(d[b[124]]), Math.round(d[b[217]]), lc(d[b[210]]));
                                            break;
                                        case x[5]:
                                            m = d[c[165]] || d[c[166]];
                                            if (!m || null == m[c[144]] || null == m[c[147]] || null == m[c[149]])
                                                return;
                                            n.push(Math.round(m[c[144]] * a[376]), Math.round(m[c[147]] * a[376]), Math.round(m[c[149]] * a[376]), d[b[34]]);
                                            break;
                                        default:
                                            n.length = a[0]
                                    }
                                    n.length && (c[0],
                                        p.push(xa(n, ca[f])))
                                }
                                ;
                                k.prototype._start = function() {
                                    var a = this;
                                    this.l || (this.l = !0,
                                        this.D = v[b[441]](),
                                        this.D.then(function(f) {
                                            a._battery[x[9]] = f[x[9]];
                                            a._battery[b[94]] = f[b[94]];
                                            a._battery[c[181]] = f[c[181]];
                                            a._battery[b[365]] = f[b[365]];
                                            a.O(a._battery);
                                            a.F.forEach(function(b) {
                                                return ia.xa(f, b, a.ea)
                                            })
                                        }))
                                }
                                ;
                                k.prototype._stop = function() {
                                    var a = this;
                                    this.l = !1;
                                    this.D && this.D.then(function(b) {
                                        a.F.forEach(function(c) {
                                            return ia.wa(b, c, a.ea)
                                        })
                                    });
                                    this.A()
                                }
                                ;
                                k.prototype.A = function() {
                                    var c = b[189];
                                    c ? oa[c] = a[0] : oa = {};
                                    this.j = [];
                                    this.D = null;
                                    this._battery = {}
                                }
                                ;
                                k.prototype.O = function(d) {
                                    function f(a) {
                                        return null == d[a] ? e._battery[a] : d[a]
                                    }
                                    var e = this
                                        , g = this.j.length
                                        , h = g < this.Y[0] ? a[226] : this.Y[1]
                                        , k = J();
                                    if (k - (this.Bb || a[0]) <= h)
                                        return this;
                                    this.Bb = k;
                                    g >= this.Y[0] && (g = Math.round(Math[c[218]]() * (g - a[675] - a[675])) + a[675],
                                        this.j.splice(g, a[675]));
                                    g = C[b[163]][b[316]].S;
                                    void 0 === g && (g = a[0]);
                                    var g = [mc(b[189]), J() - g]
                                        , m = [f(x[9]), f(b[94]), f(c[181]), f(b[365])]
                                        , h = m[0]
                                        , k = m[1]
                                        , n = m[2]
                                        , m = m[3];
                                    g.push(lc(h), Math.round(k * a[226]), function(c) {
                                        return typeof c === b[7] && isFinite(c) ? c : a[674]
                                    }(h ? n : m));
                                    c[0];
                                    this.j.push(xa(g, ca[c[11]]))
                                }
                                ;
                                k.prototype.J = function() {
                                    var a = [];
                                    this.j.forEach(function(b) {
                                        return a = a.concat(b)
                                    });
                                    this.j = [];
                                    return a
                                }
                                ;
                                var Ta, R = db();
                                n.prototype._start = function() {
                                    this.Q._start();
                                    la && this.M._start()
                                }
                                ;
                                n.prototype._stop = function() {
                                    this.Q._stop();
                                    la && this.M._stop()
                                }
                                ;
                                n.prototype.A = function() {
                                    this.Q.A();
                                    la && this.M.A()
                                }
                                ;
                                n.prototype.J = function() {
                                    return this.Q.J().concat(la ? this.M.J() : [])
                                }
                                ;
                                g.prototype.aa = function(a) {
                                    this.g = p(a);
                                    this.jc();
                                    C.h(ka, this.g);
                                    this.tc()
                                }
                                ;
                                g.prototype.jc = function() {
                                    var c = this.g
                                        , f = c.buildVersion
                                        , e = c.sConfig
                                        , g = c.staticServer
                                        , h = c.uc
                                        , c = c.valid;
                                    void 0 === c && (c = a[0]);
                                    if (!(c > a[0]) && e && N(h) === b[7])
                                        try {
                                            qa.setItem(nc, JSON[b[139]]({
                                                sConfig: e,
                                                buildVersion: f,
                                                staticServer: g,
                                                valid: J() + na(h, a[34])
                                            }))
                                        } catch (k) {}
                                }
                                ;
                                g.prototype.tc = function() {
                                    var a = this.g
                                        , c = a[b[72]]
                                        , a = a.ra;
                                    this.N = new n;
                                    this.H = !1;
                                    c && this._start();
                                    a && (this.P() || this.I(),
                                        this.Ra())
                                }
                                ;
                                g.prototype.qa = function(b, c) {
                                    void 0 === b && (b = []);
                                    for (var e = a[0], g = b.length; e < g; e++)
                                        b[e](c);
                                    b.length = a[0]
                                }
                                ;
                                g.prototype.oa = function() {
                                    this.qa(this.na)
                                }
                                ;
                                g.prototype.pa = function(a) {
                                    this.qa(this.sa, a)
                                }
                                ;
                                g.prototype.P = function() {
                                    var a = this.g
                                        , b = a.buildVersion
                                        , c = a.lastUsedVersion;
                                    if (!a.ra)
                                        return !0;
                                    var a = ea().sc(ta)
                                        , g = ea().k(oc)
                                        , h = W().k(Ia)
                                        , k = W().k(ob);
                                    return !(c && g && g !== b && g !== c) && a && h && k
                                }
                                ;
                                g.prototype.I = function(c, f) {
                                    var e = this;
                                    typeof f === b[86] && this.sa.push(f);
                                    typeof c === b[86] && this.na.push(c);
                                    this.H || (this.H = !0,
                                        this.ha(function(c, d) {
                                            if (c)
                                                e.H = !1,
                                                    e.pa(Error(b[45]));
                                            else {
                                                var f = d && d[0];
                                                if (f === a[349])
                                                    return e.ha(function(a) {
                                                        a ? e.pa(Error(b[45])) : e.oa();
                                                        e.H = !1
                                                    });
                                                f === a[295] && (e.oa(),
                                                    e.H = !1)
                                            }
                                        }))
                                }
                                ;
                                g.prototype.Ra = function() {
                                    var b = this
                                        , c = a[141] * a[376];
                                    qd(function() {
                                        ea().qc(ta) - J() <= c * a[13] && b.I()
                                    }, c * a[13])
                                }
                                ;
                                g.prototype.ha = function(b) {
                                    void 0 === b && (b = V);
                                    var f = $a();
                                    gd(Cc, a[5])(function(e) {
                                        var g = ba(!0);
                                        c[0];
                                        c[0];
                                        c[0];
                                        e = ja(lb, a[675], void 0)(f.concat(e, g));
                                        return e;
                                        // C.h(wc, e, b)
                                    })
                                }
                                ;
                                g.prototype._start = function() {
                                    this.l || (this.l = !0,
                                    this.P() || this.I(),
                                        this.g.C = bc(),
                                        this.g.S = J(),
                                        C.h(ka, this.g),
                                        this.N._start())
                                }
                                ;
                                g.prototype._stop = function() {
                                    this.l = !1;
                                    this.N._stop()
                                }
                                ;
                                g.prototype._setCustomTrackId = function(a) {
                                    this.g.lc = a;
                                    C.h(ka, this.g)
                                }
                                ;
                                g.prototype.ia = function(d, f, e, g) {
                                    function h() {
                                        x || (ua(z),
                                            f(dc({
                                                C: t,
                                                la: x
                                            })))
                                    }
                                    function k() {
                                        x || (ua(z),
                                            console.log(b[80]),
                                            x = v.g.vc = !0,
                                            C.h(ka, v.g),
                                            f(dc({
                                                C: t,
                                                la: x
                                            })))
                                    }
                                    N(e) !== b[86] && (g = e,
                                            e = function() {}
                                    );
                                    var m = this.g
                                        , n = m.S
                                        , p = m.ic
                                        , m = m.Gc;
                                    this.g.Ic = J() - n;
                                    this.g.S = J();
                                    var t = this.g.C = bc();

                                    if (!~p.indexOf(d)) {
                                        this.g.ma = d;
                                        C.h(ka, this.g);
                                        var v = this;
                                        d = $a();
                                        var w = ja(this.N.J, a[8], this.N)()
                                            , y = ba();
                                        c[0];
                                        c[0];
                                        c[0];
                                        d = ja(lb, a[675], void 0)(d.concat(y, w));
                                        var x = this.g.vc = !1
                                            , z = ya(k, +g >= a[0] ? +g : m);
                                        C.h(tb, d, function(c, d) {
                                            var f = d && d[0];
                                            return c ? k() : f === a[295] ? h() : f === a[352] && e ? (ua(z),
                                                e(Error(b[192]))) : f === a[349] ? (f = $a(),
                                                f = ja(lb, a[675], void 0)(f.concat(y, w)),
                                                C.h(tb, f, h)) : k()
                                        })
                                    }
                                }
                                ;
                                g.prototype._getToken = function(a, b, c, g) {
                                    var h = this;
                                    void 0 === b && (b = V);
                                    this.P() ? this.ia(a, b, c, g) : this.I(function() {
                                        return h.ia(a, b, c, g)
                                    }, c)
                                }
                                ;
                                g.prototype._getNdInfo = function(a) {
                                    void 0 === a && (a = V);
                                    this.P() ? a(nb()) : this.I(function() {
                                        var b = nb();
                                        W().m(pc, b);
                                        a(b)
                                    })
                                }
                                ;
                                var pa;
                                y[c[207]][b[97]] ? y[b[157]] = g : jd();
                                bc1 = bc();
                            }
                        )()
                    }
                )()
            }
        )()
    }
)();
let Did = '7r/yN+h9NpZFEAVAAFLEbFEjgza/L3iI'

console.log(get_actoken(Did))

// function get_d_param() {
//     var e = _a();
//     var g = _ba(!0);
//     var f = _f
//     e = ja(lb,1, void 0)(e.concat(f, g));
// }




