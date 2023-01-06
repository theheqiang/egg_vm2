// EventTarget对象
EventTarget = function EventTarget(){

}
eggvm.toolsFunc.safeProto(EventTarget, "EventTarget");
// 函数native化
eggvm.toolsFunc.setNative(EventTarget, "EventTarget");
// 修改对象名称
eggvm.toolsFunc.reNameObj(EventTarget, "EventTarget");

Object.defineProperty(EventTarget.prototype, "addEventListener", {
    value:function (){}
});
eggvm.toolsFunc.safeFunc(Object.getOwnPropertyDescriptor(EventTarget.prototype, "addEventListener").value, "addEventListener");
