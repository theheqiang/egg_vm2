// window对象
// 删除浏览器中不存在的对象
delete global;
delete Buffer;
delete WindowProperties;
window = globalThis;
Object.setPrototypeOf(window, Window.prototype);




eggvm.toolsFunc.defineProperty(window, "atob", {configurable:true, enumerable:true, writable:true,
    value:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "atob", arguments)}
});


eggvm.toolsFunc.defineProperty(window, "btoa", {
    configurable:true,
    enumerable:true,
    writable:true,
    value:function btoa(str){
        return eggvm.toolsFunc.base64.base64encode(str);
    }
});

eggvm.toolsFunc.defineProperty(window, "name", {configurable:true, enumerable:true, get:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "name_get", arguments, 'window.name666')}, set:function (){return eggvm.toolsFunc.dispatch(this, window, "window", "name_set", arguments)}});
