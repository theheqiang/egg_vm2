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
eggvm.memory.filterProxyProp =[eggvm.memory.symbolProxy,eggvm.memory.symbolData, "eval"];// 需要过滤的属性

// 插件功能相关
!function (){
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
            case "style":
                tag = eggvm.toolsFunc.createProxyObj(tag,HTMLStyleElement,`Document_createElement_${tagName}`);
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
eggvm.toolsFunc.defineProperty(Document.prototype, "URL", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "URL_get", arguments, 'chrome://new-tab-page/')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "documentURI", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentURI_get", arguments, 'chrome://new-tab-page/')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "compatMode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "compatMode_get", arguments, 'CSS1Compat')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "characterSet", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "characterSet_get", arguments, 'UTF-8')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "charset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "charset_get", arguments, 'UTF-8')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "inputEncoding", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "inputEncoding_get", arguments, 'UTF-8')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "contentType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "contentType_get", arguments, 'text/html')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "doctype", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "doctype_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "documentElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "documentElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlEncoding", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlEncoding_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlVersion", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlVersion_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "xmlStandalone", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_get", arguments, false)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "xmlStandalone_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "domain", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_get", arguments, 'new-tab-page')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "domain_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "referrer", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "referrer_get", arguments, '')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "cookie", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "cookie_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "lastModified", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastModified_get", arguments, '10/25/2022 14:23:03')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "readyState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "readyState_get", arguments, 'complete')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "title", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_get", arguments, '新标签页')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "title_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "dir", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_get", arguments, 'ltr')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "dir_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "body", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "body_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "head", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "head_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "images", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "images_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "embeds", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "embeds_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "plugins", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "plugins_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "links", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "links_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "forms", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "forms_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "scripts", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scripts_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "currentScript", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "currentScript_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "defaultView", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "defaultView_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "designMode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_get", arguments, 'off')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "designMode_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onreadystatechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreadystatechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "anchors", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "anchors_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "applets", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "applets_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "fgColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fgColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "linkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "linkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "vlinkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "vlinkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "alinkColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "alinkColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "bgColor", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "bgColor_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "all", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "all_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "scrollingElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "scrollingElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerlockerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerlockerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "hidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "hidden_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "visibilityState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "visibilityState_get", arguments, 'hidden')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "wasDiscarded", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "wasDiscarded_get", arguments, false)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "featurePolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "featurePolicy_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitVisibilityState", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitVisibilityState_get", arguments, 'hidden')}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitHidden", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitHidden_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforecopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforecut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforecut_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforepaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforepaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfreeze", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfreeze_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onresume", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresume_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsearch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsearch_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onvisibilitychange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvisibilitychange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreenEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_get", arguments, true)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenEnabled_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreen", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_get", arguments, false)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreen_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitIsFullScreen", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitIsFullScreen_get", arguments, false)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitCurrentFullScreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitCurrentFullScreenElement_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenEnabled_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "webkitFullscreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "webkitFullscreenElement_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitfullscreenerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitfullscreenerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "rootElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "rootElement_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforexrselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforexrselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onabort", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onabort_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforeinput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforeinput_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onblur", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onblur_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncanplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncanplaythrough", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncanplaythrough_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onclose", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onclose_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextlost", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextlost_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextmenu", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextmenu_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncontextrestored", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncontextrestored_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncuechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncuechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondblclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondblclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondrag", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrag_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondragstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondragstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondrop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondrop_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ondurationchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ondurationchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onemptied", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onemptied_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onended", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onended_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onerror", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onerror_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onfocus", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onfocus_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onformdata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onformdata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oninput", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninput_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oninvalid", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oninvalid_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeydown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeydown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeypress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeypress_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onkeyup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onkeyup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onload", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onload_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadeddata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadeddata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadedmetadata", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadedmetadata_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onloadstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onloadstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousedown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousedown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousemove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousemove_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseout_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmouseup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmouseup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onmousewheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onmousewheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpause", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpause_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onplay", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplay_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onplaying", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onplaying_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onprogress", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprogress_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onratechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onratechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onreset", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onreset_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onresize", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onresize_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onscroll", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onscroll_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsecuritypolicyviolation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsecuritypolicyviolation_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onseeked", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeked_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onseeking", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onseeking_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselect_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onslotchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onslotchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onstalled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onstalled_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsubmit", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsubmit_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onsuspend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onsuspend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontimeupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontimeupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontoggle", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontoggle_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onvolumechange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onvolumechange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwaiting", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwaiting_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkitanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkitanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwebkittransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwebkittransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onwheel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onwheel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onauxclick", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onauxclick_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ongotpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ongotpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onlostpointercapture", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onlostpointercapture_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerdown", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerdown_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointermove", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointermove_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerrawupdate", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerrawupdate_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerup", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerup_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointercancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointercancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerover", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerover_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerout", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerout_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerenter", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerenter_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpointerleave", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpointerleave_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselectstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onselectionchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onselectionchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationiteration", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationiteration_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onanimationstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onanimationstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionrun", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionrun_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionstart", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionstart_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitionend", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitionend_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "ontransitioncancel", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "ontransitioncancel_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncopy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncopy_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "oncut", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "oncut_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "onpaste", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onpaste_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "children", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "children_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "firstElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "firstElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "lastElementChild", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "lastElementChild_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "childElementCount", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "childElementCount_get", arguments, 1)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "activeElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "activeElement_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "styleSheets", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "styleSheets_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pointerLockElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pointerLockElement_get", arguments, null)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "fullscreenElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fullscreenElement_set", arguments)}});
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
eggvm.toolsFunc.defineProperty(Document.prototype, "prerendering", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "prerendering_get", arguments, false)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onprerenderingchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onprerenderingchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "fragmentDirective", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "fragmentDirective_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "onbeforematch", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "onbeforematch_set", arguments)}});
eggvm.toolsFunc.defineProperty(Document.prototype, "timeline", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "timeline_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureEnabled", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureEnabled_get", arguments, true)}, set:undefined});
eggvm.toolsFunc.defineProperty(Document.prototype, "pictureInPictureElement", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Document.prototype, "Document", "pictureInPictureElement_get", arguments, null)}, set:undefined});
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
eggvm.toolsFunc.defineProperty(location, "href", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "href_get", arguments, 'chrome://new-tab-page/')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "href_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "origin", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "origin_get", arguments, 'chrome://new-tab-page')}, set:undefined});
eggvm.toolsFunc.defineProperty(location, "protocol", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "protocol_get", arguments, 'chrome:')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "protocol_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "host", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "host_get", arguments, 'new-tab-page')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "host_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "hostname", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hostname_get", arguments, 'new-tab-page')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hostname_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "port", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "port_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "port_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "pathname", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "pathname_get", arguments, '/')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "pathname_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "search", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "search_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "search_set", arguments)}});
eggvm.toolsFunc.defineProperty(location, "hash", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hash_get", arguments, '')}, set:function (){return eggvm.toolsFunc.dispatch(this, location, "location", "hash_set", arguments)}});
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
}();
// 网页变量初始化

!function (){
    // console.log(Date.now());// 1666689952666
    // console.log(new Date().getTime());// 1666689952666
    // console.log(Math.random());// 0.5

    let meta1 = document.createElement("meta");
    let meta2 = document.createElement("meta");
    let head = document.createElement("head");
    meta2.content = "YVc1cGRDQjBZV2";
    eggvm.toolsFunc.setProtoArr.call(meta2, "parentNode", head);
}();
// 需要代理的对象
// window = new Proxy(window, {});
localStorage = eggvm.toolsFunc.proxy(localStorage, "localStorage");
sessionStorage = eggvm.toolsFunc.proxy(sessionStorage, "sessionStorage");
location = eggvm.toolsFunc.proxy(location, "location");
document = eggvm.toolsFunc.proxy(document, "document");
window = eggvm.toolsFunc.proxy(window, "window");
// 用户调试代码
// 异步执行的代码
