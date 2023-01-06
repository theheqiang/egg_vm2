// window对象
// 删除浏览器中不存在的对象
delete global;
delete Buffer;
delete WindowProperties;
window = globalThis;
Object.setPrototypeOf(window, Window.prototype);


Object.defineProperty(window, "atob", {
    value:function atob(str){
        return eggvm.toolsFunc.base64.base64decode(str);
    }
});
eggvm.toolsFunc.safeFunc(window.atob,"atob");
Object.defineProperty(window, "btoa", {
    value:function btoa(str){
        return eggvm.toolsFunc.base64.base64encode(str);
    }
});
eggvm.toolsFunc.safeFunc(window.btoa,"btoa");