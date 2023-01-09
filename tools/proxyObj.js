// 需要代理的对象
// window = new Proxy(window, {});
localStorage = eggvm.toolsFunc.proxy(localStorage, "localStorage");
sessionStorage = eggvm.toolsFunc.proxy(sessionStorage, "sessionStorage");
location = eggvm.toolsFunc.proxy(location, "location");
document = eggvm.toolsFunc.proxy(document, "document");
window = eggvm.toolsFunc.proxy(window, "window");