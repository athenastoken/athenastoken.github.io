var offWidth = document.body.offsetWidth,
	rule = {},
	cid = 1,
	currenDif,
	difData = {},
	eosbi,
	lan,
	isTest = $.fn.getQueryString("test");
let opts = {
    body: JSON.stringify({
        code: rextokenbank,
        scope: rextokenbank,
        table: "state",
        json: true
    }),
    method: "POST"
}
$(function(){

	lan = $.fn.getCookie("language");
	if(lan == null || lan == "null"){
		$.fn.setCookie("language","en");
		lan = "en";
	}
	// $(".main .dif").hide();
	if(isTest)$(".main .dif").show();
	if(lan == "cn"){
		$("#language option:eq(1)").attr("selected",true).siblings().attr("selected",false);
	}else{
		$("#language option:eq(0)").attr("selected",true).siblings().attr("selected",false);
	}

	setLanguage();

	$("html,body").css({"height":"auto","position":"relative","overflow":"auto"});
	setSize();
	$(window).resize(function(){
		setTimeout(function(){setSize();},100);
	});
	$("#app,.loading").show();

    getd();

	ScatterJS.scatter.connect("accno").then(connected => {
        if (connected) {
            scatter = ScatterJS.scatter;
            const requiredFields = {
                accounts: [network]
            };
            scatter.getIdentity(requiredFields).then(() => {
                const eosOptions = {
                    expireInSeconds: 60
                };
                eos = scatter.eos(network, Eos, eosOptions);

            }).catch(error => {
                console.error(error);
            });
        }
	    setTimeout(function(){
			scatterLogin();
		},1000);
    });
    getwalletlist();

	setInterval(function(){
		getd();
    },30000);

	$("#language").on("change",function(){
		var val = $(this).val();
		val == 0?lan = "en":lan = "cn";
		$.fn.setCookie("language",lan);
		setLanguage();
	});

	$("#dh").on("keyup",function(){
		if($(".login").is(":visible")){
			$(".login").click();
			$(this).val(0);
			return;
		}
		var val = parseFloat($(this).val()),
			bi = parseFloat($(".eosbi").attr("data-eos"));

		if(val > bi){
			$(this).val(bi);
			val = bi;
		}
		if(val < 0){
			$(this).val(0);
			return;
		}
		if(isNaN(val)){
			$("#result").val(0);
			return;
		}
		val = calc(val);
		$("#result").val(val.result).attr("data-leve",val.leve).attr("data-bep",val.bep);
	});

	$("#dh").on("blur",function(){
		var val = $(this).val();
		if(isNaN(parseFloat(val)) && val != 0){
			if(lan == "en"){
				alert("Please enter the correct number！");
			}else{
				alert("请输入正确的数字！");
			}
			$(this).val(0);
			return;
		}
	});

	$(".dif").on("click",function(){
		var dh = $("#dh").val();
		if(dh.indexOf(".") != -1){
			if(dh.split(".")[1].length > 4){
				if(lan == "en"){
					alert("Minimum exchange EOS is 4 decimal places!");
				}else{
					alert("最低兑换EOS为小数点后4位！");
				}
				return;
			}
		}
		if(isNaN(parseFloat(dh))){
			if(lan == "en"){
				alert("Please enter the correct number！");
			}else{
				alert("请输入正确的数字！");
			}
			$(this).val(0);
			return;
		}
		if(parseFloat($("#dh").val()) <= 0 || $("#dh").val().length == 0)return;
		if($(".login").is(":visible")){
			$(".login").click();
			return;
		}
		if(parseFloat($("#result").val()) < 1){
			if(lan == "en"){
				alert("The minimum exchange amount is 1ATHENA");
			}else{
				alert("最低兑换额度为1ATHENA！");
			}
			return;
		}
		if(parseFloat($("#result").val()) > parseInt($(".lang .text span:eq(2)").text())){
			if(lan == "en"){
				alert("Insufficient contract pool");
			}else{
				alert("合约池不足！");
			}
			return;
		}
		$(".loading").show();

		if(dh.indexOf(".") != -1){
			if(dh.split(".")[1].length != 4){
				for (var i = dh.split(".")[1].length; i < 4; i++) {
					dh += "0";
				}
			}
		}else{
			dh += ".0000";
		}
		buy(dh);
	});

	var time = stime = (new Date()).getTime() - 1561474800000,
    	hours,
    	minutes,
    	seconds,
    	startTime = [];
    if(stime < 0)time = -time;
    if(time > -1000 && time < 1000){
    	startTime=[0,0,0,99];
    }else{
    	startTime[3] = 99;
    	time /= 1000;
    	if(time / 60 < 1){
    		startTime=[0,0,parseInt(time),99];
    	}else{
    		startTime[2] = parseInt(time%60);
    		time/=60;
    		if(time / 60 < 1){
    			startTime[0] = 0;
    			startTime[1] = parseInt(time);
    		}else{
    			startTime[1] = parseInt(time%60);
    			time /= 60;
    			if(time < 1){
    				startTime[0] = 0;
    			}else{
    				startTime[0] = parseInt(time%60);
    			}
    		}
    	}
    }
    
	if(stime < 0){
		setTime(startTime);
	}else{
		timePlus(startTime);
		$(".main .timeout .title").hide();
	}
})

function calc(val){
	var result = 0,
		num = 0,
		bep = difData.beProportion,
		data = {
			state : true,
			surplus : difData.surplus
		},
		firstDif = (difData.thresholdValue - currenDif) / bep,
		leve = difData.leve;
	if(val < firstDif){
		result = val * bep;
		difData.hasTheDiffraction = val * bep + currenDif;
	}else if(val == firstDif){
		result = val * bep;
		difData.hasTheDiffraction = difData.notTheDiffraction = 0;
		leve++;
	}else{
		result += firstDif * bep;
		leve++;
		bep /= 1.015;
		val -= firstDif;
		
		if(val * bep < 300000){
			result += val * bep;
			difData.hasTheDiffraction = val * bep;
		}else{
			for (var i = 1; i < 2;) {
				result += difData.thresholdValue;
				val -= (difData.thresholdValue / bep);
				leve++;
				bep /= 1.015;
				if(val * bep < 300000)i++;
			}
			if(val != 0){
				difData.hasTheDiffraction = val * bep;
				result += difData.hasTheDiffraction;
			}else{
				difData.hasTheDiffraction = 0;
			}
		}
	}
	if((result+"").indexOf(".") != -1){
		if((result+"").split(".")[1].length > 4){
			data.result = result.intfix(4);
		}else{
			data.result = result;
		}
	}else{
		data.result = result;
	}
	data.leve = leve;
	data.bep = bep;

	if(result > difData.surplus){
		data.state = false;
	}
	return data;
}

function setTime(date){
	for (var i = 0; i < date.length; i++) {
		if((""+date[i]).length < 2)date[i] = "0"+date[i];
	}
	var houer = date[0],
		minute = date[1],
		secound = date[2],
		secound2 = date[3];
	$(".time p:eq(0)").text(houer);
	$(".time p:eq(1)").text(minute);
	$(".time p:eq(2)").text(secound);
	$(".time p:eq(3)").text(secound2);
	secound2 = parseInt(secound2);
	secound2--;
	if(secound2 == 0){
		secound2 = 99;
		secound = parseInt(secound);
		secound--;
		if(secound < 0)secound=0;
		if(secound == 0){
			secound = 59;
			minute = parseInt(minute);
			minute--;
			if(minute < 0)minute=0;
			if(minute == 0){
				minute = 59;
				houer = parseInt(houer);
				houer--;
				if(houer < 0)houer=0;
			}
		}
	}
	if(houer == '00' && minute == '00' && secound == '01' && secound2 <= 1){
		gd(99);
	}else{
		setTimeout(function(){
			setTime([houer,minute,secound,secound2]);
		},10);
	}
}

function gd(s){
	$(".time p:eq(0)").text("00");
	$(".time p:eq(1)").text("00");
	$(".time p:eq(2)").text("00");
	$(".time p:eq(3)").text(s);
	s--;
	if(s <= 0){
		timePlus([0,0,0,0]);
		$(".main .timeout .title").hide();
	}else{
		setTimeout(function(){
			gd(s);
		},10);
	}
}

function timePlus(date){
	$(".main .dif").show();
	for (var i = 0; i < date.length; i++) {
		if((""+date[i]).length < 2)date[i] = "0"+date[i];
	}
	var houer = date[0],
		minute = date[1],
		secound = date[2],
		secound2 = date[3];

	$(".time p:eq(0)").text(houer);
	$(".time p:eq(1)").text(minute);
	$(".time p:eq(2)").text(secound);
	$(".time p:eq(3)").text(secound2);
	secound2 = parseInt(secound2);
	secound2++;
	if(secound2 >= 99){
		secound2 = 0;
		secound = parseInt(secound);
		secound++;
		if(secound >= 60){
			secound = 0;
			minute = parseInt(minute);
			minute++;
			if(minute >= 60)minute=0;
			if(minute == 0){
				minute = 0;
				houer = parseInt(houer);
				houer++;
			}
		}
	}

	setTimeout(function(){
		timePlus([houer,minute,secound,secound2]);
	},10);
}

function setSize() {
	if(document.body.offsetWidth < 900){
		var size = document.body.offsetWidth / 375 * 20;
		$("html").css("font-size", size + "px");
	}
}

function setLanguage(){
	var language = {
		"en" : {
			login : 'login',
			lang : ["English",'Chinese'],
			from : 'From',
			to : 'To',
			more : "More",
			difBtn : 'DIF NOW',
			centerList : ['Business<br>cooperation','Contract<br>account','Block<br>browsing'],
			difTitle : "DIF Total Progress",
			difList : ['Contract pool','Has DIF(diffraction)','Remaining DIF(diffraction)','Current exchange ratio','DIF Threshold','Transaction EOS'],
			preTitle : 'DIF Diffraction Stage',
			preState : 'processing',
			preList : ['Starting dif ht:<br><b></b>','End dif ht:<br><b></b>','Current dif ht:<br><b></b>'],
			time : ["Countdown to the start of the activity","<span>Flash</span> sale...",'Remaining','ATHENA'],
			tip : ["(Forecast ratio only)",'Tips: Flash order queues are packaged according to the transaction order']
		},
		'cn' : {
			login : '登录',
			lang : ['英文',"简体中文"],
			from : '从',
			to : '到',
			more : "更多",
			difBtn : '现在衍射',
			centerList : ['商务合作','合约账户','区块浏览'],
			difTitle : "DIF总进度",
			difList : ['合约池','已DIF(衍射)','剩余DIF(衍射)','当前兑换比例','DIF阀值','已交易EOS'],
			preTitle : 'DIF衍射阶段',
			preState : '进行中',
			preList : ['开始衍射数量：<br><b></b>','结束衍射数量：<br><b></b>','当前衍射数量：<br><b></b>'],
			time : ["活动开始倒计时","闪购...",'剩余','ATHENA'],
			tip : ["(仅为预测比例)","温馨提示：闪购队列按照交易打包顺序"]
		}
	}
	language = language[lan];
	$(".login").text(language['login']);
	$("#language option:eq(0)").text(language['lang'][0]);
	$("#language option:eq(1)").text(language['lang'][1]);
	$(".from>p").text(language['from']+':');
	$(".to>p").text(language['to']+":");
	$(".more").text(language['more']+" >");
	$(".dif").text(language['difBtn']);
	$(".center_list p:eq(0)").html(language['centerList'][0]);
	$(".center_list p:eq(1)").html(language['centerList'][1]);
	$(".center_list p:eq(2)").html(language['centerList'][2]);
	$(".pro .title span").text(language['difTitle']);
	for (var i = 0; i < language['difList'].length; i++) {
		$("#diffraction b").eq(i).text(language['difList'][i]+":");
	}
	$(".pre .title").text(language['preTitle']);
	$(".pre .state").text(language['preState']);
	$(".dtext").each(function(){
		$(this).children().each(function(index){
			$(this).html(language['preList'][index]);
		});
	});
	$(".timeout .title").text(language['time'][0]);
	$(".timeout .title").next().html(language['time'][1]);
	$(".timeout .text b span:eq(0)").html(language['time'][2]);
	$(".timeout .text b span:eq(1)").html(language['time'][3]);
	$(".result b").text(language['tip'][0]);
	$(".etip").text(language['tip'][1]);
}

function getd(){
	fetch("https://eos.newdex.one/v1/chain/get_table_rows", opts)
        .then(resp => resp.json())
        .then(resp => {
            if (resp.rows && resp.rows instanceof Array && resp.rows.length > 0) {
                var data = resp.rows[0];
                if(data.available == 0){
                	// $(".main .dif").hide();
                }
                console.dir(data)
                var leve = parseInt(data.round),
                	hasd = (300000-parseFloat(data.round_remain)).intercept(4),
                	d0 = (data.round-1) * 300000,
					d1 = parseFloat(data.total_send),
					d2 = data.round * 300000,
					fz = '300000.0000';

                if(leve == 264){
                	$(".dif2").hide();
                	hasd = (103000-parseFloat(data.round_remain)).intercept(4);
                	if(hasd < 0)hasd = 103000;
                	d2 -= 197000;
                	fz = "103000.0000";
                }
                
                $("#diffraction li:eq(0) span,.lang .text span:eq(2)").text((79003000-parseFloat(data.total_send)).intercept(4));
				$("#diffraction li:eq(1) span").text(hasd);
				$("#diffraction li:eq(2) span").text(parseFloat(data.round_remain));
				$("#diffraction li:eq(3) span").text(parseFloat(data.rate).intfix(4));
				$("#diffraction li:eq(4) span").text(fz);
				$("#diffraction li:eq(5) span").text(data.total_received);

				$(".lang .bl").css("height",(79003000-parseFloat(data.total_send)).intercept(4)/79003000 * 100 + "%");

				$(".dif0>p b").text("1 : "+parseFloat(data.rate).intfix(4));
				$(".dif0>p span:eq(0)").text(data.round);
				$(".dif0 .dtext b:eq(0)").text(d0.intfix(4));
				$(".dif0 .dtext b:eq(2)").text(d1.intfix(4));
				$(".dif0 .dtext b:eq(1)").text(d2.intfix(4));
				$(".scroll_d1").css("width",(d1-d0)/(d2-d0) * 100 + "%");

				$(".dif2>p b").text("1 : "+parseFloat(data.rate/1.015).intfix(4));
				$(".dif2>p span:eq(0)").text(parseInt(data.round)+1);
				$(".dif2 .dtext b:eq(0)").text(d2.intfix(4));
				$(".dif2 .dtext b:eq(1)").text(d2+300000);

				$(".main .result span").text(parseFloat(data.rate).intfix(4));
				currenDif = 300000-parseFloat(data.round_remain);
				difData = {
					beProportion : parseFloat(data.rate),
					leve : parseInt(data.round),
					thresholdValue : 300000
				}
				$(".loading").hide();
            }
        })
        .catch(err => {
            
        });
}