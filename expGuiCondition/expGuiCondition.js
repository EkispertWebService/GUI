/**
 *  駅すぱあと Web サービス
 *  探索条件パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2020-10-12
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiCondition = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiCondition\.js"));
        if (s.src && s.src.match(/expGuiCondition\.js(\?.*)?/)) {
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
    // デフォルト探索条件
    var def_condition_t = "T3221233232319";
    var def_condition_f = "F3421122120000";
    
    var def_condition_a = "A23121141";
    var def_sortType = "ekispert"; // デフォルトソート
    var def_priceType = "oneway"; // 片道運賃がデフォルト
    var def_answerCount = "5"; // 探索結果数のデフォルト
    var checkBoxItemName = "shinkansen:shinkansenNozomi:limitedExpress:localBus:liner:midnightBus"; //チェックボックスに表示する条件
    var checkboxItem = new Array();
    var selectItem = new Array();
    var radioItem = new Array();
    var conditionObject = initCondition();

    /**
     * 探索条件のオブジェクトの初期化
     */
    function initCondition() {
        // 探索条件のオブジェクトを作成
        var tmp_conditionObject = new Object();
        // 回答数
        var conditionId = "answerCount";
        var conditionLabel = "回答数";
        var tmpOption = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption);
        // 探索時の表示順設定
        var conditionId = "sortType";
        var conditionLabel = "表示順設定";
        //  var conditionLabel = "探索時の表示順設定";
        //  var tmpOption = new Array("駅すぱあと探索順","料金順","時間順","定期券の料金順","乗換回数順","CO2排出量順","1ヶ月定期券の料金順","3ヶ月定期券の料金順","6ヶ月定期券の料金順");
        var tmpOption = new Array("探索順", "料金順", "時間順", "定期券順", "乗換回数順", "CO2排出量順", "1ヶ月定期順", "3ヶ月定期順", "6ヶ月定期順");
        var tmpValue = new Array("ekispert", "price", "time", "teiki", "transfer", "co2", "teiki1", "teiki3", "teiki6");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 探索時の料金設定
        var conditionId = "priceType";
        //  var conditionLabel = "探索時の料金設定";
        var conditionLabel = "料金設定";
        var tmpOption = new Array("片道", "往復", "定期");
        var tmpValue = new Array("oneway", "round", "teiki");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 飛行機
        var conditionId = "plane";
        var conditionLabel = "飛行機";
        var tmpOption = new Array("気軽に利用", "普通に利用", "極力利用しない", "利用しない");
        var tmpValue = new Array("light", "normal", "bit", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 新幹線
        var conditionId = "shinkansen";
        var conditionLabel = "新幹線";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 新幹線のぞみ
        var conditionId = "shinkansenNozomi";
        var conditionLabel = "新幹線のぞみ";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 寝台列車
        var conditionId = "sleeperTrain";
        var conditionLabel = "寝台列車";
        var tmpOption = new Array("極力利用する", "普通に利用", "利用しない");
        var tmpValue = new Array("possible", "normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 有料特急
        var conditionId = "limitedExpress";
        var conditionLabel = "有料特急";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 高速バス
        var conditionId = "highwayBus";
        var conditionLabel = "高速バス";
        var tmpOption = new Array("気軽に利用", "普通に利用", "極力利用しない", "利用しない");
        var tmpValue = new Array("light", "normal", "bit", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 連絡バス
        var conditionId = "connectionBus";
        var conditionLabel = "連絡バス";
        var tmpOption = new Array("気軽に利用", "普通に利用", "極力利用しない", "利用しない");
        var tmpValue = new Array("light", "normal", "bit", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 路線バス
        var conditionId = "localBus";
        var conditionLabel = "路線バス";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 船
        var conditionId = "ship";
        var conditionLabel = "船";
        var tmpOption = new Array("気軽に利用", "普通に利用", "極力利用しない", "利用しない");
        var tmpValue = new Array("light", "normal", "bit", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 有料普通列車
        var conditionId = "liner";
        var conditionLabel = "有料普通列車";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 駅間徒歩
        var conditionId = "walk";
        var conditionLabel = "駅間徒歩";
        var tmpOption = new Array("気にならない", "少し気になる", "利用しない");
        var tmpValue = new Array("normal", "little", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 深夜急行バス
        var conditionId = "midnightBus";
        var conditionLabel = "深夜急行バス";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("normal", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 特急料金初期値
        var conditionId = "surchargeKind";
        var conditionLabel = "特急料金初期値";
        var tmpOption = new Array("自由席", "指定席", "グリーン");
        var tmpValue = new Array("free", "reserved", "green");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 定期種別初期値
        var conditionId = "teikiKind";
        var conditionLabel = "定期種別初期値";
        var tmpOption = new Array("通勤", "通学（大学）", "通学（高校）", "通学（中学）");
        var tmpValue = new Array("3", "1", "2", "4"); //APIで返却値
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // JR季節料金
        var conditionId = "JRSeasonalRate";
        var conditionLabel = "JR季節料金";
        //  var tmpOption = new Array("繁忙期・閑散期の季節料金を考慮する","無視する");
        var tmpOption = new Array("繁忙期・閑散期を考慮", "無視する");
        var tmpValue = new Array("true", "false");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 学割乗車券
        var conditionId = "studentDiscount";
        var conditionLabel = "学割乗車券";
        var tmpOption = new Array("計算する", "計算しない");
        var tmpValue = new Array("true", "false");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // EX予約/スマートEX
        var conditionId = "JRReservation";
        var conditionLabel = "EX予約/スマートEX";
        var tmpOption = new Array("適用しない","ＥＸ予約", "ＥＸ予約(ｅ特急券)", "ＥＸ予約(ＥＸ早特)", "ＥＸ予約(ＥＸ早特２１)", "ＥＸ予約(ＥＸグリーン早特)", "スマートＥＸ", "スマートＥＸ(ＥＸ早特)", "スマートＥＸ(ＥＸ早特２１)", "スマートＥＸ(ＥＸグリーン早特)");
        var tmpValue = new Array("none", "exYoyaku", "exETokkyu", "exHayatoku", "exHayatoku21", "exGreenHayatoku", "smartEx", "smartExHayatoku", "smartExHayatoku21", "smartExGreenHayatoku");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 新幹線eチケット
        var conditionId = "shinkansenETicket";
        var conditionLabel = "新幹線eチケット";
        var tmpOption = new Array("適用しない","新幹線ｅチケット");
        var tmpValue = new Array("none", "eTicket");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 航空運賃の指定
        //var conditionId = "airFare";
        //var conditionLabel = "航空運賃の指定";
        //var tmpOption = new Array("常に普通運賃を採用","特定便割引を極力採用");
        //var tmpValue  = new Array("normal","tokuwari");
        //tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel,tmpOption,tmpValue);
        // 航空保険特別料金
        // var conditionId = "includeInsurance";
        // var conditionLabel = "航空保険特別料金";
        // var tmpOption = new Array("運賃に含む", "運賃に含まない");
        // var tmpValue = new Array("true", "false");
        // tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 乗車券計算のシステム
        var conditionId = "ticketSystemType";
        //  var conditionLabel = "乗車券計算のシステム";
        var conditionLabel = "乗車券計算";
        //  var tmpOption = new Array("普通乗車券として計算","ICカード乗車券として計算");
        var tmpOption = new Array("普通乗車券", "ICカード乗車券");
        var tmpValue = new Array("normal", "ic");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // ２区間定期の利用
        var conditionId = "nikukanteiki";
        var conditionLabel = "２区間定期の利用";
        var tmpOption = new Array("利用する", "利用しない");
        var tmpValue = new Array("true", "false");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // JR路線
        var conditionId = "useJR";
        var conditionLabel = "JR路線";
        var tmpOption = new Array("気軽に利用", "普通に利用", "極力利用しない");
        var tmpValue = new Array("light", "normal", "bit");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 乗換え
        var conditionId = "transfer";
        var conditionLabel = "乗換え";
        var tmpOption = new Array("気にならない", "少し気になる", "利用しない");
        var tmpValue = new Array("normal", "little", "never");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 特急始発駅
        var conditionId = "expressStartingStation";
        var conditionLabel = "特急始発駅";
        var tmpOption = new Array("なるべく利用", "普通に利用");
        var tmpValue = new Array("possible", "normal");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 出発駅乗車
        var conditionId = "waitAverageTime";
        var conditionLabel = "出発駅乗車";
        //  var tmpOption = new Array("平均待ち時間を利用する","待ち時間なし");
        var tmpOption = new Array("平均待ち時間", "待ち時間なし");
        var tmpValue = new Array("true", "false");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 路線バスのみ探索
        var conditionId = "localBusOnly";
        var conditionLabel = "路線バスのみ探索";
        var tmpOption = new Array("する", "しない");
        var tmpValue = new Array("true", "false");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 路線名あいまい指定
        //  var conditionId = "fuzzyLine";
        //  var conditionLabel = "路線名あいまい指定";
        //  var tmpOption = new Array("あいまいに行う","厳格に行う");
        //  var tmpValue  = new Array("true","false");
        //  tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel,tmpOption,tmpValue);
        // 乗換え時間
        var conditionId = "transferTime";
        var conditionLabel = "乗換え時間";
        //  var tmpOption = new Array("駅すぱあとの既定値","既定値より少し余裕をみる","既定値より余裕をみる","既定値より短い時間にする");
        var tmpOption = new Array("既定値", "少し余裕をみる", "余裕をみる", "短い時間");
        var tmpValue = new Array("normal", "moreMargin", "mostMargin", "lessMargin");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        // 経由駅指定の継承
        //  var conditionId = "entryPathBehavior";
        //  var conditionLabel = "経由駅指定の継承";
        //  var tmpOption = new Array("する","しない");
        //  var tmpValue  = new Array("true","false");
        //  tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel,tmpOption,tmpValue);
        // 優先する乗車券の順序
        var conditionId = "preferredTicketOrder";
        //  var conditionLabel = "優先する乗車券の順序";
        var conditionLabel = "優先する乗車券";
        //var tmpOption = new Array("指定なし", "普通乗車券を優先する", "ＩＣカード乗車券を優先する", "安い乗車券を優先する");
        var tmpOption = new Array("指定なし", "安い乗車券", "ＩＣカード乗車券", "普通乗車券");
        var tmpValue = new Array("none", "cheap", "ic", "normal");
        tmp_conditionObject[conditionId.toLowerCase()] = addCondition(conditionLabel, tmpOption, tmpValue);
        return tmp_conditionObject;
    }

    /**
    * 探索条件オブジェクト追加
    */
    function addCondition(name, option, value) {
        var tmpCondition = new Object();
        tmpCondition.name = name;
        tmpCondition.option = option;
        if (typeof value != 'undefined') {
            tmpCondition.value = value;
        } else {
            tmpCondition.value = option;
        }
        // デフォルトは表示
        tmpCondition.visible = true;
        return tmpCondition;
    }

    /**
    * 探索条件の設置
    */
    function dispCondition() {
        // HTML本体
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiCondition expGuiConditionPc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiCondition expGuiConditionPhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiCondition expGuiConditionTablet">';
        }
        if (agent == 1 || agent == 3) {
            // チェックボックスの設定とデフォルト
            buffer += '<div class="exp_clearfix">';
            buffer += viewConditionSimple(true);
            buffer += viewConditionDetail();
            buffer += "</div>";
        } else if (agent == 2) {
            // セレクトボックス
            buffer += viewConditionPhone();
        }
        buffer += '</div>';
        documentObject.innerHTML = buffer;

        //チェックボックスを設定した条件は非表示にする
        for (var i = 0; i < checkboxItem.length; i++) {
            setConditionView(checkboxItem[i], false);
        }

        // イベントを設定
        addEvent(document.getElementById(baseId + ":conditionOpen"), "click", onEvent);
        var tabCount = 1;
        while (document.getElementById(baseId + ":conditionTab:" + String(tabCount))) {
            addEvent(document.getElementById(baseId + ":conditionTab:" + String(tabCount)), "click", onEvent);
            tabCount++;
        }
        var tabCount = 1;
        while (document.getElementById(baseId + ":conditionSection:" + String(tabCount) + ":open")) {
            addEvent(document.getElementById(baseId + ":conditionSection:" + String(tabCount) + ":open"), "click", onEvent);
            addEvent(document.getElementById(baseId + ":conditionSection:" + String(tabCount) + ":close"), "click", onEvent);
            tabCount++;
        }
        addEvent(document.getElementById(baseId + ":conditionClose"), "click", onEvent);
        // チェックボックスの設定
        for (var i = 0; i < checkboxItem.length; i++) {
            addEvent(document.getElementById(baseId + ':' + checkboxItem[i] + ':checkbox'), "change", onEvent);
        }
        // セレクトボックスの設定
        for (var i = 0; i < selectItem.length; i++) {
            addEvent(document.getElementById(baseId + ':' + selectItem[i]), "change", onEvent);
        }
        // ラジオボタンの設定
        for (var i = 0; i < radioItem.length; i++) {
            addEvent(document.getElementById(baseId + ':' + radioItem[i]), "click", onEvent);
        }
        // 連動機能の追加
        setEvent("shinkansen");
        setEvent("shinkansenNozomi");
        setEvent("ticketSystemType");
        setEvent("preferredTicketOrder");
        setEvent("studentDiscount");
        // デフォルト設定
        resetCondition();
        // 簡易設定のデフォルトも設定
        setSimpleCondition();
    }

    /**
    * 探索条件の設置
    */
    function setEvent(id) {
        id = id.toLowerCase();
        if (agent == 1 || agent == 3) {
            for (var i = 0; i < conditionObject[id].option.length; i++) {
                addEvent(document.getElementById(baseId + ':' + id + ':' + String(i + 1)), "click", onEvent);
            }
        } else if (agent == 2) {
            addEvent(document.getElementById(baseId + ':' + id), "change", onEvent);
        }
    }

    /**
    * 簡易版探索条件の設置
    */
    function dispConditionSimple() {
        // HTML本体
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiCondition expGuiConditionPc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiCondition expGuiConditionPhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiCondition expGuiConditionTablet">';
        }
        buffer += viewConditionSimple(false);
        buffer += viewConditionDetail();
        buffer += '</div>';
        documentObject.innerHTML = buffer;

        // チェックボックスの設定
        for (var i = 0; i < checkboxItem.length; i++) {
            addEvent(document.getElementById(baseId + ':' + checkboxItem[i] + ':checkbox'), "change", onEvent);
        }
        // デフォルト設定
        resetCondition();
        // 簡易設定のデフォルトも設定
        setSimpleCondition();
    }

    /**
     * 無償版用探索条件の設置
     */
    function dispConditionLight() {
        // HTML本体
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiCondition expGuiConditionPc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiCondition expGuiConditionPhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiCondition expGuiConditionTablet">';
        }

        buffer += '<div class="exp_conditionSimple exp_clearfix">';
        buffer += '<div class="exp_title">交通手段</div>';
        buffer += outConditionCheckbox("plane", "normal", "never");
        buffer += outConditionCheckbox("shinkansen", "normal", "never");
        buffer += outConditionCheckbox("limitedExpress", "normal", "never", "特急");
        buffer += outConditionCheckbox("localBus", "normal", "never", "バス");
        buffer += viewConditionDetail();
        buffer += '</div>';
        documentObject.innerHTML = buffer;

        // チェックボックスの設定
        for (var i = 0; i < checkboxItem.length; i++) {
            addEvent(document.getElementById(baseId + ':' + checkboxItem[i] + ':checkbox'), "change", onEvent);
        }
        // デフォルト設定
        resetCondition();
        // 簡易設定のデフォルトも設定
        setSimpleCondition();
    }
    
    /**
    * 簡易設定のデフォルト設定
    */
    function setSimpleCondition() {
        for (var i = 0; i < checkboxItem.length; i++) {
            document.getElementById(baseId + ':' + checkboxItem[i] + ':checkbox').checked = (getValue(checkboxItem[i]) == document.getElementById(baseId + ':' + checkboxItem[i] + ':checkbox').value ? true : false);
        }
    }

    /**
    * 探索条件簡易
    */
    function viewConditionSimple(detail) {
        var buffer = "";
        if (typeof checkBoxItemName != 'undefined') {
            if (checkBoxItemName != "") {
                buffer += '<div class="exp_conditionSimple exp_clearfix">';
                buffer += '<div class="exp_title">交通手段</div>';
                var checkBoxItemList = checkBoxItemName.split(":");
                for (var i = 0; i < checkBoxItemList.length; i++) {
                    buffer += outConditionCheckbox(checkBoxItemList[i], "normal", "never");
                }
                buffer += '</div>';
            }
        }
        if (detail) {
            buffer += '<div class="exp_conditionOpen" id="' + baseId + ':conditionOpenButton">';
            if (agent == 1) {
                buffer += '<a class="exp_conditionOpenButton" id="' + baseId + ':conditionOpen" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':conditionOpen:text">探索詳細条件を設定</span></a>';
            } else if (agent == 3) {
                buffer += '<a class="exp_conditionOpenButton" id="' + baseId + ':conditionOpen" href="Javascript:void(0);">探索詳細条件を設定</a>';
            }
            buffer += '</div>';
        }
        return buffer;
    }

    /**
    * 探索条件詳細
    */
    function viewConditionDetail() {
        var buffer = "";
        buffer += '<div id="' + baseId + ':conditionDetail" class="exp_conditionDetail" style="display:none;">';
        buffer += '<div class="exp_conditionTable exp_clearfix">';
        if (agent == 3) {
            // タブレット用閉じるボタン
            buffer += '<div class="exp_titlebar exp_clearfix">';
            buffer += '探索条件';
            buffer += '<span class="exp_button">';
            buffer += '<a class="exp_conditionClose" id="' + baseId + ':conditionClose" href="Javascript:void(0);">閉じる</a>';
            buffer += '</span>';
            buffer += '</div>';
        }
        // タブ
        buffer += '<div class="exp_header exp_clearfix">';
        var groupList = new Array("表示", "運賃", "交通手段", "ダイヤ経路", "平均経路");
        buffer += '<div class="exp_conditionLeft"></div>';
        for (var i = 0; i < groupList.length; i++) {
            var tabType = "conditionTab";
            if (agent == 3) {
                if (i == 0) { tabType = "conditionTabLeft"; }
                if (i == (groupList.length - 1)) { tabType = "conditionTabRight"; }
            }
            buffer += '<div class="exp_' + tabType + ' exp_conditionTabSelected" id="' + baseId + ':conditionTab:' + String(i + 1) + ':active" style="display:' + (i == 0 ? "block" : "none") + ';">';
            buffer += '<span class="exp_text">' + groupList[i] + '</span>';
            buffer += '</div>';
            buffer += '<div class="exp_' + tabType + ' exp_conditionTabNoSelect" id="' + baseId + ':conditionTab:' + String(i + 1) + ':none" style="display:' + (i != 0 ? "block" : "none") + ';">';
            buffer += '<a id="' + baseId + ':conditionTab:' + String(i + 1) + '" href="Javascript:void(0);">';
            buffer += groupList[i];
            buffer += '</a>';
            buffer += '</div>';
        }
        buffer += '<div class="exp_conditionRight"></div>';
        buffer += '</div>';

        // 探索条件
        buffer += '<div class="exp_conditionList">';
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(1) + '" class="exp_clearfix">';
        // 回答数
        if (agent == 1 || agent == 2) {
            buffer += outConditionSelect("answerCount");
        } else if (agent == 3) {
            buffer += outConditionRadio("answerCount");
        }
        buffer += outSeparator("answerCount");
        // 探索時の表示順設定
        if (agent == 1 || agent == 2) {
            buffer += outConditionSelect("sortType", "whiteSelect");
        } else if (agent == 3) {
            buffer += outConditionRadio("sortType", "whiteSelect");
        }
        buffer += outSeparator("sortType");
        // 探索時の料金設定
        buffer += outConditionRadio("priceType", "greenSelect");
        buffer += '</div>';

        buffer += '<div id="' + baseId + ':conditionGroup:' + String(2) + '" class="exp_clearfix" style="display:none;">';
        // 特急料金初期値
        buffer += outConditionRadio("surchargeKind");
        buffer += outSeparator("surchargeKind");
        // 学割乗車券
        buffer += outConditionRadio("studentDiscount", "whiteSelect");
        buffer += outSeparator("studentDiscount");
        // 定期種別初期値
        buffer += outConditionRadio("teikiKind", "greenSelect");
        buffer += outSeparator("teikiKind");
        // EX予約/スマートEX
        if (agent == 1 || agent == 2) {
            buffer += outConditionSelect("JRReservation");
        } else if (agent == 3) {
            buffer += outConditionRadio("JRReservation");
        }
        buffer += outSeparator("JRReservation");
        // 新幹線eチケット
        if (agent == 1 || agent == 2) {
            buffer += outConditionSelect("shinkansenETicket");
        } else if (agent == 3) {
            buffer += outConditionRadio("shinkansenETicket");
        }
        buffer += outSeparator("shinkansenETicket");
        // JR季節料金
        buffer += outConditionRadio("JRSeasonalRate", "whiteSelect");
        buffer += outSeparator("JRSeasonalRate");
        // 乗車券計算のシステム
        buffer += outConditionRadio("ticketSystemType", "greenSelect");
        buffer += outSeparator("ticketSystemType");
        // 優先する乗車券の順序
        buffer += outConditionRadio("preferredTicketOrder", "whiteSelect");
        buffer += outSeparator("preferredTicketOrder");
        // ２区間定期の利用
        buffer += outConditionRadio("nikukanteiki", "greenSelect");
        //buffer += outSeparator("nikukanteiki");
        // 航空保険特別料金
        //buffer += outConditionRadio("includeInsurance", "whiteSelect");
        // 航空運賃の指定
        //  buffer += outConditionRadio("airFare");
        buffer += '</div>';

        buffer += '<div id="' + baseId + ':conditionGroup:' + String(3) + '" class="exp_clearfix" style="display:none;">';
        // 飛行機
        buffer += outConditionRadio("plane");
        buffer += outSeparator("plane");
        // 新幹線
        buffer += outConditionRadio("shinkansen");
        buffer += outSeparator("shinkansen");
        // 新幹線のぞみ
        buffer += outConditionRadio("shinkansenNozomi");
        buffer += outSeparator("shinkansenNozomi");
        // 有料特急
        buffer += outConditionRadio("limitedExpress");
        buffer += outSeparator("limitedExpress");
        // 寝台列車
        buffer += outConditionRadio("sleeperTrain");
        buffer += outSeparator("sleeperTrain");
        // 有料普通列車
        buffer += outConditionRadio("liner");
        buffer += outSeparator("liner");
        // 高速バス
        buffer += outConditionRadio("highwayBus");
        buffer += outSeparator("highwayBus");
        // 連絡バス
        buffer += outConditionRadio("connectionBus");
        buffer += outSeparator("connectionBus");
        // 深夜急行バス
        buffer += outConditionRadio("midnightBus");
        buffer += outSeparator("midnightBus");
        // 路線バス
        buffer += outConditionRadio("localBus");
        buffer += outSeparator("localBus");
        // 船
        buffer += outConditionRadio("ship");
        buffer += '</div>';

        buffer += '<div id="' + baseId + ':conditionGroup:' + String(4) + '" class="exp_clearfix" style="display:none;">';
        // 乗換え時間
        if (agent == 1 || agent == 2) {
            buffer += outConditionSelect("transferTime", "whiteSelect");
        } else if (agent == 3) {
            buffer += outConditionRadio("transferTime", "whiteSelect");
        }
        buffer += '</div>';

        buffer += '<div id="' + baseId + ':conditionGroup:' + String(5) + '" class="exp_clearfix" style="display:none;">';
        // 駅間徒歩
        buffer += outConditionRadio("walk", "whiteSelect");
        buffer += outSeparator("walk");
        // JR路線
        buffer += outConditionRadio("useJR", "greenSelect");
        buffer += outSeparator("useJR");
        // 特急始発駅
        buffer += outConditionRadio("expressStartingStation", "whiteSelect");
        buffer += outSeparator("expressStartingStation");
        // 出発駅乗車
        buffer += outConditionRadio("waitAverageTime", "greenSelect");
        buffer += outSeparator("waitAverageTime");
        // 路線バスのみ探索
        buffer += outConditionRadio("localBusOnly", "whiteSelect");
        buffer += outSeparator("localBusOnly");
        // 乗換え
        buffer += outConditionRadio("transfer", "greenSelect");
        buffer += '</div>';
        // 隠しタブ
        buffer += '<div style="display:none;">';
        // 路線名あいまい指定
        //  buffer += outConditionRadio("fuzzyLine");
        // 経由駅指定の継承
        //  buffer += outConditionRadio("entryPathBehavior");
        buffer += '</div>';

        if (agent == 1) {
            // PC用閉じるボタン
            buffer += '<div class="exp_conditionFooter">';
            buffer += '<div class="exp_conditionClose">';
            buffer += '<a class="exp_conditionCloseButton" id="' + baseId + ':conditionClose" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':conditionClose:text">閉じる</span></a>';
            buffer += '</div>';
            buffer += '</div>';
        }
        buffer += '</div>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * スマートフォン用探索条件
    */
    function viewConditionPhone() {
        var buffer = "";
        buffer += '<div id="' + baseId + ':conditionDetail" class="exp_conditionDetail">';
        // 交通手段
        buffer += '<div class="exp_conditionSection">';
        buffer += '<div class="exp_title">交通手段</div>';
        buffer += '<div class="exp_conditionCheckList exp_clearfix">';
        buffer += outConditionCheckbox("shinkansen", "normal", "never");
        buffer += outConditionCheckbox("shinkansenNozomi", "normal", "never");
        buffer += outConditionCheckbox("limitedExpress", "normal", "never");
        buffer += outConditionCheckbox("localBus", "normal", "never");
        buffer += outConditionCheckbox("liner", "normal", "never");
        buffer += outConditionCheckbox("midnightBus", "normal", "never");
        buffer += '</div>';
        buffer += '<div class="exp_detailButton exp_clearfix">';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(1) + ':active">';
        buffer += '<a class="exp_visible" id="' + baseId + ':conditionSection:' + String(1) + ':open" href="Javascript:void(0);">';
        buffer += '詳細条件を開く';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(1) + ':none" style="display:none;">';
        buffer += '<a class="exp_hidden" id="' + baseId + ':conditionSection:' + String(1) + ':close" href="Javascript:void(0);">';
        buffer += '詳細条件を閉じる';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '</div>';
        // 詳細
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(1) + '" class="exp_conditionGroup exp_clearfix" style="display:none;">';
        buffer += '<div class="exp_line exp_clearfix">';
        buffer += '<div class="exp_left"></div><div class="exp_right"></div>';
        buffer += '</div>';
        buffer += outConditionSelect("plane", "whiteSelect"); // 飛行機
        buffer += outConditionSelect("sleeperTrain", "greenSelect"); // 寝台列車
        buffer += outConditionSelect("highwayBus", "whiteSelect"); // 高速バス
        buffer += outConditionSelect("connectionBus", "greenSelect"); // 連絡バス
        buffer += outConditionSelect("ship", "whiteSelect"); // 船
        buffer += '</div>';
        buffer += '</div>';

        // 運賃
        buffer += '<div class="exp_conditionSection">';
        buffer += '<div class="exp_title">運賃</div>';
        buffer += '<div class="exp_conditionGroup exp_clearfix">';
        buffer += outConditionSelect("surchargeKind"); // 特急料金初期値
        buffer += '</div>';
        buffer += '<div class="exp_detailButton exp_clearfix">';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(2) + ':active">';
        buffer += '<a class="exp_visible" id="' + baseId + ':conditionSection:' + String(2) + ':open" href="Javascript:void(0);">';
        buffer += '詳細条件を開く';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(2) + ':none" style="display:none;">';
        buffer += '<a class="exp_hidden" id="' + baseId + ':conditionSection:' + String(2) + ':close" href="Javascript:void(0);">';
        buffer += '詳細条件を閉じる';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '</div>';
        // 詳細
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(2) + '" class="exp_conditionGroup exp_clearfix" style="display:none;">';
        buffer += '<div class="exp_line exp_clearfix">';
        buffer += '<div class="exp_left"></div><div class="exp_right"></div>';
        buffer += '</div>';
        buffer += outConditionSelect("studentDiscount", "whiteSelect"); // 学割乗車券
        buffer += outConditionSelect("teikiKind", "greenSelect"); // 定期種別初期値
        buffer += outConditionSelect("JRSeasonalRate", "whiteSelect"); // JR季節料金
        buffer += outConditionSelect("JRReservation", "greenSelect"); // EX予約/スマートEX
        buffer += outConditionSelect("shinkansenETicket", "whiteSelect"); // 新幹線eチケット
        buffer += outConditionSelect("ticketSystemType", "greenSelect"); // 乗車券計算のシステム
        buffer += outConditionSelect("preferredTicketOrder", "whiteSelect"); // 優先する乗車券の順序
        buffer += outConditionSelect("nikukanteiki", "greenSelect"); // ２区間定期の利用
        //buffer += outConditionSelect("includeInsurance", "greenSelect"); // 航空保険特別料金
        //  buffer += outConditionSelect("airFare");// 航空運賃の指定
        buffer += '</div>';
        buffer += '</div>';

        //表示
        buffer += '<div class="exp_conditionSection">';
        buffer += '<div class="exp_title">表示</div>';
        // 回答数
        buffer += '<div class="exp_conditionGroup exp_clearfix">';
        buffer += outConditionSelect("answerCount");
        buffer += '</div>';
        buffer += '<div class="exp_detailButton exp_clearfix">';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(3) + ':active">';
        buffer += '<a class="exp_visible" id="' + baseId + ':conditionSection:' + String(3) + ':open" href="Javascript:void(0);">';
        buffer += '詳細条件を開く';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(3) + ':none" style="display:none;">';
        buffer += '<a class="exp_hidden" id="' + baseId + ':conditionSection:' + String(3) + ':close" href="Javascript:void(0);">';
        buffer += '詳細条件を閉じる';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '</div>';
        // 詳細
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(3) + '" class="exp_conditionGroup exp_clearfix" style="display:none;">';
        buffer += '<div class="exp_line exp_clearfix">';
        buffer += '<div class="exp_left"></div><div class="exp_right"></div>';
        buffer += '</div>';
        buffer += outConditionSelect("sortType", "whiteSelect"); // 探索時の表示順設定
        buffer += outConditionSelect("priceType", "greenSelect"); // 探索時の料金設定
        buffer += '</div>';
        buffer += '</div>';

        // ダイヤ経路
        buffer += '<div class="exp_conditionSection">';
        buffer += '<div class="exp_title">ダイヤ経路</div>';
        buffer += '<div class="exp_detailButton exp_clearfix">';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(4) + ':active">';
        buffer += '<a class="exp_visible" id="' + baseId + ':conditionSection:' + String(4) + ':open" href="Javascript:void(0);">';
        buffer += '詳細条件を開く';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(4) + ':none" style="display:none;">';
        buffer += '<a class="exp_hidden" id="' + baseId + ':conditionSection:' + String(4) + ':close" href="Javascript:void(0);">';
        buffer += '詳細条件を閉じる';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '</div>';
        // 詳細
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(4) + '" class="exp_conditionGroup exp_clearfix" style="display:none;">';
        buffer += '<div class="exp_line exp_clearfix">';
        buffer += '<div class="exp_left"></div><div class="exp_right"></div>';
        buffer += '</div>';
        buffer += outConditionSelect("transferTime", "whiteSelect"); // 乗換え時間
        buffer += '</div>';
        buffer += '</div>';

        // 平均経路
        buffer += '<div class="exp_conditionSection">';
        buffer += '<div class="exp_title">平均経路</div>';
        buffer += '<div class="exp_detailButton exp_clearfix">';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(5) + ':active">';
        buffer += '<a class="exp_visible" id="' + baseId + ':conditionSection:' + String(5) + ':open" href="Javascript:void(0);">';
        buffer += '詳細条件を開く';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':conditionSection:' + String(5) + ':none" style="display:none;">';
        buffer += '<a class="exp_hidden" id="' + baseId + ':conditionSection:' + String(5) + ':close" href="Javascript:void(0);">';
        buffer += '詳細条件を閉じる';
        buffer += '</a>';
        buffer += '</div>';
        buffer += '</div>';
        // 詳細
        buffer += '<div id="' + baseId + ':conditionGroup:' + String(5) + '" class="exp_conditionGroup exp_clearfix" style="display:none;">';
        buffer += '<div class="exp_line exp_clearfix">';
        buffer += '<div class="exp_left"></div><div class="exp_right"></div>';
        buffer += '</div>';
        buffer += outConditionSelect("walk", "whiteSelect"); // 駅間徒歩
        buffer += outConditionSelect("useJR", "greenSelect"); // JR路線
        buffer += outConditionSelect("expressStartingStation", "whiteSelect"); // 特急始発駅
        buffer += outConditionSelect("waitAverageTime", "greenSelect"); // 出発駅乗車
        buffer += outConditionSelect("localBusOnly", "whiteSelect"); // 路線バスのみ探索
        buffer += outConditionSelect("transfer", "greenSelect"); // 乗換え
        buffer += '</div>';
        buffer += '</div>';

        // 隠しタブ
        buffer += '<div style="display:none;">';
        // 新幹線
        buffer += outConditionSelect("shinkansen");
        // 新幹線のぞみ
        buffer += outConditionSelect("shinkansenNozomi");
        // 有料特急
        buffer += outConditionSelect("limitedExpress");
        // 路線バス
        buffer += outConditionSelect("localBus");
        // 有料普通列車
        buffer += outConditionSelect("liner");
        // 深夜急行バス
        buffer += outConditionSelect("midnightBus");
        // 路線名あいまい指定
        //  buffer += outConditionSelect("fuzzyLine");
        // 経由駅指定の継承
        //  buffer += outConditionSelect("entryPathBehavior");
        buffer += '</div>';

        buffer += '</div>';
        return buffer;
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "conditionTab" && eventIdList.length == 3) {
                // タブの選択
                var tabCount = 1;
                while (document.getElementById(baseId + ":conditionTab:" + String(tabCount))) {
                    if (tabCount == parseInt(eventIdList[2])) {
                        document.getElementById(baseId + ':conditionGroup:' + String(tabCount)).style.display = "block";
                        document.getElementById(baseId + ':conditionTab:' + String(tabCount) + ':active').style.display = "block";
                        document.getElementById(baseId + ':conditionTab:' + String(tabCount) + ':none').style.display = "none";
                    } else {
                        document.getElementById(baseId + ':conditionGroup:' + String(tabCount)).style.display = "none";
                        document.getElementById(baseId + ':conditionTab:' + String(tabCount) + ':active').style.display = "none";
                        document.getElementById(baseId + ':conditionTab:' + String(tabCount) + ':none').style.display = "block";
                    }
                    tabCount++;
                }
            } else if (eventIdList[1] == "conditionOpen") {
                // 探索条件を開く
                document.getElementById(baseId + ':conditionDetail').style.display = "block";
            } else if (eventIdList[1] == "conditionClose") {
                document.getElementById(baseId + ':conditionDetail').style.display = "none";
                // 簡易設定のデフォルトも設定
                setSimpleCondition();
            } else if (eventIdList[2] == "checkbox" && eventIdList.length == 3) {
                if (document.getElementById(baseId + ':' + eventIdList[1] + ':checkbox').checked) {
                    // オンの時
                    setValue(eventIdList[1], document.getElementById(baseId + ':' + eventIdList[1] + ':checkbox').value);
                    // 追加連動処理
                    if (eventIdList[1].toLowerCase() == String("shinkansenNozomi").toLowerCase()) {
                        setValue("shinkansen", document.getElementById(baseId + ':' + 'shinkansen:checkbox').value);
                        setSimpleCondition();
                    }
                } else {
                    // オフの時
                    setValue(eventIdList[1], document.getElementById(baseId + ':' + eventIdList[1] + ':checkbox:none').value);
                    // 追加連動処理
                    if (eventIdList[1] == "shinkansen") {
                        setValue("shinkansenNozomi", document.getElementById(baseId + ':' + String('shinkansenNozomi').toLowerCase() + ':checkbox:none').value);
                        setSimpleCondition();
                    }
                }
            } else if (eventIdList[1] == "conditionSection" && eventIdList.length == 4) {
                // スマートフォン用の選択
                if (eventIdList[3] == "open") {
                    // タブを開く
                    document.getElementById(baseId + ':conditionSection:' + eventIdList[2] + ':active').style.display = "none";
                    document.getElementById(baseId + ':conditionSection:' + eventIdList[2] + ':none').style.display = "block";
                    document.getElementById(baseId + ':conditionGroup:' + eventIdList[2]).style.display = "block";
                } else if (eventIdList[3] == "close") {
                    // タブを閉じる
                    document.getElementById(baseId + ':conditionSection:' + eventIdList[2] + ':active').style.display = "block";
                    document.getElementById(baseId + ':conditionSection:' + eventIdList[2] + ':none').style.display = "none";
                    document.getElementById(baseId + ':conditionGroup:' + eventIdList[2]).style.display = "none";
                }
            } else {
                // 探索条件の変更
                if (eventIdList[1].toLowerCase() == String("shinkansen").toLowerCase()) {
                    // 新幹線
                    if (getValue("shinkansen") == "never") {
                        setValue("shinkansenNozomi", "never");
                    }
                } else if (eventIdList[1].toLowerCase() == String("shinkansenNozomi").toLowerCase()) {
                    // 新幹線
                    if (getValue("shinkansenNozomi") == "normal") {
                        setValue("shinkansen", "normal");
                    }
                } else if (eventIdList[1].toLowerCase() == String("ticketSystemType").toLowerCase()) {
                    // 乗車券計算のシステム
                    if (getValue("ticketSystemType") == "normal") {
                        setValue("preferredTicketOrder", "none");
                    }
                } else if (eventIdList[1].toLowerCase() == String("preferredTicketOrder").toLowerCase()) {
                    // 優先する乗車券の順序
                    if (getValue("preferredTicketOrder") != "none") {
                        setValue("ticketSystemType", "ic");
                    }
                } else if (eventIdList[1].toLowerCase() == String("studentDiscount").toLowerCase()) {
                    // 学割乗車券とEX予約/スマートEXは排他
                    if (getValue("studentDiscount") == "true" && getValue("JRReservation") != "none") {
                        setValue("studentDiscount", "false");
                        alert("学割乗車券とEX予約/スマートEXを同時に有効にすることはできません。")
                    }
                    // 学割乗車券と新幹線eチケットは排他
                    if (getValue("studentDiscount") == "true" && getValue("shinkansenETicket") != "none") {
                        setValue("studentDiscount", "false");
                        alert("学割乗車券と新幹線eチケットを同時に有効にすることはできません。")
                    }
                } else if (eventIdList[1].toLowerCase() == String("JRReservation").toLowerCase()) {
                    // 学割乗車券とEX予約/スマートEXは排他
                    if (getValue("JRReservation") != "none" && getValue("studentDiscount") == "true") {
                        setValue("JRReservation", "none");
                        alert("学割乗車券とEX予約/スマートEXを同時に有効にすることはできません。")
                    }
                } else if (eventIdList[1].toLowerCase() == String("shinkansenETicket").toLowerCase()) {
                    // 学割乗車券と新幹線eチケットは排他
                    if (getValue("shinkansenETicket") != "none" && getValue("studentDiscount") == "true") {
                        setValue("shinkansenETicket", "none");
                        alert("学割乗車券と新幹線eチケットを同時に有効にすることはできません。")
                    }
                }
            }
        }
    }

    /**
    * セパレータを出力
    */
    function outSeparator(id) {
        id = id.toLowerCase();
        var buffer = "";
        buffer += '<div class="exp_separator" id="' + baseId + ':' + id + ':separator"></div>';
        return buffer;
    }

    /**
    * 探索条件の項目出力
    */
    function outConditionSelect(id, classType) {
        id = id.toLowerCase();
        selectItem.push(id);
        var buffer = "";
        buffer = '<div id="' + baseId + ':' + id + ':condition" style="display:' + (conditionObject[id].visible ? 'block;' : 'none;') + '">';
        if (typeof classType == 'undefined') {
            buffer += '<dl class="exp_conditionItemList">';
        } else {
            buffer += '<dl class="exp_conditionItemList exp_' + classType + '">';
        }
        buffer += '<dt class="exp_conditionHeader" id="' + baseId + ':' + id + ':title">' + conditionObject[id].name + '</dt>';
        buffer += '<dd class="exp_conditionValue" id="' + baseId + ':' + id + ':value">';
        buffer += '<select id="' + baseId + ':' + id + '">';
        for (var i = 0; i < conditionObject[id].option.length; i++) {
            buffer += '<option value="' + conditionObject[id].value[i] + '">' + conditionObject[id].option[i] + '</option>';
        }
        buffer += '</select>';
        buffer += '</dd>';
        buffer += '</dl>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * 探索条件の項目出力
    */
    function outConditionRadio(id, classType) {
        id = id.toLowerCase();
        var buffer = "";
        buffer = '<div id="' + baseId + ':' + id + ':condition" style="display:' + (conditionObject[id].visible ? 'block;' : 'none;') + '">';
        if (typeof classType == 'undefined') {
            buffer += '<dl class="exp_conditionItemList">';
        } else {
            buffer += '<dl class="exp_conditionItemList exp_' + classType + '">';
        }
        buffer += '<dt class="exp_conditionHeader" id="' + baseId + ':' + id + ':title">' + conditionObject[id].name + '</dt>';
        if (id == "answercount" || id == "sorttype") {
            buffer += '<dd class="exp_conditionValueMulti" id="' + baseId + ':' + id + ':value">';
        } else {
            buffer += '<dd class="exp_conditionValue" id="' + baseId + ':' + id + ':value">';
        }
        buffer += '<div>';
        for (var i = 0; i < conditionObject[id].option.length; i++) {
            radioItem.push(id + ':' + (i + 1));
            
            // 改行処理
            if (i > 0) {
                if (id == "answerCount" && i % 10 == 0) { buffer += '</div><span class="exp_separator"></span><div>'; }
                if (id == "sortType" && i % 5 == 0) { buffer += '</div><span class="exp_separator"></span><div>'; }
            }
            if (i == 0) {
                buffer += '<span class="exp_conditionItemLeft">';
            } else if ((i + 1) == conditionObject[id].option.length) {
                buffer += '<span class="exp_conditionItemRight">';
            } else {
                buffer += '<span class="exp_conditionItem">';
            }
            buffer += '<input type="radio" id="' + baseId + ':' + id + ':' + String(i + 1) + '" name="' + baseId + ':' + id + '" value="' + conditionObject[id].value[i] + '"><label for="' + baseId + ':' + id + ':' + String(i + 1) + '">' + conditionObject[id].option[i] + '</label></span>';
        }
        buffer += '</div>';
        buffer += '</dd>';
        buffer += '</dl>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * 探索条件の項目出力
    */
    function outConditionCheckbox(id, value, none, label) {
        // 簡易条件のリストに入れる
        id = id.toLowerCase();
        checkboxItem.push(id);
        var buffer = "";
        buffer += '<div id="' + baseId + ':' + id + ':simple" class="exp_item" style="display:' + (conditionObject[id].visible ? 'block;' : 'none;') + '">';
        buffer += '<input type="checkbox" id="' + baseId + ':' + id + ':checkbox" value="' + value + '"><label for="' + baseId + ':' + id + ':checkbox">' + ((typeof label != 'undefined') ? label : conditionObject[id].name) + '</label>';
        if (typeof none != 'undefined') {
            buffer += '<input type="hidden" id="' + baseId + ':' + id + ':checkbox:none" value="' + none + '">';
        }
        buffer += '</div>';
        return buffer;
    }

    /**
    * ソート順の取得
    */
    function getSortType() {
        return getValue("sortType");
    }

    /**
    * 探索結果数の取得
    */
    function getAnswerCount() {
        return getValue("answerCount");
    }

    /**
    * 探索条件文字列の取得
    */
    function getConditionDetail() {
        return fixCondition();
    }

    /**
    * 片道・往復・定期のフラグ取得
    */
    function getPriceType() {
        return getValue("priceType");
    }

    /**
    * EX予約/スマートEXのインデックスの桁数変換
    */
    function getJRReservation() {      
        var selectedName = getValue("JRReservation");
        switch(selectedName) {
            case 'none':
              return [0, 0];
            case 'exYoyaku':
              return [1, 0];
            case 'exETokkyu':
              return [2, 0];
            case 'exHayatoku':
              return [3, 0];
            case 'exHayatoku21':
              return [4, 0];
            case 'exGreenHayatoku':
              return [5, 0];
            case 'smartEx':
              return [0, 1];
            case 'smartExHayatoku':
              return [0, 2];
            case 'smartExHayatoku21':
              return [0, 3];
            case 'smartExGreenHayatoku':
              return [0, 4];
            default:
              return [0, 0];
        }
    }

    /**
    * 新幹線eチケットのインデックスの桁数変換
    */
   function getShinkansenETicket() {      
    var selectedName = getValue("shinkansenETicket");
    switch(selectedName) {
        case 'none':
          return 0;
        case 'eTicket':
          return 1;
        default:
          return 0;
    }
}

    /**
    * 探索条件をフォームにセットする
    */
    function setCondition(param1, param2, priceType, condition) {
        if (isNaN(param1)) {
            // 単独で指定
            setValue(param1, String(param2));
        } else {
            // 全部指定
            // ヘッダ部分
            setValue("answerCount", String(param1));
            setValue("sortType", String(param2));
            setValue("priceType", String(priceType));
            var conditionList_t, conditionList_f, conditionList_a;
            var condition_split = condition.split(':');
            for (var i = 0; i < condition_split.length; i++) {
                if (condition_split[i].length > 0) {
                    if (condition_split[i].substring(0, 1) == "T") {
                        conditionList_t = condition_split[i].split('');
                    } else if (condition_split[i].substring(0, 1) == "F") {
                        conditionList_f = condition_split[i].split('');
                    } else if (condition_split[i].substring(0, 1) == "A") {
                        conditionList_a = condition_split[i].split('');
                    }
                }
            }
            // 探索条件(T)
            setValue("plane", parseInt(conditionList_t[1]));
            setValue("shinkansen", parseInt(conditionList_t[2]));
            setValue("shinkansenNozomi", parseInt(conditionList_t[3]));
            setValue("sleeperTrain", parseInt(conditionList_t[4]));
            setValue("limitedExpress", parseInt(conditionList_t[5]));
            setValue("highwayBus", parseInt(conditionList_t[6]));
            setValue("connectionBus", parseInt(conditionList_t[7]));
            setValue("localBus", parseInt(conditionList_t[8]));
            setValue("ship", parseInt(conditionList_t[9]));
            setValue("liner", parseInt(conditionList_t[10]));
            setValue("walk", parseInt(conditionList_t[11]));
            setValue("midnightBus", parseInt(conditionList_t[12]));
            // 13:固定
            // 探索条件(F)
            setValue("surchargeKind", parseInt(conditionList_f[1]));
            setValue("teikiKind", parseInt(conditionList_f[2]));
            setValue("JRSeasonalRate", parseInt(conditionList_f[3]));
            setValue("studentDiscount", parseInt(conditionList_f[4]));
            //  setValue("airFare",parseInt(conditionList_f[5]));(固定)
            //setValue("includeInsurance", parseInt(conditionList_f[6]));
            setValue("ticketSystemType", parseInt(conditionList_f[7]));
            setValue("nikukanteiki", parseInt(conditionList_f[8]));
            // 9:固定
            setValue("preferredTicketOrder", parseInt(conditionList_f[10]));
            if (conditionList_f.length >= 12) {
                if ( parseInt(conditionList_f[11]) > 0 ) {
                    setValue("JRReservation", 10 - parseInt(conditionList_f[11]));
                } else if ( parseInt(conditionList_f[12]) > 0 ) {
                    setValue("JRReservation", 10 - ( parseInt(conditionList_f[12]) + 5) );
                } else {
                    setValue("JRReservation", 10);
                }
            } else {
                setValue("JRReservation", 10);
            }
            setValue("shinkansenETicket", parseInt(conditionList_f[13]));
            // 探索条件(A)
            setValue("useJR", parseInt(conditionList_a[1]));
            setValue("transfer", parseInt(conditionList_a[2]));
            setValue("expressStartingStation", parseInt(conditionList_a[3]));
            setValue("waitAverageTime", parseInt(conditionList_a[4]));
            setValue("localBusOnly", parseInt(conditionList_a[5]));
            //  setValue("fuzzyLine",parseInt(conditionList_a[6]));(固定)
            setValue("transferTime", parseInt(conditionList_a[7]));
            //  setValue("entryPathBehavior",parseInt(conditionList_a[8]));(固定)
        }
        setSimpleCondition();
    }
    /**
    * フォームに値をセットする
    */
    function setValue(id, value) {
        var name = id.toLowerCase();
        if (document.getElementById(baseId + ':' + name)) {
            if (typeof document.getElementById(baseId + ':' + name).length != 'undefined') {
                // セレクトボックス
                if (value == "0") {
                    setSelect(name, "none");
                } else if (typeof value == 'number') {
                    setSelectIndex(name, value);
                } else {
                    setSelect(name, value);
                }
                return;
            }
        }
        // ラジオボタン
        if (value == "0") {
            setRadio(name, "none");
        } else if (typeof value == 'number') {
            setRadioIndex(name, value);
        } else {
            setRadio(name, value);
        }
    }

    /**
    * ラジオボタンをインデックスで指定する
    */
    function setRadioIndex(name, value) {
        document.getElementsByName(baseId + ':' + name)[(document.getElementsByName(baseId + ':' + name).length - value)].checked = true;
    }
    /**
    * ラジオボタンを値で指定する
    */
    function setRadio(name, value) {
        for (var i = 0; i < document.getElementsByName(baseId + ':' + name).length; i++) {
            if (document.getElementsByName(baseId + ':' + name)[i].value == String(value)) {
                document.getElementsByName(baseId + ':' + name)[i].checked = true;
            }
        }
    }

    /**
    * セレクトボックスをインデックスで指定する
    */
    function setSelectIndex(name, value) {
        document.getElementById(baseId + ':' + name).selectedIndex = (document.getElementById(baseId + ':' + name).options.length - value);
    }

    /**
    * セレクトボックスを値で指定する
    */
    function setSelect(name, value) {
        for (var i = 0; i < document.getElementById(baseId + ':' + name).options.length; i++) {
            if (document.getElementById(baseId + ':' + name)[i].value == String(value)) {
                document.getElementById(baseId + ':' + name).selectedIndex = i;
                return;
            }
        }
    }
    
    /**
    * 探索条件の確定
    */
    function fixCondition() {
        var conditionList_t = def_condition_t.split('');
        // 探索条件(T)
        conditionList_t[1] = getValueIndex("plane", parseInt(conditionList_t[1]));
        conditionList_t[2] = getValueIndex("shinkansen", parseInt(conditionList_t[2]));
        conditionList_t[3] = getValueIndex("shinkansenNozomi", parseInt(conditionList_t[3]));
        conditionList_t[4] = getValueIndex("sleeperTrain", parseInt(conditionList_t[4]));
        conditionList_t[5] = getValueIndex("limitedExpress", parseInt(conditionList_t[5]));
        conditionList_t[6] = getValueIndex("highwayBus", parseInt(conditionList_t[6]));
        conditionList_t[7] = getValueIndex("connectionBus", parseInt(conditionList_t[7]));
        conditionList_t[8] = getValueIndex("localBus", parseInt(conditionList_t[8]));
        conditionList_t[9] = getValueIndex("ship", parseInt(conditionList_t[9]));
        conditionList_t[10] = getValueIndex("liner", parseInt(conditionList_t[10]));
        conditionList_t[11] = getValueIndex("walk", parseInt(conditionList_t[11]));
        conditionList_t[12] = getValueIndex("midnightBus", parseInt(conditionList_t[12]));
        // 13:固定
        // 探索条件(F)
        var conditionList_f = def_condition_f.split('');
        conditionList_f[1] = getValueIndex("surchargeKind", parseInt(conditionList_f[1]));
        conditionList_f[2] = getInputValue("teikiKind");
        conditionList_f[3] = getValueIndex("JRSeasonalRate", parseInt(conditionList_f[3]));
        conditionList_f[4] = getValueIndex("studentDiscount", parseInt(conditionList_f[4]));
        // conditionList_f[5] = getValueIndex("airFare",parseInt(conditionList_f[5]));
        // conditionList_f[6] = getValueIndex("includeInsurance", parseInt(conditionList_f[6]));
        conditionList_f[7] = getValueIndex("ticketSystemType", parseInt(conditionList_f[7]));
        conditionList_f[8] = getValueIndex("nikukanteiki", parseInt(conditionList_f[8]));
        // 9:固定
        conditionList_f[10] = getValueIndex("preferredTicketOrder", parseInt(conditionList_f[10]));
        conditionList_f[11] = getJRReservation()[0];
        conditionList_f[12] = getJRReservation()[1];
        conditionList_f[13] = getShinkansenETicket();
        // 探索条件(A)
        var conditionList_a = def_condition_a.split('');
        conditionList_a[1] = getValueIndex("useJR", parseInt(conditionList_a[1]));
        conditionList_a[2] = getValueIndex("transfer", parseInt(conditionList_a[2]));
        conditionList_a[3] = getValueIndex("expressStartingStation", parseInt(conditionList_a[3]));
        conditionList_a[4] = getValueIndex("waitAverageTime", parseInt(conditionList_a[4]));
        conditionList_a[5] = getValueIndex("localBusOnly", parseInt(conditionList_a[5]));
        //  conditionList_a[6] = getValueIndex("fuzzyLine",parseInt(conditionList_a[6]));
        conditionList_a[7] = getValueIndex("transferTime", parseInt(conditionList_a[7]));
        //  conditionList_a[8] = getValueIndex("entryPathBehavior",parseInt(conditionList_a[8]));

        // 設定値
        var tmpCondition = conditionList_t.join('') + ":" + conditionList_f.join('') + ":" + conditionList_a.join('') + ":";
        return tmpCondition;
    }

    /**
    * 詳細探索条件のオープン
    */
    function openConditionDetail() {
        document.getElementById(baseId + ':conditionDetail').style.display = "block";
    }

    /**
    * フォームの値を取得する
    */
    function getValue(id) {
        var name = id.toLowerCase();
        if (document.getElementById(baseId + ':' + name)) {
            if (typeof document.getElementById(baseId + ':' + name).length != 'undefined') {
                // セレクトボックス
                return getSelect(name);
            } else {
                // ラジオボタン
                return getRadio(name);
            }
        } else {
            // ラジオボタン
            return getRadio(name);
        }
    }
    /**
    * ラジオボタンの値を取得
    */
    function getRadio(name) {
        for (var i = 0; i < document.getElementsByName(baseId + ':' + name).length; i++) {
            if (document.getElementsByName(baseId + ':' + name)[i].checked == true) {
                return document.getElementsByName(baseId + ':' + name)[i].value;
            }
        }
        return null;
    }
    /**
    * セレクトボックスの値を取得
    */
    function getSelect(name) {
        return document.getElementById(baseId + ':' + name).options.item(document.getElementById(baseId + ':' + name).selectedIndex).value;
    }

    /**
    * フォームのインデックスを取得する
    */
    function getValueIndex(id) {
        var name = id.toLowerCase();
        if (getValue(id) == "none") {
            return 0;
        } else {
            if (document.getElementById(baseId + ':' + name)) {
                if (typeof document.getElementById(baseId + ':' + name).length != 'undefined') {
                    // セレクトボックス
                    return getSelectIndex(name);
                }
            }
            // ラジオボタン
            return getRadioIndex(name);
        }
    }
    /**
    * ラジオボタンのインデックスを取得
    */
    function getRadioIndex(name) {
        var index = document.getElementsByName(baseId + ':' + name).length;
        for (var i = 0; i < document.getElementsByName(baseId + ':' + name).length; i++) {
            if (document.getElementsByName(baseId + ':' + name)[i].checked) {
                return (index - i);
            }
        }
    }
    /**
    * セレクトボックスのインデックスを取得
    */
    function getSelectIndex(name) {
        return (document.getElementById(baseId + ':' + name).options.length - document.getElementById(baseId + ':' + name).selectedIndex)
    }
    
    /**
    * 名称から選択または、クリックされているvalueを取得します。
    */
    function getInputValue(name){
        name = name.toLowerCase();
        if (document.getElementById(baseId + ':' + name)) {
            if (typeof document.getElementById(baseId + ':' + name).length != 'undefined') {
              // セレクトボックス
              var index = document.getElementById(baseId + ':' + name).selectedIndex;
              var api_id = document.getElementById(baseId + ':' + name).options[index].value;
              return api_id;
            }
        }
        // ラジオボタン
        var index = document.getElementsByName(baseId + ':' + name).length;
        for (var i = 0; i < index; i++) {
            if (document.getElementsByName(baseId + ':' + name)[i].checked) {
                var api_id = document.getElementsByName(baseId + ':' + name)[i].value;
                return api_id;
            }
        }
    }
    /**
    * デフォルトを設定
    */
    function resetCondition() {
        var def_condition = def_condition_t + ":" + def_condition_f + ":" + def_condition_a + ":";
        setCondition(def_answerCount, def_sortType, def_priceType, def_condition);
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (name.toLowerCase() == String("agent").toLowerCase()) {
            agent = value;
        } else if (name.toLowerCase() == String("conditionDetailButton").toLowerCase()) {
            //詳細設定ボタンを切り替え
            if (String(value).toLowerCase() == "visible") {
                document.getElementById(baseId + ':conditionOpenButton').style.display = "block";
            } else if (String(value).toLowerCase() == "hidden") {
                document.getElementById(baseId + ':conditionOpenButton').style.display = "none";
            }
        } else if (name.toLowerCase() == String("simpleCondition").toLowerCase()) {
            //探索条件を簡易指定にする
            checkBoxItemName = value;
        } else if (String(value).toLowerCase() == "visible") {
            // 探索条件の表示
            setConditionView(name, true);
            if (document.getElementById(baseId + ':' + name.toLowerCase() + ':simple')) {
                document.getElementById(baseId + ':' + name.toLowerCase() + ':simple').style.display = "block";
            }
        } else if (String(value).toLowerCase() == "hidden") {
            // 探索条件の非表示
            setConditionView(name, false);
            if (document.getElementById(baseId + ':' + name.toLowerCase() + ':simple')) {
                document.getElementById(baseId + ':' + name.toLowerCase() + ':simple').style.display = "none";
            }
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    /**
    * 探索条件の表示切り替え
    */
    function setConditionView(name, display) {
        conditionObject[name.toLowerCase()].visible = display;
        if (document.getElementById(baseId + ':' + name.toLowerCase() + ':separator')) {
            document.getElementById(baseId + ':' + name.toLowerCase() + ':separator').style.display = display ? "block" : "none";
        }
        if (document.getElementById(baseId + ':' + name.toLowerCase() + ':condition')) {
            document.getElementById(baseId + ':' + name.toLowerCase() + ':condition').style.display = display ? "block" : "none";
        }
    }

    /**
    * 探索条件を取得
    */
    function getCondition(id) {
        return getValue(id.toLowerCase());
    }

    /**
    * 簡易探索条件を取得
    */
    function getConditionLight(id) {
        if (getValue(id.toLowerCase()) == "normal") {
            return true;
        } else {
            return false;
        }
    }

    // 外部参照可能な関数リスト
    this.dispCondition = dispCondition;
    this.dispConditionSimple = dispConditionSimple;
    this.dispConditionLight = dispConditionLight;
    this.getPriceType = getPriceType;
    this.getConditionDetail = getConditionDetail;
    this.getAnswerCount = getAnswerCount;
    this.getSortType = getSortType;
    this.getCondition = getCondition;
    this.getConditionLight = getConditionLight;
    this.setCondition = setCondition;
    this.openConditionDetail = openConditionDetail;
    this.resetCondition = resetCondition;
    this.setConfigure = setConfigure;

    // 定数リスト
    this.SORT_EKISPERT = "ekispert";
    this.SORT_PRICE = "price";
    this.SORT_TIME = "time";
    this.SORT_TEIKI = "teiki";
    this.SORT_TRANSFER = "transfer";
    this.SORT_CO2 = "co2";
    this.SORT_TEIKI1 = "teiki1";
    this.SORT_TEIKI3 = "teiki3";
    this.SORT_TEIKI6 = "teiki6";
    this.PRICE_ONEWAY = "oneway";
    this.PRICE_ROUND = "round";
    this.PRICE_TEIKI = "teiki";

    this.CONDITON_ANSWERCOUNT = "answerCount";
    this.CONDITON_SORTTYPE = "sortType";
    this.CONDITON_PRICETYPE = "priceType";
    this.CONDITON_PLANE = "plane";
    this.CONDITON_SHINKANSEN = "shinkansen";
    this.CONDITON_SHINKANSENNOZOMI = "shinkansenNozomi";
    this.CONDITON_SLEEPERTRAIN = "sleeperTrain";
    this.CONDITON_LIMITEDEXPRESS = "limitedExpress";
    this.CONDITON_HIGHWAYBUS = "highwayBus";
    this.CONDITON_CONNECTIONBUS = "connectionBus";
    this.CONDITON_LOCALBUS = "localBus";
    this.CONDITON_SHIP = "ship";
    this.CONDITON_LINER = "liner";
    this.CONDITON_WALK = "walk";
    this.CONDITON_MIDNIGHTBUS = "midnightBus";
    this.CONDITON_SURCHARGEKIND = "surchargeKind";
    this.CONDITON_TEIKIKIND = "teikiKind";
    this.CONDITON_JRSEASONALRATE = "JRSeasonalRate";
    this.CONDITON_STUDENTDISCOUNT = "studentDiscount";
    //this.CONDITON_AIRFARE = "airFare";
    //this.CONDITON_INCLUDEINSURANCE = "includeInsurance";
    this.CONDITON_TICKETSYSTEMTYPE = "ticketSystemType";
    this.CONDITON_NIKUKANTEIKI = "nikukanteiki";
    this.CONDITON_USEJR = "useJR";
    this.CONDITON_TRANSFER = "transfer";
    this.CONDITON_EXPRESSSTARTINGSTATION = "expressStartingStation";
    this.CONDITON_WAITAVERAGETIME = "waitAverageTime";
    this.CONDITON_LOCALBUSONLY = "localBusOnly";
    //this.CONDITON_FUZZYLINE = "fuzzyLine";
    this.CONDITON_TRANSFERTIME = "transferTime";
    //this.CONDITON_ENTRYPATHBEHAVIOR = "entryPathBehavior";
    this.CONDITON_PREFERREDTICKETORDER = "preferredTicketOrder";

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
