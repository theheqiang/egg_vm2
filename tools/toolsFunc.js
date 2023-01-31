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