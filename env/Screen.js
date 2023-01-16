// Screen对象
Screen = function Screen(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}

screen = {}
Object.setPrototypeOf(screen,Screen.prototype)
eggvm.toolsFunc.safeProto(Screen, "Screen");
Object.setPrototypeOf(Screen.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(Screen.prototype, "availWidth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availWidth_get", arguments, 1600)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availHeight", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availHeight_get", arguments, 860)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "width", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "width_get", arguments, 1600)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "height", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "height_get", arguments, 900)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "colorDepth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "colorDepth_get", arguments, 24)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "pixelDepth", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "pixelDepth_get", arguments, 24)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availLeft", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availLeft_get", arguments, 0)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "availTop", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "availTop_get", arguments, 0)}, set:undefined});
eggvm.toolsFunc.defineProperty(Screen.prototype, "orientation", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, Screen.prototype, "Screen", "orientation_get", arguments)}, set:undefined});
