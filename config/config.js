// 全局对象配置
debugger;
eggvm = {
    "toolsFunc":{},//功能函数相关，插件
    "envFunc":{},// 具体环境实现相关
    "config":{}, // 配置相关
    "memory":{}, // 内存
}
eggvm.config.proxy = false; // 是否开启代理
eggvm.config.print = true; // 是否输出日志
eggvm.memory.symbolProxy = Symbol("proxy");// 独一无二的属性, 标记是否已代理
eggvm.memory.symbolData = Symbol("data");// 用来保存当前对象上的原型属性
eggvm.memory.tag = []; // 内存，存储tag标签
eggvm.memory.filterProxyProp =[eggvm.memory.symbolProxy,eggvm.memory.symbolData, "eval"];// 需要过滤的属性

