// 网页变量初始化

!function (){
    // console.log(Date.now());// 1666689952666
    // console.log(new Date().getTime());// 1666689952666
    // console.log(Math.random());// 0.5
    // Math.random = eggvm.toolsFunc.hook(Math.random,undefined,false,() =>{},(obj) => {obj.result = 0.5});
    // Date.prototype.getTime = eggvm.toolsFunc.hook(Date.prototype.getTime,undefined,false,() =>{},(obj) => {obj.result =1666689952666});
    let meta1 = document.createElement("meta");
    let meta2 = document.createElement("meta");
    let head = document.createElement("head");
    meta2.content = "{qVKpzLhKgBMnTfhbGvMSYjr0t1083179040YT.yPfgl5C_fxqJFZqTadz[aFHLuGV.hJ4g27q5iKyEtWYNYWkQ.1kNAcmALxmJQr60mRVY9oDQmVVVBKlNwpGpqivyAwprSkvlmImfPVorR8V7OWvAQwaVarCGmQOAu1SlkKqz6EKgeQGWUrUW4YY2lllQM81GxV6QoKqYcpVlQUqY7pprFKcxCoCrA30wqWVLgkmrsivWLrre_1aAnVpa7rK0oJaVBJDfhQYGatolArr9hUqlQ8GazHULyta3dhvxscGQvrsemifayrAzmwYawVKLEFcgzrs0Mks7WVsEcr173WcJhKsEtoq9m1GQ1rAA0pVz1KkLCcn7jHcJpxuGjrVEHtn06hsQ3YTWzraEmmlVUor3mx9Y8tS7PrafhEJEv4uoTkdQjdPBHiwRoe9XnWXQQyGKvrd9mgs1P1ZaBdPknkWG9T1uIltAE0Y6Xxtle0pPgVZqo_AUSpIqQZaUep3Wjnc4VKeV9ZmdOUyEuZAdshIq_50Iz1yQnarukrRaoSqU8JxehZ2OIxxGiZrO.W3G26k4dKEgGZAd_txTsba80rFym.pnLrRfmyc52WME.GrCMkM7L2GKeEI7LbG5Eh.rh_kteohGm5A8OrM70elXpcj7r9S5BHg0o2Sb5q3QcL2DhxwLES2i5ryWmP0KDoEVmz0UxxFEDjAiPlyLR9AFVijVbzYj3UEa220BJWN3Q2AUKrggm9ksp1_giP0p2ECLbY1JMhK7.QffsJVgeAa7.VmllIGRGpbWI3GR1pOE_8nruUmA4ppyOcnWa8OTelP9lQGR_1c3SQSenrOWlYARJJayEQPYkDKLomPAxlrlGVuYIiDflQTgwDaSAwqpmr2TDUreIrb2DmuyXrbrQ3fx3qYplYrJVUAab31euWPmE8ul7onZDFqAarPL6F0GADcZakSqEEpZokTE2cqlycpEhx1GMQYqHrcqDi93youADrlRgckTwQ2a_xC9MJP36EPqaskq2qsWZmlfQWA9IrqRmrrZDruwq1qGZtal3UOZPtn7phPaEikLdh03xp1zFVcElka3UpfEIlA3Op20WZPkAEIRR5PhZW70Mjr4El_RM6s4J1hlSgfdfrjEl5GMZJ4TEerhdqdavdObGlBqf.kP7UJlLePOXc4eASAsjr7SDuSdirByDfG6wxygy9ukDhB3rafvMDLEwy1IgUifEPOoIoegDvasrrz96b9O8tHzQOav6idEGuGFtVzr30n8_Kgqhgmc3rhlDjVFLo_7D2VM.qHE1.f5Oo_GzdTv4HhgeXPbtH3wl2VOBW30SeVKBk4zmXSj.pM0FzlK.DML3La5HoLQ3uqFJc3ql2A5CDt7mOAdmkLgxvfiwo.ghvAXwDwJDffPDk_2D.9ORoREETaXxDzVhPaHsoggHOcbFrUAiQ0pXqbqiFffGpDliQnwfcDam8AyoqvZIh0w_DULiss3erKQoIu3g1UyR3u2pWblkhrxNW0W1YG3joP3XQPacVULmYawHp0L81Aw4paVmoTzQDTWrRqJoK2AoAVYLooewFsJu1A9aKfyRrSLmAGwVJfYxYpN1iK9n1aeRivW3JAE9rfENrPG7cbwpoAVnrnpoxSgbrSRoMf96Kp0eiqAGtclHxkeGpAgEm0V8kPRx3Oq6oO3owaVNrulCQ99LHGV2xa9EpAVtkmg0lPgclcYpEc7t1mlarp9oqVQqoGWohVwsorZoHmgOrfWRkGZyKf9nEpE5VGNsi02oWrq8la87rIAo4OM5p5L8_AIM3Ar2v1zr2zcX2t_lB7OP6EBLPX18nR4l9B15PRhW5713qqqqqqq|v3dmIbqCcmLwkGrjmr7zrvajQryaJCli1rZmrLOnpkRWh3Ar8inrlMAYNqsfDYq25kUEz3sTmJO0cHrY6l20OM1xnJT9mR1YnHv7csTSdxKJtFpyzV69BhalLVogkscJehoASMnwFtTLOlmwxxTQXASRmooLq3cfbhlZHRswRhvqrqYJ3HbA8QGJ1olAhRcxGoDEZYlN5Wlgb3SR_JoqDKOpuqu7tQrAaoca2xuJ9pklmxrl7KKfVtmqtVr9oDqEjJogHHpaLqfLN3sW0pbGqr1r4k674hPHWuS6r3UPCQA82CCUsMwwfg6UhVwJRu6okcwQpS}FsdrenvBrw3qjGOjwHRrf21_Vxy0Bn6UkIWlfbsOwkN042PR2clgnFkYGxcS6YOfNWCavF1R7mb3S8kGPqCVdMszgWK3TYuSuE6z6HUy1JKEDwPxSWU7ZI6GZwDLTMnJ6H6m6cUy1ElgyY6GkQqxyIKm_Wr2jDCEAE0GP1sYkI29y1np3HYImvSDom3QJ7SKAqqqqqqq!x7z,aac,amr,asm,avi,bak,bat,bmp,bin,c,cab,css,csv,com,cpp,dat,dll,doc,dot,docx,exe,eot,fla,flc,fon,fot,font,gdb,gif,gz,gho,hlp,hpp,htc,ico,ini,inf,ins,iso,js,jar,jpg,jpeg,json,java,lib,log,mid,mp4,mpa,m4a,mp3,mpg,mkv,mod,mov,mim,mpp,msi,mpeg,obj,ocx,ogg,olb,ole,otf,py,pyc,pas,pgm,ppm,pps,ppt,pdf,pptx,png,pic,pli,psd,qif,qtx,ra,rm,ram,rmvb,reg,res,rtf,rar,so,sbl,sfx,swa,swf,svg,sys,tar,taz,tif,tiff,torrent,txt,ttf,vsd,vss,vsw,vxd,woff,woff2,wmv,wma,wav,wps,xbm,xpm,xls,xlsx,xsl,xml,z,zip,apk,plist,ipaqqr7hok8w2.xay9fr0qDa67074kAHZskVLPhbadMkeLhoZzRKqqqqqqqqq.mZi2yl_wqE_oZmaiaBbf5uV5pSknDEhslQj2MwM3axZr0l4096hertzoFP0ofb~RwjAP2rILmwqYZV6PqN09dSBEERQIC9HhoQ9u_l6RHIL3gfkgqEge0u.kDBqqC0CchLaBTVcWm3VTOfCiigQs.0CTD43e20DirdaSd1uyhtwl.9Czry9udltcD57BvG1PAjRc7V6Oi3pm9A1ZA_2D.pnAxMl8yG_.WXLrTGKvA39Qf0dUr_eJGsbPDMl4.GcJpw0HT08El47Mzn8RWxLmB9CpHy3GNOPGrtZZu94clxqcOpCMlWL_jkdJKKmrJ9QTAuzRMGA5kOEoYuzWmsgTRAr4KKTri9QyAuwR8GAjDTLSQrTZJ1AgIrmyscLeVqmtrUxlwneuDPYqxPRWmDqiFfylAV98http:3Dw11rlzTZkWI3TUmRrjQA:80qqqqqqqqqq";
    eggvm.toolsFunc.setProtoArr.call(meta1, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(meta2, "parentNode", head);
    eggvm.toolsFunc.setProtoArr.call(navigator,"connection",connection)
    eggvm.toolsFunc.setProtoArr.call(navigator,"webkitPersistentStorage",{})
    // let body = document.createElement("body");
    document.charset = "UTF-8"
    document.characterSet = "UTF-8"

    location.href = 'https://www.nmpa.gov.cn/datasearch/home-index.html'
}();

