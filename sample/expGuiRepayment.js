/**
 *  駅すぱあと Web サービス
 *  定期払戻計算パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiRepayment = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiRepayment\.js"));
        if (s.src && s.src.match(/expGuiRepayment\.js(\?.*)?/)) {
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
    var repaymentData;
    var routeList;
    var repaymentList; // 定期払い戻し計算結果
    var separatorList;
    var separatorChangeableList;
    var calculateTargetList;
    var httpObj; // 定期払い戻し計算のリクエストオブジェクト

    var callBackFunction;
    var callBackFunctionAction;

    /**
    * 払い戻し計算の設置
    */
    function dispRepayment(param, callback) {
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiRepayment expGuiRepaymentPc" id="' + baseId + ':repayment" style="display:none;"></div>';
        } else if (agent == 2) {
            buffer = '<div class="expGuiRepayment expGuiRepaymentPhone" id="' + baseId + ':repayment" style="display:none;"></div>';
        } else if (agent == 3) {
            buffer = '<div class="expGuiRepayment expGuiRepaymentTablet" id="' + baseId + ':repayment" style="display:none;"></div>';
        }
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // コールバック
        callbackFunction = callback;
        // シリアライズ等
        repaymentData = param;
        // 変数初期化
        separatorList = new Array();
        // 計算開始
        calcRepayment(true);
    }

    /**
    * 計算開始処理（再計算も含む）
    */
    function calcRepayment(initFlag) {
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //読み込み中
        if (initFlag) {
            document.getElementById(baseId + ':repayment').innerHTML = '<div class="expLoading"><div class="expText">計算中...</div></div>';
            document.getElementById(baseId + ':repayment').style.display = "block";
        }
        var url = apiURL + "v1/json/course/repayment?key=" + key;
        if (typeof repaymentData == "string") {
            url += "&" + repaymentData;
        } else {
            //オブジェクト解析
            if (typeof repaymentData.getSerializeData() != 'undefined') {
                url += "&serializeData=" + repaymentData.getSerializeData();
            }
            if (typeof repaymentData.getStartDate() != 'undefined') {
                url += "&startDate=" + repaymentData.getStartDate();
            }
            if (typeof repaymentData.getBuyDate() != 'undefined') {
                url += "&buyDate=" + repaymentData.getBuyDate();
            }
            if (typeof repaymentData.getRepaymentDate() != 'undefined') {
                url += "&repaymentDate=" + repaymentData.getRepaymentDate();
            }
            if (typeof repaymentData.getValidityPeriod() != 'undefined') {
                url += "&validityPeriod=" + repaymentData.getValidityPeriod();
            }
            if (typeof repaymentData.getChangeSection() != 'undefined') {
                url += "&changeSection=" + repaymentData.getChangeSection();
            }
        }
        if (separatorList.length >= 1) {
            var separator = "";
            for (var i = 0; i < separatorList.length; i++) {
                if (separatorList[i]) {
                    if (separator != "") { separator += ":"; }
                    separator += String(i + 1) + ",true";
                }
            }
            if (separator != "") {
                url += "&separator=" + separator;
            }
        }
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                outRepayment(JSON_object);
            };
            httpObj.onerror = function () {
                // エラー時の処理
                if (typeof callbackFunction == 'function') {
                    callbackFunction(false);
                }
                if (typeof callBackFunctionAction == 'function') {
                    callBackFunctionAction(false);
                }
            };
        } else {
            httpObj = new XMLHttpRequest();
            httpObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (httpObj.readyState == done && httpObj.status == ok) {
                    JSON_object = JSON.parse(httpObj.responseText);
                    outRepayment(JSON_object);
                } else if (httpObj.readyState == done && httpObj.status != ok) {
                    // エラー時の処理
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(false);
                    }
                    if (typeof callBackFunctionAction == 'function') {
                        callBackFunctionAction(false);
                    }
                }
            };
        }
        httpObj.open("GET", url, true);
        httpObj.send(null);
    }

    /**
    * 定期券払い戻し計算のオブジェクトを作成
    */
    function setRepaymentObject(buyDate, repaymentDate, startDate, tmpRepayment) {
        var tmpRepaymentObject = new Object();
        // 情報
        tmpRepaymentObject.buyDate = buyDate;
        tmpRepaymentObject.repaymentDate = repaymentDate;
        tmpRepaymentObject.startDate = startDate;
        // 区間のインデックス
        tmpRepaymentObject.fromTeikiRouteSectionIndex = parseInt(tmpRepayment.fromTeikiRouteSectionIndex);
        tmpRepaymentObject.toTeikiRouteSectionIndex = parseInt(tmpRepayment.toTeikiRouteSectionIndex);
        // 金額
        tmpRepaymentObject.payPriceValue = parseInt(tmpRepayment.payPriceValue);
        tmpRepaymentObject.usedPriceValue = parseInt(tmpRepayment.usedPriceValue);
        tmpRepaymentObject.feePriceValue = parseInt(tmpRepayment.feePriceValue);
        tmpRepaymentObject.repayPriceValue = parseInt(tmpRepayment.repayPriceValue);
        tmpRepaymentObject.calculateTarget = (tmpRepayment.calculateTarget.toLowerCase() == "true" ? true : false);
        tmpRepaymentObject.state = parseInt(tmpRepayment.state);
        return tmpRepaymentObject;
    }

    /**
    * 払い戻しデータのインデックスを取得
    */
    function getRepaymentIndex(index) {
        if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket == 'undefined') {
            return -1;
        } else if (typeof repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length == 'undefined') {
            if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket.fromTeikiRouteSectionIndex == index) {
                return 0;
            } else if (index > repaymentObject.ResultSet.RepaymentList.RepaymentTicket.fromTeikiRouteSectionIndex && index <= repaymentObject.ResultSet.RepaymentList.RepaymentTicket.toTeikiRouteSectionIndex) {
                return -1;
            }
        } else {
            for (var i = 0; i < repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length; i++) {
                if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].fromTeikiRouteSectionIndex == index) {
                    return i;
                } else if (index > repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].fromTeikiRouteSectionIndex && index <= repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].toTeikiRouteSectionIndex) {
                    return -1;
                }
            }
        }
        return -1;
    }

    /**
    * 表示のための定期券の払い戻しデータを取得
    */
    function getRepaymentObject(index) {
        var tmpRepayment;
        if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket == 'undefined') {
            return -1;
        } else if (typeof repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length == 'undefined') {
            if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket.fromTeikiRouteSectionIndex == index) {
                return repaymentObject.ResultSet.RepaymentList.RepaymentTicket;
            } else if (index > repaymentObject.ResultSet.RepaymentList.RepaymentTicket.fromTeikiRouteSectionIndex && index <= repaymentObject.ResultSet.RepaymentList.RepaymentTicket.toTeikiRouteSectionIndex) {
                return 0;
            }
        } else {
            for (var i = 0; i < repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length; i++) {
                if (repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].fromTeikiRouteSectionIndex == index) {
                    return repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i];
                } else if (index > repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].fromTeikiRouteSectionIndex && index <= repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].toTeikiRouteSectionIndex) {
                    return 0;
                }
            }
        }
        return -1;
    }

    /**
    * 区間情報
    */
    function setRouteSection(tmpTeikiRouteSection) {
        var tmpRoute = new Object();
        tmpRoute.index = parseInt(tmpTeikiRouteSection.index);
        tmpRoute.repaymentTicketIndex = parseInt(tmpTeikiRouteSection.repaymentTicketIndex);
        tmpRoute.from = setPointObject(tmpTeikiRouteSection.Point[0]);
        tmpRoute.to = setPointObject(tmpTeikiRouteSection.Point[1]);
        return tmpRoute;
    }

    /**
    * 地点オブジェクトを取得
    */
    function setPointObject(tmpPoint) {
        var tmp_station = new Object();
        tmp_station.name = tmpPoint.Station.Name;
        tmp_station.code = tmpPoint.Station.code;
        tmp_station.yomi = tmpPoint.Station.Yomi;
        if (typeof tmpPoint.Station.Type.text != 'undefined') {
            tmp_station.type = tmpPoint.Station.Type.text;
            if (typeof tmpPoint.Station.Type.detail != 'undefined') {
                tmp_station.type_detail = tmpPoint.Station.Type.text + "." + tmpPoint.Station.Type.detail;
            }
        } else {
            tmp_station.type = tmpPoint.Station.Type;
        }
        //県コード
        if (typeof tmpPoint.Prefecture != 'undefined') {
            tmp_station.kenCode = parseInt(tmpPoint.Prefecture.code);
        }
        return tmp_station;
    }

    /**
    * 払い戻し計算の出力
    */
    function outRepayment(json) {
        var repaymentObject = json;
        routeList = new Array();
        repaymentList = new Array();
        separatorList = new Array();
        calculateTargetList = new Array();
        separatorChangeableList = new Array();
        if (typeof repaymentObject.ResultSet.RepaymentList != 'undefined') {
            // 区間リストを設定
            if (typeof repaymentObject.ResultSet.TeikiRoute.TeikiRouteSection != 'undefined') {
                if (typeof repaymentObject.ResultSet.TeikiRoute.TeikiRouteSection.length == 'undefined') {
                    // 単一
                    routeList.push(setRouteSection(repaymentObject.ResultSet.TeikiRoute.TeikiRouteSection));
                } else {
                    // 複数
                    for (var i = 0; i < repaymentObject.ResultSet.TeikiRoute.TeikiRouteSection.length; i++) {
                        routeList.push(setRouteSection(repaymentObject.ResultSet.TeikiRoute.TeikiRouteSection[i]));
                    }
                }
            }
            // 払戻対象の設定&計算結果
            if (typeof repaymentObject.ResultSet.RepaymentList.RepaymentTicket != 'undefined') {
                if (typeof repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length == 'undefined') {
                    // 単一
                    calculateTargetList.push((repaymentObject.ResultSet.RepaymentList.RepaymentTicket.calculateTarget.toLowerCase() == "true" ? true : false));
                    repaymentList.push(setRepaymentObject(repaymentObject.ResultSet.RepaymentList.buyDate, repaymentObject.ResultSet.RepaymentList.repaymentDate, repaymentObject.ResultSet.RepaymentList.startDate, repaymentObject.ResultSet.RepaymentList.RepaymentTicket));
                } else {
                    // 複数
                    for (var i = 0; i < repaymentObject.ResultSet.RepaymentList.RepaymentTicket.length; i++) {
                        calculateTargetList.push((repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i].calculateTarget.toLowerCase() == "true" ? true : false));
                        repaymentList.push(setRepaymentObject(repaymentObject.ResultSet.RepaymentList.buyDate, repaymentObject.ResultSet.RepaymentList.repaymentDate, repaymentObject.ResultSet.RepaymentList.startDate, repaymentObject.ResultSet.RepaymentList.RepaymentTicket[i]));
                    }
                }
            }
            // セパレータの設定
            if (typeof repaymentObject.ResultSet.TeikiRoute.SectionSeparator != 'undefined') {
                if (typeof repaymentObject.ResultSet.TeikiRoute.SectionSeparator.length == 'undefined') {
                    // 単一
                    separatorList.push((repaymentObject.ResultSet.TeikiRoute.SectionSeparator.divided.toLowerCase() == "true" ? true : false));
                    separatorChangeableList.push((repaymentObject.ResultSet.TeikiRoute.SectionSeparator.changeable.toLowerCase() == "true" ? true : false));
                } else {
                    // 複数
                    for (var i = 0; i < repaymentObject.ResultSet.TeikiRoute.SectionSeparator.length; i++) {
                        separatorList.push((repaymentObject.ResultSet.TeikiRoute.SectionSeparator[i].divided.toLowerCase() == "true" ? true : false));
                        separatorChangeableList.push((repaymentObject.ResultSet.TeikiRoute.SectionSeparator[i].changeable.toLowerCase() == "true" ? true : false));
                    }
                }
            }
        }
        viewRepayment();
        // コールバック
        if (typeof callbackFunction == 'function') {
            callbackFunction(true);
        }
        if (typeof callBackFunctionAction == 'function') {
            callBackFunctionAction(true);
        }
    }

    /**
    * 払い戻しテーブルの出力
    */
    function viewRepayment() {
        var buffer = '';
        // 払い戻し区間が複数
        if (routeList.length >= 2) {
            buffer += '<div class="exp_routeList exp_clearfix">';
            buffer += '<a id="' + baseId + ':routeList"></a>';
            for (var i = 0; i < routeList.length; i++) {
                if (i == 0) {
                    // 最初
                    buffer += getRoute((i + 1), routeList[i], true, separatorList[i]);
                } else if ((i + 1) == routeList.length) {
                    // 最後
                    buffer += getRoute((i + 1), routeList[i], separatorList[i - 1], true);
                } else {
                    buffer += getRoute((i + 1), routeList[i], separatorList[i - 1], separatorList[i]);
                }
                // 分割用のハサミ
                buffer += '<div class="exp_separator">';
                if ((i + 1) != routeList.length) {
                    buffer += '<div class="exp_cut">';
                    if (separatorChangeableList[i]) {
                        if (separatorList[i]) {
                            buffer += '<a class="exp_close" id="' + baseId + ':separator:' + String(i + 1) + '" href="Javascript:void(0);"></a>';
                        } else {
                            buffer += '<a class="exp_open" id="' + baseId + ':separator:' + String(i + 1) + '" href="Javascript:void(0);"></a>';
                        }
                    } else {
                        if (separatorList[i]) {
                            buffer += '<span class="exp_closeDisable"></span>';
                        } else {
                            buffer += '<span class="exp_openDisable"></span>';
                        }
                    }
                    buffer += '</div>';
                }
                buffer += '</div>';
            }
            buffer += '<div class="exp_clear">&nbsp;</div>';
            buffer += '</div>';
        }

        // 払い戻し区間表示
        buffer += '<div class="exp_repaymentList">';
        for (var i = 0; i < repaymentList.length; i++) {
            buffer += outRepaymentPrice(i, repaymentList[i], calculateTargetList[i]);
        }

        // 払い戻し金額
        if (repaymentList.length >= 2) {
            buffer += '<div class="exp_total exp_clearfix">';
            buffer += '<div class="exp_header">合計</div>';
            buffer += '<div class="exp_repay">';
            buffer += '<span class="exp_title">払戻金額</span><span class="exp_value">' + (getRepayPrice() > 0 ? num2String(getRepayPrice()) : "-----") + '</span>円';
            buffer += '</div>';
            buffer += '<div class="exp_ticketCount">';
            buffer += '<span class="exp_title">定期枚数</span><span class="exp_value">' + (getRepayCount() > 0 ? getRepayCount() : "-----") + '</span>枚';
            buffer += '</div>';
            buffer += '</div>';
            if (agent == 2) {
                // 戻るボタン
                buffer += '<div class="exp_return">';
                buffer += '<a class="exp_link" id="' + baseId + ':routeList:total" href="Javascript:void(0);">一覧に戻る</a>';
                buffer += '</div>';
            }
        }
        buffer += '<div class="exp_clear">&nbsp;</div>';
        buffer += '</div>';

        document.getElementById(baseId + ':repayment').innerHTML = buffer;
        document.getElementById(baseId + ':repayment').style.display = "block";
        // イベント設置
        for (var i = 0; i < routeList.length; i++) {
            addEvent(document.getElementById(baseId + ":route:" + String(i + 1)), "click", onEvent);
        }
        for (var i = 0; i < calculateTargetList.length; i++) {
            addEvent(document.getElementById(baseId + ":section:" + String(i + 1)), "click", onEvent);
            addEvent(document.getElementById(baseId + ":routeList:" + String(i + 1)), "click", onEvent);
        }
        for (var i = 0; i < separatorList.length; i++) {
            addEvent(document.getElementById(baseId + ":separator:" + String(i + 1)), "click", onEvent);
        }
        addEvent(document.getElementById(baseId + ":routeList:total"), "click", onEvent);
    }

    /**
    * 経路リストの出力
    */
    function getRoute(index, routeObject, top, bottom) {
        var buffer = "";
        buffer += '<div class="exp_section exp_clearfix exp_' + (top ? "section_top_cut" : "section_top_connect") + ' exp_' + (bottom ? "section_bottom_cut" : "section_bottom_connect") + '">';
        buffer += '<a class="exp_link" id="' + baseId + ':route:' + String(index) + '" href="Javascript:void(0);">';
        buffer += '<div class="exp_from" id="' + baseId + ':route:' + String(index) + ':from">' + routeObject.from.name + '</div>';
        buffer += '<div class="exp_cursor" id="' + baseId + ':route:' + String(index) + ':cursor"></div>';
        buffer += '<div class="exp_to" id="' + baseId + ':route:' + String(index) + ':to">' + routeObject.to.name + '</div>';
        buffer += '</a>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * 払戻金額をintで取得
    */
    function getRepayPrice() {
        if (typeof repaymentList != 'undefined') {
            var price = 0;
            if (repaymentList.length > 0) {
                // 払戻対象の設定
                for (var i = 0; i < repaymentList.length; i++) {
                    if (calculateTargetList[i]) {
                        price += parseInt(repaymentList[i].repayPriceValue);
                    }
                }
            }
            return price;
        }
    }

    /**
    * 払戻枚数をintで取得
    */
    function getRepayCount() {
        if (typeof repaymentList != 'undefined') {
            var count = 0;
            if (repaymentList.length > 0) {
                // 払戻対象の設定
                for (var i = 0; i < repaymentList.length; i++) {
                    if (calculateTargetList[i]) {
                        count++;
                    }
                }
            }
            return count;
        }
    }

    /**
    * 払い戻し計算の詳細取得
    */
    function getRepayObject(index) {
        if (typeof repaymentList != 'undefined') {
            var count = 0;
            // 払戻対象の設定
            for (var i = 0; i < repaymentList.length; i++) {
                if (calculateTargetList[i]) {
                    count++;
                    if (parseInt(index) == count) {
                        var tmp_repayObject = new Object();
                        tmp_repayObject.from = routeList[repaymentList[i].fromTeikiRouteSectionIndex - 1].from.name;
                        tmp_repayObject.to = routeList[repaymentList[i].toTeikiRouteSectionIndex - 1].to.name;
                        tmp_repayObject.payPrice = repaymentList[i].payPriceValue;
                        tmp_repayObject.usedPrice = repaymentList[i].usedPriceValue;
                        tmp_repayObject.feePrice = repaymentList[i].feePriceValue;
                        tmp_repayObject.repayPrice = repaymentList[i].repayPriceValue;
                        tmp_repayObject.validityPeriod = repaymentList[i].validityPeriod;
                        tmp_repayObject.state = repaymentList[i].state;
                        return tmp_repayObject;
                    }
                }
            }
        }
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
        if (typeof routeList != 'undefined') {
            for (var i = 0; i < routeList.length; i++) {
                if (isNaN(station)) {
                    if (routeList[i].from.name == station) {
                        return clone(routeList[i].from);
                    } else if (routeList[i].to.name == station) {
                        return clone(routeList[i].to);
                    }
                } else {
                    if (routeList[i].from.code == station) {
                        return clone(routeList[i].from);
                    } else if (routeList[i].to.code == station) {
                        return clone(routeList[i].to);
                    }
                }
            }
        }
    }

    /**outRepaymentPrice
    * 払戻金額のテーブル出力
    */
    function outRepaymentPrice(n, tmpRepayment, calculateTarget) {
        var buffer = '';
        if (agent == 2) {
            buffer += '<a id="' + baseId + ':repaymentData:' + String(n) + '"></a>';
        }
        buffer += '<div class="exp_repayment exp_clearfix exp_' + (calculateTarget ? "active" : "passive") + ' exp_' + (n % 2 == 1 ? "odd" : "even") + '">';
        // チェック
        if (tmpRepayment.calculateTarget) {
            if (calculateTarget) {
                buffer += '<div class="exp_checked">';
            } else {
                buffer += '<div class="exp_noCheck">';
            }
            buffer += '<a id="' + baseId + ':section:' + String(n + 1) + '" href="Javascript:void(0);"></a>';
            buffer += '</div>';
        } else {
            buffer += '<div class="exp_passive"></div>';
        }
        // 区間
        buffer += '<div class="exp_route">';
        buffer += '<div class="exp_from">' + routeList[tmpRepayment.fromTeikiRouteSectionIndex - 1].from.name + '</div>';
        buffer += '<div class="exp_cursor"></div>';
        buffer += '<div class="exp_to">' + routeList[tmpRepayment.toTeikiRouteSectionIndex - 1].to.name + '</div>';
        buffer += '</div>';

        // 払い戻し金額
        if (tmpRepayment.calculateTarget && calculateTarget) {
            buffer += '<div class="exp_price">';
        } else {
            buffer += '<div class="exp_priceDisable">';
        }
        buffer += '<div class="exp_summary">';
        buffer += '<span class="exp_title">払戻金額</span><span class="exp_value">' + (calculateTarget ? num2String(tmpRepayment.repayPriceValue) : "-----") + '</span>円';
        buffer += '</div>';
        if (calculateTarget) {
            // セパレータ
            buffer += '<div class="exp_separator"></div>';
            // 詳細金額
            buffer += '<div class="exp_priceDetailList">';
            buffer += '<div class="exp_priceDetail">';
            buffer += '<span class="exp_title">購入金額</span><span class="exp_value">' + (calculateTarget ? num2String(tmpRepayment.payPriceValue) : "-----") + '</span>円';
            buffer += '</div>';
            buffer += '<div class="exp_priceDetail">';
            buffer += '<span class="exp_title">使用済金額</span><span class="exp_value">' + (calculateTarget ? num2String(tmpRepayment.usedPriceValue) : "-----") + '</span>円';
            buffer += '</div>';
            buffer += '<div class="exp_priceDetail">';
            buffer += '<span class="exp_title">手数料</span><span class="exp_value">' + (calculateTarget ? num2String(tmpRepayment.feePriceValue) : "---") + '</span>円';
            buffer += '</div>';
            buffer += '</div>';
        }
        buffer += '</div>';
        buffer += '<div class="exp_clear">&nbsp;</div>';
        buffer += '</div>';
        if (agent == 2) {
            // 戻るボタン
            buffer += '<div class="exp_return">';
            buffer += '<a class="exp_link" id="' + baseId + ':routeList:' + String(n + 1) + '" href="Javascript:void(0);">一覧に戻る</a>';
            buffer += '</div>';
        }
        return buffer;
    }

    /**
    * カンマ区切りの数値を出力
    */
    function num2String(str) {
        var num = new String(str).replace(/,/g, "");
        while (num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
        return num;
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "section" && eventIdList.length == 3) {
                // 計算対象
                calculateTargetList[parseInt(eventIdList[2]) - 1] = !calculateTargetList[parseInt(eventIdList[2]) - 1];
                viewRepayment();
                if (typeof callBackFunctionAction == 'function') {
                    callBackFunctionAction(true);
                }
            } else if ((eventIdList[1] == "separator" || eventIdList[1] == "separator_img") && eventIdList.length == 3) {
                // 区間のセパレータ
                separatorList[parseInt(eventIdList[2]) - 1] = !separatorList[parseInt(eventIdList[2]) - 1];
                calcRepayment(false);
            } else if (eventIdList[1] == "route" && eventIdList.length >= 3) {
                for (var i = 0; i < repaymentList.length; i++) {
                    if (parseInt(eventIdList[2]) >= repaymentList[i].fromTeikiRouteSectionIndex && parseInt(eventIdList[2]) <= repaymentList[i].toTeikiRouteSectionIndex) {
                        location.href = "#" + baseId + ":repaymentData:" + String(i);
                    }
                }
            } else if (eventIdList[1] == "routeList" && eventIdList.length >= 3) {
                location.href = "#" + baseId + ":routeList";
            }
        }
    }

    /**
    * コールバック関数の定義
    */
    function bind(type, func) {
        if (type == 'change' && typeof func == 'function') {
            callBackFunctionAction = func;
        }
    }

    /**
    * コールバック関数の解除
    */
    function unbind(type) {
        if (type == 'change') {
            callBackFunctionAction = undefined;
        }
    }

    /**
    * 定期払い戻しオブジェクト作成
    */
    function createRepaymentInterface() {
        var tmp_repaymentInterface = new repaymentInterface();
        return tmp_repaymentInterface;
    };

    /**
    * 定期払い戻しインターフェース
    */
    function repaymentInterface() {
        // データリスト
        var serializeData;
        var startDate;
        var buyDate;
        var repaymentDate;
        var validityPeriod;
        var changeSection;
        // 関数リスト
        // serializeData設定
        function setSerializeData(value) { serializeData = value; };
        function getSerializeData() { return serializeData; };
        this.setSerializeData = setSerializeData;
        this.getSerializeData = getSerializeData;
        // startDate設定
        function setStartDate(value) { startDate = value; };
        function getStartDate() { return startDate; };
        this.setStartDate = setStartDate;
        this.getStartDate = getStartDate;
        // buyDate設定
        function setBuyDate(value) { buyDate = value; };
        function getBuyDate() { return buyDate; };
        this.setBuyDate = setBuyDate;
        this.getBuyDate = getBuyDate;
        // repaymentDate設定
        function setRepaymentDate(value) { repaymentDate = value; };
        function getRepaymentDate() { return repaymentDate; };
        this.setRepaymentDate = setRepaymentDate;
        this.getRepaymentDate = getRepaymentDate;
        // validityPeriod設定
        function setValidityPeriod(value) { validityPeriod = value; };
        function getValidityPeriod() { return validityPeriod; };
        this.setValidityPeriod = setValidityPeriod;
        this.getValidityPeriod = getValidityPeriod;
        // changeSection設定
        function setChangeSection(value) { changeSection = value; };
        function getChangeSection() { return changeSection; };
        this.setChangeSection = setChangeSection;
        this.getChangeSection = getChangeSection;
    };

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (name.toLowerCase() == String("Agent").toLowerCase()) {
            agent = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    // 外部参照可能な関数リスト
    this.dispRepayment = dispRepayment;
    this.getRepayPrice = getRepayPrice;
    this.getRepayCount = getRepayCount;
    this.getRepayObject = getRepayObject;
    this.getPointObject = getPointObject;
    this.createRepaymentInterface = createRepaymentInterface;
    this.setConfigure = setConfigure;
    this.bind = bind;
    this.unbind = unbind;

    // 定数リスト
    this.TEIKI1 = 1;
    this.TEIKI3 = 3;
    this.TEIKI6 = 6;

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
