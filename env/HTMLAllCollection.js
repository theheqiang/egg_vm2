// HTMLAllCollection对象
HTMLAllCollection = function HTMLAllCollection(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(HTMLAllCollection, "HTMLAllCollection");
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "length", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "length_get", arguments)}, set:undefined});
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "item", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "item", arguments)}});
eggvm.toolsFunc.defineProperty(HTMLAllCollection.prototype, "namedItem", {configurable:true, enumerable:true, writable:true, value:function (){return eggvm.toolsFunc.dispatch(this, HTMLAllCollection.prototype, "HTMLAllCollection", "namedItem", arguments)}});
