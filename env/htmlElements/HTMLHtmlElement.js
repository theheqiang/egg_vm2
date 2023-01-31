// HTMLHtmlElement对象
HTMLHtmlElement = function HTMLHtmlElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLHtmlElement, "HTMLHtmlElement");
Object.setPrototypeOf(HTMLHtmlElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLHtmlElement.prototype, "version", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLHtmlElement.prototype, "HTMLHtmlElement", "version_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLHtmlElement.prototype, "HTMLHtmlElement", "version_set", arguments)}});
