// Window对象
Window = function Window(){

}
// 函数native化
eggvm.toolsFunc.setNative(Window, "Window");
// 修改对象名称
eggvm.toolsFunc.reNameObj(Window, "Window");
// 设置Window.prototype的原型对象
Object.setPrototypeOf(Window.prototype, WindowProperties.prototype);

// 删除浏览器中不存在的对象
delete global;
delete Buffer;
window = globalThis;
Object.setPrototypeOf(window, Window.prototype);


Object.defineProperty(window, "atob", {
    value:function atob(str){
        return eggvm.toolsFunc.base64.base64decode(str);
    }
});
eggvm.toolsFunc.setNative(window.atob,"atob");
Object.defineProperty(window, "btoa", {
    value:function btoa(str){
        return eggvm.toolsFunc.base64.base64encode(str);
    }
});
eggvm.toolsFunc.setNative(window.btoa,"btoa");

console.log(atob('YWJj'));
console.log(btoa('abc'));
console.log(btoa.toString());
console.log(atob.toString());
