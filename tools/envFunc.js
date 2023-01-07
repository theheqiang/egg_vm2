// 浏览器接口具体的实现

eggvm.envFunc.EventTarget_addEventListener = function EventTarget_addEventListener(){
    console.log(this === window);
    console.log(arguments);
    debugger;
    return "666"
}
eggvm.envFunc.window_atob = function window_atob(){
    return "正在调用atob方法"
}