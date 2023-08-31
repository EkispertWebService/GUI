/**
 *  駅すぱあと Web サービス
 *  駅名入力パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *
 *  Version:2018-06-14
 *
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiStation = function (pObject, config) {
    // ドキュメントのオブジェクトを格納
    var documentObject = pObject;
    var baseId = pObject.id;

    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiStation\.js"));
        if (s.src && s.src.match(/expGuiStation\.js(\?.*)?/)) {
            var params = s.src.replace(/.+\?/, '');
            params = params.split("&");
            for (var j = 0; j < params.length; j++) {
                var tmp = params[j].split("=");
                if (tmp[0] == "key") {
                    key = unescape(tmp[1]);
                }
            }
            break;
        }
    }

    // AGENTのチェック
    var agent = 1;
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
    var isAndroid_phone = (navigator.userAgent.match(/Android/i) != null && navigator.userAgent.match(/Mobile/i) != null);
    var isAndroid_tablet = (navigator.userAgent.match(/Android/i) != null && navigator.userAgent.match(/Mobile/i) == null);
    if (isiPhone || isAndroid_phone) { agent = 2; }
    if (isiPad || isAndroid_tablet) { agent = 3; }

    //古い端末向けのフラグ
    if (/Android\s2\.[0|1|2|3]/.test(navigator.userAgent)) {
        agent = 3;
    }

    /**
    * イベントの設定(IE対応版)
    */
    function addEvent(element, eventName, func) {
        if (element) {
            if (typeof eventName == 'string' && typeof func == 'function') {
                if (element.addEventListener) {
                    element.addEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + eventName, func);
                }
            }
        }
    }

    // 変数郡
    var stationList = new Array(); // インクリメンタルサーチ結果
    var httpObj; // インクリメンタルサーチのリクエストオブジェクト
    var oldvalue = ""; // キー監視用の文字列
    var stationCorporationBind;
    var stationType;
    var stationPrefectureCode;
    var callBackFunction = new Object();
    var maxStation = 30; //最大駅数
    var selectStation = 0;
    var callBackFunctionDelay = false;

    var stationSort = new Array(createSortObject("駅", "train"), createSortObject("空港", "plane"), createSortObject("船", "ship"), createSortObject("バス", "bus"));
    function createSortObject(name, type, sList) {
        var tmpObj = new Object();
        tmpObj.name = name;
        tmpObj.type = type;
        tmpObj.visible = true;
        tmpObj.stationList = new Array();
        return tmpObj;
    }

    /**
    * 駅名入力の設置
    */
    function dispStation() {
        // 駅名入力
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiStation expGuiStationPc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiStation expGuiStationPhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiStation expGuiStationTablet">';
        }
        if (agent == 1 || agent == 3) {
            buffer += '<div><input class="exp_station" type="text" id="' + baseId + ':stationInput" autocomplete="off"></div>';
            buffer += '<div class="exp_stationList" id="' + baseId + ':stationList" style="display:none;">';
            if (agent == 3) {
                buffer += '<div class="exp_stationTabList exp_clearfix">';
                buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(1) + '" value="1"><label class="exp_stationTabTextLeft" for="' + baseId + ':stationView:' + String(1) + '">駅</label></span>';
                buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(2) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(2) + '">空港</label></span>';
                buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(3) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(3) + '">船</label></span>';
                buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(4) + '" value="1"><label class="exp_stationTabTextRight" for="' + baseId + ':stationView:' + String(4) + '">バス</label></span>';
                buffer += '</div>';
            }
            buffer += '<div class="exp_stationSelect" id="' + baseId + ':stationSelect"></div>';
            buffer += '</div>';
        } else if (agent == 2) {
            buffer += '<input class="exp_station" type="text" id="' + baseId + ':stationOutput">';
            buffer += '<div class="exp_stationPopupBack" id="' + baseId + ':stationPopupBack"style="display:none;">';
            buffer += '<div class="exp_stationPopup" id="' + baseId + ':stationPopup" style="display:none;">';
            buffer += '<div class="exp_stationInputHeader exp_clearfix">';
            buffer += '<div class="exp_stationInputBack"><a id="' + baseId + ':stationBack" href="Javascript:void(0);"></a></div>';
            buffer += '<div class="exp_stationInputText"><input type="text" id="' + baseId + ':stationInput" autocomplete="off"></div>';
            buffer += '</div>';
            buffer += '<div class="exp_stationTabList exp_clearfix">';
            buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(1) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(1) + '">駅</label></span>';
            buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(2) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(2) + '">空港</label></span>';
            buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(3) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(3) + '">船</label></span>';
            buffer += '<span class="exp_stationTab"><input type="checkbox" class="exp_stationTabCheck" id="' + baseId + ':stationView:' + String(4) + '" value="1"><label class="exp_stationTabText" for="' + baseId + ':stationView:' + String(4) + '">バス</label></span>';
            buffer += '</div>';
            buffer += '<div class="exp_stationSPListBase" id="' + baseId + ':stationList" style="display:none;">';
            buffer += '<div class="exp_stationSPList exp_clearfix" id="' + baseId + ':stationSelect"></div>';
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        }
        buffer += '</div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // イベントの設定
        addEvent(document.getElementById(baseId + ":stationInput"), "keyup", inputStation);
        addEvent(document.getElementById(baseId + ":stationInput"), "keydown", selectStationChange);
        if (agent == 1 || agent == 3) {
            addEvent(document.getElementById(baseId + ":stationInput"), "blur", onblurEvent);
            addEvent(document.getElementById(baseId + ":stationInput"), "focus", onFocusEvent);
        } else if (agent == 2) {
            addEvent(document.getElementById(baseId + ":stationOutput"), "keyup", openStationInput);
            addEvent(document.getElementById(baseId + ":stationOutput"), "click", openStationInput);
            addEvent(document.getElementById(baseId + ":stationBack"), "click", closeStationInput);
        }
        // 種別のチェックタブ
        if (agent == 2 || agent == 3) {
            document.getElementById(baseId + ':stationView:1').checked = true;
            document.getElementById(baseId + ':stationView:2').checked = true;
            document.getElementById(baseId + ':stationView:3').checked = true;
            document.getElementById(baseId + ':stationView:4').checked = true;
        }

        // キーの監視
        if (agent == 1 || agent == 3) {
            inputCheck();
        }
    }

    /**
    * スマートフォン用入力画面を開く
    */
    function openStationInput() {
        document.getElementById(baseId + ':stationPopupBack').style.display = "block";
        document.getElementById(baseId + ':stationPopup').style.display = "block";
        document.getElementById(baseId + ':stationInput').value = document.getElementById(baseId + ':stationOutput').value;
        document.getElementById(baseId + ':stationInput').focus();
        document.getElementById(baseId + ':stationPopup').style.top = 0;
        document.getElementById(baseId + ':stationPopup').style.left = 0;
        //キー監視
        inputCheck();
    }

    /**
    * スマートフォン用入力画面を閉じる
    */
    function closeStationInput() {
        if (document.getElementById(baseId + ':stationOutput').value != "" && document.getElementById(baseId + ':stationInput').value == "") {
            // 空にする
            document.getElementById(baseId + ':stationOutput').value = "";
            if (typeof callBackFunction['change'] == 'function') {
                callBackFunction['change']();
            }
        } else {
            for (var i = 0; i < stationList.length; i++) {
                if (stationList[i].name == document.getElementById(baseId + ':stationInput').value) {
                    if (document.getElementById(baseId + ':stationOutput').value != stationList[i].name) {
                        // 変わっていたら変更
                        document.getElementById(baseId + ':stationOutput').value = stationList[i].name;
                        if (typeof callBackFunction['change'] == 'function') {
                            callBackFunction['change']();
                        }
                    }
                }
            }
        }
        document.getElementById(baseId + ':stationPopupBack').style.display = "none";
        document.getElementById(baseId + ':stationPopup').style.display = "none";
        document.getElementById(baseId + ':stationOutput').focus();
    }

    /**
    * フォーカスが外れた時にイベント
    */
    function onblurEvent() {
        callBackFunctionDelay = true;
        setTimeout(onblurEventCallBack, 1000);
    }

    /**
    * 遅延処理を行った際に実行される
    */
    function onblurEventCallBack() {
        if (callBackFunctionDelay) {
            callBackFunctionDelay = false;
            if (typeof callBackFunction['blur'] == 'function') {
                callBackFunction['blur']();
            }
        }
    }

    /**
    * フォーカスが合った時にイベント
    */
    function onFocusEvent() {
        callBackFunctionDelay = false;
        if (typeof callBackFunction['focus'] == 'function') {
            callBackFunction['focus']();
        }
        if (agent == 1 || agent == 3) {
            if (document.getElementById(baseId + ':stationInput').value != "") {
                if (document.getElementById(baseId + ':stationList').style.display == "none") {
                    document.getElementById(baseId + ':stationList').style.display = "block";
                    // コールバック
                    if (typeof callBackFunction['open'] == 'function') {
                        callBackFunction['open']();
                    }
                }
            }
        }
    }

    /**
    * 文字の入力中でもチェックする
    */
    var inputCheck = function () {
        if (document.getElementById(baseId + ':stationInput')) {
            if (oldvalue != document.getElementById(baseId + ':stationInput').value) {
                oldvalue = document.getElementById(baseId + ':stationInput').value;
                searchStation(true, oldvalue);
            };
            setTimeout(inputCheck, 100);
        }
    };

    /**
    * フォームのイベント処理
    */
    function inputStation(event) {
        var iStation = document.getElementById(baseId + ':stationInput').value;
        if (iStation == "") {
            document.getElementById(baseId + ':stationList').style.display = "none";
        }
        if (event.keyCode == 13) {
            // エンターキー
            if (selectStation > 0) {
                // カーソルで移動済み
                setStationNo(selectStation);
            } else {
                // エンターキーのみ
                /*
                if (iStation != "") {
                    var tmp_stationList = new Array();
                    for (var n = 0; n < stationSort.length; n++) {
                        if (stationSort[n].visible) {
                            for (var i = 0; i < stationSort[n].stationList.length; i++) {
                                tmp_stationList.push(stationSort[n].stationList[i] + 1);
                            }
                        }
                    }
                    setStationNo(tmp_stationList[0]);
                }
                */
            }
            // エンターキー
            if (typeof callBackFunction['enter'] == 'function') {
                callBackFunction['enter']();
            }
        }
    }

    /**
    * カーソルによる駅指定
    */
    function selectStationChange(event) {
        if (event.keyCode == 38 || event.keyCode == 40) {
            var tmp_stationList = new Array();
            for (var n = 0; n < stationSort.length; n++) {
                if (stationSort[n].visible) {
                    for (var i = 0; i < stationSort[n].stationList.length; i++) {
                        tmp_stationList.push(stationSort[n].stationList[i] + 1);
                    }
                }
            }
            //マークを消す
            if (document.getElementById(baseId + ":stationRow:" + String(selectStation))) {
                document.getElementById(baseId + ":stationRow:" + String(selectStation)).className = "exp_stationName";
            }
            if (tmp_stationList.length == 0) {
                selectStation = 0;
            } else {
                var pos = checkArray(tmp_stationList, selectStation);
                if (pos == -1) {
                    selectStation = tmp_stationList[0];
                } else if (event.keyCode == 38) {
                    if (pos > 0) {
                        selectStation = tmp_stationList[pos - 1];
                    }
                } else if (event.keyCode == 40) {
                    if (pos < tmp_stationList.length - 1) {
                        selectStation = tmp_stationList[pos + 1];
                    }
                }
            }
            if (selectStation > 0) {
                if (document.getElementById(baseId + ":stationRow:" + String(selectStation))) {
                    document.getElementById(baseId + ":stationRow:" + String(selectStation)).className = "exp_stationName exp_stationNameCursor";
                }
                if (document.getElementById(baseId + ':stationList').style.display == "none") {
                    document.getElementById(baseId + ':stationList').style.display = "block";
                    // コールバック
                    if (typeof callBackFunction['open'] == 'function') {
                        callBackFunction['open']();
                    }
                }
            }
        }
    }

    /**
    * 駅名の検索
    */
    function searchStation(openFlag, str) {
        resetCursor();
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        if (str.length == "") {
            closeStationList();
            return;
        }
        var url = apiURL + "v1/json/station/light?key=" + key + "&name=" + encodeURIComponent(str);
        if (typeof stationType != 'undefined') {
            url += "&type=" + stationType;
        } else {
            var tmp_type = new Array();
            for (var n = 0; n < stationSort.length; n++) {
                if (stationSort[n].visible) {
                    tmp_type.push(stationSort[n].type);
                }
            }
            // すべてオフの場合は問い合わせない
            if (tmp_type.length == 0) {
                return;
            }
            url += "&type=" + tmp_type.join(":");
        }
        if (typeof stationPrefectureCode != 'undefined') {
            url += "&prefectureCode=" + stationPrefectureCode;
        }
        if (typeof stationCorporationBind != 'undefined') {
            url += "&corporationBind=" + encodeURIComponent(stationCorporationBind);
        }
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                outStationList(openFlag, JSON_object);
            };
        } else {
            httpObj = new XMLHttpRequest();
            httpObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (httpObj.readyState == done && httpObj.status == ok) {
                    JSON_object = JSON.parse(httpObj.responseText);
                    outStationList(openFlag, JSON_object);
                }
            };
        }
        httpObj.open("GET", url, true);
        httpObj.send(null);
    }

    /**
    * 駅名をセットする
    */
    function setStationNo(n) {
        resetCursor();
        if (typeof stationList[n - 1] != 'undefined') {
            if (agent == 1 || agent == 3) {
                if (stationList[(n - 1)].name != document.getElementById(baseId + ':stationInput').value) {
                    setStation(stationList[(n - 1)].name);
                    if (typeof callBackFunction['change'] == 'function') {
                        callBackFunction['change']();
                    }
                } else {
                    setStation(stationList[(n - 1)].name);
                }
            } else if (agent == 2) {
                if (stationList[(n - 1)].name != document.getElementById(baseId + ':stationOutput').value) {
                    setStation(stationList[(n - 1)].name);
                    if (typeof callBackFunction['change'] == 'function') {
                        callBackFunction['change']();
                    }
                } else {
                    setStation(stationList[(n - 1)].name);
                }
            }
        }
    }

    /**
    * 駅のアイコンを設定
    */
    function getStationIconType(type) {
        if (typeof type != 'object') {
            // 単一の場合
            return '<span class="exp_' + type + '"></span>';
        } else if (typeof type.text != 'undefined') {
            return '<span class="exp_' + type.text + '"></span>';
        } else if (type.length > 0) {
            // 複数の場合
            var buffer = "";
            for (var i = 0; i < type.length; i++) {
                if (typeof type[i].text != 'undefined') {
                    buffer += '<span class="exp_' + type[i].text + '"></span>';
                } else {
                    buffer += '<span class="exp_' + type[i] + '"></span>';
                }
            }
            return buffer;
        }
        return '';
    }

    /**
    * 検索した駅リストの出力
    */
    function outStationList(openFlag, tmp_stationList) {
        if (typeof tmp_stationList != 'undefined') {
            if (typeof tmp_stationList.ResultSet.Point != 'undefined') {
                stationList = new Array();
                if (typeof tmp_stationList.ResultSet.Point.length != 'undefined') {
                    // 複数
                    for (var i = 0; i < tmp_stationList.ResultSet.Point.length; i++) {
                        stationList.push(setStationObject(tmp_stationList.ResultSet.Point[i]));
                    }
                } else {
                    // 一つだけ
                    stationList.push(setStationObject(tmp_stationList.ResultSet.Point));
                }
            }
        }
        // 駅名を出力
        if (stationList.length > 0) {
            // リストを出力
            var viewStationType = (typeof stationType != 'undefined') ? stationType : "";
            var buffer = "";
            buffer += '<ul class="exp_stationTable">';
            for (var n = 0; n < stationSort.length; n++) {
                stationSort[n].stationList = new Array();
                for (var i = 0; i < stationList.length; i++) {
                    if (stationList[i].type.split(":")[0] == stationSort[n].type) {
                        stationSort[n].stationList.push(i);
                    }
                }
                if (agent == 1) {
                    if (viewStationType.indexOf(stationSort[n].type) != -1 || viewStationType == "") {
                        buffer += '<li>';
                        if (stationSort[n].visible) {
                            buffer += '<a class="exp_stationTitle" id="' + baseId + ':stationView:' + String(n + 1) + '" href="Javascript:void(0);">';
                        } else {
                            buffer += '<a class="exp_stationTitleClose" id="' + baseId + ':stationView:' + String(n + 1) + '" href="Javascript:void(0);">';
                        }
                        buffer += '<div class="exp_stationCount">' + stationSort[n].stationList.length + '件</div>';
                        buffer += '<div class="exp_stationIcon">';
                        buffer += '<span class="exp_' + stationSort[n].type + '" id="' + baseId + ':stationView:' + String(n + 1) + ':icon"></span>';
                        buffer += '</div>';
                        buffer += '<div class="exp_stationType" id="' + baseId + ':stationView:' + String(n + 1) + ':type">';
                        buffer += stationSort[n].name;
                        buffer += '</div>';
                        buffer += '</a>';
                        buffer += '</li>';
                    }
                }
                if (stationSort[n].visible) {
                    // リストの出力
                    for (var i = 0; i < stationList.length; i++) {
                        if (stationList[i].type.split(":")[0] == stationSort[n].type) {
                            buffer += getStationListItem(i + 1, stationList[i]);
                        }
                    }
                }
            }
            buffer += '</ul>';
            document.getElementById(baseId + ':stationSelect').innerHTML = buffer;
            // イベントを設定
            for (var i = 0; i < stationList.length; i++) {
                addEvent(document.getElementById(baseId + ":stationRow:" + String(i + 1)), "click", onEvent);
            }
            if (viewStationType.split(":").length >= 2 || viewStationType == "") {
                for (var i = 0; i < stationSort.length; i++) {
                    addEvent(document.getElementById(baseId + ":stationView:" + String(i + 1)), "click", onEvent);
                }
            }
            if (document.getElementById(baseId + ':stationList').style.display == "none" && openFlag) {
                document.getElementById(baseId + ':stationList').style.display = "block";
                // コールバック
                if (typeof callBackFunction['open'] == 'function') {
                    callBackFunction['open']();
                }
            }
            // リストが取得できたためコールバックする
            if (typeof callBackFunction['callback'] == 'function') {
                callBackFunction['callback'](true);
                callBackFunction['callback'] = undefined;
            }
        } else {
            if (typeof callBackFunction['callback'] == 'function') {
                callBackFunction['callback'](false);
                callBackFunction['callback'] = undefined;
            }
        }
    }

    /**
    * 表示切替
    */
    function stationView(n) {
        stationSort[n].visible = !stationSort[n].visible;
        outStationList(true);
    }

    /**
    * 地点オブジェクトの作成
    */
    function setStationObject(stationObj) {
        var tmp_station = new Object();
        tmp_station.name = stationObj.Station.Name;
        tmp_station.code = stationObj.Station.code;
        tmp_station.yomi = stationObj.Station.Yomi;

        if (typeof stationObj.Station.Type == 'string') {
            // 1つのタイプだけある
            tmp_station.type = stationObj.Station.Type;
        } else {
            if (typeof stationObj.Station.Type.length == 'undefined') {
                // 単一のタイプ
                if (typeof stationObj.Station.Type.text != 'undefined') {
                    tmp_station.type = stationObj.Station.Type.text;
                    if (typeof stationObj.Station.Type.detail != 'undefined') {
                        tmp_station.type_detail = stationObj.Station.Type.text + "." + stationObj.Station.Type.detail;
                    }
                } else {
                    tmp_station.type = stationObj.Station.Type;
                }
            } else {
                // 駅のタイプが複数
                var temp_type = "";
                var temp_type_detail = "";
                for (var i = 0; i < stationObj.Station.Type.length; i++) {
                    if (typeof stationObj.Station.Type[i].text != 'undefined') {
                        if (temp_type != "") { temp_type += ":"; }
                        temp_type += stationObj.Station.Type[i].text;
                        if (typeof stationObj.Station.Type[i].detail != 'undefined') {
                            if (temp_type_detail != "") { temp_type_detail += ":"; }
                            temp_type_detail += stationObj.Station.Type[i].text + "." + stationObj.Station.Type[i].detail;
                        }
                    } else {
                        if (temp_type != "") { temp_type += ":"; }
                        temp_type += stationObj.Station.Type[i];
                    }
                    tmp_station.type = temp_type;
                    tmp_station.type_detail = temp_type_detail;
                }
            }
        }
        // 県コード
        if (typeof stationObj.Prefecture != 'undefined') {
            tmp_station.kenCode = parseInt(stationObj.Prefecture.code);
        }
        return tmp_station;
    }

    /**
    * 駅のリストを出力
    */
    function getStationListItem(n, stationItem) {
        var buffer = "";
        buffer += '<li>';
        if (agent == 2 || agent == 3) {
            buffer += '<div class="exp_stationIcon">';
            buffer += getStationIconType(stationItem.type);
            buffer += '</div>';
        }
        buffer += '<div>';
        buffer += '<a class="exp_stationName" id="' + baseId + ':stationRow:' + String(n) + '" href="Javascript:void(0);" title="' + stationItem.yomi + '">' + stationItem.name + '</a>';
        buffer += '</div>';
        buffer += '</li>';
        return buffer;
    }

    /**
    * IE用に配列の検索機能を実装
    */
    function checkArray(arr, target) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === target) { return i; }
        }
        return -1;
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        callBackFunctionDelay = false;
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "stationRow" && eventIdList.length == 3) {
                // 駅の選択
                setStationNo(parseInt(eventIdList[2]));
                callBackFunctionDelay = true;
                onblurEventCallBack();
            } else if (eventIdList[1] == "stationView" && eventIdList.length >= 3) {
                // 表示切替
                stationView(parseInt(eventIdList[2]) - 1);
                // 駅名を検索
                searchStation(true, oldvalue);
            }
        }
    }

    /**
    * フォームの駅名を返す
    */
    function getStation() {
        if (agent == 1 || agent == 3) {
            return document.getElementById(baseId + ':stationInput').value;
        } else if (agent == 2) {
            return document.getElementById(baseId + ':stationOutput').value;
        }
    }

    /**
    * 検索した駅名リストを返す
    */
    function getStationList() {
        var stationArray = new Array();
        for (var i = 0; i < stationList.length; i++) {
            stationArray.push(stationList[i].name);
        }
        return stationArray.join(",");
    }

    /**
    * 選択中の駅名を返す
    */
    function getStationName() {
        var tmp_station;
        if (agent == 1 || agent == 3) {
            tmp_station = document.getElementById(baseId + ':stationInput').value;
        } else if (agent == 2) {
            tmp_station = document.getElementById(baseId + ':stationOutput').value;
        }
        if (stationList.length > 0) {
            for (var i = 0; i < stationList.length; i++) {
                if (stationList[i].name == tmp_station) {
                    return stationList[i].name;
                }
            }
        }
        return "";
    }

    /**
    * 選択中の駅コードを返す
    */
    function getStationCode() {
        var tmp_station;
        if (agent == 1 || agent == 3) {
            tmp_station = document.getElementById(baseId + ':stationInput').value;
        } else if (agent == 2) {
            tmp_station = document.getElementById(baseId + ':stationOutput').value;
        }
        if (stationList.length > 0) {
            for (var i = 0; i < stationList.length; i++) {
                if (stationList[i].name == tmp_station) {
                    return stationList[i].code;
                }
            }
        }
        return "";
    }


    /**
    * 駅情報の取得
    */
    function getPointObject(station) {
        // オブジェクトコピー用インライン関数
        function clone(obj) {
            var f = function () { };
            f.prototype = obj;
            return new f;
        }
        for (var i = 0; i < stationList.length; i++) {
            if (isNaN(station)) {
                if (stationList[i].name == station) {
                    return clone(stationList[i]);
                }
            } else if (stationList[i].code == station) {
                return clone(stationList[i]);
            }
        }
    }

    /**
    * 検索した駅名リストを閉じる
    */
    function closeStationList() {
        resetCursor();
        if (agent == 1 || agent == 3) {
            document.getElementById(baseId + ':stationList').style.display = "none";
            // コールバック
            if (typeof callBackFunction['close'] == 'function') {
                callBackFunction['close']();
            }
        }
    }

    /**
    * 駅リストを開いているかどうかのチェック
    */
    function checkStationList() {
        if (document.getElementById(baseId + ':stationList').style.display == "block") {
            return true;
        } else {
            return false;
        }
    }

    function resetCursor() {
        if (document.getElementById(baseId + ":stationRow:" + String(selectStation))) {
            document.getElementById(baseId + ":stationRow:" + String(selectStation)).className = "exp_stationName";
        }
        selectStation = 0;
    }

    /**
    * フォームに駅名をセットしてリストを閉じる
    */
    function setStation(str, callback) {
        callBackFunction['callback'] = callback;
        if (agent == 1 || agent == 3) {
            document.getElementById(baseId + ':stationInput').value = str;
            // チェックはしない
            oldvalue = document.getElementById(baseId + ':stationInput').value;
            closeStationList();
        } else if (agent == 2) {
            document.getElementById(baseId + ':stationOutput').value = str;
            //リストを閉じる
            document.getElementById(baseId + ':stationPopup').style.display = "none";
            document.getElementById(baseId + ':stationPopupBack').style.display = "none";
        }
        if (str != "") {
            //駅リスト検索をチェックし、無かった場合は問い合わせ
            if (stationList.length > 0) {
                for (var i = 0; i < stationList.length; i++) {
                    if (stationList[i].name == str) {
                        if (typeof callBackFunction['callback'] == 'function') {
                            callBackFunction['callback'](true);
                            callBackFunction['callback'] = undefined;
                        }
                        return;
                    }
                }
            }
            //一致する駅が無いため、問い合わせ
            searchStation(false, str);
        }
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (name.toLowerCase() == "type") {
            if (typeof value == "object") {
                stationType = value.join(":");
            } else {
                stationType = value;
            }
        } else if (name.toLowerCase() == String("corporationBind").toLowerCase()) {
            if (typeof value == "object") {
                stationCorporationBind = value.join(":");
            } else {
                stationCorporationBind = value;
            }
        } else if (name.toLowerCase() == String("prefectureCode").toLowerCase()) {
            if (typeof value == "object") {
                stationPrefectureCode = value.join(":");
            } else {
                stationPrefectureCode = value;
            }
        } else if (name.toLowerCase() == String("maxStation").toLowerCase()) {
            maxStation = value;
        } else if (name.toLowerCase() == String("agent").toLowerCase()) {
            agent = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    /**
    * コールバック関数の定義
    */
    function bind(type, func) {
        if (type == 'open' && typeof func == 'function') {
            callBackFunction[type] = func;
        } else if (type == 'close' && typeof func == 'function') {
            callBackFunction[type] = func;
        } else if (type == 'change' && typeof func == 'function') {
            callBackFunction[type] = func;
        } else if (type == 'blur' && typeof func == 'function') {
            callBackFunction[type] = func;
        } else if (type == 'enter' && typeof func == 'function') {
            callBackFunction[type] = func;
        } else if (type == 'focus' && typeof func == 'function') {
            callBackFunction[type] = func;
        }
    }

    /**
    * コールバック関数の解除
    */
    function unbind(type) {
        if (typeof callBackFunction[type] == 'function') {
            callBackFunction[type] = undefined;
        }
    }

    // 外部参照可能な関数リスト
    this.dispStation = dispStation;
    this.getStation = getStation;
    this.setStation = setStation;
    this.getStationList = getStationList;
    this.getStationName = getStationName;
    this.getStationCode = getStationCode;
    this.getPointObject = getPointObject;
    this.closeStationList = closeStationList;
    this.checkStationList = checkStationList;
    this.setConfigure = setConfigure;
    this.bind = bind;
    this.unbind = unbind;

    // 定数リスト
    this.TYPE_TRAIN = "train";
    this.TYPE_PLANE = "plane";
    this.TYPE_SHIP = "ship";
    this.TYPE_BUS = "bus";
    this.TYPE_WALK = "walk";
    this.TYPE_STRANGE = "strange";
    this.TYPE_BUS_LOCAL = "bus.local";
    this.TYPE_BUS_CONNECTION = "bus.connection";
    this.TYPE_BUS_HIGHWAY = "bus.highway";
    this.TYPE_BUS_MIDNIGHT = "bus.midnight";
    this.TYPE_TRAIN_LIMITEDEXPRESS = "train.limitedExpress";
    this.TYPE_TRAIN_SHINKANSEN = "train.shinkansen";
    this.TYPE_TRAIN_SLEEPERTRAIN = "train.sleeperTrain";
    this.TYPE_TRAIN_LINER = "train.liner";
    this.TDFK_HOKKAIDO = 1;
    this.TDFK_AOMORI = 2;
    this.TDFK_IWATE = 3;
    this.TDFK_MIYAGI = 4;
    this.TDFK_AKITA = 5;
    this.TDFK_YAMAGATA = 6;
    this.TDFK_FUKUSHIMA = 7;
    this.TDFK_IBARAKI = 8;
    this.TDFK_TOCHIGI = 9;
    this.TDFK_GUNMA = 10;
    this.TDFK_SAITAMA = 11;
    this.TDFK_CHIBA = 12;
    this.TDFK_TOKYO = 13;
    this.TDFK_KANAGAWA = 14;
    this.TDFK_NIIGATA = 15;
    this.TDFK_TOYAMA = 16;
    this.TDFK_ISHIKAWA = 17;
    this.TDFK_FUKUI = 18;
    this.TDFK_YAMANASHI = 19;
    this.TDFK_NAGANO = 20;
    this.TDFK_GIFU = 21;
    this.TDFK_SHIZUOKA = 22;
    this.TDFK_AICHI = 23;
    this.TDFK_MIE = 24;
    this.TDFK_SHIGA = 25;
    this.TDFK_KYOTO = 26;
    this.TDFK_OSAKA = 27;
    this.TDFK_HYOGO = 28;
    this.TDFK_NARA = 29;
    this.TDFK_WAKAYAMA = 30;
    this.TDFK_TOTTORI = 31;
    this.TDFK_SHIMANE = 32;
    this.TDFK_OKAYAMA = 33;
    this.TDFK_HIROSHIMA = 34;
    this.TDFK_YAMAGUCHI = 35;
    this.TDFK_TOKUSHIMA = 36;
    this.TDFK_KAGAWA = 37;
    this.TDFK_EHIME = 38;
    this.TDFK_KOCHI = 39;
    this.TDFK_FUKUOKA = 40;
    this.TDFK_SAGA = 41;
    this.TDFK_NAGASAKI = 42;
    this.TDFK_KUMAMOTO = 43;
    this.TDFK_OITA = 44;
    this.TDFK_MIYAZAKI = 45;
    this.TDFK_KAGOSHIMA = 46;
    this.TDFK_OKINAWA = 47;

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
