/**
 *  駅すぱあと Web サービス
 *  経路表示パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *
 *  Version:2018-07-29
 *
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiCourse = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiCourse\.js"));

        if (s.src && s.src.match(/expGuiCourse\.js(\?.*)?/)) {
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

    // 合計運賃のスタイルを返す関数。
    function appendRevisionStatusClass(RevisionStatusResults,Summary) {
        if (checkArray(RevisionStatusResults, "previous") != -1) {
            return '<span class="exp_taxRateIsNotSupported">' + num2String(Summary) + '円</span>';
        }
        if (checkArray(RevisionStatusResults, "forecast") != -1) {
            return '<span class="exp_RevisionStatusPrice">' + num2String(Summary) + '円</span>';
        }
        return num2String(Summary) + '円';
    }

    // 区間の運賃のスタイルを返す関数。
    // 引数attrは呼び出し元で作ったDomのid属性の値が渡されてくる。
    function appendRevisionStatusLineClass(RevisionStatusResults, contents, attrs) {
        if (checkArray(RevisionStatusResults, "previous") != -1) {
            return '<span class="exp_RevisionStatusPrevious" ' + attrs + '>' + contents + '</span>';
        }
        if (checkArray(RevisionStatusResults, "forecast") != -1) {
            return '<span class="exp_RevisionStatusForecast" ' + attrs + '>'  + contents + '</span>';
        }
        return '<span class="exp_linePrice" ' + attrs + '>' + contents + '</span>';
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
    var searchObj; // 探索条件のオブジェクト
    var resultObj; // 探索結果のリクエストオブジェクト
    var result; // 探索結果オブジェクト
    var selectNo = 0; // 表示している探索経路NO
    var resultCount = 0; // 探索結果数
    var viewCourseListFlag = false; // 経路一覧表示
    var priceChangeFlag = true; // 座席種別を変更できるかどうか
    var priceChangeRefreshFlag = false; // 座席種別変更時にリクエストするかどうか
    var priceViewFlag = "oneway"; // 片道・往復・定期の表示切替
    var assignDiaFlag = false; // 前後のダイヤ割り当ての設定
    var courseListFlag = false; // 探索結果の一覧自動オープン
    var callbackFunction; // コールバック関数の設定
    var callBackFunctionBind = new Object();
    var windowFlag = false; // ウィンドウ表示フラグ
    var checkEngineVersion = true; // エンジンバージョン同一チェック
    var courseDisplayAll = false;// 経路一覧・探索結果の表示
    var fromName; // 座標指定等で名称を上書きする際の変数
    var toName; // 座標指定等で名称を上書きする際の変数
    var selectedIndex; // 選択中の経路NOを指定
    var sortCourseList; // ソート用配列
    var sortType; // ソートする基準
    var resultTab = true; // タブを表示の有無を指定(オンにすることでソート可能)
    var resultSearchType; // 平均・ダイヤ探索

    // 最適経路の変数
    var minEkispertIndex;
    var minTimeSummary;
    var minTransferCount;
    var minPriceSummary;
    var minPriceRoundSummary;
    var minTeikiSummary;
    var minTeiki1Summary;
    var minTeiki3Summary;
    var minTeiki6Summary;
    var minTeiki12Summary;
    var minExhaustCO2;

    /**
    * メニューのコールバック
    */
    var callBackObjectStation = new Array();
    var callBackObjectLine = new Array();

    /**
     * 探索結果ウィンドウの表示
     */
    function dispCourseWindow() {
        windowFlag = true;
        dispCourse();
    }

    /**
    * 探索結果の設置
    */
    function dispCourse() {
        var buffer = "";
        // 探索結果の表示
        if (agent == 1) {
            buffer += '<div class="expGuiCourse expGuiCoursePc" id="' + baseId + ':course" style="display:none;">';
        } else if (agent == 2) {
            buffer += '<div class="expGuiCourse expGuiCoursePhone" id="' + baseId + ':course" style="display:none;">';
        } else if (agent == 3) {
            buffer += '<div class="expGuiCourse expGuiCourseTablet" id="' + baseId + ':course" style="display:none;">';
        }
        if (windowFlag) {
            // ポップアップ版
            buffer += '<div id="' + baseId + ':resultPopup" class="exp_resultPopup">';
            // 結果本体
            buffer += '<div class="exp_resultBody">';
            // 閉じるボタン
            buffer += '<div class="exp_header">';
            buffer += '<div class="exp_resultClose">';
            buffer += '<a class="exp_resultCloseButton" id="' + baseId + ':resultClose" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':resultClose:text">閉じる</span></a>';
            buffer += '</div>';
            buffer += '</div>';
            // 探索結果の表示
            buffer += '<div class="exp_result" id="' + baseId + ':result"></div>';
            buffer += '</div>';
            buffer += '</div>';
        } else {
            // 探索結果の表示
            buffer += '<div class="exp_result" id="' + baseId + ':result"></div>';
        }
        buffer += '</div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // イベントの登録
        addEvent(document.getElementById(baseId + ":course"), "click", onEvent);
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
    * 探索実行
    */
    function search(searchObject, param1, param2) {
        // その他パラメータ
        var etcParam = new Array();
        if (typeof searchObject == "string") {
            // コールバック関数の設定
            callbackFunction = param2;
            // 探索オブジェクトを生成
            searchObj = createSearchInterface();
            searchObj.setPriceType(param1);
            // パラメータを解析
            var tmpParamList = searchObject.split('&');
            for (var i = 0; i < tmpParamList.length; i++) {
                var tmpParam = tmpParamList[i].split('=');
                if (tmpParam.length == 2) {
                    switch (tmpParam[0].toLowerCase()) {
                        case "vialist":
                            searchObj.setViaList(tmpParam[1]);
                            break;
                        case "fixedraillist":
                            searchObj.setFixedRailList(tmpParam[1]);
                            break;
                        case "fixedraildirectionlist":
                            searchObj.setFixedRailDirectionList(tmpParam[1]);
                            break;
                        case "date":
                            searchObj.setDate(tmpParam[1]);
                            break;
                        case "time":
                            searchObj.setTime(tmpParam[1]);
                            break;
                        case "searchtype":
                            searchObj.setSearchType(tmpParam[1]);
                            break;
                        case "sort":
                            searchObj.setSort(tmpParam[1]);
                            break;
                        case "answercount":
                            searchObj.setAnswerCount(tmpParam[1]);
                            break;
                        case "searchcount":
                            searchObj.setSearchCount(tmpParam[1]);
                            break;
                        case "conditiondetail":
                            searchObj.setConditionDetail(tmpParam[1]);
                            break;
                        case "corporationbind":
                            searchObj.setCorporationBind(tmpParam[1]);
                            break;
                        case "interruptcorporationlist":
                            searchObj.setInterruptCorporationList(tmpParam[1]);
                            break;
                        case "interruptraillist":
                            searchObj.setInterruptRailList(tmpParam[1]);
                            break;
                        case "resultdetail":
                            searchObj.setResultDetail(tmpParam[1]);
                            break;
                        case "assignroute":
                            searchObj.setAssignRoute(tmpParam[1]);
                            break;
                        case "assigndetailroute":
                            searchObj.setAssignDetailRoute(tmpParam[1]);
                            break;
                        case "assignteikiserializedata":
                            searchObj.setAssignTeikiSerializeData(tmpParam[1]);
                            break;
                        case "assignnikukanteikiindex":
                            searchObj.setAssignNikukanteikiIndex(tmpParam[1]);
                            break;
                        case "coupon":
                            searchObj.setCoupon(tmpParam[1]);
                            break;
                        case String("bringAssignmentError").toLowerCase():
                            searchObj.setBringAssignmentError(tmpParam[1]);
                            break;
                        case "from":
                            searchObj.setFrom(tmpParam[1]);
                            break;
                        case "to":
                            searchObj.setTo(tmpParam[1]);
                            break;
                        case "via":
                            searchObj.setVia(tmpParam[1]);
                            break;
                        case "plane":
                            searchObj.setPlane(tmpParam[1]);
                            break;
                        case "shinkansen":
                            searchObj.setShinkansen(tmpParam[1]);
                            break;
                        case String("limitedExpress").toLowerCase():
                            searchObj.setLimitedExpress(tmpParam[1]);
                            break;
                        case "bus":
                            searchObj.setBus(tmpParam[1]);
                            break;
                        default:
                            etcParam.push(tmpParam[0] + "=" + encodeURIComponent(tmpParam[1]));
                            break;
                    }
                }
            }
        } else {
            // 探索オブジェクトを指定
            searchObj = searchObject;
            // コールバック関数の設定
            callbackFunction = param1;
        }
        // 探索オブジェクトを文字列に変換
        var url = apiURL;
        var searchWord = "";
        if (typeof searchObj.getViaList() != 'undefined') {
            var tmp_stationList = searchObj.getViaList().split(":");
            for (var i = 0; i < tmp_stationList.length; i++) {
                if (isNaN(tmp_stationList[i])) {
                    if (tmp_stationList[i].indexOf("P-") != 0) {
                        tmp_stationList[i] = encodeURIComponent(tmp_stationList[i]);
                    }
                }
            }
            searchWord += "&viaList=" + tmp_stationList.join(":");
            if (typeof searchObj.getFixedRailList() != 'undefined') {
                searchWord += "&fixedRailList=" + encodeURIComponent(searchObj.getFixedRailList());
            }
            if (typeof searchObj.getFixedRailDirectionList() != 'undefined') {
                searchWord += "&fixedRailDirectionList=" + encodeURIComponent(searchObj.getFixedRailDirectionList());
            }
            if (typeof searchObj.getDate() != 'undefined') {
                searchWord += "&date=" + searchObj.getDate();
            }
            if (typeof searchObj.getTime() != 'undefined') {
                searchWord += "&time=" + searchObj.getTime();
            }
            if (typeof searchObj.getSearchType() != 'undefined') {
                searchWord += "&searchType=" + searchObj.getSearchType();
            }
            if (typeof searchObj.getSort() != 'undefined') {
                searchWord += "&sort=" + searchObj.getSort();
            }
            if (typeof searchObj.getAnswerCount() != 'undefined') {
                searchWord += "&answerCount=" + searchObj.getAnswerCount();
            }
            if (typeof searchObj.getSearchCount() != 'undefined') {
                searchWord += "&searchCount=" + searchObj.getSearchCount();
            }
            if (typeof searchObj.getConditionDetail() != 'undefined') {
                searchWord += "&conditionDetail=" + searchObj.getConditionDetail();
            }
            if (typeof searchObj.getCorporationBind() != 'undefined') {
                searchWord += "&corporationBind=" + encodeURIComponent(searchObj.getCorporationBind());
            }
            if (typeof searchObj.getInterruptCorporationList() != 'undefined') {
                searchWord += "&interruptCorporationList=" + encodeURIComponent(searchObj.getInterruptCorporationList());
            }
            if (typeof searchObj.getInterruptRailList() != 'undefined') {
                searchWord += "&interruptRailList=" + encodeURIComponent(searchObj.getInterruptRailList());
            }
            if (typeof searchObj.getResultDetail() != 'undefined') {
                searchWord += "&resultDetail=" + searchObj.getResultDetail();
            }
            if (typeof searchObj.getAssignRoute() != 'undefined') {
                searchWord += "&assignRoute=" + encodeURIComponent(searchObj.getAssignRoute());
            }
            if (typeof searchObj.getAssignDetailRoute() != 'undefined') {
                searchWord += "&assignDetailRoute=" + encodeURIComponent(searchObj.getAssignDetailRoute());
            }
            if (typeof searchObj.getAssignTeikiSerializeData() != 'undefined') {
                searchWord += "&assignTeikiSerializeData=" + encodeURIComponent(searchObj.getAssignTeikiSerializeData());
            }
            if (typeof searchObj.getAssignNikukanteikiIndex() != 'undefined') {
                searchWord += "&assignNikukanteikiIndex=" + searchObj.getAssignNikukanteikiIndex();
            }
            if (typeof searchObj.getCoupon() != 'undefined') {
                searchWord += "&coupon=" + encodeURIComponent(searchObj.getCoupon());
            }
            if (typeof searchObj.getBringAssignmentError() != 'undefined') {
                searchWord += "&bringAssignmentError=" + searchObj.getBringAssignmentError();
            }
            url += "v1/json/search/course/extreme?key=" + key + searchWord;
            // エンジンバージョン同一チェック
            if (!checkEngineVersion) {
                url += "&checkEngineVersion=false";
            }
        } else if (typeof searchObj.getFrom() != 'undefined' && typeof searchObj.getTo() != 'undefined') {
            searchWord += "&from=" + encodeURIComponent(searchObj.getFrom());
            searchWord += "&to=" + encodeURIComponent(searchObj.getTo());
            if (typeof searchObj.getVia() != 'undefined') {
                searchWord += "&via=" + encodeURIComponent(searchObj.getVia());
            }
            if (typeof searchObj.getPlane() != 'undefined') {
                searchWord += "&plane=" + searchObj.getPlane();
            }
            if (typeof searchObj.getShinkansen() != 'undefined') {
                searchWord += "&shinkansen=" + searchObj.getShinkansen();
            }
            if (typeof searchObj.getLimitedExpress() != 'undefined') {
                searchWord += "&limitedExpress=" + searchObj.getLimitedExpress();
            }
            if (typeof searchObj.getBus() != 'undefined') {
                searchWord += "&bus=" + searchObj.getBus();
            }
            url += "v1/json/search/course/plain?key=" + key + searchWord;
        } else {
            alert("viaListまたはfrom、toは必須です。");
            return;
        }
        // その他パラメータ追加
        if (etcParam.length > 0) {
            searchWord += "&" + etcParam.join("&");
        }
        searchRun(url, searchObj.getPriceType());
    }

    /**
    * 探索結果の編集
    */
    function courseEdit(param, callback) {
        if (resultCount >= 1 && selectNo >= 1) {
            callbackFunction = callback;
            // 探索オブジェクトの特定
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            // シリアライズデータを設定
            var url = apiURL + "v1/json/course/edit?key=" + key + "&serializeData=" + encodeURIComponent(tmpResult.SerializeData);
            url += "&" + param;
            // エンジンバージョン同一チェック
            if (!checkEngineVersion) {
                url += "&checkEngineVersion=false";
            }
            // 探索を実行
            reSearch(url, selectNo);
        }
    }

    /**
    * 探索実行本体
    */
    function searchRun(url, tmpPriceFlag) {
        // 金額指定されていた場合はセットする
        if (typeof tmpPriceFlag != 'undefined') {
            priceViewFlag = tmpPriceFlag;
        } else {
            priceViewFlag = "oneway";
        }
        //探索実行中はキャンセル
        if (typeof resultObj != 'undefined') {
            resultObj.abort();
        }
        //ロード中の表示
        if (!document.getElementById(baseId + ':result')) {
            dispCourse();
        }
        document.getElementById(baseId + ':result').innerHTML = '<div class="expLoading"><div class="expText">経路取得中...</div></div>';
        document.getElementById(baseId + ':course').style.display = "block";
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            resultObj = new XDomainRequest();
            resultObj.onload = function () {
                // OK時の処理
                setResult(resultObj.responseText, callbackFunction);
            };
            resultObj.onerror = function () {
                // エラー時の処理
                document.getElementById(baseId + ':course').style.display = "none";
                if (typeof callbackFunction == 'function') {
                    callbackFunction(false);
                }
            };
        } else {
            resultObj = new XMLHttpRequest();
            resultObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (resultObj.readyState == done && resultObj.status == ok) {
                    // OK時の処理
                    setResult(resultObj.responseText, callbackFunction);
                } else if (resultObj.readyState == done && resultObj.status != ok) {
                    // エラー時の処理
                    document.getElementById(baseId + ':course').style.display = "none";
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(false);
                    }
                }
            };
        }
        resultObj.open("GET", url, true);
        resultObj.send(null);
    }

    /**
    * シリアライズデータを探索結果に復元
    */
    function setSerializeData(serialize, tmpPriceFlag, callback) {
        callbackFunction = callback;
        var url = apiURL + "v1/json/course/edit?key=" + key + "&serializeData=" + encodeURIComponent(serialize);
        // エンジンバージョン同一チェック
        if (!checkEngineVersion) {
            url += "&checkEngineVersion=false";
        }
        searchRun(url, tmpPriceFlag);
    }

    /**
    * 前後のダイヤ探索
    */
    function assignDia(type) {
        // 探索オブジェクトの特定
        var tmpResult;
        if (resultCount == 1) {
            tmpResult = result.ResultSet.Course;
        } else {
            tmpResult = result.ResultSet.Course[(selectNo - 1)];
        }
        // シリアライズデータを設定し
        var url = apiURL + "v1/json/course/edit?key=" + key + "&serializeData=" + encodeURIComponent(tmpResult.SerializeData);
        if (type == "prev") {
            // 前のダイヤ
            url += "&assignInstruction=AutoPrevious";
        } else if (type == "next") {
            // 次のダイヤ
            url += "&assignInstruction=AutoNext";
        }
        // エンジンバージョン同一チェック
        if (!checkEngineVersion) {
            url += "&checkEngineVersion=false";
        }
        // 探索を実行
        reSearch(url, selectNo);
    }

    /**
    * JSONを解析して探索結果を出力
    */
    function setResult(resultObject, param1, param2) {
        if (!document.getElementById(baseId + ':result')) {
            dispCourse();
        }
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                callbackFunction = param1;
            } else {
                priceViewFlag = param1;
                callbackFunction = undefined;
            }
        } else {
            priceViewFlag = param1;
            callbackFunction = param2;
        }
        if (typeof resultObject == 'undefined') {
            // 探索結果が取得できていない場合
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (resultObject == "") {
            // 探索結果が取得できていない場合
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else {
            // オブジェクトの場合は一度テキストに変換しておく
            if (typeof resultObject == 'object') {
                result = JSON.parse(JSON.stringify(resultObject));
            } else {
                result = JSON.parse(resultObject);
            }
            // 描画領域を初期化
            if (!document.getElementById(baseId + ':result')) {
                dispCourse();
            }
            // 経路表示
            viewResult();
            // 表示する
            document.getElementById(baseId + ':course').style.display = "block";
            // 一度だけコールバックする
            if (typeof callbackFunction == 'function') {
                if (typeof result == 'undefined') {
                    // 探索結果オブジェクトがない場合
                    document.getElementById(baseId + ':course').style.display = "none";
                    callbackFunction(false);
                } else if (typeof result.ResultSet.Course == 'undefined') {
                    // 探索結果が取得できていない場合
                    document.getElementById(baseId + ':course').style.display = "none";
                    callbackFunction(false);
                } else {
                    // 探索完了
                    callbackFunction(true);
                }
                callbackFunction = undefined;
            }
        }
    }

    /**
    * 料金種別の変更
    */
    function setPriceType(tmpPriceFlag) {
        priceViewFlag = tmpPriceFlag;
        changeCourse(selectNo);
    }

    /**
    * 探索結果出力部分
    */
    function viewResult() {
        if (typeof result == 'undefined') {
            // 探索結果オブジェクトがない場合
            return false;
        } else if (typeof result.ResultSet.Course == 'undefined') {
            // 探索結果がない場合
            return false;
        } else {
            // 必ず第一経路を表示
            selectNo = 1;
            // 経路一覧を表示に切り替え
            viewCourseListFlag = courseListFlag;
            if (typeof result.ResultSet.Course.length == 'undefined') {
                // 探索結果が単一の場合
                resultCount = 1;
            } else {
                // 探索結果が複数の場合
                resultCount = result.ResultSet.Course.length;
            }
            // 最適経路のチェック
            checkCourseList();

            // 探索結果の描画
            var buffer = '';
            buffer += '<div id="' + baseId + ':result:header" class="exp_resultHeader exp_clearfix"></div>';
            buffer += '<div id="' + baseId + ':result:body"></div>';
            document.getElementById(baseId + ':result').innerHTML = buffer;

            // 経路を出力
            viewResultList();
        }
    }

    /**
    * 表示している経路を変更
    */
    function changeCourse(n, callback) {
        if (n >= 1 && n <= resultCount) {
            selectNo = n;
            viewCourseListFlag = false;
            // 最適経路のチェック
            checkCourseList();
            // 経路を出力
            viewResultList();
            // 変更を検出
            if (typeof callback == 'function') {
                callback(true);
            } else if (typeof callBackFunctionBind['change'] == 'function') {
                callBackFunctionBind['change'](true);
            }
        } else {
            // 失敗
            if (typeof callback == 'function') {
                callback(false);
            } else if (typeof callBackFunctionBind['change'] == 'function') {
                callBackFunctionBind['change'](false);
            }
        }
    }

    /**
    * 最適経路のフラグをチェックする
    */
    function checkCourseList() {
        // ソート用の配列を用意する
        sortCourseList = new Array();
        for (var i = 0; i < resultCount; i++) {
            var tmp_sortObject = new Object();
            tmp_sortObject.index = i + 1;
            sortCourseList.push(tmp_sortObject);
        }
        minEkispertIndex = undefined;
        minTimeSummary = undefined;
        minTransferCount = undefined;
        minPriceSummary = undefined;
        minPriceRoundSummary = undefined;
        minTeikiSummary = undefined;
        minTeiki1Summary = undefined;
        minTeiki3Summary = undefined;
        minTeiki6Summary = undefined;
        minTeiki12Summary = undefined;
        minExhaustCO2 = undefined;
        // 探索結果が2以上の場合にチェックする
        if (resultCount >= 2) {
            // 駅すぱあとの時間順
            resultSearchType = "plain";
            // 最適経路フラグ
            for (var i = 0; i < resultCount; i++) {
                var tmpResult;
                tmpResult = result.ResultSet.Course[i];
                if (typeof tmpResult.searchType != 'undefined' && tmpResult.searchType != "plain") {
                    resultSearchType = result.ResultSet.Course[i].searchType;
                }
                sortCourseList[i].departure = getDepartureState(tmpResult).getTime();
                sortCourseList[i].arrival = getArrivalState(tmpResult).getTime();
                // 所要時間をチェック
                var TimeSummary = parseInt(tmpResult.Route.timeOnBoard) + parseInt(tmpResult.Route.timeWalk) + parseInt(tmpResult.Route.timeOther);
                if (typeof minTimeSummary == 'undefined') {
                    minTimeSummary = TimeSummary;
                } else if (minTimeSummary > TimeSummary) {
                    minTimeSummary = TimeSummary;
                }
                sortCourseList[i].timeSummary = TimeSummary;
                // 乗り換え回数をチェック
                var transferCount = parseInt(tmpResult.Route.transferCount);
                if (typeof minTransferCount == 'undefined') {
                    minTransferCount = transferCount;
                } else if (minTransferCount > transferCount) {
                    minTransferCount = transferCount;
                }
                sortCourseList[i].transferCount = transferCount;
                // CO2排出量をチェック
                var exhaustCO2 = parseInt(tmpResult.Route.exhaustCO2);
                if (typeof minExhaustCO2 == 'undefined') {
                    minExhaustCO2 = exhaustCO2;
                } else if (minExhaustCO2 > exhaustCO2) {
                    minExhaustCO2 = exhaustCO2;
                }
                // 料金の計算
                var FareSummary = 0;
                var FareRoundSummary = 0;
                var ChargeSummary = 0;
                var ChargeRoundSummary = 0;
                var Teiki1Summary = undefined;
                var Teiki3Summary = undefined;
                var Teiki6Summary = undefined;
                var Teiki12Summary = undefined;
                if (typeof tmpResult.Price != 'undefined') {
                    for (var j = 0; j < tmpResult.Price.length; j++) {
                        if (tmpResult.Price[j].kind == "FareSummary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                FareSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                            if (typeof tmpResult.Price[j].Round != 'undefined') {
                                FareRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                            }
                        } else if (tmpResult.Price[j].kind == "ChargeSummary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                ChargeSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                            if (typeof tmpResult.Price[j].Round != 'undefined') {
                                ChargeRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                            }
                        } else if (tmpResult.Price[j].kind == "Teiki1Summary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                Teiki1Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                        } else if (tmpResult.Price[j].kind == "Teiki3Summary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                Teiki3Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                        } else if (tmpResult.Price[j].kind == "Teiki6Summary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                Teiki6Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                        } else if (tmpResult.Price[j].kind == "Teiki12Summary") {
                            if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                                Teiki12Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                            }
                        }
                    }
                    // 金額のチェック
                    if (typeof minPriceSummary == 'undefined') {
                        minPriceSummary = FareSummary + ChargeSummary;
                    } else if (minPriceSummary > (FareSummary + ChargeSummary)) {
                        minPriceSummary = FareSummary + ChargeSummary;
                    }
                    sortCourseList[i].priceSummary = FareSummary + ChargeSummary;
                    // 往復金額のチェック
                    if (typeof minPriceRoundSummary == 'undefined') {
                        minPriceRoundSummary = FareRoundSummary + ChargeRoundSummary;
                    } else if (minPriceRoundSummary > (FareRoundSummary + ChargeRoundSummary)) {
                        minPriceRoundSummary = FareRoundSummary + ChargeRoundSummary;
                    }
                    sortCourseList[i].priceRoundSummary = FareSummary + ChargeSummary;
                    // 定期券1
                    if (typeof Teiki1Summary != 'undefined') {
                        if (typeof minTeiki1Summary == 'undefined') {
                            minTeiki1Summary = Teiki1Summary;
                        } else if (minTeiki1Summary > Teiki1Summary) {
                            minTeiki1Summary = Teiki1Summary;
                        }
                    }
                    sortCourseList[i].teiki1Summary = Teiki1Summary;
                    // 定期券3
                    if (typeof Teiki3Summary != 'undefined') {
                        if (typeof minTeiki3Summary == 'undefined') {
                            minTeiki3Summary = Teiki3Summary;
                        } else if (minTeiki3Summary > Teiki3Summary) {
                            minTeiki3Summary = Teiki3Summary;
                        }
                    }
                    sortCourseList[i].teiki3Summary = Teiki3Summary;
                    // 定期券6
                    if (typeof Teiki6Summary != 'undefined') {
                        if (typeof minTeiki6Summary == 'undefined') {
                            minTeiki6Summary = Teiki6Summary;
                        } else if (minTeiki6Summary > Teiki6Summary) {
                            minTeiki6Summary = Teiki6Summary;
                        }
                    }
                    var TeikiSummary = 0;
                    //定期の合計
                    if (typeof Teiki6Summary != 'undefined') {
                        if (typeof minTeikiSummary == 'undefined') {
                            minTeikiSummary = Teiki6Summary;
                        } else if (minTeikiSummary > Teiki6Summary) {
                            minTeikiSummary = Teiki6Summary;
                        }
                        TeikiSummary = Teiki6Summary;
                    } else if (typeof Teiki3Summary != 'undefined') {
                        if (typeof minTeikiSummary == 'undefined') {
                            minTeikiSummary = Teiki3Summary * 2;
                        } else if (minTeikiSummary > Teiki3Summary * 2) {
                            minTeikiSummary = Teiki3Summary * 2;
                        }
                        TeikiSummary = Teiki3Summary * 2;
                    } else if (typeof Teiki1Summary != 'undefined') {
                        if (typeof minTeikiSummary == 'undefined') {
                            minTeikiSummary = Teiki1Summary * 6;
                        } else if (minTeikiSummary > Teiki1Summary * 6) {
                            minTeikiSummary = Teiki1Summary * 6;
                        }
                        TeikiSummary = Teiki3Summary * 6;
                    }
                    sortCourseList[i].teikiSummary = TeikiSummary;
                }
            }
            // 時間のソートを行う
            sortCourse("time");
            if (resultSearchType != "plain") {
                minEkispertIndex = sortCourseList[0].index;
            }
            // ソートを実施
            if (sortType != "time") {
                sortCourse(sortType);
            }
        }
    }

    /**
    * 経路一覧の表示・非表示設定
    */
    function dispCourseList() {
        viewCourseListFlag = (viewCourseListFlag ? false : true);
        // 経路を出力
        viewResultList();
    }

    /**
    * 探索結果のタブを出力し、選択されている経路も出力
    */
    function viewResultList() {
        // 経路が複数ある場合と初期表示が経路一覧の場合は、タブを出力
        if (resultTab) {
            if (!courseDisplayAll) {
                if (resultCount > 1 || courseListFlag) {
                    if (agent == 1 || agent == 3) {
                        viewResultTab();
                    } else if (agent == 2) {
                        if (!viewCourseListFlag) {
                            viewResultTab();
                        } else {
                            document.getElementById(baseId + ':result:header').innerHTML = '';
                            document.getElementById(baseId + ':result:header').style.display = "none";
                        }
                    }
                } else {
                    document.getElementById(baseId + ':result:header').style.display = "none";
                }
            } else {
                document.getElementById(baseId + ':result:header').style.display = "none";
            }
        } else {
            document.getElementById(baseId + ':result:header').style.display = "none";
        }
        // リンクの設定
        var buffer = '';
        if (viewCourseListFlag) {
            // 経路一覧の表示
            buffer += viewCourseList();
        } else {
            // 経路一覧同時表示用
            if (courseDisplayAll) {
                buffer += viewCourseList();
            }
            // 経路出力本体
            var tmpResult;
            if (resultCount == 1) {
                // 探索結果が単一
                buffer += viewResultRoute(result.ResultSet.Course);
            } else if (courseDisplayAll) {
                // 全経路出力
                for (var n = 1; n <= resultCount; n++) {
                    buffer += viewResultRoute(result.ResultSet.Course[(n - 1)], n);
                }
            } else {
                // 探索結果が複数
                buffer += viewResultRoute(result.ResultSet.Course[(selectNo - 1)], selectNo);
            }
        }
        // 表示
        document.getElementById(baseId + ':result:body').innerHTML = buffer;
        // 金額の切り替え
        if (agent == 2 || agent == 3) {
            if (priceChangeFlag) {
                for (var n = 0; n < resultCount; n++) {
                    if (resultCount == 1) {
                        tmpResult = result.ResultSet.Course;
                    } else {
                        tmpResult = result.ResultSet.Course[n];
                    }
                    for (var i = 0; i < (tmpResult.Route.Point.length - 1); i++) {
                        if (document.getElementById(baseId + ':fareSelect:' + (n + 1) + ':' + (i + 1))) {
                            if (typeof document.getElementById(baseId + ':fareSelect:' + (n + 1) + ':' + (i + 1)).selectedIndex != 'undefined') {
                                addEvent(document.getElementById(baseId + ':fareSelect:' + (n + 1) + ':' + (i + 1)), "change", changePrice);
                            }
                        }
                        if (document.getElementById(baseId + ':chargeSelect:' + (n + 1) + ':' + (i + 1))) {
                            if (typeof document.getElementById(baseId + ':chargeSelect:' + (n + 1) + ':' + (i + 1)).selectedIndex != 'undefined') {
                                addEvent(document.getElementById(baseId + ':chargeSelect:' + (n + 1) + ':' + (i + 1)), "change", changePrice);
                            }
                        }
                        if (priceChangeRefreshFlag) {
                            if (document.getElementById(baseId + ':teikiSelect:' + (n + 1) + ':' + (i + 1))) {
                                if (typeof document.getElementById(baseId + ':teikiSelect:' + (n + 1) + ':' + (i + 1)).selectedIndex != 'undefined') {
                                    addEvent(document.getElementById(baseId + ':teikiSelect:' + (n + 1) + ':' + (i + 1)), "change", changePrice);
                                }
                            }
                        }
                    }
                }
            }
        }
        document.getElementById(baseId + ':result:body').style.display = "block";
        document.getElementById(baseId + ':result').style.display = "block";
    }

    /**
    * 探索結果のタブを出力
    */
    function viewResultTab() {
        var buffer = '';
        buffer += '<div>';
        buffer += '<div class="exp_resultListButton">';
        if (viewCourseListFlag) {
            buffer += '<div class="exp_on">';
            if (agent == 1) {
                buffer += '<a id="' + baseId + ':tab:list" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:list:text">結果一覧</span></a>';
            } else if (agent == 2 || agent == 3) {
                buffer += '<a class="exp_link" id="' + baseId + ':tab:list" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:list:text">結果一覧</span></a>';
            }
            buffer += '</div>';
        } else {
            buffer += '<div class="exp_off">';
            if (agent == 1) {
                buffer += '<a id="' + baseId + ':tab:list" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:list:text">結果一覧</span></a>';
            } else if (agent == 2 || agent == 3) {
                buffer += '<a class="exp_link" id="' + baseId + ':tab:list" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:list:text">結果一覧</span></a>';
            }

            buffer += '</div>';
        }
        buffer += '</div>';
        if (agent == 1 || agent == 3) {
            buffer += '<ul class="exp_resultTab">';
            for (var n = 1; n <= resultCount; n++) {
                var buttonType = "";
                if (agent == 1) {
                    if (n == resultCount || n == 10) {
                        buttonType = "resultTabButtonRight";
                    }
                } else if (agent == 2 || agent == 3) {
                    if (n == 1) {
                        buttonType = "leftBtn";
                    } else if (n == resultCount) {
                        buttonType = "rightBtn";
                    }
                }
                if (selectNo == (n)) {
                    if (agent == 1) {
                        if (n == 11) {
                            // 改行
                            buffer += '<div class="exp_return"></div>';
                        }
                        buffer += '<li class="exp_resultTabButtonSelect' + ((n <= 10 && resultCount > 10) ? " exp_buttom" : "") + (buttonType != "" ? " exp_" + buttonType : "") + '">';
                        buffer += '<a class="exp_link" id="' + baseId + ':tab:' + String(n) + '" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:' + String(n) + ':text">' + String(n) + '</span></a>';
                        buffer += '</li>';
                    } else if (agent == 2 || agent == 3) {
                        buffer += '<li class="exp_resultTabButtonSelect' + (buttonType != "" ? " exp_" + buttonType : "") + '">';
                        buffer += '<a class="exp_link" id="' + baseId + ':tab:' + String(n) + '" href="Javascript:void(0);">' + String(n) + '</a>';
                        buffer += '</li>';
                    }
                } else {
                    if (agent == 1) {
                        if (n <= 10) {
                            buffer += '<li class="exp_resultTabButtonNoSelect' + (resultCount > 10 ? " exp_buttom" : "") + (buttonType != "" ? " exp_" + buttonType : "") + '">';
                        } else {
                            if (n == 11) {
                                // 改行
                                buffer += '<div class="exp_return"></div>';
                            }
                            buffer += '<li class="exp_resultTabButtonNoSelect' + (buttonType != "" ? " exp_" + buttonType : "") + '">';
                        }
                        buffer += '<a class="exp_link" id="' + baseId + ':tab:' + String(n) + '" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':tab:' + String(n) + ':text">' + String(n) + '</span></a>';
                        buffer += '</li>';
                    } else if (agent == 2 || agent == 3) {
                        buffer += '<li class="exp_resultTabButtonNoSelect' + (buttonType != "" ? " exp_" + buttonType : "") + '">';
                        buffer += '<a class="exp_link" id="' + baseId + ':tab:' + String(n) + '" href="Javascript:void(0);">' + String(n) + '</a>';
                        buffer += '</li>';
                    }
                }
            }
            buffer += '</ul>';
        } else if (agent == 2) {
            /**
            buffer += '<div class="exp_resultChangeButton">';
            buffer += '<div class="exp_button">';
            buffer += '<span class="exp_text" id="' + baseId + ':result:change:text">他の経路</span>';
            //選択
            buffer += '<select class="exp_selectObj" id="' + baseId + ':resultSelect">';
            for (var n = 1; n <= resultCount; n++) {
            buffer += '<option value="' + String(n) + '"' + (n == selectNo ? " selected" : "") + '>' + String(n) + '</option>';
            }
            buffer += '</select>';
            buffer += '</div>';
            buffer += '</div>';
            */
        }
        buffer += '</div>';

        document.getElementById(baseId + ':result:header').innerHTML = buffer;
        document.getElementById(baseId + ':result:header').style.display = "block";
    }

    /**
    * 経路の出力文字列を作成
    */
    function viewCourseList() {
        var buffer = "";
        // リストの出力
        buffer += '<div class="exp_resultList">';
        // タイトル
        buffer += '<div class="exp_resultListTitle exp_clearfix">';
        // 出発地
        buffer += '<div class="exp_from">';
        var firstCourse;
        var courseList = new Array();
        if (resultCount == 1) {
            // 探索結果が単一
            firstCourse = result.ResultSet.Course;
            courseList.push(firstCourse);
        } else {
            // 探索結果が複数
            firstCourse = result.ResultSet.Course[0];
            for (var i = 0; i < resultCount; i++) {
                // ソート時の経路を設定
                courseList.push(result.ResultSet.Course[sortCourseList[i].index - 1]);
            }
        }
        if (typeof fromName != 'undefined') {
            buffer += sanitaize(fromName);
        } else if (typeof firstCourse.Route.Point[0].Station != 'undefined') {
            buffer += firstCourse.Route.Point[0].Station.Name;
        } else if (typeof firstCourse.Route.Point[0].Name != 'undefined') {
            if (firstCourse.Route.Point[0].Name.split(",")[2] == "tokyo" || firstCourse.Route.Point[0].Name.split(",")[2] == "wgs84") {
                buffer += "座標情報";
            } else {
                buffer += firstCourse.Route.Point[0].Name;
            }
        }
        buffer += '</div>';
        buffer += '<div class="exp_cursor"></div>';
        // 目的地
        buffer += '<div class="exp_to">';
        if (typeof toName != 'undefined') {
            buffer += sanitaize(toName);
        } else if (typeof firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Station != 'undefined') {
            buffer += firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Station.Name;
        } else if (typeof firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Name != 'undefined') {
            if (firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Name.split(",")[2] == "tokyo" || firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Name.split(",")[2] == "wgs84") {
                buffer += "座標情報";
            } else {
                buffer += firstCourse.Route.Point[firstCourse.Route.Point.length - 1].Name;
            }
        }
        buffer += '</div>';
        var searchDate;
        if (typeof searchObj != 'undefined') {
            if (typeof searchObj.getDate() != 'undefined') {
                searchDate = new Date(parseInt(String(searchObj.getDate()).substring(0, 4), 10), parseInt(String(searchObj.getDate()).substring(4, 6), 10) - 1, parseInt(String(searchObj.getDate()).substring(6, 8), 10));
                buffer += '<div class="exp_date">';
                var week = new Array('日', '月', '火', '水', '木', '金', '土');
                buffer += String(searchDate.getFullYear()) + '年' + String(searchDate.getMonth() + 1) + '月' + String(searchDate.getDate()) + '日';
                buffer += '(' + week[searchDate.getDay()] + ')';
                buffer += '</div>';
            }
        }
        buffer += '</div>';

        // 運賃改定未対応
        var salesTaxRateIsNotSupported = false;
        for (var i = 0; i < resultCount; i++) {
            if (typeof courseList[i].Price != 'undefined') {
                for (var j = 0; j < courseList[i].Price.length; j++) {
                    if (typeof courseList[i].Price[j].fareRevisionStatus != 'undefined') {
                        if (courseList[i].Price[j].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                            if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                                // 片道・往復計算時
                                if (courseList[i].Price[j].kind == "Fare" || courseList[i].Price[j].kind == "Charge") {
                                    // 運賃改定未対応
                                    salesTaxRateIsNotSupported = true;
                                }
                            } else if (priceViewFlag == "teiki") {
                                // 定期計算時
                                if (courseList[i].Price[j].kind == "Teiki1" || courseList[i].Price[j].kind == "Teiki3" || courseList[i].Price[j].kind == "Teiki6") {
                                    // 運賃改定未対応
                                    salesTaxRateIsNotSupported = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (salesTaxRateIsNotSupported) {
            buffer += '<div class="exp_fareRevisionStatus">';
            buffer += '赤色の金額は、消費税率変更に未対応です。';
            buffer += '</div>';
        }
        // ソートを行う
        if (!resultTab) {
            buffer += '<div class="exp_sortTab exp_clearfix">';
            // 時間順
            buffer += '<a class="exp_sortButton ' + (sortType == "time" ? "exp_hayaiButtonSelected" : "exp_hayaiButton") + '" id="' + baseId + ':sort:time" href="Javascript:void(0);">';
            buffer += '<span class="exp_hayai" id="' + baseId + ':sort:time:icon"></span>';
            buffer += '<span class="exp_text" id="' + baseId + ':sort:time:text">時間順</span>';
            buffer += '</a>';
            // 安い順
            buffer += '<a class="exp_sortButton ' + (sortType == "price" ? "exp_yasuiButtonSelected" : "exp_yasuiButton") + '" id="' + baseId + ':sort:price" href="Javascript:void(0);">';
            buffer += '<span class="exp_yasui" id="' + baseId + ':sort:price:icon"></span>';
            buffer += '<span class="exp_text" id="' + baseId + ':sort:price:text">料金の安い順</span>';
            buffer += '</a>';
            // 乗り換え順
            buffer += '<a class="exp_sortButton ' + (sortType == "transfer" ? "exp_rakuButtonSelected" : "exp_rakuButton") + '" id="' + baseId + ':sort:transfer" href="Javascript:void(0);">';
            buffer += '<span class="exp_raku" id="' + baseId + ':sort:transfer:icon"></span>';
            buffer += '<span class="exp_text" id= "' + baseId + ':sort:transfer:text" > 乗換回数順</span>';
            buffer += '</a>';
            buffer += '</div>';
        }
        // 金額をチェック
        for (var i = 0; i < resultCount; i++) {
            var tmpResult;
            tmpResult = courseList[i];
            var time = parseInt(tmpResult.Route.timeOnBoard) + parseInt(tmpResult.Route.timeWalk) + parseInt(tmpResult.Route.timeOther);
            var TransferCount = parseInt(tmpResult.Route.transferCount);
            var FareSummary = 0;
            var FareRoundSummary = 0;
            var ChargeSummary = 0;
            var ChargeRoundSummary = 0;
            var Teiki1Summary = undefined;
            var Teiki3Summary = undefined;
            var Teiki6Summary = undefined;
            var Teiki12Summary = undefined;
            // 運賃改定未対応
            var FareSummarySalesTaxRateIsNotSupported = false;
            var ChargeSummarySalesTaxRateIsNotSupported = false;
            var Teiki1SummarySalesTaxRateIsNotSupported = false;
            var Teiki3SummarySalesTaxRateIsNotSupported = false;
            var Teiki6SummarySalesTaxRateIsNotSupported = false;
            var Teiki12SummarySalesTaxRateIsNotSupported = false;
            // 料金の計算
            if (typeof tmpResult.Price != 'undefined') {
                for (var j = 0; j < tmpResult.Price.length; j++) {
                    if (tmpResult.Price[j].kind == "FareSummary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            FareSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                        if (typeof tmpResult.Price[j].Round != 'undefined') {
                            FareRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                        }
                    } else if (tmpResult.Price[j].kind == "ChargeSummary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            ChargeSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                        if (typeof tmpResult.Price[j].Round != 'undefined') {
                            ChargeRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki1Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki1Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki3Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki3Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki6Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki6Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki12Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki12Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else {
                        // 運賃改定未対応チェック
                        if (typeof tmpResult.Price[j].fareRevisionStatus != 'undefined') {
                            if (tmpResult.Price[j].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                if (tmpResult.Price[j].kind == "Fare") {
                                    FareSummarySalesTaxRateIsNotSupported = true;
                                } else if (tmpResult.Price[j].kind == "Charge") {
                                    ChargeSummarySalesTaxRateIsNotSupported = true;
                                } else if (tmpResult.Price[j].kind == "Teiki1") {
                                    Teiki1SummarySalesTaxRateIsNotSupported = true;
                                } else if (tmpResult.Price[j].kind == "Teiki3") {
                                    Teiki3SummarySalesTaxRateIsNotSupported = true;
                                } else if (tmpResult.Price[j].kind == "Teiki6") {
                                    Teiki6SummarySalesTaxRateIsNotSupported = true;
                                } else if (tmpResult.Price[j].kind == "Teiki12") {
                                    Teiki12SummarySalesTaxRateIsNotSupported = true;
                                }
                            }
                        }
                    }
                }
            }
            var salesTaxRateIsNotSupported = (FareSummarySalesTaxRateIsNotSupported || ChargeSummarySalesTaxRateIsNotSupported);
            // 探索結果一覧
            buffer += '<a class="exp_link" id="' + baseId + ':list:' + String(i + 1) + '" href="Javascript:void(0);">';
            buffer += '<div class="exp_resultListRow exp_' + (i % 2 == 0 ? 'odd' : 'even') + (sortCourseList[i].index == selectedIndex ? ' exp_selectedRoute' : '') + ' exp_clearfix">';
            // 結果NO
            buffer += '<div class="exp_no" id="' + baseId + ':list:' + String(i + 1) + ':no">';
            buffer += '<span class="exp_routeNo" id="' + baseId + ':list:' + String(i + 1) + ':no:text">' + String(i + 1) + '</span>';
            buffer += '</div>';
            // 探索結果の情報
            buffer += '<div class="exp_summary">';
            // 上の段
            buffer += '<div class="exp_upper" id="' + baseId + ':list:' + String(i + 1) + ':upper">';
            var icon_count = 0;
            // アイコン
            buffer += '<div class="exp_mark exp_clearfix" id="' + baseId + ':list:' + String(i + 1) + ':icon">';
            if (typeof minEkispertIndex != 'undefined') {
                if (getDepartureState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getDepartureState(tmpResult).getTime() && getArrivalState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getArrivalState(tmpResult).getTime()) {
                    buffer += '<span class="exp_hayai" id="' + baseId + ':list:' + String(i + 1) + ':icon:hayai"></span>';
                    icon_count++;
                }
            } else if (minTimeSummary == time) {
                buffer += '<span class="exp_hayai" id="' + baseId + ':list:' + String(i + 1) + ':icon:hayai"></span>';
                icon_count++;
            }
            if (priceViewFlag == "oneway") {
                if (minPriceSummary == (FareSummary + ChargeSummary)) {
                    buffer += '<span class="exp_yasui" id="' + baseId + ':list:' + String(i + 1) + ':icon:yasui"></span>';
                    icon_count++;
                }
            } else if (priceViewFlag == "round") {
                if (minPriceRoundSummary == (FareRoundSummary + ChargeRoundSummary)) {
                    buffer += '<span class="exp_yasui" id="' + baseId + ':list:' + String(i + 1) + ':icon:yasui"></span>';
                    icon_count++;
                }
            } else if (priceViewFlag == "teiki") {
                if (typeof Teiki6Summary != 'undefined') {
                    if (minTeikiSummary == Teiki6Summary) {
                        buffer += '<span class="exp_yasui" id="' + baseId + ':list:' + String(i + 1) + ':icon:yasui"></span>';
                        icon_count++;
                    }
                } else if (typeof Teiki3Summary != 'undefined') {
                    if (minTeikiSummary == Teiki3Summary * 2) {
                        buffer += '<span class="exp_yasui" id="' + baseId + ':list:' + String(i + 1) + ':icon:yasui"></span>';
                        icon_count++;
                    }
                } else if (typeof Teiki1Summary != 'undefined') {
                    if (minTeikiSummary == Teiki1Summary * 6) {
                        buffer += '<span class="exp_yasui" id="' + baseId + ':list:' + String(i + 1) + ':icon:yasui"></span>';
                        icon_count++;
                    }
                }
            }
            if (minTransferCount == TransferCount) {
                buffer += '<span class="exp_raku" id="' + baseId + ':list:' + String(i + 1) + ':icon:raku"></span>';
                icon_count++;
            }
            // 残りの情報を入れる
            var summary_info = "";
            if (typeof tmpResult.Route.Line.length == 'undefined') {
                if (getTextValue(tmpResult.Route.Line.Type) == "walk") {
                    summary_info = "徒歩";
                } else {
                    summary_info = "直通";
                }
            } else {
                // 最初と最後の駅は除く
                for (var j = 1; j < tmpResult.Route.Point.length - 1; j++) {
                    if (j > 1) { summary_info += "・"; }
                    if (typeof tmpResult.Route.Point[j].Station != 'undefined') {
                        summary_info += tmpResult.Route.Point[j].Station.Name;
                    } else if (typeof point.Name != 'undefined') {
                        summary_info += tmpResult.Route.Point[j].Name;
                    }
                }
                summary_info += " 乗換";
            }

            buffer += '<span class="exp_information_' + (tmpResult.dataType == "onTimetable" ? "dia" : "plain") + (icon_count > 0 ? String(icon_count) : "") + ((agent == 2) ? " exp_informationPhone_" + (tmpResult.dataType == "onTimetable" ? "dia" : "plain") + (icon_count > 0 ? String(icon_count) : "") : "") + '" id="' + baseId + ':list:' + String(i + 1) + ':information">' + summary_info + '</span>';
            buffer += '</div>';
            // ダイヤ探索のみ
            if (tmpResult.dataType == "onTimetable") {
                buffer += '<div class="exp_time exp_clearfix" id="' + baseId + ':list:' + String(i + 1) + ':time">';
                // 発着時刻
                var DepartureTime, ArrivalTime;
                if (typeof tmpResult.Route.Line.length == 'undefined') {
                    if (typeof tmpResult.Route.Line.DepartureState.Datetime.text != 'undefined') {
                        DepartureTime = convertISOtoDate(tmpResult.Route.Line.DepartureState.Datetime.text);
                    }
                    if (typeof tmpResult.Route.Line.ArrivalState.Datetime.text != 'undefined') {
                        ArrivalTime = convertISOtoDate(tmpResult.Route.Line.ArrivalState.Datetime.text);
                    }
                } else {
                    if (typeof tmpResult.Route.Line[0].DepartureState.Datetime.text != 'undefined') {
                        DepartureTime = convertISOtoDate(tmpResult.Route.Line[0].DepartureState.Datetime.text);
                    }
                    if (typeof tmpResult.Route.Line[tmpResult.Route.Line.length - 1].ArrivalState.Datetime.text != 'undefined') {
                        ArrivalTime = convertISOtoDate(tmpResult.Route.Line[tmpResult.Route.Line.length - 1].ArrivalState.Datetime.text);
                    }
                }
                //buffer += '<span class="exp_departure">出</span>';
                buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':time:dep">' + String(DepartureTime.getHours()) + ':' + (DepartureTime.getMinutes() < 10 ? '0' : '') + String(DepartureTime.getMinutes()) + '</span>';
                buffer += '<span class="exp_cursor" id="' + baseId + ':list:' + String(i + 1) + ':time:cursur"></span>';
                //buffer += '<span class="exp_arrival">着</span>';
                buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':time:arr">' + String(ArrivalTime.getHours()) + ':' + (ArrivalTime.getMinutes() < 10 ? '0' : '') + String(ArrivalTime.getMinutes()) + '</span>';
                buffer += '</div>';
            }
            buffer += '</div>';
            // 下の段
            buffer += '<div class="exp_lower" id="' + baseId + ':list:' + String(i + 1) + ':lower">';
            if (agent == 1 || agent == 3) {
                // 所要時間
                buffer += '<span class="exp_title" id="' + baseId + ':list:' + String(i + 1) + ':time">所要時間</span>';
                buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':time:text">' + String(time) + '分</span>';
                // 乗り換え回数
                if (priceViewFlag == "teiki") {
                    buffer += '<span class="exp_title" id="' + baseId + ':list:' + String(i + 1) + ':trans">乗り換え</span>';
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':trans:text">' + String(TransferCount) + '回</span>';
                }
                //運賃
                if (priceViewFlag == "oneway") {
                    buffer += '<span class="exp_title" id="' + baseId + ':list:' + String(i + 1) + ':price">片道金額</span>';
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                    buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported">' : '';
                    buffer += num2String(FareSummary + ChargeSummary) + '円';
                    buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                    buffer += '</span>';
                } else if (priceViewFlag == "round") {
                    buffer += '<span class="exp_title" id="' + baseId + ':list:' + String(i + 1) + ':price">往復金額</span>';
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                    buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:text2">' : '';
                    buffer += num2String(FareRoundSummary + ChargeRoundSummary) + '円';
                    buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                    buffer += '</span>';
                } else if (priceViewFlag == "teiki") {
                    // 定期券の表示
                    buffer += '<span class="exp_titleTeiki1" id="' + baseId + ':list:' + String(i + 1) + ':price">定期券1ヶ月</span>';
                    if (typeof Teiki1Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                        buffer += Teiki1SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:support">' : '';
                        buffer += num2String(Teiki1Summary) + '円';
                        buffer += Teiki1SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------円</span>';
                    }
                    buffer += '<span class="exp_titleTeiki3">定期券3ヶ月</span>';
                    if (typeof Teiki3Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                        buffer += Teiki3SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:support">' : '';
                        buffer += num2String(Teiki3Summary) + '円';
                        buffer += Teiki3SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------円</span>';
                    }
                    buffer += '<span class="exp_titleTeiki6" id="' + baseId + ':list:' + String(i + 1) + ':price">定期券6ヶ月</span>';
                    if (typeof Teiki6Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                        buffer += Teiki6SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:support">' : '';
                        buffer += num2String(Teiki6Summary) + '円';
                        buffer += Teiki6SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------円</span>';
                    }
                    buffer += '<span class="exp_titleTeiki12" id="' + baseId + ':list:' + String(i + 1) + ':price">定期券12ヶ月</span>';
                    if (typeof Teiki12Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">';
                        buffer += Teiki12SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:support">' : '';
                        buffer += num2String(Teiki12Summary) + '円';
                        buffer += Teiki12SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------円</span>';
                    }
                }
                // 乗り換え回数
                if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                    buffer += '<span class="exp_title" id="' + baseId + ':list:' + String(i + 1) + ':trans">乗り換え</span>';
                    if (TransferCount > 0) {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':trans:text">' + String(TransferCount) + '回</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':trans:text">なし</span>';
                    }
                }
            } else if (agent == 2) {
                // 所要時間
                buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':time:text">' + String(time) + '分</span>';
                //運賃
                if (priceViewFlag == "oneway") {
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                    buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported">' : '';
                    buffer += '\\' + num2String(FareSummary + ChargeSummary);
                    buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                    buffer += '</span>';
                } else if (priceViewFlag == "round") {
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                    buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported">' : '';
                    buffer += '\\' + num2String(FareRoundSummary + ChargeRoundSummary);
                    buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                    buffer += '</span>';
                } else if (priceViewFlag == "teiki") {
                    // 定期券の表示
                    if (typeof Teiki1Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                        buffer += Teiki1SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:text">' : '';
                        buffer += '\\' + num2String(Teiki1Summary);
                        buffer += Teiki1SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '(1ヵ月)</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------</span>';
                    }
                    if (typeof Teiki3Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                        buffer += Teiki3SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:text">' : '';
                        buffer += '\\' + num2String(Teiki3Summary);
                        buffer += Teiki3SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '(3ヵ月)</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------</span>';
                    }
                    if (typeof Teiki6Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                        buffer += Teiki6SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:text">' : '';
                        buffer += '\\' + num2String(Teiki6Summary);
                        buffer += Teiki6SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '(6ヵ月)</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------</span>';
                    }
                    if (typeof Teiki12Summary != 'undefined') {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price">';
                        buffer += Teiki12SummarySalesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':list:' + String(i + 1) + ':price:text">' : '';
                        buffer += '\\' + num2String(Teiki12Summary);
                        buffer += Teiki12SummarySalesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '(12ヵ月)</span>';
                    } else {
                        buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':price:text">------</span>';
                    }
                }
                // 乗り換え回数
                if (TransferCount > 0) {
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':trans">乗換' + String(TransferCount) + '回</span>';
                } else {
                    buffer += '<span class="exp_value" id="' + baseId + ':list:' + String(i + 1) + ':trans">乗換なし</span>';
                }
            }
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</a>';
        }
        buffer += '</div>';

        return buffer;
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList;
        if (typeof e == 'string') {
            eventIdList = e.split(":");
        } else {
            eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        }
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "resultClose") {
                // ウィンドウを閉じる
                document.getElementById(baseId + ':course').style.display = "none";
                if (typeof callBackFunctionBind['close'] == 'function') {
                    callBackFunctionBind['close'](true);
                }
            } else if (eventIdList[1] == "resultPopup") {
                // 画面外
                document.getElementById(baseId + ':course').style.display = "none";
                if (typeof callBackFunctionBind['close'] == 'function') {
                    callBackFunctionBind['close'](true);
                }
            } else if (eventIdList[1] == "courseSelect" && eventIdList.length >= 3) {
                // 経路選択
                if (courseDisplayAll) {
                    selectNo = parseInt(eventIdList[2]);
                }
                if (windowFlag) {
                    document.getElementById(baseId + ':course').style.display = "none";
                }
                if (typeof callBackFunctionBind['select'] == 'function') {
                    callBackFunctionBind['select'](true);
                }
            } else if (eventIdList[1] == "tab" && eventIdList.length >= 3) {
                if (eventIdList[2] == "list") {
                    // 一覧の表示
                    dispCourseList();
                    if (typeof callBackFunctionBind['click'] == 'function') {
                        callBackFunctionBind['click'](true);
                    }
                } else {
                    // 経路の切り替え
                    changeCourse(sortCourseList[parseInt(eventIdList[2]) - 1].index);
                }
            } else if (eventIdList[1] == "list" && eventIdList.length >= 3) {
                // 経路の切り替え
                changeCourse(sortCourseList[parseInt(eventIdList[2]) - 1].index);
            } else if (eventIdList[1] == "resultSelect" && eventIdList.length >= 2) {
                // 経路の切り替え
                changeCourse(parseInt(document.getElementById(baseId + ':resultSelect').options.item(document.getElementById(baseId + ':resultSelect').selectedIndex).value));
            } else if (eventIdList[1] == "stationMenu" && eventIdList.length >= 5) {
                // 駅メニュー
                if (callBackObjectStation.length > 0) {
                    if (eventIdList[4] == "open") {
                        if (document.getElementById(baseId + ':stationMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display == "none") {
                            document.getElementById(baseId + ':stationMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "block";
                        } else {
                            document.getElementById(baseId + ':stationMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    } else if (eventIdList[3] == "close") {
                        document.getElementById(baseId + ':stationMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                    } else {
                        if (courseDisplayAll) {
                            selectNo = parseInt(eventIdList[2]);
                        }
                        document.getElementById(baseId + ':stationMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        callBackObjectStation[parseInt(eventIdList[4]) - 1].callBack(parseInt(eventIdList[3]));
                    }
                }
            } else if (eventIdList[1] == "lineMenu" && eventIdList.length >= 5) {
                // 路線メニュー
                if (callBackObjectLine.length > 0) {
                    if (eventIdList[4] == "open") {
                        if (document.getElementById(baseId + ':lineMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display == "none") {
                            document.getElementById(baseId + ':lineMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "block";
                        } else {
                            document.getElementById(baseId + ':lineMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    } else if (eventIdList[3] == "close") {
                        document.getElementById(baseId + ':lineMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                    } else {
                        if (courseDisplayAll) {
                            selectNo = parseInt(eventIdList[2]);
                        }
                        document.getElementById(baseId + ':lineMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        callBackObjectLine[parseInt(eventIdList[4]) - 1].callBack(parseInt(eventIdList[3]));
                    }
                }
            } else if (eventIdList[1] == "fareMenu" && eventIdList.length >= 5) {
                // 運賃メニュー
                if (priceChangeFlag) {
                    if (eventIdList[4] == "open") {
                        if (document.getElementById(baseId + ':fareMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display == "none") {
                            document.getElementById(baseId + ':fareMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "block";
                        } else {
                            document.getElementById(baseId + ':fareMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    } else if (eventIdList[4] == "close") {
                        document.getElementById(baseId + ':fareMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                    } else {
                        if (priceChangeFlag) {
                            document.getElementById(baseId + ':fare:' + eventIdList[2] + ':' + eventIdList[3]).value = eventIdList[4];
                            if (courseDisplayAll) {
                                selectNo = parseInt(eventIdList[2]);
                            }
                            changePrice();
                        } else {
                            document.getElementById(baseId + ':fareMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    }
                }
            } else if (eventIdList[1] == "chargeMenu" && eventIdList.length >= 5) {
                // 特急券メニュー
                if (priceChangeFlag) {
                    if (eventIdList[4] == "open") {
                        if (document.getElementById(baseId + ':chargeMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display == "none") {
                            document.getElementById(baseId + ':chargeMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "block";
                        } else {
                            document.getElementById(baseId + ':chargeMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    } else if (eventIdList[4] == "close") {
                        document.getElementById(baseId + ':chargeMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                    } else {
                        if (priceChangeFlag) {
                            document.getElementById(baseId + ':charge:' + eventIdList[2] + ':' + eventIdList[3]).value = eventIdList[4];
                            if (courseDisplayAll) {
                                selectNo = parseInt(eventIdList[2]);
                            }
                            changePrice();
                        } else {
                            document.getElementById(baseId + ':chargeMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    }
                }
            } else if (eventIdList[1] == "teikiMenu" && eventIdList.length >= 5) {
                // 定期券メニュー
                if (priceChangeFlag && priceChangeRefreshFlag) {
                    if (eventIdList[4] == "open") {
                        if (document.getElementById(baseId + ':teikiMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display == "none") {
                            document.getElementById(baseId + ':teikiMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "block";
                        } else {
                            document.getElementById(baseId + ':teikiMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    } else if (eventIdList[4] == "close") {
                        document.getElementById(baseId + ':teikiMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                    } else {
                        if (priceChangeFlag) {
                            document.getElementById(baseId + ':teiki:' + eventIdList[2] + ':' + eventIdList[3]).value = eventIdList[4];
                            if (courseDisplayAll) {
                                selectNo = parseInt(eventIdList[2]);
                            }
                            changePrice();
                        } else {
                            document.getElementById(baseId + ':teikiMenu:' + eventIdList[2] + ':' + eventIdList[3]).style.display = "none";
                        }
                    }
                }
            } else if ((eventIdList[1] == "prevDia" || eventIdList[1] == "prevDia2") && eventIdList.length >= 3) {
                if (courseDisplayAll) {
                    selectNo = parseInt(eventIdList[2]);
                }
                assignDia("prev");
            } else if ((eventIdList[1] == "nextDia" || eventIdList[1] == "nextDia2") && eventIdList.length >= 3) {
                if (courseDisplayAll) {
                    selectNo = parseInt(eventIdList[2]);
                }
                assignDia("next");
            } else if (eventIdList[1] == "link" && eventIdList.length >= 3) {
                if (eventIdList[2] == "resultList") {
                    if (!courseDisplayAll) {
                        dispCourseList();
                    }
                    if (typeof callBackFunctionBind['click'] == 'function') {
                        callBackFunctionBind['click'](true);
                    }
                }
            } else if (eventIdList[1] == "sort" && eventIdList.length >= 3) {
                sortType = eventIdList[2];
                // 最適経路のチェック
                checkCourseList();
                // 経路を出力
                viewResultList();
                if (typeof callBackFunctionBind['click'] == 'function') {
                    callBackFunctionBind['click'](true);
                }
            }
        }
    }

    /**
    * 探索結果をソートする
    */
    function sortCourse(sortType) {
        sortCourseList.sort(function (a, b) {
            if (sortType == "ekispert") {
                if (a.index > b.index) return 1;
                if (a.index < b.index) return -1;
                return 0;
            } else if (sortType == "time") {
                if (resultSearchType == "departure" || resultSearchType == "firstTrain") {
                    if (a.arrival > b.arrival || a.arrival === b.arrival && a.departure < b.departure) return 1;
                    if (a.arrival < b.arrival || a.arrival === b.arrival && a.departure > b.departure) return -1;
                    return 0;
                } else if (resultSearchType == "arrival" || resultSearchType == "lastTrain") {
                    if (a.departure < b.departure || a.departure === b.departure && a.arrival > b.arrival) return 1;
                    if (a.departure > b.departure || a.departure === b.departure && a.arrival < b.arrival) return -1;
                    return 0;
                } else {
                    if (a.timeSummary > b.timeSummary) return 1;
                    if (a.timeSummary < b.timeSummary) return -1;
                    return 0;
                }
            } else if (sortType == "price" && priceViewFlag == "oneway") {
                if (a.priceSummary > b.priceSummary) return 1;
                if (a.priceSummary < b.priceSummary) return -1;
                return 0;
            } else if (sortType == "price" && priceViewFlag == "round") {
                if (a.priceRoundSummary > b.priceRoundSummary) return 1;
                if (a.priceRoundSummary < b.priceRoundSummary) return -1;
                return 0;
            } else if (sortType == "price" && priceViewFlag == "teiki") {
                if (a.teikiSummary > b.teikiSummary) return 1;
                if (a.teikiSummary < b.teikiSummary) return -1;
                return 0;
            } else if (sortType == "transfer") {
                if (a.transferCount > b.transferCount) return 1;
                if (a.transferCount < b.transferCount) return -1;
                return 0;
            } else {
                if (a.index > b.index) return 1;
                if (a.index < b.index) return -1;
                return 0;
            }
        });
    }

    /**
    * 分を時+分表記に変更する
    */
    function fun2ji(num) {
        var hour = Math.floor(num / 60);
        var minute = num % 60;
        if (hour > 0) {
            if (minute == 0) {
                return hour + "時間";
            } else {
                return hour + "時間" + minute + "分";
            }
        } else {
            return minute + "分";
        }
    }

    /**
    * 駅のマーク種別を取得する
    */
    function getStationType(tmpStationType) {
        for (var i = 0; i < tmpStationType.length; i++) {
            if (tmpStationType[i] == "back") {
                return 3; // 戻る
            } else if (tmpStationType[i] == "extension" || tmpStationType[i] == "pass") {
                return 4; // 乗り入れ・通過
            }
        }
        return 2; // 通常
    }

    /**
    * コースオブジェクトを経路に展開
    */
    function viewResultRoute(courseObj, routeNo) {
        var buffer = "";
        buffer += '<div class="exp_route">';
        // 経路一覧に戻るリンク
        if (courseDisplayAll || !resultTab) {
            buffer += '<div class="exp_resultTopLink">';
            buffer += '<a class="exp_resultTopLinkArea" id="' + baseId + ':link:resultList" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':link:resultList:text">経路一覧へ</span></a>';
            buffer += '</div>';
        }
        // サマリー
        buffer += outSummary(courseObj, routeNo);
        // 前後のダイヤで探索
        if (courseObj.dataType == "onTimetable" && assignDiaFlag) {
            buffer += '<div class="exp_routeHeader exp_clearfix">';
            if (agent == 1) {
                buffer += '<div class="exp_assignButton exp_left">';
                buffer += '<a id="' + baseId + ':prevDia:' + String(routeNo) + '" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':prevDia:' + String(routeNo) + ':text">一本前</span></a>';
                buffer += '</div>';
                buffer += '<div class="exp_assignButton exp_right">';
                buffer += '<a id="' + baseId + ':nextDia:' + String(routeNo) + '" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':nextDia:' + String(routeNo) + ':text">一本後</span></a>';
                buffer += '</div>';
            } else if (agent == 2 || agent == 3) {
                buffer += '<span class="exp_assign exp_left"><a class="exp_prev" id="' + baseId + ':prevDia:' + String(routeNo) + '" href="Javascript:void(0);">一本前</a></span>';
                buffer += '<span class="exp_assign exp_right"><a class="exp_next" id="' + baseId + ':nextDia:' + String(routeNo) + '" href="Javascript:void(0);">一本後</a></span>';
            }
            // テキスト
            var DepartureTime, ArrivalTime;
            if (typeof courseObj.Route.Line.length == 'undefined') {
                if (typeof courseObj.Route.Line.DepartureState.Datetime.text != 'undefined') {
                    DepartureTime = convertISOtoDate(courseObj.Route.Line.DepartureState.Datetime.text);
                }
                if (typeof courseObj.Route.Line.ArrivalState.Datetime.text != 'undefined') {
                    ArrivalTime = convertISOtoDate(courseObj.Route.Line.ArrivalState.Datetime.text);
                }
            } else {
                if (typeof courseObj.Route.Line[0].DepartureState.Datetime.text != 'undefined') {
                    DepartureTime = convertISOtoDate(courseObj.Route.Line[0].DepartureState.Datetime.text);
                }
                if (typeof courseObj.Route.Line[courseObj.Route.Line.length - 1].ArrivalState.Datetime.text != 'undefined') {
                    ArrivalTime = convertISOtoDate(courseObj.Route.Line[courseObj.Route.Line.length - 1].ArrivalState.Datetime.text);
                }
            }
            if (agent == 2) {
                buffer += '<div class="exp_headerText">' + String(DepartureTime.getHours()) + ':' + (DepartureTime.getMinutes() < 10 ? '0' : '') + String(DepartureTime.getMinutes()) + '発</div>';
            } else if (agent == 3) {
                buffer += '<div class="exp_headerText">' + String(DepartureTime.getHours()) + ':' + (DepartureTime.getMinutes() < 10 ? '0' : '') + String(DepartureTime.getMinutes()) + '発～' + String(ArrivalTime.getHours()) + ':' + (ArrivalTime.getMinutes() < 10 ? '0' : '') + String(ArrivalTime.getMinutes()) + '着' + '</div>';
            }
            buffer += '</div>';
        }

        // まずは配列を作成
        var point = new Array();
        var line = new Array();
        for (var i = 0; i < courseObj.Route.Point.length; i++) {
            point.push(courseObj.Route.Point[i]);
        }
        if (typeof courseObj.Route.Line.length == 'undefined') {
            line.push(courseObj.Route.Line);
        } else {
            for (var i = 0; i < courseObj.Route.Line.length; i++) {
                line.push(courseObj.Route.Line[i]);
            }
        }
        // 金額の配列
        var fare = new Array();
        var charge = new Array();
        var teiki1 = new Array();
        var teiki3 = new Array();
        var teiki6 = new Array();
        var teiki12 = new Array();
        var teiki = new Array();
        if (typeof courseObj.Price != 'undefined') {
            for (var i = 0; i < courseObj.Price.length; i++) {
                if (courseObj.Price[i].kind == "Fare") {
                    // 乗車券のリスト作成
                    fare.push(courseObj.Price[i]);
                } else if (courseObj.Price[i].kind == "Charge") {
                    // 特急券のリスト作成
                    charge.push(courseObj.Price[i]);
                } else if (courseObj.Price[i].kind == "Teiki1") {
                    // 定期券のリスト作成
                    teiki1.push(courseObj.Price[i]);
                } else if (courseObj.Price[i].kind == "Teiki3") {
                    // 定期券のリスト作成
                    teiki3.push(courseObj.Price[i]);
                } else if (courseObj.Price[i].kind == "Teiki6") {
                    // 定期券のリスト作成
                    teiki6.push(courseObj.Price[i]);
                } else if (courseObj.Price[i].kind == "Teiki12") {
                    // 定期券のリスト作成
                    teiki12.push(courseObj.Price[i]);
                }
            }
        }
        // 複数の定期
        if (typeof courseObj.PassStatus != 'undefined') {
            for (var i = 0; i < courseObj.PassStatus.length; i++) {
                teiki.push(courseObj.PassStatus[i]);
            }
        }
        // 経路本体
        buffer += '<div class="exp_detail exp_clearfix">';
        for (var i = 0; i < point.length; i++) {
            // 金額区間の終了
            if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                // 運賃の終わり
                for (var j = 0; j < fare.length; j++) {
                    if (parseInt(fare[j].toLineIndex) == i && fare[j].selected == "true") {
                        buffer += '</div>';
                        break;
                    }
                }
            } else if (priceViewFlag == "teiki") {
                // 定期券の終わり
                for (var j = 0; j < teiki1.length; j++) {
                    if (parseInt(teiki1[j].toLineIndex) == i && teiki1[j].selected == "true") {
                        buffer += '</div>';
                    }
                }
            }
            // 運賃の出力
            if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                // 乗車券
                var fareList = new Array();
                for (var j = 0; j < fare.length; j++) {
                    // 対象となる乗車券をセット
                    if (parseInt(fare[j].fromLineIndex) == (i + 1)) {
                        fareList.push(fare[j]);
                    }
                }
                if (fareList.length > 0) {
                    // 1つだけ表示
                    for (var j = 0; j < fareList.length; j++) {
                        if (fareList[j].selected == "true") {
                            // 値を出力
                            if (fareList[j].Type == "WithTeiki") {
                                buffer += '<div class="exp_fareTeikiValue">';
                                // buffer += '<div class="exp_cost">定期券区間<div class="exp_top"></div></div>';
                                buffer += '<div class="exp_cost">定期券区間</div>';
                                buffer += '</div>';
                            } else {
                                buffer += '<div class="exp_fareValue">';
                                buffer += '<div class="exp_cost">';
                                var fareName = "";
                                if (typeof fareList[j].Name != 'undefined') {
                                    fareName += fareList[j].Name + (agent == 2 ? "<br>" : "&nbsp;");
                                } else if (fareList.length >= 2) {
                                    fareName += "指定なし" + (agent == 2 ? "<br>" : "&nbsp;");
                                } else {
                                    fareName += "乗車券" + (agent == 2 ? "<br>" : "&nbsp;");
                                }
                                // 運賃改定未対応
                                var salesTaxRateIsNotSupported = false;
                                if (typeof fareList[j].fareRevisionStatus != 'undefined') {
                                    if (fareList[j].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                        salesTaxRateIsNotSupported = true;
                                    }
                                }

                                var attrs = "id=" + baseId + ':fareMenu:' + String(routeNo) + ':' + String(i + 1) + ':open:2';
                                if (priceViewFlag == "oneway") {
                                    fareName += appendRevisionStatusLineClass([fareList[j].RevisionStatus],num2String(getTextValue(fareList[j].Oneway)) + '円', attrs);
                                } else if (priceViewFlag == "round") {
                                    fareName += appendRevisionStatusLineClass([fareList[j].RevisionStatus],num2String(getTextValue(fareList[j].Round)) + '円', attrs);
                                }

                                if (fareList.length >= 2) {
                                    if (agent == 1) {
                                        // 選択している値
                                        buffer += '<input type="hidden" id="' + baseId + ':fare:' + String(routeNo) + ':' + String(i + 1) + '" value="' + fareList[j].index + '">';
                                        // 2つ以上ある場合はメニューのリンクを設置
                                        if (priceChangeFlag) {
                                            buffer += '<span class="exp_priceMenu"><a id="' + baseId + ':fareMenu:' + String(routeNo) + ':' + String(i + 1) + ':open" href="Javascript:void(0);">' + fareName + '▼</a></span>';
                                        } else {
                                            buffer += fareName;
                                        }
                                    } else if (agent == 2 || agent == 3) {
                                        // スマホ・タブレット用
                                        buffer += '<div class="exp_fareSelect">';
                                        buffer += '<div class="exp_fareSelectText">';
                                        buffer += fareName + (priceChangeFlag ? "▼" : "");
                                        buffer += '</div>';
                                        if (priceChangeFlag) {
                                            buffer += '<select id="' + baseId + ':fareSelect:' + String(routeNo) + ':' + fareList[j].fromLineIndex + '">';
                                            for (var k = 0; k < fareList.length; k++) {
                                                buffer += '<option value="' + fareList[k].index + '"' + ((fareList[k].selected == "true") ? "selected" : "") + '>';
                                                if (typeof fareList[k].Name != 'undefined') {
                                                    buffer += fareList[k].Name + ":";
                                                } else {
                                                    buffer += "指定なし:";
                                                }
                                                if (priceViewFlag == "oneway") {
                                                    buffer += num2String(parseInt(getTextValue(fareList[k].Oneway))) + '円';
                                                } else if (priceViewFlag == "round") {
                                                    buffer += num2String(parseInt(getTextValue(fareList[k].Round))) + '円';
                                                }
                                                buffer += '</option>';
                                            }
                                            buffer += '</select>';
                                        }
                                        buffer += '</div>';
                                    }
                                } else {
                                    buffer += fareName;
                                }
                                //              buffer += '<div class="exp_top"></div>';
                                buffer += '</div>';
                                buffer += '</div>';
                            }
                            // メニュー本体
                            if (agent == 1 && fareList.length >= 2) {
                                buffer += '<div class="exp_menu exp_fareWindow" id="' + baseId + ':fareMenu:' + String(routeNo) + ':' + String(i + 1) + '" style="display:none;">';
                                buffer += '<div class="exp_header exp_clearfix">';
                                buffer += '<span class="exp_title">乗車券</span>';
                                buffer += '<span class="exp_close">';
                                buffer += '<a class="exp_link" id="' + baseId + ':fareMenu:' + String(routeNo) + ':' + String(i + 1) + ':close" href="Javascript:void(0);">×</a>';
                                buffer += '</span>';
                                buffer += '</div>';
                                buffer += '<div class="exp_body">';
                                buffer += '<div class="exp_list">';
                                // メニュー
                                for (var k = 0; k < fareList.length; k++) {
                                    buffer += '<div class="exp_item' + (fareList[k].selected == "true" ? " exp_checked" : "") + ' exp_' + (k % 2 == 0 ? 'odd' : 'even') + '">';
                                    buffer += '<a href="Javascript:void(0);" id="' + baseId + ':fareMenu:' + String(routeNo) + ':' + String(i + 1) + ':' + String(fareList[k].index) + '">';
                                    // 金額
                                    if (priceViewFlag == "oneway") {
                                        buffer += num2String(parseInt(getTextValue(fareList[k].Oneway))) + '円';
                                    } else if (priceViewFlag == "round") {
                                        buffer += num2String(parseInt(getTextValue(fareList[k].Round))) + '円';
                                    }
                                    buffer += '</span>';
                                    buffer += ((typeof fareList[k].Name != 'undefined') ? fareList[k].Name : "指定なし") + '&nbsp;</a></div>';
                                }
                                buffer += '</div>';
                                buffer += '</div>';
                                buffer += '</div>';
                            }
                        }
                    }
                }
            } else if (priceViewFlag == "teiki") {
                // 定期券の出力
                var teiki1List = new Array();
                var teiki3List = new Array();
                var teiki6List = new Array();
                var teiki12List = new Array();
                // 対象となる定期券をセット
                for (var j = 0; j < teiki1.length; j++) {
                    if (parseInt(teiki1[j].fromLineIndex) == (i + 1)) {
                        teiki1List.push(teiki1[j]);
                    }
                }
                for (var j = 0; j < teiki3.length; j++) {
                    if (parseInt(teiki3[j].fromLineIndex) == (i + 1)) {
                        teiki3List.push(teiki3[j]);
                    }
                }
                for (var j = 0; j < teiki6.length; j++) {
                    if (parseInt(teiki6[j].fromLineIndex) == (i + 1)) {
                        teiki6List.push(teiki6[j]);
                    }
                }
                for (var j = 0; j < teiki12.length; j++) {
                    if (parseInt(teiki12[j].fromLineIndex) == (i + 1)) {
                        teiki12List.push(teiki12[j]);
                    }
                }
                if (teiki1List.length > 0 || teiki3List.length > 0 || teiki6List.length > 0 || teiki12List.length > 0) {
                    // 1つだけ表示
                    for (var j = 0; j < teiki1List.length; j++) {
                        // 定期のチェック
                        var teikiIndex = 0;
                        var teikiName = "";
                        var teikiKind = "";
                        for (var k = 0; k < teiki.length; k++) {
                            if (teiki[k].teiki1Index == teiki1List[j].index) {
                                // 選択している値
                                if (teiki[k].selected == "true") {
                                    teikiIndex = k + 1;
                                    teikiName = teiki[k].Name;
                                    teikiKind = teiki[k].kind;
                                }
                            }
                        }
                        // 値を出力
                        buffer += '<div class="exp_teikiValue">';
                        buffer += '<div class="exp_cost">';
                        buffer += '<div class="exp_name">';
                        if (agent == 1) {
                            if (teikiIndex == 0 || !priceChangeFlag || !priceChangeRefreshFlag) {
                                buffer += (teikiName != "" ? teikiName : "定期");
                            } else {
                                // 2つ以上ある場合はメニューのリンクを設置
                                buffer += '<span class="exp_priceMenu"><a id="' + baseId + ':teikiMenu:' + String(routeNo) + ':' + String(i + 1) + ':open" href="Javascript:void(0);">' + (teikiName != "" ? teikiName : "定期") + '▼</a></span>';
                            }
                        } else if (agent == 2 || agent == 3) {
                            if (teikiIndex == 0 || !priceChangeFlag || !priceChangeRefreshFlag) {
                                buffer += (teikiName != "" ? teikiName : "定期");
                            } else {
                                // 定期が複数あった場合のフォーム出力
                                buffer += '<div class="exp_teikiSelect">';
                                buffer += '<div class="exp_teikiSelectText">' + teikiName + '▼</div>';
                                buffer += '<input type="hidden" id="' + baseId + ':teikiKind:' + String(routeNo) + ':' + String(i + 1) + '" value="' + teikiKind + '">';
                                buffer += '<select id="' + baseId + ':teikiSelect:' + String(routeNo) + ':' + String(i + 1) + '" value="' + String(teikiIndex) + '">';
                                for (var k = 0; k < teiki.length; k++) {
                                    if (teiki[k].teiki1Index == teiki1List[j].index) {
                                        buffer += '<option value="' + String(k + 1) + '"' + (teiki[k].selected == "true" ? " selected" : "") + '>';
                                        buffer += String(teiki[k].Name);
                                        buffer += '</option>';
                                    }
                                }
                                buffer += '</select>';
                                buffer += '</div>';
                            }
                        }
                        buffer += '</div>';
                        buffer += '<div class="exp_teiki1">' + (agent != 2 ? '1ヵ月' : '');
                        if (typeof teiki1List[j] != 'undefined') {
                            if (getTextValue(teiki1List[j].Name) != "") {
                                buffer += appendRevisionStatusLineClass([teiki1List[j].RevisionStatus], getTextValue(teiki1List[j].Name), '');
                            } else {
                                buffer += appendRevisionStatusLineClass([teiki1List[j].RevisionStatus], num2String(parseInt(getTextValue(teiki1List[j].Oneway))) + '円', '');
                            }
                        } else {
                            buffer += '------円';
                        }
                        buffer += '</div>';
                        buffer += '<div class="exp_teiki3">' + (agent != 2 ? '3ヵ月' : '');
                        if (typeof teiki3List[j] != 'undefined') {
                            if (getTextValue(teiki3List[j].Name) != "") {
                                buffer += appendRevisionStatusLineClass([teiki3List[j].RevisionStatus], getTextValue(teiki3List[j].Name), '');
                            } else {
                                buffer += appendRevisionStatusLineClass([teiki3List[j].RevisionStatus], num2String(parseInt(getTextValue(teiki3List[j].Oneway))) + '円', '');
                            }
                        } else {
                            buffer += '------円';
                        }
                        buffer += '</div>';
                        buffer += '<div class="exp_teiki6">' + (agent != 2 ? '6ヵ月' : '');
                        if (typeof teiki6List[j] != 'undefined') {
                            if (getTextValue(teiki6List[j].Name) != "") {
                                buffer += appendRevisionStatusLineClass([teiki6List[j].RevisionStatus], getTextValue(teiki6List[j].Name), '');
                            } else {
                                buffer += appendRevisionStatusLineClass([teiki6List[j].RevisionStatus], num2String(parseInt(getTextValue(teiki6List[j].Oneway))) + '円', '');
                            }
                        } else {
                            buffer += '------円';
                        }
                        buffer += '</div>';
                        buffer += '<div class="exp_teiki12">' + (agent != 2 ? '12ヵ月' : '');
                        if (typeof teiki12List[j] != 'undefined') {
                            if (getTextValue(teiki12List[j].Name) != "") {
                                buffer += appendRevisionStatusLineClass([teiki12List[j].RevisionStatus], getTextValue(teiki12List[j].Name), '');
                            } else {
                                buffer += appendRevisionStatusLineClass([teiki12List[j].RevisionStatus], num2String(parseInt(getTextValue(teiki12List[j].Oneway))) + '円', '');
                            }
                        } else {
                            buffer += '------円';
                        }
                        buffer += '</div>';
                        //          buffer += '<div class="exp_top"></div>';
                        buffer += '</div>';
                        buffer += '</div>';
                        if (teikiIndex > 0) {
                            if (agent == 1) {
                                buffer += '<input type="hidden" id="' + baseId + ':teiki:' + String(routeNo) + ':' + String(i + 1) + '" value="' + String(teikiIndex) + '">';
                                // タイプを入れる
                                buffer += '<input type="hidden" id="' + baseId + ':teikiKind:' + String(routeNo) + ':' + String(i + 1) + '" value="' + teikiKind + '">';
                                // メニュー本体
                                buffer += '<div class="exp_menu exp_teikiWindow" id="' + baseId + ':teikiMenu:' + String(routeNo) + ':' + String(i + 1) + '" style="display:none;">';
                                buffer += '<div class="exp_header exp_clearfix">';
                                buffer += '<span class="exp_title">定期</span>';
                                buffer += '<span class="exp_close">';
                                buffer += '<a class="exp_link" id="' + baseId + ':teikiMenu:' + String(routeNo) + ':' + String(i + 1) + ':close" href="Javascript:void(0);">×</a>';
                                buffer += '</span>';
                                buffer += '</div>';
                                buffer += '<div class="exp_body">';
                                buffer += '<div class="exp_list">';
                                // メニュー
                                var menuCount = 0;
                                for (var k = 0; k < teiki.length; k++) {
                                    if (teiki[k].teiki1Index == teiki1List[j].index) {
                                        buffer += '<div class="exp_item' + (teiki[k].selected == "true" ? " exp_checked" : "") + ' exp_' + (menuCount % 2 == 0 ? 'odd' : 'even') + '"><a href="Javascript:void(0);" id="' + baseId + ':teikiMenu:' + String(routeNo) + ':' + String(i + 1) + ':' + String(k + 1) + '">&nbsp;' + String(teiki[k].Name) + '&nbsp;</a></div>';
                                        menuCount++;
                                    }
                                }
                                buffer += '</div>';
                                buffer += '</div>';
                                buffer += '</div>';
                            }
                        }
                    }
                }
            }

            // 駅の出力
            var stationType = "transfer";
            if (i == 0) {
                stationType = "start";
            } else if (i == point.length - 1) {
                stationType = "end";
            }
            buffer += outStation(routeNo, i, point[i], line[i - 1], line[i], courseObj.dataType, stationType);
            // 運賃の開始
            if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                if (fareList.length > 0) {
                    buffer += '<div class="exp_priceSection">';
                    buffer += '<div class="exp_priceData">';
                    if (fareList[0].Type == "WithTeiki") {
                        buffer += '<div class="exp_teiki">';
                    } else {
                        buffer += '<div class="exp_fare">';
                    }
                    buffer += '<div class="exp_bar"><div class="exp_base"><div class="exp_color"></div></div></div>';
                    //buffer += '<div class="exp_end"></div>';
                    buffer += '</div>';
                    buffer += '</div>';
                }
            } else if (priceViewFlag == "teiki") {
                if (teiki1List.length > 0 || teiki3List.length > 0 || teiki6List.length > 0 || teiki12List.length > 0) {
                    buffer += '<div class="exp_priceSection">';
                    buffer += '<div class="exp_priceData">';
                    buffer += '<div class="exp_teiki">';
                    buffer += '<div class="exp_bar"><div class="exp_base"><div class="exp_color"></div></div></div>';
                    //buffer += '<div class="exp_end"></div>';
                    buffer += '</div>';
                    buffer += '</div>';
                }
            }
            // 路線の出力
            if (typeof line[i] != 'undefined') {
                var chargeList = new Array();
                // 特急券の設定
                if (priceViewFlag == "oneway" || priceViewFlag == "round") {
                    for (var j = 0; j < charge.length; j++) {
                        // 対象となる特急券をセット
                        if (parseInt(charge[j].fromLineIndex) == (i + 1)) {
                            chargeList.push(charge[j]);
                        }
                    }
                }
                // 出力
                buffer += outLine(routeNo, i, line[i], chargeList);
            }
        }

        // フッター
        if (agent == 2 || agent == 3) {
            if (courseObj.dataType == "onTimetable" && assignDiaFlag) {
                buffer += '<div class="exp_routeHeader exp_clearfix">';
                buffer += '<span class="exp_assign exp_right"><a class="exp_next" id="' + baseId + ':nextDia2:' + String(routeNo) + '" href="Javascript:void(0);">一本後</a></span>';
                buffer += '<span class="exp_assign exp_left"><a class="exp_prev" id="' + baseId + ':prevDia2:' + String(routeNo) + '" href="Javascript:void(0);">一本前</a></span>';
                // テキスト
                var DepartureTime, ArrivalTime;
                if (typeof courseObj.Route.Line.length == 'undefined') {
                    if (typeof courseObj.Route.Line.DepartureState.Datetime.text != 'undefined') {
                        DepartureTime = convertISOtoDate(courseObj.Route.Line.DepartureState.Datetime.text);
                    }
                    if (typeof courseObj.Route.Line.ArrivalState.Datetime.text != 'undefined') {
                        ArrivalTime = convertISOtoDate(courseObj.Route.Line.ArrivalState.Datetime.text);
                    }
                } else {
                    if (typeof courseObj.Route.Line[0].DepartureState.Datetime.text != 'undefined') {
                        DepartureTime = convertISOtoDate(courseObj.Route.Line[0].DepartureState.Datetime.text);
                    }
                    if (typeof courseObj.Route.Line[courseObj.Route.Line.length - 1].ArrivalState.Datetime.text != 'undefined') {
                        ArrivalTime = convertISOtoDate(courseObj.Route.Line[courseObj.Route.Line.length - 1].ArrivalState.Datetime.text);
                    }
                }
                if (agent == 2) {
                    buffer += '<div class="exp_headerText">' + String(ArrivalTime.getHours()) + ':' + (ArrivalTime.getMinutes() < 10 ? '0' : '') + String(ArrivalTime.getMinutes()) + '着' + '</div>';
                } else if (agent == 3) {
                    buffer += '<div class="exp_headerText">' + String(DepartureTime.getHours()) + ':' + (DepartureTime.getMinutes() < 10 ? '0' : '') + String(DepartureTime.getMinutes()) + '発～' + String(ArrivalTime.getHours()) + ':' + (ArrivalTime.getMinutes() < 10 ? '0' : '') + String(ArrivalTime.getMinutes()) + '着' + '</div>';
                }
                buffer += '</div>';
            }
        }
        // 確定ボタン
        if (typeof callBackFunctionBind['select'] == 'function') {
            buffer += '<div class="exp_footer">';
            buffer += '<div class="exp_resultSelect">';
            buffer += '<a class="exp_resultSelectButton" id="' + baseId + ':courseSelect:' + String(routeNo) + '" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':courseSelect:' + String(routeNo) + ':text">経路確定</span></a>';
            buffer += '</div>';
            buffer += '</div>';
        }
        buffer += '</div>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * サマリーを出力
    */
    function outSummary(courseObj, routeNo) {
        var buffer = "";
        buffer += '<div class="exp_summary exp_clearfix">';
        buffer += '<div class="exp_row">';
        // 経路番号
        buffer += '<span class="exp_titleRouteNo">経路' + ((typeof routeNo != 'undefined') ? getCourseNo(routeNo) : "") + '</span>';
        // 出発日・到着日
        var departureDate;
        var arrivalDate;
        var week = new Array('日', '月', '火', '水', '木', '金', '土');
        if (typeof courseObj.Route.Line.length == 'undefined') {
            departureDate = convertISOtoDate(courseObj.Route.Line.DepartureState.Datetime.text);
            arrivalDate = convertISOtoDate(courseObj.Route.Line.ArrivalState.Datetime.text);
        } else {
            departureDate = convertISOtoDate(courseObj.Route.Line[0].DepartureState.Datetime.text);
            arrivalDate = convertISOtoDate(courseObj.Route.Line[courseObj.Route.Line.length - 1].ArrivalState.Datetime.text);
        }
        buffer += '<span class="exp_date">' + departureDate.getFullYear() + '年' + (departureDate.getMonth() + 1) + '月' + departureDate.getDate() + '日' + '(' + week[departureDate.getDay()] + ')</span>';
        // アイコン
        var time = parseInt(courseObj.Route.timeOnBoard) + parseInt(courseObj.Route.timeWalk) + parseInt(courseObj.Route.timeOther);
        var TransferCount = parseInt(courseObj.Route.transferCount);
        var FareSummary = 0;
        var FareRoundSummary = 0;
        var ChargeSummary;
        var ChargeRoundSummary;
        var Teiki1Summary;
        var Teiki3Summary;
        var Teiki6Summary;
        var Teiki12Summary;
        // 運賃改定未対応
        var FareSummarySalesTaxRateIsNotSupported = false;
        var ChargeSummarySalesTaxRateIsNotSupported = false;
        var Teiki1SummarySalesTaxRateIsNotSupported = false;
        var Teiki3SummarySalesTaxRateIsNotSupported = false;
        var Teiki6SummarySalesTaxRateIsNotSupported = false;
        var Teiki12SummarySalesTaxRateIsNotSupported = false;
        // 事業者の金額改定への対応状況
        var FareSummaryRevisionStatus = undefined;
        var ChargeSummaryRevisionStatus = undefined;
        var Teiki1SummaryRevisionStatus = undefined;
        var Teiki3SummaryRevisionStatus = undefined;
        var Teiki6SummaryRevisionStatus = undefined;
        var Teiki12SummaryRevisionStatus = undefined;

        // 事業者の金額改定への対応状況を判定するための配列
        var FareSummaryRevisionStatusResults = [];
        var ChargeSummaryRevisionStatusResults = [];
        var Teiki1SummaryRevisionStatusResults = [];
        var Teiki3SummaryRevisionStatusResults = [];
        var Teiki6SummaryRevisionStatusResults = [];
        var Teiki12SummaryRevisionStatusResults = [];

        if (typeof courseObj.Price != 'undefined') {
            for (var j = 0; j < courseObj.Price.length; j++) {
                if (courseObj.Price[j].kind == "FareSummary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        FareSummary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                    if (typeof courseObj.Price[j].Round != 'undefined') {
                        FareRoundSummary = parseInt(getTextValue(courseObj.Price[j].Round));
                    }
                } else if (courseObj.Price[j].kind == "ChargeSummary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        ChargeSummary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                    if (typeof courseObj.Price[j].Round != 'undefined') {
                        ChargeRoundSummary = parseInt(getTextValue(courseObj.Price[j].Round));
                    }
                } else if (courseObj.Price[j].kind == "Teiki1Summary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        Teiki1Summary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                } else if (courseObj.Price[j].kind == "Teiki3Summary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        Teiki3Summary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                } else if (courseObj.Price[j].kind == "Teiki6Summary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        Teiki6Summary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                } else if (courseObj.Price[j].kind == "Teiki12Summary") {
                    if (typeof courseObj.Price[j].Oneway != 'undefined') {
                        Teiki12Summary = parseInt(getTextValue(courseObj.Price[j].Oneway));
                    }
                } else {
                    if (typeof courseObj.Price[j].fareRevisionStatus != 'undefined') {
                        if (courseObj.Price[j].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                            if (courseObj.Price[j].kind == "Fare") {
                                FareSummarySalesTaxRateIsNotSupported = true;
                            } else if (courseObj.Price[j].kind == "Charge") {
                                ChargeSummarySalesTaxRateIsNotSupported = true;
                            } else if (courseObj.Price[j].kind == "Teiki1") {
                                Teiki1SummarySalesTaxRateIsNotSupported = true;
                            } else if (courseObj.Price[j].kind == "Teiki3") {
                                Teiki3SummarySalesTaxRateIsNotSupported = true;
                            } else if (courseObj.Price[j].kind == "Teiki6") {
                                Teiki6SummarySalesTaxRateIsNotSupported = true;
                            } else if (courseObj.Price[j].kind == "Teiki12") {
                                Teiki12SummarySalesTaxRateIsNotSupported = true;
                            }
                        }
                    }
                    if (typeof courseObj.Price[j].RevisionStatus != 'undefined') {
                        if (courseObj.Price[j].kind == "Fare") {
                            FareSummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        } else if (courseObj.Price[j].kind == "Charge") {
                            ChargeSummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        } else if (courseObj.Price[j].kind == "Teiki1") {
                            Teiki1SummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        } else if (courseObj.Price[j].kind == "Teiki3") {
                            Teiki3SummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        } else if (courseObj.Price[j].kind == "Teiki6") {
                            Teiki6SummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        } else if (courseObj.Price[j].kind == "Teiki12") {
                            Teiki12SummaryRevisionStatusResults.push(courseObj.Price[j].RevisionStatus);
                        }
                    }
                }
            }
        }

        var salesTaxRateIsNotSupported = (FareSummarySalesTaxRateIsNotSupported || ChargeSummarySalesTaxRateIsNotSupported);
        // アイコン
        buffer += '<div class="exp_mark exp_clearfix">';
        if (typeof minEkispertIndex != 'undefined') {
            if (getDepartureState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getDepartureState(courseObj).getTime() && getArrivalState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getArrivalState(courseObj).getTime()) {
                buffer += '<span class="exp_hayai"></span>';
            }
        } else if (minTimeSummary == time) {
            buffer += '<span class="exp_hayai"></span>';
        }
        if (priceViewFlag == "oneway") {
            if (typeof ChargeSummary == 'undefined') {
                if (minPriceSummary == FareSummary) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            } else {
                if (minPriceSummary == (FareSummary + ChargeSummary)) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            }
        } else if (priceViewFlag == "round") {
            if (typeof ChargeRoundSummary == 'undefined') {
                if (minPriceRoundSummary == FareRoundSummary) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            } else {
                if (minPriceRoundSummary == (FareRoundSummary + ChargeRoundSummary)) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            }
        } else if (priceViewFlag == "teiki") {
            if (typeof Teiki6Summary != 'undefined') {
                if (minTeikiSummary == Teiki6Summary) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            } else if (typeof Teiki3Summary != 'undefined') {

                if (minTeikiSummary == Teiki3Summary * 2) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            } else if (typeof Teiki1Summary != 'undefined') {
                if (minTeikiSummary == Teiki1Summary * 6) {
                    buffer += '<span class="exp_yasui"></span>';
                }
            }
        }
        if (minTransferCount == TransferCount) {
            buffer += '<span class="exp_raku"></span>';
        }
        buffer += '</div>';
        buffer += '</div>';
        // セパレータ
        buffer += '<div class="exp_row exp_line">';
        buffer += '<span class="exp_title">所要時間</span>';
        buffer += '<span class="exp_value">';
        buffer += fun2ji(parseInt(courseObj.Route.timeOnBoard) + parseInt(courseObj.Route.timeWalk) + parseInt(courseObj.Route.timeOther));
        if (agent == 1 || agent == 3) {
            var tmp_timeStr = "";
            var timeCount = 0;
            // スマートフォンは非表示
            if (typeof courseObj.Route.timeOnBoard != 'undefined') {
                if (parseInt(courseObj.Route.timeOnBoard) > 0) {
                    tmp_timeStr += '乗車&nbsp;' + parseInt(courseObj.Route.timeOnBoard) + '分';
                    timeCount++;
                }
            }
            if (typeof courseObj.Route.timeOther != 'undefined') {
                if (parseInt(courseObj.Route.timeOther) > 0) {
                    if (tmp_timeStr != "") { tmp_timeStr += "、"; }
                    tmp_timeStr += '他&nbsp;' + parseInt(courseObj.Route.timeOther) + '分';
                    timeCount++;
                }
            }
            if (typeof courseObj.Route.timeWalk != 'undefined') {
                if (parseInt(courseObj.Route.timeWalk) > 0) {
                    if (tmp_timeStr != "") { tmp_timeStr += "、"; }
                    tmp_timeStr += '徒歩&nbsp;' + parseInt(courseObj.Route.timeWalk) + '分';
                    timeCount++;
                }
            }
            if (timeCount >= 2) {
                buffer += '<span class="exp_valueDetail">';
                buffer += "(" + tmp_timeStr + ")";
                buffer += '</span>';
            }
        }
        buffer += '</span>';
        buffer += '<span class="exp_title">距離</span>';
        buffer += '<span class="exp_value">';
        if (parseInt(courseObj.Route.distance) >= 10) {
            buffer += (parseInt(courseObj.Route.distance) / 10) + "km";
        } else {
            buffer += parseInt(courseObj.Route.distance) * 100 + "m";
        }
        buffer += '</span>';
        if (priceViewFlag == "teiki") {
            buffer += '<span class="exp_title">乗り換え</span>';
            buffer += '<span class="exp_value">';
            if (TransferCount > 0) {
                buffer += String(TransferCount) + '回';
            } else {
                buffer += 'なし';
            }
            buffer += '</span>';
        }
        buffer += '</div>';
        // 改行
        buffer += '<div class="exp_row">';
        if (priceViewFlag == "oneway") {
            buffer += '<span class="exp_title">運賃</span>';
            buffer += '<span class="exp_value">';
            if (typeof ChargeSummary == 'undefined') {
                buffer += appendRevisionStatusClass(FareSummaryRevisionStatusResults,FareSummary);
            } else {
                buffer += appendRevisionStatusClass(FareSummaryRevisionStatusResults.concat(ChargeSummaryRevisionStatusResults),(FareSummary+ChargeSummary));
                if (agent == 1 || agent == 3) {
                    buffer += '<span class="exp_valueDetail">';
                    buffer += '(乗車券&nbsp;' + num2String(FareSummary) + '円&nbsp;料金' + num2String(ChargeSummary) + '円)';
                    buffer += '</span>';
                }
            }
            buffer += '</span>';
        } else if (priceViewFlag == "round") {
            buffer += '<span class="exp_title">往復運賃</span>';
            buffer += '<span class="exp_value">';
            if (typeof ChargeSummary == 'undefined') {
                buffer += appendRevisionStatusClass(FareSummaryRevisionStatusResults,FareRoundSummary);
            } else {
                buffer += appendRevisionStatusClass(FareSummaryRevisionStatusResults,FareRoundSummary + ChargeRoundSummary);

                if (agent == 1 || agent == 3) {
                    buffer += '<span class="exp_detail">';
                    buffer += '(乗車券&nbsp;' + num2String(FareRoundSummary) + '円&nbsp;料金' + num2String(ChargeRoundSummary) + '円)';
                    buffer += '</span>';
                }
            }
            buffer += '</span>';
        } else if (priceViewFlag == "teiki") {
            buffer += '<span class="exp_titleTeiki1">定期1ヵ月</span>';
            buffer += '<span class="exp_value">';
            if (typeof Teiki1Summary != 'undefined') {
                buffer += appendRevisionStatusClass(Teiki1SummaryRevisionStatusResults,Teiki1Summary);
            } else {
                buffer += '------円';
            }
            buffer += '</span>';
            buffer += '<span class="exp_titleTeiki3">定期3ヵ月</span>';
            buffer += '<span class="exp_value">';
            if (typeof Teiki3Summary != 'undefined') {
                buffer += appendRevisionStatusClass(Teiki3SummaryRevisionStatusResults,Teiki3Summary);
            } else {
                buffer += '------円';
            }
            buffer += '</span>';
            buffer += '<span class="exp_titleTeiki6">定期6ヵ月</span>';
            buffer += '<span class="exp_value">';
            if (typeof Teiki6Summary != 'undefined') {
                buffer += appendRevisionStatusClass(Teiki6SummaryRevisionStatusResults,Teiki6Summary);
            } else {
                buffer += '------円';
            }
            buffer += '</span>';
            buffer += '<span class="exp_titleTeiki12">定期12ヵ月</span>';
            buffer += '<span class="exp_value">';
            if (typeof Teiki12Summary != 'undefined') {
                buffer += appendRevisionStatusClass(Teiki12SummaryRevisionStatusResults,Teiki12Summary);
            } else {
                buffer += '------円';
            }
            buffer += '</span>';
        }
        if (priceViewFlag == "oneway" || priceViewFlag == "round") {
            buffer += '<span class="exp_title">乗り換え</span>';
            buffer += '<span class="exp_value">';
            if (TransferCount > 0) {
                buffer += String(TransferCount) + '回';
            } else {
                buffer += 'なし';
            }
            buffer += '</span>';
        }

        buffer += '</div>';
        buffer += '</div>';
        // 運賃改定未対応
        if (priceViewFlag == "oneway" || priceViewFlag == "round") {
            if (salesTaxRateIsNotSupported) {
                buffer += '<div class="exp_fareRevisionStatus exp_clearfix">';
                buffer += '赤色の金額は、消費税率変更に未対応です。';
                buffer += '</div>';
            }

            // 運賃改定状況に「見込み」(forecast)を含むものがあった場合にメッセージを出力する。
            if (checkArray(FareSummaryRevisionStatusResults, 'forecast') != -1) {
                buffer += '<div class="exp_RevisionStatus exp_clearfix">';
                buffer += '青色の金額は、「駅すぱあと」が予測した運賃改定後の見込の金額です。';
                buffer += '</div>';
            }
        } else if (priceViewFlag == "teiki") {
            if (Teiki1SummarySalesTaxRateIsNotSupported || Teiki3SummarySalesTaxRateIsNotSupported || Teiki6SummarySalesTaxRateIsNotSupported || Teiki12SummarySalesTaxRateIsNotSupported) {
                buffer += '<div class="exp_fareRevisionStatus exp_clearfix">';
                buffer += '赤色の金額は、消費税率変更に未対応です。';
                buffer += '</div>';
            }

            if (checkArray(Teiki1SummaryRevisionStatusResults, 'forecast') != -1 ||
                checkArray(Teiki3SummaryRevisionStatusResults, 'forecast') != -1 ||
                checkArray(Teiki6SummaryRevisionStatusResults, 'forecast') != -1 ||
                checkArray(Teiki12SummaryRevisionStatusResults, 'forecast') != -1) {
                buffer += '<div class="exp_RevisionStatus exp_clearfix">';
                buffer += '青色の金額は、「駅すぱあと」が予測した運賃改定後の見込の金額です。';
                buffer += '</div>';
            }
        }

        return buffer;
    }

    /**
    * 駅を出力
    */
    function outStation(routeNo, index, point, arrLine, depLine, dataType, stationType) {
        var buffer = "";
        // 駅
        buffer += '<div class="exp_point exp_' + stationType + ' exp_clearfix">';
        // 到着時刻
        var type = "";
        var ArrivalStateFlag = false;
        var ArrivalState;
        if (typeof arrLine != 'undefined') {
            if (typeof arrLine.Type != 'undefined') {
                // タイプがある
                type = getTextValue(arrLine.Type);
            }
            if (dataType == "onTimetable" && type != "walk") {
                // 徒歩以外は出力
                if (typeof arrLine.ArrivalState != 'undefined') {
                    if (typeof arrLine.ArrivalState.Datetime.text != 'undefined') {
                        ArrivalState = convertISOtoDate(arrLine.ArrivalState.Datetime.text);
                        ArrivalStateFlag = true;
                    }
                }
            }
        }
        // 出発時刻
        var DepartureStateFlag = false;
        var DepartureState;
        if (typeof depLine != 'undefined') {
            if (typeof depLine.Type != 'undefined') {
                // タイプがある
                type = getTextValue(depLine.Type);
            }
            if (dataType == "onTimetable" && type != "walk") {
                // 徒歩以外は出力
                if (typeof depLine.DepartureState != 'undefined') {
                    if (typeof depLine.DepartureState.Datetime.text != 'undefined') {
                        DepartureState = convertISOtoDate(depLine.DepartureState.Datetime.text);
                        DepartureStateFlag = true;
                    }
                }
            }
        }
        // 発着時刻
        if (ArrivalStateFlag && DepartureStateFlag) {
            buffer += '<div class="exp_time exp_both">';
        } else if (ArrivalStateFlag) {
            buffer += '<div class="exp_time exp_arrivalOnly">';
        } else if (DepartureStateFlag) {
            buffer += '<div class="exp_time exp_departureOnly">';
        } else if (dataType == "onTimetable") {
            buffer += '<div class="exp_time exp_noData">&nbsp;';
        } else {
            buffer += '<div>';
        }
        if (typeof ArrivalState != 'undefined') {
            buffer += '<div class="exp_arrival">' + convertDate2TimeString(ArrivalState, arrLine.TimeReliability) + '</div>';
        }
        if (typeof DepartureState != 'undefined') {
            buffer += '<div class="exp_departure">' + convertDate2TimeString(DepartureState, depLine.TimeReliability) + '</div>';
        }
        buffer += '</div>';
        // 駅アイコン
        if (dataType == "onTimetable") {
            buffer += '<div class="exp_stationIcon">';
        } else {
            buffer += '<div class="exp_stationIconPlain">';
        }
        // 駅のマーク
        if (typeof arrLine == 'undefined' || typeof depLine == 'undefined') {
            buffer += '<div class="exp_edge"></div>';
        } else {
            var tmpStationType = new Array();
            if (typeof depLine.DepartureState.Type == 'string') {
                tmpStationType.push(depLine.DepartureState.Type);
            } else {
                for (var stType = 0; stType < depLine.DepartureState.Type.length; stType++) {
                    tmpStationType.push(depLine.DepartureState.Type[stType].text);
                }
            }
            stationType = getStationType(tmpStationType);
            // 駅のマークを出力
            if (stationType == 2) {
                buffer += '<div class="exp_none"></div>';
            } else if (stationType == 3) {
                buffer += '<div class="exp_back"></div>';
            } else if (stationType == 4) {
                buffer += '<div class="exp_extend"></div>';
            }
        }
        buffer += '</div>';
        // 駅名
        buffer += '<div class="exp_station">';
        if (stationType == "start" && typeof fromName != 'undefined') {
            buffer += sanitaize(fromName);
        } else if (stationType == "end" && typeof toName != 'undefined') {
            buffer += sanitaize(toName);
        } else if (typeof point.Station != 'undefined') {
            buffer += point.Station.Name;
        } else if (typeof point.Name != 'undefined') {
            if (point.Name.split(",")[2] == "tokyo") {
                buffer += "座標情報";
            } else {
                buffer += point.Name;
            }
        }
        // メニューリスト作成
        if (callBackObjectStation.length > 0) {
            buffer += '<span class="exp_stationMenu"><a id="' + baseId + ':stationMenu:' + String(routeNo) + ':' + String(index + 1) + ':open" href="Javascript:void(0);">&nbsp;&nbsp;</a></span>';
        }
        buffer += '</div>';
        buffer += '</div>';
        // メニュー本体
        if (callBackObjectStation.length > 0) {
            buffer += '<div class="exp_menu exp_stationWindow" id="' + baseId + ':stationMenu:' + String(routeNo) + ':' + String(index + 1) + '" style="display:none;">';
            buffer += '<div class="exp_header exp_clearfix">';
            buffer += '<span class="exp_title">駅情報</span>';
            buffer += '<span class="exp_close">';
            buffer += '<a class="exp_link" id="' + baseId + ':stationMenu:' + String(routeNo) + ':' + String(index + 1) + ':close" href="Javascript:void(0);">×</a>';
            buffer += '</span>';
            buffer += '</div>';
            buffer += '<div class="exp_body">';
            buffer += '<div class="exp_list">';
            // メニュー
            for (var i = 0; i < callBackObjectStation.length; i++) {
                buffer += '<div class="exp_item exp_' + (i % 2 == 0 ? 'odd' : 'even') + '"><a href="Javascript:void(0);" id="' + baseId + ':stationMenu:' + String(routeNo) + ':' + String(index + 1) + ':' + String(i + 1) + '">&nbsp;' + String(callBackObjectStation[i].text) + '&nbsp;</a></div>';
            }
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        }
        return buffer;
    }

    /**
    * 路線を出力
    */
    function outLine(routeNo, index, line, chargeList) {
        var buffer = "";
        var type;
        if (typeof line.Type != 'undefined') {
            // タイプがある
            type = getTextValue(line.Type);
        }
        // 路線メニュー本体
        if (callBackObjectLine.length > 0) {
            buffer += '<div class="exp_menu exp_lineWindow" id="' + baseId + ':lineMenu:' + String(routeNo) + ':' + String(index + 1) + '" style="display:none;">';
            buffer += '<div class="exp_header exp_clearfix">';
            buffer += '<span class="exp_title">路線情報</span>';
            buffer += '<span class="exp_close">';
            buffer += '<a class="exp_link" id="' + baseId + ':lineMenu:' + String(routeNo) + ':' + String(index + 1) + ':close" href="Javascript:void(0);">×</a>';
            buffer += '</span>';
            buffer += '</div>';
            buffer += '<div class="exp_body">';
            buffer += '<div class="exp_list">';
            // メニュー
            for (var i = 0; i < callBackObjectLine.length; i++) {
                buffer += '<div class="exp_item exp_' + (i % 2 == 0 ? 'odd' : 'even') + '"><a href="Javascript:void(0);" id="' + baseId + ':lineMenu:' + String(routeNo) + ':' + String(index + 1) + ':' + String(i + 1) + '">&nbsp;' + String(callBackObjectLine[i].text) + '&nbsp;</a></div>';
            }
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        }

        // 路線
        if (chargeList.length > 0) {
            buffer += '<div class="exp_line exp_charge exp_clearfix">';
        } else {
            buffer += '<div class="exp_line exp_normal exp_clearfix">';
        }
        // 縦の線
        buffer += '<div class="exp_bar">';
        buffer += '<div class="exp_base">';
        var R = Math.floor(parseInt(line.Color, 10) / 1000000).toString(16);
        var G = (Math.floor(parseInt(line.Color, 10) / 1000) % 1000).toString(16);
        var B = (parseInt(line.Color, 10) % 1000).toString(16);
        buffer += '<div class="exp_color" style="background-color:#' + (R.length == 1 ? '0' + R : R) + (G.length == 1 ? '0' + G : G) + (B.length == 1 ? '0' + B : B) + ';"></div>';
        buffer += '</div>';
        buffer += '</div>';

        if (agent == 1) {
            // PC用の情報表示
            buffer += '<div class="exp_data">';
            buffer += '<div class="exp_info">';
            buffer += '<div class="exp_cell">';
            if (parseInt(line.timeOnBoard) > 0) {
                buffer += '<div class="exp_timeOnBoard">' + line.timeOnBoard + '分</div>';
            }
            if (parseInt(line.stopStationCount) > 0) {
                buffer += '<div class="exp_stopStationCount">' + line.stopStationCount + '駅</div>';
            }
            if (parseInt(line.distance) > 0) {
                if (parseInt(line.distance) >= 10) {
                    buffer += '<div class="exp_distance">' + (parseInt(line.distance) / 10) + 'km</div>';
                } else {
                    buffer += '<div class="exp_distance">' + parseInt(line.distance) * 100 + 'm</div>';
                }
            }
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        } else if (agent == 2 || agent == 3) {
            // スマホ・タブレット用のアイコン
            buffer += '<div class="exp_iconArea">';
            buffer += '<div class="exp_iconCol">';
            buffer += '<div class="exp_iconCell">';
            if (parseInt(line.stopStationCount) > 0) {
                buffer += '<div class="exp_icon">';
            } else {
                buffer += '<div class="exp_icon exp_direct">';
            }
            if (type == "train") {
                buffer += '<span class="exp_train"></span>';
            } else if (type == "plane") {
                buffer += '<span class="exp_plane"></span>';
            } else if (type == "ship") {
                buffer += '<span class="exp_ship"></span>';
            } else if (type == "bus") {
                buffer += '<span class="exp_bus"></span>';
            } else if (type == "walk") {
                buffer += '<span class="exp_walk"></span>';
            }
            if (parseInt(line.stopStationCount) > 0) {
                buffer += '<div class="exp_stopStationCount">' + line.stopStationCount + '駅</div>';
            }
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        }

        // 路線情報
        if (agent == 1) {
            if (typeof type == 'undefined') {
                buffer += '<div class="exp_rail exp_rail_normal">';
            } else if (type == "train") {
                buffer += '<div class="exp_rail exp_rail_normal exp_train">';
            } else if (type == "plane") {
                buffer += '<div class="exp_rail exp_rail_normal exp_plane">';
            } else if (type == "ship") {
                buffer += '<div class="exp_rail exp_rail_normal exp_ship">';
            } else if (type == "bus") {
                buffer += '<div class="exp_rail exp_rail_normal exp_bus">';
            } else if (type == "walk") {
                buffer += '<div class="exp_rail exp_rail_normal exp_walk">';
            } else {
                buffer += '<div class="exp_rail exp_rail_normal">';
            }
        } else if (agent == 2 || agent == 3) {
            buffer += '<div class="exp_rail exp_rail_icon">';
        }
        // 番線表示
        if (typeof line.DepartureState.no != 'undefined') {
            buffer += '<div class="exp_no">[' + line.DepartureState.no + '番線]</div>';
        } else {
            buffer += '<div class="exp_no">&nbsp;</div>';
        }
        // 路線名
        var lineName = getTextValue(line.Name);
        // 列車番号・便名を出力するかどうか
        if (typeof line.Number != 'undefined') {
            if (type == "train") {
                lineName += '&nbsp;<span class="exp_trainNo">' + line.Number + '号</span>';
            } else if (type == "plane" || type == "ship") {
                lineName += '&nbsp;<span class="exp_trainNo">' + line.Number + '便</span>';
            } else {
                lineName += '&nbsp;<span class="exp_trainNo">' + line.Number + '</span>';
            }
        }
        buffer += '<div class="exp_name">';
        buffer += lineName;
        // メニューリンク
        if (callBackObjectLine.length > 0) {
            buffer += '<span class="exp_lineMenu"><a id="' + baseId + ':lineMenu:' + String(routeNo) + ':' + String(index + 1) + ':open" href="Javascript:void(0);">&nbsp;</a></span>';
        }
        buffer += '</div>';
        // 改行
        buffer += '<div class="exp_separator"></div>';
        // その他情報
        if (agent == 2 || agent == 3) {
            buffer += '<div class="exp_etcInfo">';
            if (parseInt(line.timeOnBoard) > 0) {
                buffer += '<span class="exp_timeOnBoard">' + line.timeOnBoard + '分</span>';
            }
            if (parseInt(line.distance) > 0) {
                if (parseInt(line.distance) >= 10) {
                    buffer += '/' + '<span class="exp_distance">' + (parseInt(line.distance) / 10) + 'km</span>';
                } else {
                    buffer += '/' + '<span class="exp_distance">' + parseInt(line.distance) * 100 + 'm</span>';
                }
            }
            buffer += '</div>';
            buffer += '<div class="exp_separator"></div>';
        }
        // 特急券の情報
        if (chargeList.length > 0) {
            if (agent == 1) {
                for (var i = 0; i < chargeList.length; i++) {
                    if (chargeList[i].selected == "true") {
                        // 1つだけ表示
                        buffer += '<input type="hidden" id="' + baseId + ':charge:' + String(routeNo) + ':' + String(index + 1) + '" value="' + chargeList[i].index + '">';
                        buffer += '<div class="exp_chargeDetail">';
                        if (chargeList.length >= 2) {
                            // 2つ以上ある場合はメニューのリンクを設置
                            buffer += '<a id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':open" href="Javascript:void(0);">';
                        }
                        buffer += '<div class="exp_chargeCost" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':open:2">';
                        var chargeRemark = '';
                        if (typeof chargeList[i].Oneway.remark != 'undefined') {
                            chargeRemark = '【' + chargeList[i].Oneway.fullRemark + '】';
                            if (typeof chargeList[i].Oneway.expectedRemark != 'undefined') {
                                chargeRemark += '※ ';
                            }
                        }
                        buffer += ((typeof chargeList[i].Name != 'undefined') ? chargeList[i].Name + chargeRemark : "指定なし") + ": ";
                        // 運賃改定未対応
                        var salesTaxRateIsNotSupported = false;
                        if (typeof chargeList[i].fareRevisionStatus != 'undefined') {
                            if (chargeList[i].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                salesTaxRateIsNotSupported = true;
                            }
                        }
                        buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':open:3">' : '';
                        if (priceViewFlag == "oneway") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Oneway))) + '円';
                        } else if (priceViewFlag == "round") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Round))) + '円';
                        }
                        buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</div>';
                        if (chargeList.length >= 2) {
                            // メニューリンク終了
                            buffer += '</a>';
                        }
                        if (typeof chargeList[i].Oneway.expectedRemark != 'undefined') {
                            buffer += '<div><span class="exp_detail">';
                            buffer += '※探索詳細条件で指定された「' + chargeList[i].Oneway.expectedFullRemark + '」とは別の割引が適用されています。';
                            buffer += '</span></div>';
                        }
                        buffer += '</div>';
                    }
                }
                // 特急券リスト
                if (chargeList.length >= 2) {
                    // 特急券メニュー本体
                    buffer += '<div class="exp_menu exp_chargeWindow" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + '" style="display:none;">';
                    buffer += '<div class="exp_header exp_clearfix">';
                    buffer += '<span class="exp_title">種別</span>';
                    buffer += '<span class="exp_close">';
                    buffer += '<a class="exp_link" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':close" href="Javascript:void(0);">×</a>';
                    buffer += '</span>';
                    buffer += '</div>';
                    buffer += '<div class="exp_body">';
                    buffer += '<div class="exp_list">';
                    var expectedRemark;
                    // メニュー
                    for (var k = 0; k < chargeList.length; k++) {
                        // 運賃改定未対応
                        var salesTaxRateIsNotSupported = false;
                        if (typeof chargeList[k].fareRevisionStatus != 'undefined') {
                            if (chargeList[k].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                salesTaxRateIsNotSupported = true;
                            }
                        }
                        buffer += '<div class="exp_item' + (chargeList[k].selected == "true" ? " exp_checked" : "") + ' exp_' + (k % 2 == 0 ? 'odd' : 'even') + '">';
                        buffer += '<a href="Javascript:void(0);" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':' + String(chargeList[k].index) + '">';
                        // 金額
                        buffer += '<span class="exp_costList" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':' + String(chargeList[k].index) + ':cost">';
                        buffer += '<span class="exp_cost" id="' + baseId + ':chargeMenu:' + String(routeNo) + ':' + String(index + 1) + ':' + String(chargeList[k].index) + ':cost:text">';
                        if (priceViewFlag == "oneway") {
                            buffer += num2String(parseInt(getTextValue(chargeList[k].Oneway))) + '円';
                        } else if (priceViewFlag == "round") {
                            buffer += num2String(parseInt(getTextValue(chargeList[k].Round))) + '円';
                        }
                        buffer += '</span>';
                        buffer += '</span>';
                        var chargeRemark = '';
                        if (typeof chargeList[k].Oneway.remark != 'undefined') {
                            chargeRemark = '(' + chargeList[k].Oneway.remark + ')';
                        }

                        buffer += ((typeof chargeList[k].Name != 'undefined') ? chargeList[k].Name　+ chargeRemark : "指定なし")

                        if (typeof chargeList[k].Oneway.expectedRemark != 'undefined') {
                            expectedRemark = chargeList[k].Oneway.expectedFullRemark;
                            buffer += '※';
                        }

                        buffer +=  '&nbsp;</a></div>';
                    }
                    buffer += '</div>';
                    buffer += '</div>';
                    if (typeof expectedRemark != 'undefined') {
                        buffer += '<div class="exp_footer"><span class="exp_title">';
                        buffer += '※探索詳細条件で指定された「' + expectedRemark + '」とは<br>別の割引が適用されています。';
                        buffer += '</span></div>';
                    }
                    buffer += '</div>';
                }
            } else if (agent == 2 || agent == 3) {
                // 運賃が複数あった場合のフォーム出力
                buffer += '<div class="exp_chargeSelect">';
                var expectedRemark;
                for (var i = 0; i < chargeList.length; i++) {
                    if (chargeList[i].selected == "true") {
                        buffer += '<div class="exp_chargeSelectText">';
                        if (typeof chargeList[i].Name != 'undefined') {
                            buffer += chargeList[i].Name;
                            if (typeof chargeList[i].Oneway.fullRemark != 'undefined') {
                              buffer += '【' + chargeList[i].Oneway.fullRemark + '】';
                            }
                            if (typeof chargeList[i].Oneway.expectedRemark != 'undefined') {
                                buffer += '※';
                                expectedRemark = chargeList[i].Oneway.expectedFullRemark;
                            }
                            buffer += " : ";
                        } else {
                            buffer += "指定なし:";
                        }
                        // 運賃改定未対応
                        var salesTaxRateIsNotSupported = false;
                        if (typeof chargeList[i].fareRevisionStatus != 'undefined') {
                            if (chargeList[i].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                salesTaxRateIsNotSupported = true;
                            }
                        }
                        buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported">' : '';
                        if (priceViewFlag == "oneway") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Oneway))) + '円';
                        } else if (priceViewFlag == "round") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Round))) + '円';
                        }
                        buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</div>';
                    }
                }
                if (priceChangeFlag) {
                    buffer += '<select id="' + baseId + ':chargeSelect:' + String(routeNo) + ':' + chargeList[0].fromLineIndex + '">';
                    for (var i = 0; i < chargeList.length; i++) {
                        buffer += '<option value="' + chargeList[i].index + '"' + ((chargeList[i].selected == "true") ? "selected" : "") + '>';
                        if (typeof chargeList[i].Name != 'undefined') {
                            buffer += chargeList[i].Name;
                            if (typeof chargeList[i].Oneway.remark != "undefined") {
                              buffer += " (" + chargeList[i].Oneway.remark + ")";
                            }
                            if (typeof chargeList[i].Oneway.expectedRemark != 'undefined') {
                                buffer += '※';
                            }
                            buffer += " : ";
                        } else {
                            buffer += "指定なし:";
                        }
                        var salesTaxRateIsNotSupported = false;
                        if (typeof chargeList[i].fareRevisionStatus != 'undefined') {
                            if (chargeList[i].fareRevisionStatus == 'salesTaxRateIsNotSupported') {
                                salesTaxRateIsNotSupported = true;
                            }
                        }
                        buffer += salesTaxRateIsNotSupported ? '<span class="exp_taxRateIsNotSupported">' : '';
                        if (priceViewFlag == "oneway") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Oneway))) + '円';
                        } else if (priceViewFlag == "round") {
                            buffer += num2String(parseInt(getTextValue(chargeList[i].Round))) + '円';
                        }
                        buffer += salesTaxRateIsNotSupported ? '</span>' : '';
                        buffer += '</option>';
                    }
                    buffer += '</select>';
                }

                buffer += '</div>';
                if (typeof expectedRemark != 'undefined') {
                    buffer += '<span class="exp_detail">';
                    buffer += '※詳細条件で指定された「' + expectedRemark + '」とは別の割引が適用されています。';
                    buffer += '</span>';
                }
            }
        }

        // 番線表示
        if (typeof line.ArrivalState.no != 'undefined') {
            buffer += '<div class="exp_no">[' + line.ArrivalState.no + '番線]</div>';
        } else {
            if (agent == 2 || agent == 3) {
                buffer += '<div class="exp_no">&nbsp;</div>';
            }
        }
        buffer += '</div>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * ISOの日時をDateオブジェクトに変換
    */
    function convertISOtoDate(str) {
        var tmp_date;
        if (str.indexOf("T") != -1) {
            // 時間あり
            tmp_date = new Date(parseInt(str.substring(0, 4), 10), parseInt(str.substring(5, 7), 10) - 1, parseInt(str.substring(8, 10), 10), parseInt(str.substring(11, 13), 10), parseInt(str.substring(14, 16), 10), 0);
        } else {
            // 日付のみ
            tmp_date = new Date(parseInt(str.substring(0, 4), 10), parseInt(str.substring(5, 7), 10) - 1, parseInt(str.substring(8, 10), 10));
        }
        return tmp_date;
    }

    /**
    * ISOの日時を文字列に変換
    */
    function convertISOtoTime(str, type) {
        if (typeof str != 'undefined') {
            var tmp_time = str.split(":");
            var hour = parseInt(tmp_time[0], 10);
            if (typeof type != 'undefined') {
                if (type == "yesterday") { hour += 24; }
            }
            return String(hour) + ":" + tmp_time[1];
        } else {
            return;
        }
    }

    /**
    * 路線の発着時刻を判定し、出力
    */
    function convertDate2TimeString(date, type) {
        if (typeof type != 'undefined') {
            var time;
            if (date.getMinutes() >= 10) {
                time = date.getHours() + ":" + date.getMinutes();
            } else {
                time = date.getHours() + ":0" + date.getMinutes();
            }
            if (type == 'onTimetable') {
                return '<span class="exp_onTimetable">' + time + '</span>';
            } else if (type == 'interval') {
                return '<span class="exp_interval">[' + time + ']</span>';
            } else if (type == 'outside') {
                return '<span class="exp_outside">&lt;' + time + '&gt;</span>';
            } else if (type == 'average') {
                return '<span class="exp_average">(' + time + ')</span>';
            }
        } else {
            return "";
        }
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
    * 料金変更時の処理
    */
    function changePrice() {
        // 探索結果オブジェクトの特定
        var tmpResult;
        if (resultCount == 1) {
            tmpResult = result.ResultSet.Course;
        } else {
            tmpResult = result.ResultSet.Course[(selectNo - 1)];
        }
        // 変更対象となった料金のリスト作成
        var fareList = new Array();
        var chargeList = new Array();
        var vehicleTeikiList = new Array();
        var nikukanTeikiList = new Array();
        var passTeikiList = new Array();
        for (var i = 0; i < (tmpResult.Route.Point.length - 1); i++) {
            // 乗車券のリスト作成
            if (document.getElementById(baseId + ':fareSelect:' + selectNo + ':' + (i + 1))) {
                fareList.push(parseInt(document.getElementById(baseId + ':fareSelect:' + selectNo + ':' + (i + 1)).options.item(document.getElementById(baseId + ':fareSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
            } else if (document.getElementById(baseId + ':fare:' + selectNo + ':' + (i + 1))) {
                fareList.push(parseInt(document.getElementById(baseId + ':fare:' + selectNo + ':' + (i + 1)).value));
            }
            // 特急券のリスト作成
            if (document.getElementById(baseId + ':chargeSelect:' + selectNo + ':' + (i + 1))) {
                chargeList.push(parseInt(document.getElementById(baseId + ':chargeSelect:' + selectNo + ':' + (i + 1)).options.item(document.getElementById(baseId + ':chargeSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
            } else if (document.getElementById(baseId + ':charge:' + selectNo + ':' + (i + 1))) {
                chargeList.push(parseInt(document.getElementById(baseId + ':charge:' + selectNo + ':' + (i + 1)).value));
            }
            // 探索された経路がひとつの場合はundefinedを含んだidになるので、その可能性を考慮した判定を行う。
            if (document.getElementById(baseId + ':chargeSelect:undefined:' + (i + 1))) {
                chargeList.push(parseInt(document.getElementById(baseId + ':chargeSelect:undefined:' + (i + 1)).options.item(document.getElementById(baseId + ':chargeSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
            } else if (document.getElementById(baseId + ':charge:undefined:' + (i + 1))) {
                chargeList.push(parseInt(document.getElementById(baseId + ':charge:undefined:' + (i + 1)).value));
            }
            // 定期の選択リスト作成
            if (document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1))) {
                if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "vehicle") {
                    // 車両選択
                    vehicleTeikiList.push(parseInt(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).options.item(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
                } else if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "nikukanteiki") {
                    // 二区間定期
                    nikukanTeikiList.push(parseInt(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).options.item(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
                } else if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "bycorporation") {
                    // 各事業者が定める定期
                    passTeikiList.push(parseInt(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).options.item(document.getElementById(baseId + ':teikiSelect:' + selectNo + ':' + (i + 1)).selectedIndex).value));
                }
            } else if (document.getElementById(baseId + ':teiki:' + selectNo + ':' + (i + 1))) {
                if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "vehicle") {
                    // 車両選択
                    vehicleTeikiList.push(parseInt(document.getElementById(baseId + ':teiki:' + selectNo + ':' + (i + 1)).value));
                } else if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "nikukanteiki") {
                    // 二区間定期
                    nikukanTeikiList.push(parseInt(document.getElementById(baseId + ':teiki:' + selectNo + ':' + (i + 1)).value));
                } else if (document.getElementById(baseId + ':teikiKind:' + selectNo + ':' + (i + 1)).value == "bycorporation") {
                    // 各事業者が定める定期
                    passTeikiList.push(parseInt(document.getElementById(baseId + ':teiki:' + selectNo + ':' + (i + 1)).value));
                }
            }
        }
        // 再探索を行なって運賃を計算する
        if (priceChangeRefreshFlag) {
            var searchWord = "";
            searchWord += "serializeData=" + encodeURIComponent(tmpResult.SerializeData);
            if (fareList.length >= 1) {
                searchWord += "&fareIndex=" + fareList.join(":");
            }
            if (chargeList.length >= 1) {
                searchWord += "&chargeIndex=" + chargeList.join(":");
            }
            if (vehicleTeikiList.length >= 1) {
                searchWord += "&vehicleIndex=" + vehicleTeikiList.join(":");
            }
            if (nikukanTeikiList.length >= 1) {
                searchWord += "&nikukanteikiIndex=" + nikukanTeikiList.join(":");
            }
            if (passTeikiList.length >= 1) {
                searchWord += "&passStatusIndex=" + passTeikiList.join(":");
            }
            searchWord += "&addRouteData=true";
            var url = apiURL + "v1/json/course/recalculate?key=" + key + "&" + searchWord;
            // エンジンバージョン同一チェック
            if (!checkEngineVersion) {
                url += "&checkEngineVersion=false";
            }
            reSearch(url, selectNo);
        } else {
            // フォームを解析して運賃を再計算する
            var fare = 0;
            var fareRound = 0;
            var charge = 0;
            var chargeRound = 0;
            for (var i = 0; i < tmpResult.Price.length; i++) {
                if (tmpResult.Price[i].kind == "Fare") {
                    // 乗車券の運賃再計算
                    if (checkArray(fareList, parseInt(tmpResult.Price[i].index)) != -1) {
                        // 探索結果オブジェクトの選択を変える
                        tmpResult.Price[i].selected = "true";
                        // 選択していない料金はオフにする
                        for (var j = 0; j < tmpResult.Price.length; j++) {
                            if (tmpResult.Price[i].index != tmpResult.Price[j].index && tmpResult.Price[i].kind == tmpResult.Price[j].kind && tmpResult.Price[i].fromLineIndex == tmpResult.Price[j].fromLineIndex) {
                                tmpResult.Price[j].selected = "false";
                            }
                        }
                    }
                } else if (tmpResult.Price[i].kind == "Charge") {
                    // 特急券の運賃再計算
                    if (checkArray(chargeList, parseInt(tmpResult.Price[i].index)) != -1) {
                        // 探索結果オブジェクトの選択を変える
                        tmpResult.Price[i].selected = "true";
                        // 選択していない料金はオフにする
                        for (var j = 0; j < tmpResult.Price.length; j++) {
                            if (tmpResult.Price[i].index != tmpResult.Price[j].index && tmpResult.Price[i].kind == tmpResult.Price[j].kind && tmpResult.Price[i].fromLineIndex == tmpResult.Price[j].fromLineIndex) {
                                tmpResult.Price[j].selected = "false";
                            }
                        }
                    }
                }
            }
            // 合計金額の算出
            for (var i = 0; i < tmpResult.Price.length; i++) {
                if (tmpResult.Price[i].kind == "Fare" && tmpResult.Price[i].selected == "true") {
                    // 片道運賃の再計算
                    fare += parseInt(getTextValue(tmpResult.Price[i].Oneway));
                    // 往復運賃の再計算
                    fareRound += parseInt(getTextValue(tmpResult.Price[i].Round));
                } else if (tmpResult.Price[i].kind == "Charge" && tmpResult.Price[i].selected == "true") {
                    // 片道運賃の再計算
                    charge += parseInt(getTextValue(tmpResult.Price[i].Oneway));
                    // 往復運賃の再計算
                    chargeRound += parseInt(getTextValue(tmpResult.Price[i].Round));
                }
            }
            // 合計金額の変更
            for (var i = 0; i < tmpResult.Price.length; i++) {
                if (tmpResult.Price[i].kind == "FareSummary") {
                    // 乗車券の運賃再計算
                    tmpResult.Price[i].Oneway = String(fare);
                    tmpResult.Price[i].Round = String(fareRound);
                } else if (tmpResult.Price[i].kind == "ChargeSummary") {
                    // 特急券の運賃再計算
                    tmpResult.Price[i].Oneway = String(charge);
                    tmpResult.Price[i].Round = String(chargeRound);
                }
            }
            changeCourse(selectNo);
        }
    }

    /**
    * 運賃変更時の最短作処理
    */
    function reSearch(url, no) {
        if (typeof resultObj != 'undefined') {
            resultObj.abort();
        }
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            resultObj = new XDomainRequest();
            resultObj.onload = function () {
                setResultSingle(resultObj.responseText, no);
            };
        } else {
            resultObj = new XMLHttpRequest();
            resultObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (resultObj.readyState == done && resultObj.status == ok) {
                    setResultSingle(resultObj.responseText, no);
                }
            };
        }
        resultObj.open("GET", url, true);
        resultObj.send(null);
    }

    /**
     * ソート済みインデックスを取得する
     */
    function getCourseNo(index) {
        for (var i = 0; i < sortCourseList.length; i++) {
            if (sortCourseList[i].index == index) {
                return (i + 1);
            }
        }
    }

    /**
    * 探索結果オブジェクト内の1経路だけ入れ替え
    */
    function setResultSingle(resultObject, no) {
        tmpResult = JSON.parse(resultObject);
        if (resultCount == 1) {
            result.ResultSet.Course = tmpResult.ResultSet.Course;
        } else {
            result.ResultSet.Course[(no - 1)] = tmpResult.ResultSet.Course;
        }
        // 探索結果の切り替え
        changeCourse(no);
    }

    /**
    * 表示している探索結果のシリアライズデータを取得
    */
    function getSerializeData() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            return tmpResult.SerializeData;
        } else {
            return;
        }
    }

    /**
    * 表示している探索結果すべてののシリアライズデータを取得
    */
    function getSerializeDataAll() {
        var tmpSerializeList = new Array();
        if (typeof result != 'undefined') {
            if (resultCount == 1) {
                tmpSerializeList.push(result.ResultSet.Course.SerializeData);
            } else {
                for (var i = 0; i < resultCount; i++) {
                    tmpSerializeList.push(result.ResultSet.Course[i].SerializeData);
                }
            }
            return tmpSerializeList;
        } else {
            return tmpSerializeList;
        }
    }

    /**
    * 表示している探索結果の定期経路シリアライズデータを取得
    */
    function getTeikiSerializeData() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Teiki != 'undefined') {
                return tmpResult.Teiki.SerializeData;
            } else {
                return;
            }
        } else {
            return;
        }
    }

    /**
    * 表示している探索結果の定期控除のための文字列を取得
    */
    function getTeiki() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        }
        if (typeof result == 'undefined') {
            return;
        }
        var tmpResult;
        if (resultCount == 1) {
            tmpResult = result.ResultSet.Course;
        } else {
            tmpResult = result.ResultSet.Course[(selectNo - 1)];
        }
        // 事前チェック
        var Teiki1Summary;
        var Teiki3Summary;
        var Teiki6Summary;
        var Teiki12Summary;
        if (typeof tmpResult.Price != 'undefined') {
            for (var j = 0; j < tmpResult.Price.length; j++) {
                if (tmpResult.Price[j].kind == "Teiki1Summary") {
                    if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                        Teiki1Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                    }
                } else if (tmpResult.Price[j].kind == "Teiki3Summary") {
                    if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                        Teiki3Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                    }
                } else if (tmpResult.Price[j].kind == "Teiki6Summary") {
                    if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                        Teiki6Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                    }
                } else if (tmpResult.Price[j].kind == "Teiki12Summary") {
                    if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                        Teiki12Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                    }
                }
            }
        }
        if (typeof Teiki1Summary == 'undefined' && typeof Teiki3Summary == 'undefined' && typeof Teiki6Summary == 'undefined' && Teiki12Summary == 'undefined') {
            return;
        }
        if (typeof tmpResult.Route.Line.length == 'undefined') {
            if (getTextValue(tmpResult.Route.Line.Type) != "train" && getTextValue(tmpResult.Route.Line.Type) != "walk") {
                return;
            }
        } else {
            for (var i = 0; i < (tmpResult.Route.Point.length - 1); i++) {
                if (getTextValue(tmpResult.Route.Line[i].Type) != "train" && getTextValue(tmpResult.Route.Line[i].Type) != "walk") {
                    return;
                }
            }
        }
        if (tmpResult.dataType == "plain") {
            var buffer = "";
            if (typeof tmpResult.Route.Line.length == 'undefined') {
                if (typeof tmpResult.Route.Point[0].Station != 'undefined') {
                    buffer += tmpResult.Route.Point[0].Station.Name;
                } else if (typeof tmpResult.Route.Point[0].Name != 'undefined') {
                    buffer += tmpResult.Route.Point[0].Name;
                }
                buffer += ":" + tmpResult.Route.Line.Name + ":" + tmpResult.Route.Line.direction + ":";
                if (typeof tmpResult.Route.Point[1].Station != 'undefined') {
                    buffer += tmpResult.Route.Point[1].Station.Name;
                } else if (typeof tmpResult.Route.Point[1].Name != 'undefined') {
                    buffer += tmpResult.Route.Point[1].Name;
                }
            } else {
                for (var i = 0; i < (tmpResult.Route.Point.length - 1); i++) {
                    if (typeof tmpResult.Route.Point[i].Station != 'undefined') {
                        buffer += tmpResult.Route.Point[i].Station.Name;
                    } else if (typeof tmpResult.Route.Point[i].Name != 'undefined') {
                        buffer += tmpResult.Route.Point[i].Name;
                    }
                    buffer += ":" + tmpResult.Route.Line[i].Name + ":" + tmpResult.Route.Line[i].direction + ":";
                }
                if (typeof tmpResult.Route.Point[tmpResult.Route.Point.length - 1].Station != 'undefined') {
                    buffer += tmpResult.Route.Point[tmpResult.Route.Point.length - 1].Station.Name;
                } else if (typeof tmpResult.Route.Point[tmpResult.Route.Point.length - 1].Name != 'undefined') {
                    buffer += tmpResult.Route.Point[tmpResult.Route.Point.length - 1].Name;
                }
            }
            return buffer;
        } else {
            return;
        }
    }

    /**
    * 二区間定期の控除用インデックスリストの取得
    */
    function getNikukanteikiIndex() {
        if (typeof result == 'undefined') {
            return;
        }
        var tmpResult;
        if (resultCount == 1) {
            tmpResult = result.ResultSet.Course;
        } else {
            tmpResult = result.ResultSet.Course[(selectNo - 1)];
        }
        if (typeof tmpResult.PassStatus != 'undefined') {
            var buffer = "";
            if (typeof tmpResult.PassStatus.length == 'undefined') {
                if (tmpResult.PassStatus.kind == "nikukanteiki") {
                    if (tmpResult.PassStatus.selected == "true") {
                        buffer += '1';
                    }
                }
            } else {
                for (var i = 0; i < tmpResult.PassStatus.length; i++) {
                    if (tmpResult.PassStatus[i].kind == "nikukanteiki") {
                        if (tmpResult.PassStatus[i].selected == "true") {
                            if (buffer != "") { buffer += ':'; }
                            buffer += String(i + 1);
                        }
                    }
                }
            }
            if (buffer != "") {
                return buffer;
            }
        }
        return;
    }

    /**
    * 車両のインデックスリストの取得
    */
    function getVehicleIndex() {
        if (typeof result == 'undefined') {
            return;
        }
        var tmpResult;
        if (resultCount == 1) {
            tmpResult = result.ResultSet.Course;
        } else {
            tmpResult = result.ResultSet.Course[(selectNo - 1)];
        }
        if (typeof tmpResult.PassStatus != 'undefined') {
            var buffer = "";
            if (typeof tmpResult.PassStatus.length == 'undefined') {
                if (tmpResult.PassStatus.kind == "vehicle") {
                    if (tmpResult.PassStatus.selected == "true") {
                        buffer += '1';
                    }
                }
            } else {
                for (var i = 0; i < tmpResult.PassStatus.length; i++) {
                    if (tmpResult.PassStatus[i].kind == "vehicle") {
                        if (tmpResult.PassStatus[i].selected == "true") {
                            if (buffer != "") { buffer += ':'; }
                            buffer += String(i + 1);
                        }
                    }
                }
            }
            if (buffer != "") {
                return buffer;
            }
        }
        return;
    }

    /**
    * 定期の状態を取得
    */
    function getPassStatusObject(index) {
        var tmpPassStatusObject;
        if (typeof result != 'undefined') {
            var tmpResult, passStatusObject;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.PassStatus.length == 'undefined') {
                if (index == 1) {
                    passStatusObject = tmpResult.PassStatus;
                }
            } else {
                if (typeof tmpResult.PassStatus[parseInt(index) - 1] != 'undefined') {
                    passStatusObject = tmpResult.PassStatus[parseInt(index) - 1];
                }
            }
            if (typeof passStatusObject != 'undefined') {
                tmpPassStatusObject = new Object();
                // 名称
                if (typeof passStatusObject.Name != 'undefined') {
                    tmpPassStatusObject.name = getTextValue(passStatusObject.Name);
                }
                // タイプ
                if (typeof passStatusObject.Type != 'undefined') {
                    tmpPassStatusObject.type = getTextValue(passStatusObject.Type);
                }
                // 種別
                if (typeof passStatusObject.kind != 'undefined') {
                    tmpPassStatusObject.kind = passStatusObject.kind;
                }
                // コメント
                if (typeof passStatusObject.Comment != 'undefined') {
                    tmpPassStatusObject.comment = getTextValue(passStatusObject.Comment);
                }
            }
        }
        return tmpPassStatusObject;
    }

    /**
    * 探索結果すべての経路オブジェクトを取得
    */
    function getResultAll() {
        if (typeof result != 'undefined') {
            return JSON.parse(JSON.stringify(result));
        } else {
            return;
        }
    }

    /**
    * 表示している経路オブジェクトの番号を取得
    */
    function getResultNo() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            return selectNo;
        } else {
            return;
        }
    }

    /**
    * 表示している経路オブジェクトを取得
    */
    function getResult() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            if (resultCount == 1) {
                return JSON.parse(JSON.stringify(result));
            } else {
                // 探索結果を一つにする
                var tmpResult = JSON.parse(JSON.stringify(result));
                tmpResult.ResultSet.Course = tmpResult.ResultSet.Course[(selectNo - 1)];
                return JSON.parse(JSON.stringify(tmpResult));
            }
        } else {
            return;
        }
    }

    /**
    * 探索結果すべての経路オブジェクトをJSONに変換して取得
    */
    function getResultStringAll() {
        if (typeof result != 'undefined') {
            return JSON.stringify(result);
        } else {
            return;
        }
    }

    /**
    * オブジェクトの値を取得
    */
    function getTextValue(obj) {
        if (typeof obj != "undefined") {
            if (typeof obj.text != "undefined") {
                return obj.text;
            }
            return obj;
        } else {
            return "";
        }
    }

    /**
    * 表示している経路オブジェクトをJSONに変換して取得
    */
    function getResultString() {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            if (resultCount == 1) {
                return JSON.stringify(result);
            } else {
                // 探索結果を一つにする
                var tmpResult = JSON.parse(JSON.stringify(result));
                tmpResult.ResultSet.Course = tmpResult.ResultSet.Course[(selectNo - 1)];
                return JSON.stringify(tmpResult);
            }
        } else {
            return;
        }
    }

    /**
    * 指定した経路の出発時刻を取得
    */
    function getDepartureState(tmpCourse, index) {
        if (typeof tmpCourse.Route.Line.length == 'undefined') {
            return convertISOtoDate(tmpCourse.Route.Line.DepartureState.Datetime.text, tmpCourse.Route.Line.DepartureState.Datetime.operation);
        } else {
            if (typeof index == 'undefined') {
                // index未指定時
                return convertISOtoDate(tmpCourse.Route.Line[0].DepartureState.Datetime.text, tmpCourse.Route.Line[0].DepartureState.Datetime.operation);
            } else {
                // index指定時
                return convertISOtoDate(tmpCourse.Route.Line[parseInt(index) - 1].DepartureState.Datetime.text, tmpCourse.Route.Line[parseInt(index) - 1].DepartureState.Datetime.operation);
            }
        }
    }

    /**
    * 出発時刻を取得
    */
    function getDepartureDate(index) {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            var tmpCourse;
            if (resultCount == 1) {
                tmpCourse = result.ResultSet.Course;
            } else {
                tmpCourse = result.ResultSet.Course[(parseInt(selectNo) - 1)];
            }
            return getDepartureState(tmpCourse, index);
        } else {
            return;
        }
    }

    /**
    * 指定した経路の到着時刻を取得
    */
    function getArrivalState(tmpCourse, index) {
        if (typeof tmpCourse.Route.Line.length == 'undefined') {
            return convertISOtoDate(tmpCourse.Route.Line.ArrivalState.Datetime.text, tmpCourse.Route.Line.ArrivalState.Datetime.operation);
        } else {
            if (typeof index == 'undefined') {
                // index未指定時
                return convertISOtoDate(tmpCourse.Route.Line[tmpCourse.Route.Line.length - 1].ArrivalState.Datetime.text, tmpCourse.Route.Line[tmpCourse.Route.Line.length - 1].ArrivalState.Datetime.operation);
            } else {
                // index指定時
                return convertISOtoDate(tmpCourse.Route.Line[parseInt(index) - 1].ArrivalState.Datetime.text, tmpCourse.Route.Line[parseInt(index) - 1].ArrivalState.Datetime.operation);
            }
        }
    }

    /**
    * 到着時刻を取得
    */
    function getArrivalDate(index) {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            var tmpCourse;
            if (resultCount == 1) {
                tmpCourse = result.ResultSet.Course;
            } else {
                tmpCourse = result.ResultSet.Course[(parseInt(selectNo) - 1)];
            }
            return getArrivalState(tmpCourse, index);
        } else {
            return;
        }
    }

    /**
    * 最適経路のチェック
    */
    function checkBestCourse(type) {
        if (viewCourseListFlag) {
            // 一覧表示中は返さない
            return;
        } else if (typeof result != 'undefined') {
            if (typeof result == 'undefined') {
                return;
            } else {
                var tmpResult;
                //ekispertを指定した場合は第一経路のみtrue
                if (type == "ekispert") {
                    if (selectNo == 1) {
                        return true;
                    } else {
                        return false;
                    }
                }
                if (resultCount == 1) {
                    tmpResult = result.ResultSet.Course;
                } else {
                    tmpResult = result.ResultSet.Course[(selectNo - 1)];
                }
                var time = parseInt(tmpResult.Route.timeOnBoard) + parseInt(tmpResult.Route.timeWalk) + parseInt(tmpResult.Route.timeOther);
                var TransferCount = parseInt(tmpResult.Route.transferCount);
                var exhaustCO2 = parseInt(tmpResult.Route.exhaustCO2);
                if (type == "price") {
                    if (priceViewFlag == "oneway") {
                        //片道
                        if (getPriceSummary("total", false) == minPriceSummary) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        //往復
                        if (getPriceSummary("total", true) == minPriceRoundSummary) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                } else if (type == "time") {
                    if (typeof minEkispertIndex != 'undefined') {
                        if (getDepartureState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getDepartureState(tmpResult).getTime() && getArrivalState(result.ResultSet.Course[minEkispertIndex - 1]).getTime() == getArrivalState(tmpResult).getTime()) {
                            return true;
                        } else {
                            return false;
                        }
                    } else if (time == minTimeSummary) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == "transfer") {
                    if (TransferCount == minTransferCount) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == "teiki") {
                    if (typeof getPriceSummary("teiki6") != 'undefined') {
                        if (minTeikiSummary == getPriceSummary("teiki6")) {
                            return true;
                        }
                    } else if (typeof getPriceSummary("teiki3") != 'undefined') {
                        if (minTeikiSummary == getPriceSummary("teiki3") * 2) {
                            return true;
                        }
                    } else if (typeof getPriceSummary("teiki1") != 'undefined') {
                        if (minTeikiSummary == getPriceSummary("teiki1") * 6) {
                            return true;
                        }
                    }
                    return false;
                } else if (type == "teiki1") {
                    if (typeof getPriceSummary("teiki1") != 'undefined' && getPriceSummary("teiki1") == minTeiki1Summary) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == "teiki3") {
                    if (typeof getPriceSummary("teiki3") != 'undefined' && getPriceSummary("teiki3") == minTeiki3Summary) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == "teiki6") {
                    if (typeof getPriceSummary("teiki6") != 'undefined' && getPriceSummary("teiki6") == minTeiki6Summary) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == "co2") {
                    if (exhaustCO2 == minExhaustCO2) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }

    /**
    * 定期券利用のチェック
    */
    function checkWithTeiki() {
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Price != 'undefined') {
                for (var j = 0; j < tmpResult.Price.length; j++) {
                    if (tmpResult.Price[j].kind == "Fare") {
                        if (typeof tmpResult.Price[j].Type != 'undefined') {
                            if (tmpResult.Price[j].Type == "WithTeiki") {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        } else {
            return;
        }
    }

    /**
    * 区間名のリストを取得
    */
    function getLineList() {
        var buffer = "";
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Route.Line.length == 'undefined') {
                if (typeof tmpResult.Route.Line.Name != 'undefined') {
                    buffer += getTextValue(tmpResult.Route.Line.Name);
                }
            } else {
                for (var i = 0; i < tmpResult.Route.Line.length; i++) {
                    if (i != 0) { buffer += ","; }
                    if (typeof tmpResult.Route.Line[i].Name != 'undefined') {
                        buffer += getTextValue(tmpResult.Route.Line[i].Name);
                    }
                }
            }
        }
        return buffer;
    }

    /**
    * 区間オブジェクトを取得
    */
    function getLineObject(index) {
        var tmpLineObject;
        if (typeof result != 'undefined') {
            var tmpResult, lineObject;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Route.Line.length == 'undefined') {
                if (index == 1) {
                    lineObject = tmpResult.Route.Line;
                }
            } else {
                if (typeof tmpResult.Route.Line[parseInt(index) - 1] != 'undefined') {
                    lineObject = tmpResult.Route.Line[parseInt(index) - 1];
                }
            }
            if (typeof lineObject != 'undefined') {
                tmpLineObject = new Object();
                // 名称
                if (typeof lineObject.Name != 'undefined') {
                    tmpLineObject.name = getTextValue(lineObject.Name);
                    // 略称
                    if (typeof lineObject.Name.abbreviation != 'undefined') {
                        tmpLineObject.abbreviation = lineObject.Name.abbreviation;
                    }
                }
                // タイプ
                if (typeof lineObject.Type != 'undefined') {
                    if (typeof lineObject.Type.text != 'undefined') {
                        if (typeof lineObject.Type.detail != 'undefined') {
                            tmpLineObject.type = lineObject.Type.text;
                            if (typeof lineObject.Type.detail != 'undefined') {
                                tmpLineObject.type_detail = lineObject.Type.text + "." + lineObject.Type.detail;
                            }
                        } else {
                            tmpLineObject.type = lineObject.Type.text;
                        }
                    } else {
                        tmpLineObject.type = lineObject.Type;
                    }
                }
                // 番号
                if (typeof lineObject.Number != 'undefined') {
                    tmpLineObject.number = Number(lineObject.Number);
                }
                // 色
                if (typeof lineObject.Color != 'undefined') {
                    tmpLineObject.color = Number(lineObject.Color);
                }
                // 発着時刻
                tmpLineObject.departureTime = convertISOtoTime(lineObject.DepartureState.Datetime.text, lineObject.DepartureState.Datetime.operation);
                tmpLineObject.arrivalTime = convertISOtoTime(lineObject.ArrivalState.Datetime.text, lineObject.ArrivalState.Datetime.operation);
                // 運行会社
                if (typeof lineObject.Corporation != 'undefined') {
                    if (typeof lineObject.Corporation.Name != 'undefined') {
                        tmpLineObject.corporation = lineObject.Corporation.Name;
                    }
                }
                // 軌道種別
                if (typeof lineObject.track != 'undefined') {
                    tmpLineObject.track = lineObject.track;
                }
            }
        }
        return tmpLineObject;
    }

    /**
    * 地点名のリストを取得
    */
    function getPointList() {
        var buffer = "";
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Route.Point.length == 'undefined') {
                if (typeof tmpResult.Route.Point.Station != 'undefined') {
                    buffer += tmpResult.Route.Point.Station.Name;
                } else if (typeof tmpResult.Route.Point.Name != 'undefined') {
                    buffer += tmpResult.Route.Point.Name;
                }
            } else {
                for (var i = 0; i < tmpResult.Route.Point.length; i++) {
                    if (i != 0) { buffer += ","; }
                    if (typeof tmpResult.Route.Point[i].Station != 'undefined') {
                        buffer += tmpResult.Route.Point[i].Station.Name;
                    } else if (typeof tmpResult.Route.Point[i].Name != 'undefined') {
                        buffer += tmpResult.Route.Point[i].Name;
                    }
                }
            }
        }
        return buffer;
    }

    /**
    * 地点オブジェクトを取得
    */
    function getPointObject(index) {
        var tmp_station;
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Route.Point[parseInt(index) - 1] != 'undefined') {
                var stationObj = tmpResult.Route.Point[parseInt(index) - 1];
                tmp_station = new Object();
                if (typeof stationObj.Station != 'undefined') {
                    tmp_station.name = stationObj.Station.Name;
                    tmp_station.code = stationObj.Station.code;
                    tmp_station.yode = stationObj.Station.Yomi;
                    if (typeof stationObj.Station.Type.text != 'undefined') {
                        tmp_station.type = stationObj.Station.Type.text;
                        if (typeof stationObj.Station.Type.detail != 'undefined') {
                            tmp_station.type_detail = stationObj.Station.Type.text + "." + stationObj.Station.Type.detail;
                        }
                    } else {
                        tmp_station.type = stationObj.Station.Type;
                    }
                } else if (typeof stationObj.Name != 'undefined') {
                    tmp_station.name = stationObj.Name;
                }
                if (typeof stationObj.GeoPoint != 'undefined') {
                    // 緯度
                    tmp_station.lati = stationObj.GeoPoint.lati;
                    tmp_station.lati_d = stationObj.GeoPoint.lati_d;
                    // 経度
                    tmp_station.longi = stationObj.GeoPoint.longi;
                    tmp_station.longi_d = stationObj.GeoPoint.longi_d;
                    // gcs
                    tmp_station.gcs = stationObj.GeoPoint.gcs;
                }
                //県コード
                if (typeof stationObj.Prefecture != 'undefined') {
                    tmp_station.kenCode = parseInt(stationObj.Prefecture.code);
                }
            }
        }
        return tmp_station;
    }

    /**
    * 乗車券のリストを出力
    */
    function getFareList(roundFlag) {
        return getPriceList("Fare", roundFlag);
    }

    /**
    * 特急券のリストを出力
    */
    function getChargeList(roundFlag) {
        return getPriceList("Charge", roundFlag);
    }

    /**
    * 運賃のリストを出力
    */
    function getPriceList(kind, roundFlag) {
        var priceList = new Array();
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Price != 'undefined') {
                for (var i = 0; i < tmpResult.Price.length; i++) {
                    if (tmpResult.Price[i].kind == kind && tmpResult.Price[i].selected.toLowerCase() == "true") {
                        if (roundFlag == "round") {
                            if (typeof tmpResult.Price[i].Round != 'undefined') {
                                priceList.push(parseInt(getTextValue(tmpResult.Price[i].Round)));
                            }
                        } else {
                            if (typeof tmpResult.Price[i].Oneway != 'undefined') {
                                priceList.push(parseInt(getTextValue(tmpResult.Price[i].Oneway)));
                            }
                        }
                    }
                }
            }
        }
        if (priceList.length > 0) {
            return priceList.join(",");
        }
    }

    /**
    * 乗車券のオブジェクトを取得
    */
    function getFareObject(index) {
        return getPriceList("Fare", index);
    }

    /**
    * 特急券のオブジェクトを取得
    */
    function getChargeObject(index) {
        return getPriceList("Charge", index);
    }

    /**
    * 運賃のオブジェクトを取得
    */
    function getPriceObject(kind, index) {
        var tmp_price;
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            if (typeof tmpResult.Price != 'undefined') {
                var price_index = 0;
                for (var i = 0; i < tmpResult.Price.length; i++) {
                    if (tmpResult.Price[i].kind == kind && tmpResult.Price[i].selected.toLowerCase() == "true") {
                        price_index++;
                        if (price_index == parseInt(index)) {
                            tmp_price = new Object();
                            tmp_price.fareRevisionStatus = tmpResult.Price[i].fareRevisionStatus;
                            tmp_price.fromLineIndex = tmpResult.Price[i].fromLineIndex;
                            tmp_price.toLineIndex = tmpResult.Price[i].toLineIndex;
                            tmp_price.selected = tmpResult.Price[i].selected.toLowerCase() == "true" ? true : false;
                            tmp_price.name = tmpResult.Price[i].Name;
                            tmp_price.type = tmpResult.Price[i].Type;
                            tmp_price.oneway = parseInt(getTextValue(tmpResult.Price[i].Oneway));
                            if (typeof tmpResult.Price[i].Round != 'undefined') {
                                tmp_price.round = parseInt(getTextValue(tmpResult.Price[i].Round));
                            }
                            tmp_price.rate = getTextValue(tmpResult.Price[i].Round);
                        }
                    }
                }
            }
        }
        return tmp_price;
    }

    /**
    * 運賃を取得
    */
    function getPrice(roundFlag) {
        if (roundFlag == "round") {
            return getPriceSummary("total", true);
        } else {
            return getPriceSummary("total", false);
        }
    }

    /**
    * 乗車券を取得
    */
    function getFarePrice(roundFlag) {
        if (roundFlag == "round") {
            return getPriceSummary("fare", true);
        } else {
            return getPriceSummary("fare", false);
        }
    }

    /**
    * 特急券を取得
    */
    function getChargePrice(roundFlag) {
        if (roundFlag == "round") {
            return getPriceSummary("charge", true);
        } else {
            return getPriceSummary("charge", false);
        }
    }

    /**
    * 定期券を取得
    */
    function getTeikiPrice(month) {
        if (String(month) == "1") {
            return getPriceSummary("teiki1");
        } else if (String(month) == "3") {
            return getPriceSummary("teiki3");
        } else if (String(month) == "6") {
            return getPriceSummary("teiki6");
        } else if (String(month) == "12") {
            return getPriceSummary("teiki12");
        }
    }

    /**
    * 金額の計算
    */
    function getPriceSummary(type, round) {
        if (typeof result != 'undefined') {
            var tmpResult;
            if (resultCount == 1) {
                tmpResult = result.ResultSet.Course;
            } else {
                tmpResult = result.ResultSet.Course[(selectNo - 1)];
            }
            var FareSummary = 0;
            var FareRoundSummary = 0;
            var ChargeSummary = 0;
            var ChargeRoundSummary = 0;
            var Teiki1Summary;
            var Teiki3Summary;
            var Teiki6Summary;
            var Teiki12Summary;
            if (typeof tmpResult.Price != 'undefined') {
                for (var j = 0; j < tmpResult.Price.length; j++) {
                    if (tmpResult.Price[j].kind == "FareSummary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            FareSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                        if (typeof tmpResult.Price[j].Round != 'undefined') {
                            FareRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                        }
                    } else if (tmpResult.Price[j].kind == "ChargeSummary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            ChargeSummary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                        if (typeof tmpResult.Price[j].Round != 'undefined') {
                            ChargeRoundSummary = parseInt(getTextValue(tmpResult.Price[j].Round));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki1Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki1Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki3Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki3Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki6Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki6Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    } else if (tmpResult.Price[j].kind == "Teiki12Summary") {
                        if (typeof tmpResult.Price[j].Oneway != 'undefined') {
                            Teiki12Summary = parseInt(getTextValue(tmpResult.Price[j].Oneway));
                        }
                    }
                }
            }
            if (type == "total") {
                return (round ? FareRoundSummary + ChargeRoundSummary : FareSummary + ChargeSummary);
            } else if (type == "fare") {
                return (round ? FareRoundSummary : FareSummary);
            } else if (type == "charge") {
                return (round ? ChargeRoundSummary : ChargeSummary);
            } else if (type == "teiki1") {
                return Teiki1Summary;
            } else if (type == "teiki3") {
                return Teiki3Summary;
            } else if (type == "teiki6") {
                return Teiki6Summary;
            } else if (type == "teiki12") {
                return Teiki12Summary;
            }
        }
    }

    /**
    * 探索結果数を取得
    */
    function getResultCount() {
        return resultCount;
    }

    /**
     * サニタイズ
     */
    function sanitaize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (String(name).toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (String(name).toLowerCase() == String("PriceChangeRefresh").toLowerCase()) {
            priceChangeRefreshFlag = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("PriceChange").toLowerCase()) {
            priceChangeFlag = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("AssignDia").toLowerCase()) {
            assignDiaFlag = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("checkEngineVersion").toLowerCase()) {
            checkEngineVersion = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("CourseList").toLowerCase()) {
            courseListFlag = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("Agent").toLowerCase()) {
            agent = value;
        } else if (String(name).toLowerCase() == String("window").toLowerCase()) {
            windowFlag = (String(value) == "true" ? true : false);
        } else if (String(name).toLowerCase() == String("tab").toLowerCase()) {
            resultTab = (String(value) == "hidden" ? false : true);
            sortType = "time";
        } else if (String(name).toLowerCase() == String("CourseDisplay").toLowerCase()) {
            if (String(value).toLowerCase() == "all") {
                courseDisplayAll = true;
            } else if (String(value).toLowerCase() == "once") {
                courseDisplayAll = false;
            }
        } else if (String(name).toLowerCase() == String("from").toLowerCase()) {
            fromName = value;
        } else if (String(name).toLowerCase() == String("to").toLowerCase()) {
            toName = value;
        } else if (String(name).toLowerCase() == String("selectedIndex").toLowerCase()) {
            selectedIndex = parseInt(value);
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    /**
    * 探索オブジェクトのインターフェースを返す
    */
    function createSearchInterface() {
        return new searchInterface();
    };

    /**
    * 探索インターフェースオブジェクト
    */
    function searchInterface() {
        // データリスト
        var viaList;
        var fixedRailList;
        var fixedRailDirectionList;
        var date;
        var time;
        var searchType;
        var sort;
        var answerCount;
        var searchCount;
        var conditionDetail;
        var corporationBind;
        var interruptCorporationList;
        var interruptRailList;
        var resultDetail;
        var assignRoute;
        var assignDetailRoute;
        var assignTeikiSerializeData;
        var assignNikukanteikiIndex;
        var coupon;
        var bringAssignmentError;
        var from;
        var to;
        var via;
        var plane;
        var shinkansen;
        var limitedExpress;
        var bus;

        // 関数リスト
        // ViaList設定
        function setViaList(value) { viaList = value; };
        function getViaList() { return viaList; };
        this.setViaList = setViaList;
        this.getViaList = getViaList;
        // FixedRailList設定
        function setFixedRailList(value) { fixedRailList = value; };
        function getFixedRailList() { return fixedRailList; };
        this.setFixedRailList = setFixedRailList;
        this.getFixedRailList = getFixedRailList;
        // FixedRailDirectionList設定
        function setFixedRailDirectionList(value) { fixedRailDirectionList = value; };
        function getFixedRailDirectionList() { return fixedRailDirectionList; };
        this.setFixedRailDirectionList = setFixedRailDirectionList;
        this.getFixedRailDirectionList = getFixedRailDirectionList;
        // Date設定
        function setDate(value) { date = value; };
        function getDate() { return date; };
        this.setDate = setDate;
        this.getDate = getDate;
        // Time設定
        function setTime(value) { time = value; };
        function getTime() { return time; };
        this.setTime = setTime;
        this.getTime = getTime;
        // SearchType設定
        function setSearchType(value) { searchType = value; };
        function getSearchType() { return searchType; };
        this.setSearchType = setSearchType;
        this.getSearchType = getSearchType;
        // Sort設定
        function setSort(value) { sort = value; };
        function getSort() { return sort; };
        this.setSort = setSort;
        this.getSort = getSort;
        // AnswerCount設定
        function setAnswerCount(value) { answerCount = value; };
        function getAnswerCount() { return answerCount; };
        this.setAnswerCount = setAnswerCount;
        this.getAnswerCount = getAnswerCount;
        // SearchCount設定
        function setSearchCount(value) { searchCount = value; };
        function getSearchCount() { return searchCount; };
        this.setSearchCount = setSearchCount;
        this.getSearchCount = getSearchCount;
        // ConditionDetail設定
        function setConditionDetail(value) { conditionDetail = value; };
        function getConditionDetail() { return conditionDetail; };
        this.setConditionDetail = setConditionDetail;
        this.getConditionDetail = getConditionDetail;
        // CorporationBind設定
        function setCorporationBind(value) { corporationBind = value; };
        function getCorporationBind() { return corporationBind; };
        this.setCorporationBind = setCorporationBind;
        this.getCorporationBind = getCorporationBind;
        // InterruptCorporationList設定
        function setInterruptCorporationList(value) { interruptCorporationList = value; };
        function getInterruptCorporationList() { return interruptCorporationList; };
        this.setInterruptCorporationList = setInterruptCorporationList;
        this.getInterruptCorporationList = getInterruptCorporationList;
        // InterruptRailList設定
        function setInterruptRailList(value) { interruptRailList = value; };
        function getInterruptRailList() { return interruptRailList; };
        this.setInterruptRailList = setInterruptRailList;
        this.getInterruptRailList = getInterruptRailList;
        // ResultDetail設定
        function setResultDetail(value) { resultDetail = value; };
        function getResultDetail() { return resultDetail; };
        this.setResultDetail = setResultDetail;
        this.getResultDetail = getResultDetail;
        // AssignRoute設定
        function setAssignRoute(value) { assignRoute = value; };
        function getAssignRoute() { return assignRoute; };
        this.setAssignRoute = setAssignRoute;
        this.getAssignRoute = getAssignRoute;
        // AssignDetailRoute設定
        function setAssignDetailRoute(value) { assignDetailRoute = value; };
        function getAssignDetailRoute() { return assignDetailRoute; };
        this.setAssignDetailRoute = setAssignDetailRoute;
        this.getAssignDetailRoute = getAssignDetailRoute;
        // AssignTeikiSerializeData設定
        function setAssignTeikiSerializeData(value) { assignTeikiSerializeData = value; };
        function getAssignTeikiSerializeData() { return assignTeikiSerializeData; };
        this.setAssignTeikiSerializeData = setAssignTeikiSerializeData;
        this.getAssignTeikiSerializeData = getAssignTeikiSerializeData;
        // AssignNikukanteikiIndex設定
        function setAssignNikukanteikiIndex(value) { assignNikukanteikiIndex = value; };
        function getAssignNikukanteikiIndex() { return assignNikukanteikiIndex; };
        this.setAssignNikukanteikiIndex = setAssignNikukanteikiIndex;
        this.getAssignNikukanteikiIndex = getAssignNikukanteikiIndex;
        // Coupon設定
        function setCoupon(value) { coupon = value; };
        function getCoupon() { return coupon; };
        this.setCoupon = setCoupon;
        this.getCoupon = getCoupon;
        // 金額設定
        var priceType;
        function setPriceType(value) { priceType = value; };
        function getPriceType() { return priceType; };
        this.setPriceType = setPriceType;
        this.getPriceType = getPriceType;
        // 割り当てエラーの場合にエラーとする
        var bringAssignmentError;
        function setBringAssignmentError(value) { bringAssignmentError = value; };
        function getBringAssignmentError() { return bringAssignmentError; };
        this.setBringAssignmentError = setBringAssignmentError;
        this.getBringAssignmentError = getBringAssignmentError;
        // From
        function setFrom(value) { from = value; };
        function getFrom() { return from; };
        this.setFrom = setFrom;
        this.getFrom = getFrom;
        // To
        function setTo(value) { to = value; };
        function getTo() { return to; };
        this.setTo = setTo;
        this.getTo = getTo;
        // Via
        function setVia(value) { via = value; };
        function getVia() { return via; };
        this.setVia = setVia;
        this.getVia = getVia;
        // Plane
        function setPlane(value) { plane = value; };
        function getPlane() { return plane; };
        this.setPlane = setPlane;
        this.getPlane = getPlane;
        // Shinkansen
        function setShinkansen(value) { shinkansen = value; };
        function getShinkansen() { return shinkansen; };
        this.setShinkansen = setShinkansen;
        this.getShinkansen = getShinkansen;
        // LimitedExpress
        function setLimitedExpress(value) { limitedExpress = value; };
        function getLimitedExpress() { return limitedExpress; };
        this.setLimitedExpress = setLimitedExpress;
        this.getLimitedExpress = getLimitedExpress;
        // Bus
        function setBus(value) { bus = value; };
        function getBus() { return bus; };
        this.setBus = setBus;
        this.getBus = getBus;
    };

    /**
    * コールバック関数の設定
    */
    function bind(type, func) {
        if (type == 'change' && typeof func == 'function') {
            callBackFunctionBind[type] = func;
        } else if (type == 'click' && typeof func == 'function') {
            callBackFunctionBind[type] = func;
        } else if (type == 'close' && typeof func == 'function') {
            callBackFunctionBind[type] = func;
        } else if (type == 'select' && typeof func == 'function') {
            callBackFunctionBind[type] = func;
        }
    }

    /**
    * コールバック関数の解除
    */
    function unbind(type) {
        if (typeof callBackFunctionBind[type] != undefined) {
            callBackFunctionBind[type] = undefined;
        }
    }

    /**
    * メニューオブジェクト作成
    */
    var menu = function (p_text, p_callBack, mask) {
        var text = p_text;
        var callBack = p_callBack;
        var type;
        var mask;
        this.text = text;
        this.callBack = callBack;
        this.mask = mask;
    };

    /**
    * 路線メニューを追加
    */
    function addLineMenu(obj) {
        callBackObjectLine.push(obj);
    };

    /**
    * 駅メニューを追加
    */
    function addPointMenu(obj) {
        callBackObjectStation.push(obj);
    };

    // 外部参照可能な関数リスト
    this.dispCourse = dispCourse;
    this.search = search;
    this.changeCourse = changeCourse;
    this.dispCourseList = dispCourseList;
    this.getSerializeData = getSerializeData;
    this.getSerializeDataAll = getSerializeDataAll;
    this.getTeikiSerializeData = getTeikiSerializeData;
    this.getTeiki = getTeiki;
    this.getNikukanteikiIndex = getNikukanteikiIndex;
    this.getVehicleIndex = getVehicleIndex;
    this.getPassStatusObject = getPassStatusObject;
    this.getResultNo = getResultNo;
    this.getResult = getResult;
    this.getResultString = getResultString;
    this.getResultAll = getResultAll;
    this.getResultStringAll = getResultStringAll;
    this.getDepartureDate = getDepartureDate;
    this.getArrivalDate = getArrivalDate;
    this.checkBestCourse = checkBestCourse;
    this.checkWithTeiki = checkWithTeiki;
    this.setResult = setResult;
    this.setPriceType = setPriceType;
    this.setSerializeData = setSerializeData;
    this.getLineList = getLineList;
    this.getLineObject = getLineObject;
    this.getPointList = getPointList;
    this.getPointObject = getPointObject;
    this.getPrice = getPrice;
    this.getFarePrice = getFarePrice;
    this.getChargePrice = getChargePrice;
    this.getTeikiPrice = getTeikiPrice;
    this.getResultCount = getResultCount;
    this.getFareList = getFareList;
    this.getFareObject = getFareObject;
    this.getChargeList = getChargeList;
    this.getChargeObject = getChargeObject;
    this.createSearchInterface = createSearchInterface;
    this.setConfigure = setConfigure;
    this.courseEdit = courseEdit;
    this.bind = bind;
    this.unbind = unbind;
    this.menu = menu;
    this.addLineMenu = addLineMenu;
    this.addPointMenu = addPointMenu;

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
    this.TEIKI1 = "1";
    this.TEIKI3 = "3";
    this.TEIKI6 = "6";
    this.SEARCHTYPE_DEPARTURE = "departure";
    this.SEARCHTYPE_ARRIVAL = "arrival";
    this.SEARCHTYPE_FIRSTTRAIN = "firstTrain";
    this.SEARCHTYPE_LASTTRAIN = "lastTrain";
    this.SEARCHTYPE_PLAIN = "plain";
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
