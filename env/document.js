// document对象
document = {};
// 设置原型
Object.setPrototypeOf(document, HTMLDocument.prototype);
// 定义自身属性
eggvm.toolsFunc.defineProperty(document, "location", {
    enumerable: true,
    configurable: false,
    get: function(){
        return eggvm.toolsFunc.dispatch(this, document, "document", "location_get",arguments, "123");
    },
    set: function(){
        return eggvm.toolsFunc.dispatch(this, document, "document", "location_get",arguments);
    }
});

// docuemnt对象
docuemnt = {}
Object.setPrototypeOf(docuemnt, HTMLDocument.prototype);
eggvm.toolsFunc.defineProperty(docuemnt, "location", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, docuemnt, "docuemnt", "location_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, docuemnt, "docuemnt", "location_set", arguments)}});