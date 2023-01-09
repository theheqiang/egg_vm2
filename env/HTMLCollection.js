// HTMLCollection对象
HTMLCollection = function HTMLCollection(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLCollection, "HTMLCollection");
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "item", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLCollection.prototype, "HTMLCollection", "namedItem", arguments)}});
