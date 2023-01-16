// 网页变量初始化

!function (){
    // console.log(Date.now());// 1666689952666
    // console.log(new Date().getTime());// 1666689952666
    // console.log(Math.random());// 0.5
    Math.random = eggvm.toolsFunc.hook(Math.random,undefined,false,() =>{},(obj) => {obj.result = 0.5});
    Date.prototype.getTime = eggvm.toolsFunc.hook(Date.prototype.getTime,undefined,false,() =>{},(obj) => {obj.result =1666689952666});
    let meta1 = document.createElement("meta");
    let meta2 = document.createElement("meta");
    let head = document.createElement("head");
    meta2.content = "{qqqqqqqqqqq~tRMRR6aBolWSmuputqERoTquRqw7hvVKNqISovsj7c_GtNqDRiXYmNG19qHwoLshgYt9aP1j5WjmQ_sFjt4RsLTFuxLAvBTKhWR067uiBr.p1PGb4Y.0UGPCak.q0L1_NEE7PBqiKYW3eXnCwcNW_GcXwxyZhGpKRc4AJSnX1hMa0NY12mRLOjOFeogTpuuIWqZZKXT8ekYqkVTmlokLtFAa0tUqstsRPmC0GITmrcClxRcW4cbLkVSSVJmqkQfr6r1lOEuYQEK9WAAmwo90aASJNECGfpYw7pqlAAaNKqS2lFrworpmV3aSdxCqOKOJPYT0xIYAMrSx3qqqqqY4c.AD1TDDIWGHgAue6Z1Jr0t1074790432hgLHgQonw_5hr0l3650VkLLdBk_5J.9eXOn5HMggq|gmkLGsvSQ3DN8VlSwAfmRk0axpnNzw9R0RaygElVfsASwrUGXVf2Dqc3w3AfSI0w2ASS6RcqoVSLvR1AA3SpMHcQOhDxTtmWYpPTrhD0yUf3btV7nsfxXEml7AOeWJDE68qmGt60MIpNYim9Q3Gm5qYG_Uqpzpl0ysr9zD6V48swUh9aWp1ZzDUE1i9wSxTIpszpy7KsE8hTfuUOREHZGNvkfYezZ76OCIHSnSokkizwdaCMERdq9ys.H3e7vNotGUBz5TvKN3Qee.KIVAZfi_1M7KBlv4960AWNelkD7OXWRq8d2sbMBN8y9hSoBzVgK4dUXTcdD45YieAeYCuK8NQZavWDTqoTZlYASlhT9YkpqEpmWKqSlqA2RHr0rsDq3m26649Ddfe167*RhpugXf_sCqM3bK9ImhUECG;8r_Y1SkBgkgFBpsHp7r3oG;z67EOpjccIBhPOTkizxDtq;7J11Z1TB0_PrDS4zbENgAq;YmwPBbTLd4DoZpjppGf1Pq;iALZgQPrFh_xWDuisxI8ua;HRWFnnaSkgAk21tdX1qWsG;yB38m9.rehd9NhUIIvHB.a;DxpA6BIg5zsjOZfXGF4Lyq;uHY3XlpFTMuMiP8u6NZKLA;h_5fy4agQ.0x0AnlXxQ35q;EAs6AmdBzeKONF5S6v_Qfa;boOYwXohBRGw7XYc0maz1q;p_qexdsC8_.ngvualNNiPA;K13JgY4_33iVrzB9B5W5Wq;SLYuXOh.biYVAyyeRz.BHA;C.o5XY9cVVpH_.5rwicvWG;Wl3HrvYnIJ7tHkx0o7kXNA;G4ThBzOEEJRXCJt0L6NCEq;eMaOFbE5nVrBNMSFTCs5Nq;McctjrO__MP2fRM_BDBugG;zWoKsJqSKqvbFt_YY.RZCG;T8F36FaS9AtR4sXBkRr0iG;beOAbDTkZl.iXHBXZ8W_9A;zsa9XRk11NcmmL5mZ7GJXA;bX.pJZup7pweKh4Iw16sxq;E3NSN8VVSishtCvGVvDxKG;paw1qGUwxFjhT0npAbBofA;xdueNVjmtmhXUerdBx_Wqq;gU7acFwtDZLMT8WPs_lGSG;Q93hyM1wrPqfoXsow7AaQG;pt5i2AuES.0rXg0.fKhBuG;ct.2k_JwliQS82nXH8kcfG;tahIqRQQSqxFkmE.oeMsCq;DN0PFQTk.3b.EWnAE0M_Ba;2fnmOqfUkLWKiEeDbwX82a;CELl9k7vj.g7SYg1HZ.jTa;xVtZ9.fpfr2dDNfaNAzAgq;Md_h7GByEBZUfD7KO_Kkya;W04bMLoJwAFCt9lT1bNduq;yCga2n_ig9tE8kvTTlbAuG;ipy_H6arWSBVsjFU9h1h.a;xrYRhwM6FYW7zCsPL.iecq;hLhicafa4br4.Unj9bcH9a;hfgZrtz_KscdFC6a3f1wKA;qqqqqqqqqqq!x7z,aac,amr,asm,avi,bak,bat,bmp,bin,c,cab,css,csv,com,cpp,dat,dll,doc,dot,docx,exe,eot,fla,flc,fon,fot,font,gdb,gif,gz,gho,hlp,hpp,htc,ico,ini,inf,ins,iso,js,jar,jpg,jpeg,json,java,lib,log,mid,mp4,mpa,m4a,mp3,mpg,mkv,mod,mov,mim,mpp,msi,mpeg,obj,ocx,ogg,olb,ole,otf,py,pyc,pas,pgm,ppm,pps,ppt,pdf,pptx,png,pic,pli,psd,qif,qtx,ra,rm,ram,rmvb,reg,res,rtf,rar,so,sbl,sfx,swa,swf,svg,sys,tar,taz,tif,tiff,torrent,txt,ttf,vsd,vss,vsw,vxd,woff,woff2,wmv,wma,wav,wps,xbm,xpm,xls,xlsx,xsl,xml,z,zip,apk,plist,ipaqqqqqhAM4MqrlPIWzhOru1KK9Qvrmk162l4096r4r0r1.ygPD4lJ9P2t5aU8ykW1532AuQJUy3CfNSxm9GQlNjl0qK5PqQ0lLCvnS9q3IextReeqioLWB7cC0t40L7Gq{)YUpvsbmmMaAarPqpxSS4DsA3Hp9TsDeWRlV4g1HLWXWf4c8jJHV20kkTxXl_yuKgM4x2zOoPJB7g_OB98dEveusvWJlyZkOui5JeBnHaWIZ_BonnJBa4uOv5hHA70sccQgYT0cIAWqc80Qm4A2Oc1WxgAffccxxL9fO1_EEgVG|[Ao3yA1E2EPf4qoQ3lf9apnlu8V0xtvBJhQA6ua1gE4Vh7kspQHrCT6BjQQmTdu8ZJ47IzAvjWdaNjPv6WdZN.a17lWq00qnOmIyTgq6O8dZy5Gj2czWy_S.JmZVRnskat5Augu18kW3r9PBREQlbnsIctQGjSOIY8dQsgAhScwfSgcIWEB26evXJlwGKuaogEzWW_qvQ8g9mzPnStFa6dnH.r.gtBAIeQEeX.PFXQIN65D_9WdA9dGFNcjGoyvc1M.lb76ofw5TX7uHftLSuy1KvEL9A.UBVWj7Df6FxkjfTTukwmyZYO6KsJtgzGv7";
    eggvm.toolsFunc.setProtoArr.call(meta1, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(meta2, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(navigator,"connection",connection)
    eggvm.toolsFunc.setProtoArr.call(navigator,"webkitPersistentStorage",{})
    // let body = document.createElement("body");
    document.charset = "UTF-8"
    document.characterSet = "UTF-8"

    location.href = 'http://www.fangdi.com.cn/new_house/new_house_detail.html?project_id=b87cb3d04f878ca6'
}();



