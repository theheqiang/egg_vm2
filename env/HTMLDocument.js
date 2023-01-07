// HTMLDocument对象
HTMLDocument = function HTMLDocument(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLDocument, "HTMLDocument");
Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);
// document对象
document = {}
Object.setPrototypeOf(document, HTMLDocument.prototype);
eggvm.toolsFunc.defineProperty(document, "location", {configurable:false, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, document, "document", "location_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, document, "document", "location_set", arguments)}});
