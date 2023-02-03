function N(a, b, c) {
    var e = a.productNumber
        , d = a.merged
        , f = a.pn || e;
    if (!f)
        throw Error("[NEWatchman] required product number");
    e = location.protocol.replace(":", "");
    a = v(v({
        onload: b,
        onerror: c
    }, a), {
        protocol: e,
        auto: !0,
        onload: r,
        onerror: r,
        timeout: 6E3,
        pn: f
    });
    "http" !== a.protocol && "https" !== a.protocol && (a.protocol = "https");
    if (!d)
        return z(a);
    var g = window.initWatchman.__instances__;
    if (g[f])
        g[f].callback.push(a.onload),
        g[f].instance && (g[f].callback.forEach(function(a) {
            return a(g[f].instance)
        }),
            g[f].callback.length = 0);
    else
        return g[f] = {
            instance: null,
            callback: [a.onload]
        },
            z(a)
}
window.initWatchman || (window.initWatchman = window.initNEWatchman = N,
window.initWatchman.version = 7,
window.initWatchman.__instances__ = {},
window.initWatchman.__supportCaptcha__ = !0)

location.href = 'https://dun.163.com/trial/jigsaw'