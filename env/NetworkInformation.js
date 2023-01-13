// NetworkInformation对象
NetworkInformation = function NetworkInformation(){return eggvm.toolsFunc.throwError("TypeError", "Illegal constructor")}
eggvm.toolsFunc.safeProto(NetworkInformation, "NetworkInformation");
Object.setPrototypeOf(NetworkInformation.prototype, EventTarget.prototype);
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "onchange", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "onchange_get", arguments, null)}, set:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "onchange_set", arguments)}});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "effectiveType", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "effectiveType_get", arguments, '3g')}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "rtt", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "rtt_get", arguments, 550)}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "downlink", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "downlink_get", arguments, 1.45)}, set:undefined});
eggvm.toolsFunc.defineProperty(NetworkInformation.prototype, "saveData", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, NetworkInformation.prototype, "NetworkInformation", "saveData_get", arguments, false)}, set:undefined});

connection = {}
Object.setPrototypeOf(connection,NetworkInformation.prototype);