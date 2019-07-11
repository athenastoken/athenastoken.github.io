(function(){
	$.fn.extend({
        getQueryString : function(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[2]); return null;
        },
        getData : function(options){
            var a = {
                url : "",
                data : {},
                result : false,
                async : false,
                type : "get",
                processData: true,
                error : false
            }
            $.extend(a, options);
             
            var data = a.data,
                url = "https://"+window.location.host+'/'+a.url;
                // url = "http://192.168.1.110:8085/"+a.url;

            $.ajax({
                url: url,
                type: a.type,
                dataType: 'json',
                async : a.async,
                processData: a.processData,
                data: data,
                success : function(data){
                    a.result(data);
                },
                error : function(a,b,c) {
                    if($.fn.getCookie("language") == "en"){
                        alert("Server error, please refresh the page and try again!",true);
                    }else{
                        alert("服务器错误，请刷新页面重试!",true);
                    }
                }
            });
            
        },
        getCookie : function(name){
            var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
            if(arr=document.cookie.match(reg)){
                return unescape(arr[2]); 
            }else{
                return null; 
            }
        },
        setCookie : function(name,value){
            var Days = 365;
            var exp = new Date();
            exp.setTime(exp.getTime() + Days*24*60*60*1000);
            document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString()+";path=/";
        },
        delCookie : function(name){ 
            var exp = new Date(); 
            exp.setTime(exp.getTime() - 1); 
            var cval=$.fn.getCookie(name); 
            if(cval!=null) 
                document.cookie= name + "="+cval+";expires="+exp.toGMTString()+";path=/"; 
        }
	});

})($);

var loginflag = 0;
var g_curwallet = '';
var g_curwalletaddress = '';
var scatter = null;
var eosjs = null;
var eos = null;
var isok = false;

//主网测试环境
//var rextokenbank = 'pandora11111';
//var eosAccount = 'larry5555555';
//var defi_account = 'been55555555';

//主网正式环境
var rextokenbank = 'athenaexpect';
var eosAccount = 'eosio.token';
var defi_account = 'athenastoken';


ScatterJS.plugins(new ScatterEOS());
const network = {
    blockchain: 'eos',
    protocol: 'https',
    host: 'nodes.get-scatter.com',
    port: 443,
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    // chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
}
var config = {
    // chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    keyProvider: null,
    // httpEndpoint: 'https://api-kylin.eoslaomao.com',
    httpEndpoint: 'https://eos.newdex.one',
    mockTransactions: () => null,
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true
};

eosjs = Eos(config);

function getwalletlist() {
    var refer = GetQueryString("ref");
    if (tp.isConnected() == true) {
        if (refer != null && refer != "") {
            localStorage.setItem("ref", refer);
        } else {
            localStorage.setItem("ref", "tpt");
        }
        tp.getCurrentWallet().then(data => {
            if (data.result == true) {
                if (data.data.blockchain_id == 4) {
                    var accountname = data.data.name;
                    var address = data.data.address;
                    $("#accno").html(accountname);
                    $("#curraccno").html(accountname);
                    g_curwallet = accountname;
                    g_curwalletaddress = address;
                    getaccountinfo(g_curwallet);
                }
            }
        })
    } else {
        refer = (refer == null ? "" : refer);
        localStorage.setItem("ref", refer);
    }
}

function scatterLogin() {
    if (tp.isConnected() == true) {
        tp.getCurrentWallet().then(data => {
            g_curwallet = data["data"]["name"];
            loginflag = 1;
            $(".login").hide().next().show().text(g_curwallet);
            $(".login_out,.bi").show();
            getaccountinfo(g_curwallet);
            $(".center_list a:eq(1)").attr("href","https://bloks.io/account/"+g_curwallet);
            setInterval(function(){
                getaccountinfo(g_curwallet);
            },30000);
        })
    } else {
        const requiredFields = {
            accounts: [network]
        };
        scatter.getIdentity(requiredFields).then(() => {
            var account = scatter.identity.accounts.find(x => x.blockchain === 'eos');
            loginflag = 1;
            $(".login").hide().next().show().text(account.name);
            $(".login_out,.bi").show();
            g_curwallet = account.name;
            getaccountinfo(account.name);
            $(".center_list a:eq(1)").attr("href","https://bloks.io/account/"+g_curwallet);
            setInterval(function(){
                getaccountinfo(account.name);
            },30000);
        }).catch(error => {
            
        });
    }
}
function getaccountinfo(accountname) {
    if (tp.isConnected() == true) {
        tp.getEosTableRows({
            json: true,
            code: eosAccount,
            scope: accountname,
            table: 'accounts',
            lower_bound: '0',
            limit: -1
        }).then(function (data) {
            if (data.result) {
                var cnt = data.data["rows"].length;
                if (cnt == 0) {
                    $(".eosbi").text("0.0000 EOS").attr("data-eos",0);
                } else {
                    for (var i = 0; i < cnt; i++) {
                        var balance = data.data["rows"][i]["balance"];
                        $(".eosbi").text(balance).attr("data-eos",balance);
                        break;
                    }
                }
            } else {
                $(".eosbi").text("0.0000 EOS").attr("data-eos",0);
            }
        });
        tp.getEosTableRows({
            json: true,
            code: defi_account,
            scope: accountname,
            table: 'accounts',
            lower_bound: '0',
            limit: -1
        }).then(function (data) {
            if (data.result) {
                var cnt = data.data["rows"].length;
                if (cnt == 0) {
                    $(".pdrbi").text("0.0000 ATHENA");
                } else {
                    for (var i = 0; i < cnt; i++) {
                        var balance = data.data["rows"][i]["balance"];
                        var arr = balance.split(' ');
                        if (arr[1] == 'ATHENA') {
                            $(".pdrbi").text(balance);
                            break;
                        }
                    }
                }
            } else {
                $(".pdrbi").text("0.0000 ATHENA");
            }
        });
    } else {
        eosjs.getTableRows(true, eosAccount, accountname, "accounts", function (error, data) {
            if (error == null) {
                $(".eosbi").text("0.0000 EOS").attr("data-eos",0);
                var cnt = data["rows"].length;
                if (cnt == 0) {
                    $(".eosbi").text("0.0000 EOS").attr("data-eos",0);
                } else {
                    for (var i = 0; i < cnt; i++) {
                        var balance = data["rows"][i]["balance"];
                        $(".eosbi").text(balance).attr("data-eos",balance);
                        break;
                    }
                }
            } else {
                if($.fn.getCookie("language") == "en"){
                    alert("Server error, please refresh the page and try again!",true);
                }else{
                    alert("服务器错误，请刷新页面重试!",true);
                }
            }
        });
        eosjs.getTableRows(true, defi_account, accountname, "accounts", function (error, data) {
            if (error == null) {
                $(".pdrbi").text("0.0000 ATHENA");
                var cnt = data["rows"].length;
                if (cnt == 0) {
                    $(".pdrbi").text("0.0000 ATHENA");
                } else {
                    for (var i = 0; i < cnt; i++) {
                        var balance = data["rows"][i]["balance"];
                        var arr = balance.split(' ');
                        if (arr[1] == 'ATHENA') {
                            $(".pdrbi").text(balance);
                            break;
                        }
                    }
                }
            } else {
                if($.fn.getCookie("language") == "en"){
                    alert("Server error, please refresh the page and try again!",true);
                }else{
                    alert("服务器错误，请刷新页面重试!",true);
                }
            }
        });
    }
}

function buy(eosbi) {
    var captcha1 = new TencentCaptcha('2069721469', function (res) {
        if (res.ret == 0){
            captcha1.destroy();
            var eosnum = eosbi;
            var quantity = eosnum + " EOS";
            var memo = "Buy ATHENA";
            if (tp.isConnected() == true) {
                tp.pushEosAction({
                    actions: [
                        {
                            account: eosAccount,
                            name: 'transfer',
                            authorization: [{
                                actor: g_curwallet,
                                permission: 'active'
                            }],
                            data: {
                                from: g_curwallet,
                                to: rextokenbank,
                                quantity: quantity,
                                memo: memo
                            }
                        },
                    ],
                    address: g_curwalletaddress,
                    account: g_curwallet
                }).then(function (data1) {
                    var txid = data1.data.transactionId;
                    if (txid.length == 64) {

                        $(".loading").hide();
                        if($.fn.getCookie("language") == "en"){
                            alert("Successful redemption,Confirmation on the chain is expected to arrive within 5 minutes!");
                        }else{
                            alert("兑换成功,预计5分钟内到账!");
                        }
                        $("#dh,#result").val(0);
                        $(".eosbi").text((parseFloat($(".eosbi").text())-eosbi).toFixed(4)+" EOS");
                        getd();
                    }
                }).catch(function (err) {
                    if($.fn.getCookie("language") == "en"){
                        alert("Server error, please refresh the page and try again!",true);
                    }else{
                        alert("服务器错误，请刷新页面重试!",true);
                    }
                    $(".loading").hide();
                });
            } else {
                scatter.getIdentity({
                    accounts: [network]
                }).then(function (identity) {
                    var account = identity.accounts[0];
                    var options = {
                        authorization: account.name + '@' + account.authority,
                        broadcast: true,
                        sign: true
                    };

                    eos.contract(eosAccount, options).then(contract => {
                        contract.transfer(account.name, rextokenbank, quantity, memo, options).then(function (tx) {
                            var txid = tx.transaction_id;
                            if (txid.length == 64) {
                                $(".loading").hide();
                                if($.fn.getCookie("language") == "en"){
                                    alert("Successful redemption,Confirmation on the chain is expected to arrive within 5 minutes!");
                                }else{
                                    alert("兑换成功,预计5分钟内到账!");
                                }
                                $("#dh,#result").val(0);
                                $(".eosbi").text((parseFloat($(".eosbi").text())-eosbi).toFixed(4)+" EOS");
                                getd();
                            }

                        }).catch(function (e) {
                            $(".loading").hide();
                            if($.fn.getCookie("language") == "en"){
                                alert("Server error, please refresh the page and try again!",true);
                            }else{
                                alert("服务器错误，请刷新页面重试!",true);
                            }
                        });
                    });
                })
            }
        }else{
            $(".loading").hide();
        }
    });
    captcha1.show();

    
}

function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return (r[2]); return null;
}
String.prototype.myReplace = function (f, e) {
    var reg = new RegExp(f, "g");
    return this.replace(reg, e);
}
let miliFormat = (() => {
    let DIGIT_PATTERN = /(^|\s)\d+(?=\.?\d*($|\s))/g
    let MILI_PATTERN = /(?=(?!\b)(\d{3})+\.?\b)/g
    return (num) => num && num.toString()
		.replace(DIGIT_PATTERN, (m) => m.replace(MILI_PATTERN, ','))
})()
//加法 
Number.prototype.add = function(arg){   
    var r1,r2,m;   
    try{r1=this.toString().split(".")[1].length}catch(e){r1=0}   
    try{r2=arg.toString().split(".")[1].length}catch(e){r2=0}   
    m=Math.pow(10,Math.max(r1,r2))   
    return (this*m+arg*m)/m   
}     
//减法   
Number.prototype.sub = function (arg){   
    return this.add(-arg);   
}   
//乘法   
Number.prototype.mul = function (arg)   
{   
    var m=0,s1=this.toString(),s2=arg.toString();   
    try{m+=s1.split(".")[1].length}catch(e){}   
    try{m+=s2.split(".")[1].length}catch(e){}   
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)   
}  
//除法   
Number.prototype.div = function (arg){   
    var t1=0,t2=0,r1,r2;   
    try{t1=this.toString().split(".")[1].length}catch(e){}   
    try{t2=arg.toString().split(".")[1].length}catch(e){}   
    with(Math){   
        r1=Number(this.toString().replace(".",""))   
        r2=Number(arg.toString().replace(".",""))   
        return (r1/r2)*pow(10,t2-t1);   
    }   
}

function FormatAllDate(sDate) {
    var date = new Date(sDate);
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    //月
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    //日
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    //时
    if (hours >= 0 && hours <= 9) {
        hours = "0" + hours;
    }
    //分
    if (minutes >= 0 && minutes <= 9) {
        minutes = "0" + minutes;
    }
    //秒
    if (seconds >= 0 && seconds <= 9) {
        seconds = "0" + seconds;
    }
    //格式化后日期为：yyyy-MM-dd HH:mm:ss
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + hours + seperator2 + minutes + seperator2 + seconds;
    return currentdate;
}

String.prototype.replaceAll = function(str1,str2) {
    var str = this;
    for (;;) {
        str = str.replace(str1,str2);
        if(str.indexOf(str1) == -1){
            return str;
        }
    }
};
Number.prototype.intercept = function(num){
    var val = this.valueOf()+"",list;
    if(val.indexOf(".") != -1){
        list = (this.valueOf()+"").split(".");
    }else{
        return parseFloat((val + ".0000"));
    }
    if(list[1].length < 4){
        for (var i = list[1].length; i < 5; i++) {
            list[1]+='0';
        }
    }
    var str1 = list[1].substring(0,num),
        str2 = str1.split(""),
        str3 = list[1].substring(num,num+1);
    str3 = parseInt(str3);
    if(str3 > 4){
        str2[3] = parseInt(str2[3])+1;
        if(str2[3] == 10){
            str2[3] = 0;
            str2[2] = parseInt(str2[2])+1;
            if(str2[2] == 10){
                str2[2] = 0;
                str2[1] = parseInt(str2[1])+1;
                if(str2[1] == 10){
                    str2[1] = 0;
                    str2[0] = parseInt(str2[0])+1;
                }
            }
        }
    }
    return parseFloat(list[0]+"." + str2[0] + "" + str2[1] + "" + str2[2] + "" + str2[3]);
}

Number.prototype.intfix = function(num){
    var val = this.valueOf()+"",list;
    if(val.indexOf(".") != -1){
        list = (this.valueOf()+"").split(".");
    }else{
        return parseFloat((val + ".0000"));
    }
    if(list[1].length < 4){
        for (var i = list[1].length; i < 5; i++) {
            list[1]+='0';
        }
    }
    return parseFloat(list[0]+"."+list[1].substring(0,num));
}

window.alert = function (msg,isRe) {
    if($(".popup").is(":visible"))return;
    if($(".popup").length == 0){
        $("body").append("<div class='popup'><div class='shadow'></div><div class='box'><p class='title'></p><p class='content'></p><a class='btn'></a></div></div>");
    }
    $(".popup .content").text(msg);
    $(".popup").show();
    $(".popup .box").css("margin-top",(-$(".popup .box").height()/2 - parseInt($(".popup .box").css("padding-top")))+"px");
    $(".popup").hide();
    $(".popup").fadeIn();
    if($.fn.getCookie("language") == "en"){
        $(".popup .btn").text("OK");
        $(".popup .title").text("Tips");
    }else{
        $(".popup .btn").text("确定");
        $(".popup .title").text("提示");
    }
    $(".popup .shadow,.popup .btn").off("click");
    if(!isRe){
        $(".popup .shadow,.popup .btn").on("click",function(){
            $(".popup").fadeOut();
        });
    }else{
        $(".popup .btn").on("click",function(){
            window.location.reload();
        });
    }
}