// window对象
// 删除浏览器中不存在的对象
delete global;
delete Buffer;
delete WindowProperties;
window = globalThis;
Object.setPrototypeOf(window, Window.prototype);


eggvm.toolsFunc.defineProperty(window, "atob", {
    configurable:true,
    enumerable:true,
    writable:true,
    value:function atob(str){
        return eggvm.toolsFunc.base64.base64decode(str);
    }
});
eggvm.toolsFunc.defineProperty(window, "btoa", {
    configurable:true,
    enumerable:true,
    writable:true,
    value:function btoa(str){
        return eggvm.toolsFunc.base64.base64encode(str);
    }
});
eggvm.toolsFunc.defineProperty(window, "name", {
    configurable: true,
    enumerable: true,
    get:function (){},
    set:function (){}
});
