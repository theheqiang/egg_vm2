// 浏览器接口具体的实现
!function (){
    eggvm.envFunc.Storage_getItem = function Storage_getItem(){
        return null;
    }
    eggvm.envFunc.document_location_get = function document_location_get(){
        return location;
    }
    eggvm.envFunc.Document_createElement = function Document_createElement(){
        return "<div></div>";
    }
    eggvm.envFunc.window_top_get = function window_top_get(){
        return window;
    }
    eggvm.envFunc.window_self_get = function window_self_get(){
        return window;
    }
}();
