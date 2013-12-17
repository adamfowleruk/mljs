
var m=window.mljs||{};var b=m.bindings||{};b.xhr=function(){};if(typeof XMLHttpRequest==="undefined"){XMLHttpRequest=function(){try{return new ActiveXObject("Msxml2.XMLHTTP.6.0");}
catch(e){}
try{return new ActiveXObject("Msxml2.XMLHTTP.3.0");}
catch(e){}
try{return new ActiveXObject("Microsoft.XMLHTTP");}
catch(e){}
throw new Error("This browser does not support XMLHttpRequest.");};}
b.xhr.supportsAdmin=function(){return false;};b.xhr.configure=function(username,password,logger){this.logger=logger;this.username=username;this.password=password;};b.xhr.request=function(reqname,options,content,callback){var xmlhttp=new XmlHttpRequest();xmlhttp.onreadystatechange=function(){if(xmlhttp.readyState===4){if(xmlhttp.status==200){var res={};res.inError=false;res.statusCode=xmlhttp.status;res.doc=JSON.parse(xmlhttp.responseText);callback(res);}else{var res={};if(xmlhttp.status==303){res.location=xmlhttp.getHeader("location");}
res.inError=true;res.statusCode=xmlhttp.status;res.doc=xmlhttp.responseText;callback(res);}}};xmlhttp.open(options.method,options.path,true,this.username,this.password);xmlhttp.setRequestHeader('X-Requested-With','XMLHttpRequest');xmlhttp.send(content);};