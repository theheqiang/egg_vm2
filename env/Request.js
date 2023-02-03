// Request对象
Request = function Request(){
    let url = arguments[0]
    eggvm.toolsFunc.setProtoArr.call(this,"url",url)
}
eggvm.toolsFunc.safeProto(Request, "Request");
eggvm.toolsFunc.defineProperty(Request.prototype, "method", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "method_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "url", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "url_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "headers", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "headers_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "destination", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "destination_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "referrer", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "referrer_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "referrerPolicy", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "referrerPolicy_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "mode", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "mode_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "credentials", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "credentials_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "cache", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "cache_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "redirect", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "redirect_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "integrity", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "integrity_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "keepalive", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "keepalive_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "signal", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "signal_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "isHistoryNavigation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "isHistoryNavigation_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "bodyUsed", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "bodyUsed_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(Request.prototype, "arrayBuffer", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "arrayBuffer", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "blob", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "blob", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "clone", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "clone", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "formData", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "formData", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "json", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "json", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "text", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "text", arguments)}});
eggvm.toolsFunc.defineProperty(Request.prototype, "body", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Request.prototype, "Request", "body_get", arguments)}, set:undefined});
