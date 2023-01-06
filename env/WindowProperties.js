// WindowProperties对象
WindowProperties = function WindowProperties(){

}
// 函数native化
eggvm.toolsFunc.setNative(WindowProperties, "WindowProperties");
// 修改对象名称
eggvm.toolsFunc.reNameObj(WindowProperties, "WindowProperties");

Object.setPrototypeOf(WindowProperties.prototype, EventTarget.prototype);

