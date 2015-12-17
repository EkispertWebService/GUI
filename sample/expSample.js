var dateTimeApp;// 日付入力パーツ
var stationApp1;// 駅名入力パーツ#1
var stationApp2;// 駅名入力パーツ#2
var stationApp3;// 駅名入力パーツ#3
var stationApp4;// 駅名入力パーツ#4
var stationApp5;// 駅名入力パーツ#5
var stationApp6;// 駅名入力パーツ#6
var conditonApp;// 探索条件パーツ
var resultApp;// 経路表示パーツ

/**
* パーツを初期化
*/
function init() {
    // 日付入力パーツ初期化
    if (document.getElementById("dateTime")) {
        dateTimeApp = new expGuiDateTime(document.getElementById("dateTime"));
        dateTimeApp.dispDateTime();
        // クッキーから情報を復元する
        if (getCookie("searchType") != "") {
            dateTimeApp.setSearchType(getCookie("searchType"));
        }
        // コールされる初期化部分
        if (typeof initDateTime != 'undefined') {
            initDateTime();
        }
    }

    // 駅名入力パーツ#1初期化
    if (document.getElementById("station1")) {
        stationApp1 = new expGuiStation(document.getElementById("station1"));
        if (typeof apiURL != 'undefined') {
            stationApp1.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp1.setConfigure("key", key);
        }
        stationApp1.dispStation();
        if (getCookie("station1") != "") {
            stationApp1.setStation(getCookie("station1"));
        }
    }

    // 駅名入力パーツ#2初期化
    if (document.getElementById("station2")) {
        stationApp2 = new expGuiStation(document.getElementById("station2"));
        if (typeof apiURL != 'undefined') {
            stationApp2.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp2.setConfigure("key", key);
        }
        stationApp2.dispStation();
        if (getCookie("station2") != "") {
            stationApp2.setStation(getCookie("station2"));
        }
    }

    // 駅名入力パーツ#3初期化
    if (document.getElementById("station3")) {
        stationApp3 = new expGuiStation(document.getElementById("station3"));
        if (typeof apiURL != 'undefined') {
            stationApp3.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp3.setConfigure("key", key);
        }
        stationApp3.dispStation();
        if (getCookie("station3") != "") {
            stationApp3.setStation(getCookie("station3"));
        }
    }

    // 駅名入力パーツ#4初期化
    if (document.getElementById("station4")) {
        stationApp4 = new expGuiStation(document.getElementById("station4"));
        if (typeof apiURL != 'undefined') {
            stationApp4.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp4.setConfigure("key", key);
        }
        stationApp4.dispStation();
        if (getCookie("station4") != "") {
            stationApp4.setStation(getCookie("station4"));
        }
    }

    // 駅名入力パーツ#5初期化
    if (document.getElementById("station5")) {
        stationApp5 = new expGuiStation(document.getElementById("station5"));
        if (typeof apiURL != 'undefined') {
            stationApp5.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp5.setConfigure("key", key);
        }
        stationApp5.dispStation();
        if (getCookie("station5") != "") {
            stationApp5.setStation(getCookie("station5"));
        }
    }

    // 駅名入力パーツ#6初期化
    if (document.getElementById("station6")) {
        stationApp6 = new expGuiStation(document.getElementById("station6"));
        if (typeof apiURL != 'undefined') {
            stationApp6.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            stationApp6.setConfigure("key", key);
        }
        stationApp6.dispStation();
        if (getCookie("station6") != "") {
            stationApp6.setStation(getCookie("station6"));
        }
    }
    // コールされる駅入力の初期化部分
    if (typeof initStation != 'undefined') {
        initStation();
    }

    // 探索条件パーツ初期化
    if (document.getElementById("condition")) {
        conditonApp = new expGuiCondition(document.getElementById("condition"));
        conditonApp.dispCondition();
        if (getCookie("answerCount") != "" && getCookie("sort") != "" && getCookie("priceType") != "" && getCookie("conditionDetail") != "") {
            conditonApp.setCondition(getCookie("answerCount"), getCookie("sort"), getCookie("priceType"), getCookie("conditionDetail"));
        }
        if (typeof initCondition != 'undefined') {
            initCondition();
        }
    }

    // 経路表示パーツ初期化
    if (document.getElementById("result")) {
        resultApp = new expGuiCourse(document.getElementById("result"));
        if (typeof apiURL != 'undefined') {
            resultApp.setConfigure("apiURL", apiURL);
        }
        if (typeof key != 'undefined') {
            resultApp.setConfigure("key", key);
        }
        if (typeof initResult != 'undefined') {
            initResult();
        }
    }
    // 定期券の復元
    if (document.getElementById("passRoute")) {
        if (getCookie("passRoute") != "") {
            document.getElementById("passRoute").value = getCookie("passRoute");
        }
    }
    // デモ用のコード
    stationApp1.setStation("高円寺");
}

/**
* 駅時刻表
*/
function stationTimeTable(index) {
    if (index == resultApp.getPointList().split(",").length) {
        alert("目的地の時刻表は指定できません")
    } else {
        var point = resultApp.getPointObject(index);
        var windowParam = 'scrollbars=1,resizable=1,width=800,height=400';
        var apiParam = "expGuiStationTimeTable";
        var callFunction = 'windowApp.dispCourseTimetable("' + resultApp.getSerializeData() + '","' + index + '")';
        var addFunction = "";
        openWindow(windowParam, apiParam, callFunction, addFunction);
    }
}
    
/**
* 路線時刻表
*/
function lineTimeTable(index) {
    var windowParam = 'scrollbars=1,resizable=1,width=800,height=400';
    var apiParam = "expGuiSectionTimeTable";
    var callFunction = 'windowApp.dispRailTimetable("' + resultApp.getSerializeData() + '","' + index + '")';
    var addFunction = "";
    openWindow(windowParam, apiParam, callFunction, addFunction);
}

/**
*路線図を開く
*/
function openMap(index) {
    var station = "";
    if (index == 1) {
        station = stationApp1.getStation();
    } else if (index == 2) {
        station = stationApp2.getStation();
    } else if (index == 3) {
        station = stationApp3.getStation();
    }
    var windowParam = 'scrollbars=1,resizable=1,width=800,height=400';
    var apiParam = "expGuiMap";
    var callFunction;
    if (station != "") {
        callFunction = "windowApp.dispMapStation('" + station + "',onDispMapStation);";
    } else {
        callFunction = "windowApp.dispMap('jpnx4');";
    }
    callFunction += "windowApp.bind('click',onStationClick);";
    //路線図表示の関数
    var resultFunction = "";
    resultFunction += "function onDispMapStation(isSuccess){\n";
    resultFunction += "if(!isSuccess){windowApp.dispMap('jpnx4');}\n";
    resultFunction += "}\n";
    //駅名選択の関数
    var setStationFunction = "";
    setStationFunction += "function onStationClick(station){\n";
    setStationFunction += "if(!window.opener || window.opener.closed){\n";
    setStationFunction += "window.close();\n";
    setStationFunction += "}else{\n";
    setStationFunction += "window.opener.setMapStation(" + index + ",station.name);\n";
    setStationFunction += "window.close();\n";
    setStationFunction += "}\n";
    setStationFunction += "}\n";
    //関数をセットする
    var addFunction = resultFunction + setStationFunction;
    openWindow(windowParam, apiParam, callFunction, addFunction);
}

/**
*路線図内の駅を選択
*/
function setMapStation(index, stationName) {
    if (index == 1) {
        station = stationApp1.setStation(stationName);
    } else if (index == 2) {
        station = stationApp2.setStation(stationName);
    } else if (index == 3) {
        station = stationApp3.setStation(stationName);
    } else if (index == 4) {
        station = stationApp4.setStation(stationName);
    } else if (index == 5) {
        station = stationApp5.setStation(stationName);
    } else if (index == 6) {
        station = stationApp6.setStation(stationName);
    }
}
    
/**
* 探索前に入力チェックを行う
*/
function checkData() {
    // メッセージの初期化
    var errorMessage = "";
    if (!dateTimeApp.checkDate()) {
        // 日付入力パーツのチェック
        errorMessage += "\n日付を正しく入力してください。";
    }
    // 発着地リストを作成
    var viaList = new Array();
    if (typeof stationApp1 != 'undefined') {
        if (stationApp1.getStation() != "") {
            viaList.push(stationApp1.getStation());
        }
    }
    if (typeof stationApp2 != 'undefined') {
        if (stationApp2.getStation() != "") {
            viaList.push(stationApp2.getStation());
        }
    }
    if (typeof stationApp3 != 'undefined') {
        if (stationApp3.getStation() != "") {
            viaList.push(stationApp3.getStation());
        }
    }
    if (typeof stationApp4 != 'undefined') {
        if (stationApp4.getStation() != "") {
            viaList.push(stationApp4.getStation());
        }
    }
    if (typeof stationApp5 != 'undefined') {
        if (stationApp5.getStation() != "") {
            viaList.push(stationApp5.getStation());
        }
    }
    if (typeof stationApp6 != 'undefined') {
        if (stationApp6.getStation() != "") {
            viaList.push(stationApp6.getStation());
        }
    }
    if (viaList.length == 0 || viaList.length == 1) {
        errorMessage += "\n出発地・目的地は必須です。";
    } else {
        if (viaList.length == 2) {
            if (viaList[0] == viaList[1]) {
                errorMessage += "\n出発地と目的地が同一です。";
            }
        } else {
            if (viaList[0] == viaList[1]) {
                errorMessage += "\n出発地と経由地が同一です。";
            } else {
                for (var i = 1; i < viaList.length - 1; i++) {
                    if (viaList[i] == viaList[i + 1]) {
                        errorMessage += "\n経由地が出発地と同一です。";
                    }
                }
            }
        }
    }
    if (errorMessage != "") {
        alert("下記の項目を確認してください。" + errorMessage);
        return false;
    } else {
        return true;
    }
}

/**
* 探索ボタンの動作
*/
function search(callBack) {
    setCookie();
    // デモ用のコード
    stationApp1.setStation("高円寺");
    // 入力チェック後に動作
    if (checkData()) {
        var searchWord = "";
        // コールバックの設定
        if (typeof callBack != 'undefined') {
            resultApp.bind("select", callBack);
        } else {
            resultApp.unbind("select");
        }
        // 発着地リストを作成
        var viaList = new Array();
        if (typeof stationApp1 != 'undefined') {
            if (stationApp1.getStation() != "") {
                viaList.push(stationApp1.getStation());
            }
            stationApp1.closeStationList();
        }
        if (typeof stationApp2 != 'undefined') {
            if (stationApp2.getStation() != "") {
                viaList.push(stationApp2.getStation());
            }
            stationApp2.closeStationList();
        }
        if (typeof stationApp3 != 'undefined') {
            if (stationApp3.getStation() != "") {
                viaList.push(stationApp3.getStation());
            }
            stationApp3.closeStationList();
        }
        if (typeof stationApp4 != 'undefined') {
            if (stationApp4.getStation() != "") {
                viaList.push(stationApp4.getStation());
            }
            stationApp4.closeStationList();
        }
        if (typeof stationApp5 != 'undefined') {
            if (stationApp5.getStation() != "") {
                viaList.push(stationApp5.getStation());
            }
            stationApp5.closeStationList();
        }
        if (typeof stationApp6 != 'undefined') {
            if (stationApp6.getStation() != "") {
                viaList.push(stationApp6.getStation());
            }
            stationApp6.closeStationList();
        }
        // 経路表示パーツ#1の場合
        searchWord += "viaList=" + viaList.join(":");
        // 探索種別
        searchWord += '&date=' + dateTimeApp.getDate();
        switch (dateTimeApp.getSearchType()) {
            case dateTimeApp.SEARCHTYPE_DEPARTURE: // ダイヤ出発
                searchWord += '&searchType=departure';
                searchWord += '&time=' + dateTimeApp.getTime();
                break;
            case dateTimeApp.SEARCHTYPE_ARRIVAL: // ダイヤ到着
                searchWord += '&searchType=arrival';
                searchWord += '&time=' + dateTimeApp.getTime();
                break;
            case dateTimeApp.SEARCHTYPE_FIRSTTRAIN: // 始発
                searchWord += '&searchType=firstTrain';
                break;
            case dateTimeApp.SEARCHTYPE_LASTTRAIN: // 終電
                searchWord += '&searchType=lastTrain';
                break;
            case dateTimeApp.SEARCHTYPE_PLAIN: // 平均
                searchWord += '&searchType=plain';
                break;
        }
        // ソート
        searchWord += '&sort=' + conditonApp.getSortType();
        // 探索結果数
        searchWord += '&answerCount=' + conditonApp.getAnswerCount();
        // 探索条件
        searchWord += '&conditionDetail=' + conditonApp.getConditionDetail();
        // 会社名の出力をデフォルトにする
        searchWord += "&resultDetail=addCorporation";
        //定期券が存在する場合はセットする
        if (document.getElementById("passRoute")) {
            if (document.getElementById("passRoute").value != "") {
                searchWord += '&assignDetailRoute=' + document.getElementById("passRoute").value;
            }
        }
        // 探索を実行
        resultApp.search(searchWord, conditonApp.getPriceType(), result);
    }
}

/**
* 探索実行時のコールバック関する
*/
function result(isSuccess) {
    if (!isSuccess) {
        alert("探索結果が取得できませんでした");
    }
}

/**
*入力内容のクッキーへの保存
*/
function setCookie() {
    if (typeof dateTimeApp != 'undefined') {
        document.cookie = 'searchType=' + encodeURIComponent(dateTimeApp.getSearchType());
    }
    if (typeof conditonApp != 'undefined') {
        document.cookie = 'answerCount=' + encodeURIComponent(conditonApp.getAnswerCount());
        document.cookie = 'sort=' + encodeURIComponent(conditonApp.getSortType());
        document.cookie = 'priceType=' + encodeURIComponent(conditonApp.getPriceType());
        document.cookie = 'conditionDetail=' + encodeURIComponent(conditonApp.getConditionDetail());
    }
    if (typeof stationApp1 != 'undefined') {
        document.cookie = 'station1=' + encodeURIComponent(stationApp1.getStation());
    }
    if (typeof stationApp2 != 'undefined') {
        document.cookie = 'station2=' + encodeURIComponent(stationApp2.getStation());
    }
    if (typeof stationApp3 != 'undefined') {
        document.cookie = 'station3=' + encodeURIComponent(stationApp3.getStation());
    }
    if (typeof stationApp4 != 'undefined') {
        document.cookie = 'station4=' + encodeURIComponent(stationApp4.getStation());
    }
    if (typeof stationApp5 != 'undefined') {
        document.cookie = 'station5=' + encodeURIComponent(stationApp5.getStation());
    }
    if (typeof stationApp6 != 'undefined') {
        document.cookie = 'station6=' + encodeURIComponent(stationApp6.getStation());
    }
    if (document.getElementById("passRoute")) {
        document.cookie = 'passRoute=' + encodeURIComponent(document.getElementById("passRoute").value);
    }
}

/**
*指定のクッキーを取得する
*/
function getCookie(name) {
    var result = "";
    var cookieName = name + '=';
    var allcookies = document.cookie;
    var position = allcookies.indexOf(cookieName);
    if (position != -1) {
        var startIndex = position + cookieName.length;
        var endIndex = allcookies.indexOf(';', startIndex);
        if (endIndex == -1) {
            endIndex = allcookies.length;
        }
        result = decodeURIComponent(
        allcookies.substring(startIndex, endIndex));
    }
    // デモ用のコード
    return "";
}

/**
* ウインドウを開いて処理を行う
*/
function openWindow(windowParam, apiParam, callFunction, addFunction) {
    var resultWindow = window.open('', 'Subwin', windowParam);
    if (navigator.appVersion.charAt(0) >= 3) { resultWindow.focus() };
    resultWindow.document.clear();
    resultWindow.document.write("<html>\n");
    resultWindow.document.write("<head>\n");
    resultWindow.document.write("<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />\n");
    resultWindow.document.write("<title>サブウィンドウ</title>\n");
    resultWindow.document.write("<link class='css' rel='stylesheet' type='text/css' href='../" + apiParam + "/expCss/" + apiParam + ".css'>\n");
    resultWindow.document.write("<script type='text/javascript' src='../" + apiParam + "/" + apiParam + ".js'></script>\n");
    resultWindow.document.write("<script type='text/javascript'>\n");
    resultWindow.document.write("var windowApp;\n");
    resultWindow.document.write("function init(){\n");
    resultWindow.document.write("windowApp = new " + apiParam + "(document.getElementById('appContent'));\n");
    if (typeof apiURL != 'undefined') {
        resultWindow.document.write("windowApp.setConfigure(\"apiURL\", \"" + apiURL + "\");\n");
    }
    if (typeof key != 'undefined') {
        resultWindow.document.write("windowApp.setConfigure(\"key\", \"" + key + "\");\n");
    }
    resultWindow.document.write(callFunction + "\n");
    resultWindow.document.write("}\n");
    resultWindow.document.write(addFunction + "\n");
    resultWindow.document.write("</script>\n");
    resultWindow.document.write("</head>\n");
    resultWindow.document.write("<body onLoad='javascript:init();'>\n");
    resultWindow.document.write("<div id='appContent'></div>\n");
    resultWindow.document.write("</body></html>\n");
    resultWindow.document.close();
}

if (!window.JSON) {
    window.JSON = {
        parse: function (sJSON) { return eval("(" + sJSON + ")"); },
        stringify: function (vContent) {
            if (vContent instanceof Object) {
                var sOutput = "";
                if (vContent.constructor === Array) {
                    for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
                    return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
                }
                if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
                for (var sProp in vContent) { sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ","; }
                return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
            }
            return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
        }
    };
}
