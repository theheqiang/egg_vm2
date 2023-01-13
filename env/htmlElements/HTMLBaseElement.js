// HTMLBaseElement对象
HTMLBaseElement = function HTMLBaseElement(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLBaseElement, "HTMLBaseElement");
Object.setPrototypeOf(HTMLBaseElement.prototype, HTMLElement.prototype);
eggvm.toolsFunc.defineProperty(HTMLBaseElement.prototype, "href", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "href_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "href_set", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLBaseElement.prototype, "target", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "target_get", arguments)}, set:function (){return eggvm.toolsFunc.dispatch(this, HTMLBaseElement.prototype, "HTMLBaseElement", "target_set", arguments)}});
