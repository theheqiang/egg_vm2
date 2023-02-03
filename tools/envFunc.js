// 浏览器接口具体的实现
!function (){
    eggvm.envFunc.Document_all_get = function Document_all_get(){
        let all = eggvm.memory.globalVar.all;
        Object.setPrototypeOf(all, HTMLAllCollection.prototype);
        return all;
    }
    // eggvm.envFunc.Document_documentElement_get = function Document_documentElement_get(){
    //     let html = document.createElement("html");
    //     let head = document.createElement("head");
    //     let body = document.createElement("body");
    //     let collection = [];
    //     collection.push(head);
    //     collection.push(body);
    //     collection = eggvm.toolsFunc.createProxyObj(collection, HTMLCollection, "collection");
    //     eggvm.toolsFunc.setProtoArr.call(html, "children", collection);
    //     return html
    // }
    eggvm.envFunc.Navigator_webkitPersistentStorage_get = function Navigator_webkitPersistentStorage_get(){
        return eggvm.toolsFunc.getProtoArr.call(this,"webkitPersistentStorage");
    }
    eggvm.envFunc.Navigator_javaEnabled = function Navigator_javaEnabled(){
        return false;
    }
    eggvm.envFunc.Document_characterSet_get = function Document_characterSet_get(){
        return eggvm.toolsFunc.getProtoArr.call(this, "characterSet");
    }
    eggvm.envFunc.Document_compatMode_get = function Document_compatMode_get(){
        return "CSS1Compat"
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
            case "script":
                collection = eggvm.toolsFunc.getCollection('[object HTMLScriptElement]');
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
