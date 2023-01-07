// EventTarget对象
EventTarget = function EventTarget(){

}
eggvm.toolsFunc.safeProto(EventTarget, "EventTarget");

eggvm.toolsFunc.defineProperty(EventTarget.prototype, "addEventListener", {
    value:function (){
        return eggvm.toolsFunc.dispatch(this, EventTarget.prototype, "EventTarget", "addEventListener", arguments);
    }
});
