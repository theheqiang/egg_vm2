// 网页变量初始化

!function (){
    // console.log(Date.now());// 1666689952666
    // console.log(new Date().getTime());// 1666689952666
    // console.log(Math.random());// 0.5
    let meta1 = document.createElement("meta");
    let meta2 = document.createElement("meta");
    let head = document.createElement("head");
    meta2.content = "{content}";
    eggvm.toolsFunc.setProtoArr.call(meta1, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(meta2, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(navigator,"connection",connection)
    eggvm.toolsFunc.setProtoArr.call(navigator,"webkitPersistentStorage",{})
    // let body = document.createElement("body");
    document.charset = "UTF-8"
    document.characterSet = "UTF-8"

    location.href = 'http://www.fangdi.com.cn/new_house/new_house_detail.html?project_id=b87cb3d04f878ca6'
}();



