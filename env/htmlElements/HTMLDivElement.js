// HTMLDivElement对象
HTMLDivElement = function HTMLDivElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLDivElement, "HTMLDivElement");
Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLDivElement.prototype, "align", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLDivElement.prototype, "HTMLDivElement", "align_set", arguments)}});
