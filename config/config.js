// 全局对象配置
debugger;
eggvm = {
    "toolsFunc":{},//功能函数相关，插件
    "envFunc":{},// 具体环境实现相关
    "config":{}, // 配置相关
    "memory":{}, // 内存
}
eggvm.config.proxy = true; // 是否开启代理
eggvm.config.print = true; // 是否输出日志
eggvm.memory.symbolProxy = Symbol("proxy");// 独一无二的属性, 标记是否已代理
eggvm.memory.filterProxyProp =[eggvm.memory.symbolProxy, "eval"];// 需要过滤的属性
