// 网页变量初始化

!function (){
    // console.log(Date.now());// 1666689952666
    // console.log(new Date().getTime());// 1666689952666
    // console.log(Math.random());// 0.5

    let onLeave = function (obj){
        obj.result = 1666689952666;
    }
    let onLeave2 = function (obj){
        obj.result = 0.5;
    }
    Date.now = eggvm.toolsFunc.hook(Date.now,undefined,false,function (){},onLeave);
    Date.prototype.getTime = eggvm.toolsFunc.hook(Date.prototype.getTime,undefined,false,function (){},onLeave);
    Math.random = eggvm.toolsFunc.hook(Math.random,undefined,false,function (){},onLeave2);

}();