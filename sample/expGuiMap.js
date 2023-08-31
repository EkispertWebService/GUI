/**
 *  駅すぱあと Web サービス
 *  路線図パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2017-03-29
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiMap = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiMap\.js"));
        imagePath += "expImages/";
        if (s.src && s.src.match(/expGuiMap\.js(\?.*)?/)) {
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

    //設定オブジェクト
    var configs = new Object();

    //古い端末向けのフラグ
    var oldFlag = false;
    if (/Android\s2\.[0|1]/.test(navigator.userAgent)) {
        oldFlag = true;
    }

    //オブジェクト
    var configure = config;
    //フラグ
    var load = false;
    //描画用
    var canvas;
    var ctx;
    //var timerDrawID;  //描画タイマーID
    var mouseDownFlag = false;  //マウスダウンしているかどうか
    var mouseObj;
    //マルチタッチ用
    var multiTouchFlag = false;  //マルチタッチしているかどうか
    var touchObj;
    //判定
    var clickStationObj;
    //路線図のデータ
    var mapObj;
    //描画路線図オブジェクト
    var obj;
    //画像ファイルの配列
    var imgArray;
    //概観図をロード
    var miniMap;
    var miniMapSub;
    //概観図のクリック領域
    var miniMapObj;
    var miniMapSubObj;
    //駅関連
    var nowLoading = 0;
    var stLoading = 0;
    var stationList; //駅座標オブジェクト
    var stationListArea; //駅チェック範囲
    var stationListLoaded;
    var stationLoading;

    var stationMarkList; //駅マークのリスト
    var stationMarkType;

    //概観図
    var naviMapObj;
    //矢印
    var cursorObj;
    var cursorImg;
    //倍率
    var scaleObj;
    var scaleImg;
    //路線図変更
    var changeObj;
    var changeImg;
    //設定項目
    var naviURL = "expapi/image/navi/";
    var tileSize;
    var cacheSize;

    //各種操作時のコールバック
    var callBackFunctionBind = new Object();

    //エラー時のコールバック
    var onDispMapStation;

    //拡大縮小のフレーム数
    var scaleFrameBase = 10;

    //路線図のリスト
    var mapList;

    /**
    * フレーム処理の定義
    */
    var frame = (1000 / 60);
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/** function */callback, /** DOMElement */element) {
                window.setTimeout(callback, frame);
            };
    })();

    /**
    * 路線図を設定
    */
    function dispMap(prefix, cbFunction) {
        onDispMapStation = cbFunction;
        return setMapStation(prefix);
    }

    /**
    * 路線図を中心駅を指定して表示
    */
    function dispMapStation(centerStation, prefix, cbFunction) {
        if (typeof prefix == 'string') {
            // prefixを指定している場合
            onDispMapStation = cbFunction;
            return setMapStation(prefix, centerStation);
        } else if (typeof prefix == 'function' || typeof prefix == 'undefined') {
            // prefixを指定していない場合
            onDispMapStation = prefix;
            return setDispMapStation(centerStation);
        }
    }

    /**
    * 駅名を指定して路線図を表示
    */
    function setDispMapStation(station) {
        var JSON_object = {};
        var http_request;
        var mapStationUrl = apiURL + "v1/json/railmap/list?key=" + key;
        if (isNaN(station)) {
            mapStationUrl += "&stationName=" + encodeURIComponent(station);
        } else {
            mapStationUrl += "&stationCode=" + station;
        }
        if (window.XDomainRequest) {
            //IE9用
            http_request = new XDomainRequest();
            http_request.onload = function () {
                JSON_object = JSON.parse(http_request.responseText);
                if (typeof JSON_object.ResultSet.RailMap != 'undefined') {
                    if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                        if (typeof JSON_object.ResultSet.RailMap.Point != 'undefined') {
                            setMapStation(JSON_object.ResultSet.RailMap.id, JSON_object.ResultSet.RailMap.Point.Station.code);
                        }
                    } else {
                        if (typeof JSON_object.ResultSet.RailMap[0].Point != 'undefined') {
                            setMapStation(JSON_object.ResultSet.RailMap[0].id, JSON_object.ResultSet.RailMap[0].Point.Station.code);
                        }
                    }
                } else {
                    resultCenterStation(false, station);
                }
            };
            http_request.onerror = function () {
                // エラー時の処理
                resultCenterStation(false, station);
            };
        } else {
            http_request = new XMLHttpRequest();
            http_request.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (http_request.readyState == done && http_request.status == ok) {
                    JSON_object = JSON.parse(http_request.responseText);
                    if (typeof JSON_object.ResultSet.RailMap != 'undefined') {
                        if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                            if (typeof JSON_object.ResultSet.RailMap.Point != 'undefined') {
                                setMapStation(JSON_object.ResultSet.RailMap.id, JSON_object.ResultSet.RailMap.Point.Station.code);
                            }
                        } else {
                            if (typeof JSON_object.ResultSet.RailMap[0].Point != 'undefined') {
                                setMapStation(JSON_object.ResultSet.RailMap[0].id, JSON_object.ResultSet.RailMap[0].Point.Station.code);
                            }
                        }
                    } else {
                        resultCenterStation(false, station);
                    }
                } else if (http_request.readyState == done && http_request.status != ok) {
                    // エラー時の処理
                    resultCenterStation(false, station);
                }
            };
        }
        http_request.open("GET", mapStationUrl, true);
        http_request.send(null);
    }

    /**
    * 路線図の中心座標を指定
    */
    function dispMapCenterPoint(point) {
        if (point.prefix == obj.prefix) {
            setCenter(point.x, point.y);
        } else {
            obj.centerStationX = point.x;
            obj.centerStationY = point.y;
            obj.prefix = point.prefix;
            loadMapData(obj.prefix);
        }
    }

    /**
    * 路線図の中心駅を設定
    */
    function setMapStation(prefix, centerStation) {
        if (typeof canvas == 'undefined') {
            //路線図の初期化
            if (typeof configure == 'undefined') {
                configure = new Object();
                configure.configure = new Object();
            }
            tileSize = (configure.configure.tileSize != null) ? configure.configure.tileSize : 500;
            frame = (configure.configure.frame != null) ? configure.configure.frame : (1000 / 60);
            cacheSize = (configure.configure.cacheSize != null) ? configure.configure.cacheSize : 0;

            imagePath = (configure.configure.imagePath != null) ? configure.configure.imagePath : imagePath;

            naviMapObj = new Object();
            naviMapObj.flag = (configure.configure.navi != null) ? configure.configure.navi : false;
            naviMapObj.x = (configure.configure.navi_x != null) ? configure.configure.navi_x : 10;
            naviMapObj.y = (configure.configure.navi_y != null) ? configure.configure.navi_y : 10;

            cursorObj = new Object();
            cursorObj.flag = (configure.configure.cursor != null) ? configure.configure.cursor : false;
            cursorObj.x = (configure.configure.cursor_x != null) ? configure.configure.cursor_x : -10;
            cursorObj.y = (configure.configure.cursor_y != null) ? configure.configure.cursor_y : 10;

            scaleObj = new Object();
            scaleObj.flag = (configure.configure.zoom != null) ? configure.configure.zoom : false;
            scaleObj.x = (configure.configure.scale_x != null) ? configure.configure.scale_x : 10;
            scaleObj.y = (configure.configure.scale_y != null) ? configure.configure.scale_y : -10;
            scaleObj.continuousZoom = (configure.configure.continuousZoom != null) ? configure.configure.continuousZoom : false;
            scaleObj.doubleClickZoom = (configure.configure.doubleClickZoom != null) ? configure.configure.doubleClickZoom : false;
            //拡大縮小専用
            scaleObj.diffScale = 0;
            scaleObj.centerX = 0;
            scaleObj.centerY = 0;
            scaleObj.frame = 0;
            scaleObj.targetScale = (configure.configure.targetScale != null) ? configure.configure.targetScale : 1;

            //路線図選択
            changeObj = new Object();
            changeObj.flag = (configure.configure.change != null) ? configure.configure.change : false;
            changeObj.x = (configure.configure.change_x != null) ? configure.configure.change_x : -10;
            changeObj.y = (configure.configure.change_y != null) ? configure.configure.change_y : -10;

            //マウスオブジェクト
            mouseObj = new Object();
            mouseObj.frame = 0;

            //タッチオブジェクト
            touchObj = new Object();
            touchObj.scale = 0;
            touchObj.centerX = 0;
            touchObj.centerY = 0;
            touchObj.defScale = 0;

            obj = new Object();
            obj.x = 0;
            obj.y = 0;
            obj.moveX = 0;
            obj.moveY = 0;
            obj.old_x = 0;
            obj.old_y = 0;
            obj.speedX = 0;
            obj.speedY = 0;
            obj.cursorMoveX = 0;
            obj.cursorMoveY = 0;
            obj.scale = scaleObj.targetScale;
            obj.centerStation = centerStation;
            obj.centerStationX = -1;
            obj.centerStationY = -1;
            obj.dragging = (configure.configure.dragging != null) ? configure.configure.dragging : true;
            obj.prefix = (prefix != null) ? prefix : "tokyo";

            var buffer = '';
            // CSSファイルを指定しない場合の対策としてwidthとheightをここで指定
            buffer += '<div class="expGuiMap" style="width:100%;height:100%;">';
            // 選択用のポップアップ領域
            buffer += '<div id="' + baseId + ':selectWindow" class="exp_mapListPopup" style="display:none;">';
            // 選択画面
            buffer += '<div class="exp_mapListBody">';
            // 閉じるボタン
            buffer += '<div class="exp_header">';
            buffer += '<div class="exp_windowClose">';
            buffer += '<a class="exp_windowCloseButton" id="' + baseId + ':windowClose" href="Javascript:void(0);"><span class="exp_text" id="' + baseId + ':windowClose:text">閉じる</span></a>';
            buffer += '</div>';
            buffer += '</div>';
            // 路線図一覧
            buffer += '<div class="exp_mapList" id="' + baseId + ':mapList"></div>';
            buffer += '</div>';
            buffer += '</div>';
            // 路線図の描画
            buffer += '<canvas id="' + baseId + ':canvas" width="' + documentObject.clientWidth + '" height="' + documentObject.clientHeight + '" style="-webkit-tap-highlight-color:rgba(0,0,0,0);"></canvas>';
            buffer += '</div>';
            documentObject.innerHTML = buffer;

            // イベント追加
            addEvent(document.getElementById(baseId + ":selectWindow"), "click", onEvent);

            //キャンバスの初期処理
            canvas = document.getElementById(baseId + ':canvas');

            if (!canvas || !canvas.getContext) return false;
            //2Dコンテキスト
            ctx = canvas.getContext('2d');

            obj.cW = canvas.width;
            obj.cH = canvas.height;

            //路線図リストを取得
            loadMapData(obj.prefix);
            return true;
        } else {
            if (prefix == obj.prefix) {
                //中心に移動
                if (typeof centerStation != 'undefined') {
                    initMap(centerStation);
                }
            } else {
                //路線図の変更
                obj.prefix = prefix;
                obj.centerStation = centerStation;
                loadMapData(obj.prefix);
            }
            return true;
        }
    }

    /**
    * コールバック関数の定義
    */
    function bind(type, func) {
        if (type == 'click' && typeof func == 'function') {
            callBackFunctionBind[type] = func;
        } else if (type == 'change' && typeof func == 'function') {
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
    * 路線図の倍率を取得
    */
    function getScale() {
        var tmpScale = Math.round((obj.scale + touchObj.scale + scaleObj.diffScale) * 10) / 10;
        if (tmpScale < 1) {
            return 1;
        } else if (tmpScale > 4) {
            return 4;
        } else {
            return tmpScale;
        }
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

    /**
    * マウス・タッチイベントの設定
    */
    function addMouseEvent() {
        //イベント
        var isiPad = navigator.userAgent.match(/iPad/i) != null;
        var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
        var isAndroid = navigator.userAgent.match(/Android/i) != null;
        if (isiPad || isiPhone || isAndroid) {
            canvas.addEventListener("touchstart", mouseDownListner, false);
            canvas.addEventListener("touchmove", mouseMoveListner, false);
            canvas.addEventListener("touchend", mouseUpListner, false);
            canvas.addEventListener("touchcancel", mouseUpListner, false);
        } else {
            canvas.addEventListener("mousedown", mouseDownListner, false);
            canvas.addEventListener("mousemove", mouseMoveListner, false);
            canvas.addEventListener("mouseup", mouseUpListner, false);
            canvas.addEventListener("mouseout", mouseUpListner, false);
        }
    }

    /**
    * 路線図情報の取得
    */
    function loadMapData(prefix) {
        var hd_flag = false;
        if (prefix.indexOf("hd_") != -1) {
            hd_flag = true;
            prefix = prefix.substring(3, prefix.length);
        }
        var url = apiURL + "v1/json/railmap/list?key=" + key + "&id=" + prefix;
        var JSON_object = {};
        var http_request;
        if (window.XDomainRequest) {
            //IE9用
            http_request = new XDomainRequest();
            http_request.onload = function () {
                JSON_object = JSON.parse(http_request.responseText);
                if (typeof JSON_object.ResultSet.RailMap != 'undefined') {
                    if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                        mapObj = getMapData(JSON_object.ResultSet.RailMap, hd_flag);
                    } else {
                        mapObj = getMapData(JSON_object.ResultSet.RailMap[0], hd_flag);
                    }
                    changeMap();
                }
            };
        } else {
            http_request = new XMLHttpRequest();
            http_request.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (http_request.readyState == done && http_request.status == ok) {
                    JSON_object = JSON.parse(http_request.responseText);
                    if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                        mapObj = getMapData(JSON_object.ResultSet.RailMap, hd_flag);
                    } else {
                        mapObj = getMapData(JSON_object.ResultSet.RailMap[0], hd_flag);
                    }
                    changeMap();
                }
            };
        }
        http_request.open("GET", url, true);
        http_request.send(null);
    }

    /**
    * prefix指定で路線図変更
    */
    function changeMap() {
        //変更チェック
        var changeFlag = (typeof obj.name != 'undefined') ? true : false;

        //オブジェクト
        obj.prefix = mapObj.prefix;
        obj.x = 0;
        obj.y = 0;
        obj.moveX = 0;
        obj.moveY = 0;
        obj.old_x = 0;
        obj.old_y = 0;
        obj.speedX = 0;
        obj.speedY = 0;
        obj.cursorMoveX = 0;
        obj.cursorMoveY = 0;

        //駅リスト
        stationList = new Array();
        stationListArea = new Array();
        stationListLoaded = new Array();
        miniMap = undefined;
        miniMapSub = undefined;
        ctx.clearRect(0, 0, obj.cW, obj.cH);
        ctx.beginPath();

        //駅マークのリスト
        stationMarkList = new Array();
        stationMarkType = 2;

        //路線図の情報をセット
        obj.name = mapObj.name;
        obj.mapWidth = parseInt(mapObj.width);
        obj.mapHeight = parseInt(mapObj.height);
        obj.miniMapFile = mapObj.minimap;
        obj.miniMapSubFile = (mapObj.submap ? mapObj.submap : "");

        //初期位置取得
        if (obj.centerStationX != -1 && obj.centerStationY != -1) {
            setCenter(obj.centerStationX, obj.centerStationY);
            obj.centerStationX = -1;
            obj.centerStationY = -1;
            //路線図ロード開始
            loadMap();
        } else {
            if (typeof obj.centerStation == 'undefined') {
                if (typeof mapObj.defaultStation != 'undefined') {
                    initMap(mapObj.defaultStation);
                } else {
                    //中心駅が無い場合の処理
                    setInitMapCenter(Math.floor(mapObj.width / 2), Math.floor(mapObj.height / 2));
                }
            } else {
                if (mapObj.defaultStation != obj.centerStation) {
                    initMap(obj.centerStation);
                } else {
                    initMap(mapObj.defaultStation);
                }
            }
        }
        //路線図変更時のコールバック
        if (changeFlag && typeof callBackFunctionBind['change'] == 'function') {
            callBackFunctionBind['change'](true);
        }
    }

    /**
    * 描画領域の変更
    */
    function changeCanvas(w, h) {
        //中心座標
        var tmp_x = Math.round(obj.x * -1 + obj.cW / getScale() / 2);
        var tmp_y = Math.round(obj.y * -1 + obj.cH / getScale() / 2);
        //キャンバスのサイズ変更
        obj.cW = w;
        obj.cH = h;
        canvas = document.getElementById(baseId + ':canvas');
        canvas.width = obj.cW;
        canvas.height = obj.cH;
        //2Dコンテキスト
        ctx = canvas.getContext('2d');
        //中心を再設定
        setCenter(tmp_x, tmp_y);
    }

    /**
    * JSONデータを解析
    */
    function getMapData(json, hd_flag) {
        var mapData = new Object();
        mapData.name = json.Name;
        if (hd_flag) {
            mapData.prefix = "hd_" + json.id;
            mapData.width = json.width * 2;
            mapData.height = json.height * 2;
        } else {
            mapData.prefix = json.id;
            mapData.width = json.width;
            mapData.height = json.height;
        }
        if (typeof json.Point != 'undefined') {
            mapData.defaultStation = json.Point.Station.code;
            mapData.type = json.Point.Station.Type;
        }    
        if (mapData.prefix == "jpnx1" || mapData.prefix == "jpnx2" || mapData.prefix == "jpnx4") {
            mapData.minimap = "jp_small.png";
            if (mapData.prefix == "jpnx2" || mapData.prefix == "jpnx4") {
                mapData.submap = "jp_large.png";
            }
        } else {
            mapData.minimap = mapData.prefix + ".png";
        }
        if (mapData.prefix == "jpnx4") {
            mapData.selected = "selected";
        }
        return mapData;
    }

    /**
    * 路線図の中心位置を取得
    */
    function initMap(station) {
        var JSON_object = {};
        var http_request;
        var mapStationUrl = apiURL + "v1/json/railmap/detail?key=" + key + "&id=" + obj.prefix;
        if (isNaN(station)) {
            mapStationUrl += "&stationName=" + encodeURIComponent(station);
        } else {
            mapStationUrl += "&stationCode=" + station;
        }
        if (window.XDomainRequest) {
            //IE9用
            http_request = new XDomainRequest();
            http_request.onload = function () {
                JSON_object = JSON.parse(http_request.responseText);
                if (typeof JSON_object.ResultSet.RailMap.Point != 'undefined') {
                    if (typeof JSON_object.ResultSet.RailMap.Point.MarkCoordinates.length == 'undefined') {
                        setInitMapCenter((parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.x) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.width) / 2), (parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.y) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.height) / 2));
                    } else {
                        setInitMapCenter((parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].x) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].width) / 2), (parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].y) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].height) / 2));
                    }
                    resultCenterStation(true, station);
                } else {
                    resultCenterStation(false, station);
                }
            };
        } else {
            http_request = new XMLHttpRequest();
            http_request.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (http_request.readyState == done && http_request.status == ok) {
                    JSON_object = JSON.parse(http_request.responseText);
                    if (typeof JSON_object.ResultSet.RailMap.Point != 'undefined') {
                        if (typeof JSON_object.ResultSet.RailMap.Point.MarkCoordinates.length == 'undefined') {
                            setInitMapCenter((parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.x) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.width) / 2), (parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.y) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates.height) / 2));
                        } else {
                            setInitMapCenter((parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].x) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].width) / 2), (parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].y) + parseInt(JSON_object.ResultSet.RailMap.Point.MarkCoordinates[0].height) / 2));
                        }
                        resultCenterStation(true, station);
                    } else {
                        resultCenterStation(false, station);
                    }
                }
            };
        }
        http_request.open("GET", mapStationUrl, true);
        http_request.send(null);
    }

    /**
    * 選択エラー時の処理
    */
    function resultCenterStation(flag, code) {
        if (typeof onDispMapStation != 'undefined') {
            var tmp_onDispMapStation = onDispMapStation;
            onDispMapStation = undefined;
            tmp_onDispMapStation(flag, code);
        }
    }

    /**
    * 路線図の初期位置を変更
    */
    function setInitMapCenter(x, y) {
        setCenter(x, y);
        //路線図ロード開始
        loadMap();
        if (!load) {
            load = true;
            //タイマー開始
            setTimerDraw();
            //イベントを実行
            addMouseEvent();
        }
    }

    /**
    * 路線図オブジェクトの初期化
    */
    function loadMap() {
        stLoading = 0;
        //画像配列
        imgArray = new Array(Math.ceil(obj.mapWidth / tileSize) * Math.ceil(obj.mapHeight / tileSize));
        for (var i = 0; i < Math.ceil(obj.mapWidth / tileSize); i++) {
            for (var j = 0; j < Math.ceil(obj.mapHeight / tileSize); j++) {
                imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))] = new Image();
            }
        }
        //初期表示
        drawMap(0, 0);
    }

    /**
    * 路線図を描画開始する処理
    */
    function setTimerDraw() {
        //監視処理
        if (document.getElementById(baseId + ':canvas')) {
            //  clearInterval(timerDrawID);
            //  timerDrawID = setInterval(function(){onEnterFrame(true);},frame);
            onEnterFrame();
            requestAnimFrame(setTimerDraw);
        }
    }

    /**
    * フレーム単位で呼ばれる関数
    */
    function onEnterFrame() {
        //ドラッグ中のみ
        if (mouseDownFlag) {
            drawMap(Math.round(mouseObj.dragDivX / getScale()), Math.round(mouseObj.dragDivY / getScale()));
        } else if (multiTouchFlag) {
            drawMap(Math.round(-touchObj.centerX * (getScale() - obj.scale)) / obj.scale, Math.round(-touchObj.centerY * (getScale() - obj.scale)) / obj.scale);
        }
        //サイズ変更のチェック
        if (obj.cW != (documentObject.clientWidth) || obj.cH != (documentObject.clientHeight)) {
            changeCanvas(documentObject.clientWidth, documentObject.clientHeight);
            return;
        } else {
            if (mouseDownFlag) {
                //ドラッグ中の処理
                obj.speedX = (obj.speedX + ((obj.x + obj.moveX) - obj.old_x) * -1) / 2;
                obj.speedY = (obj.speedY + ((obj.y + obj.moveY) - obj.old_y) * -1) / 2;
                obj.old_x = obj.x + obj.moveX;
                obj.old_y = obj.y + obj.moveY;
                drawMap(mouseObj.dragDivX, mouseObj.dragDivY);
            } else if (obj.speedX != 0 || obj.speedY != 0) {
                //加速中の処理
                if (Math.abs(obj.speedX) >= 1) {
                    obj.x += -Math.round(obj.speedX);
                    obj.speedX = obj.speedX * 3 / 4;
                } else {
                    obj.speedX = 0;
                }
                if (Math.abs(obj.speedY) >= 1) {
                    obj.y += -Math.round(obj.speedY);
                    obj.speedY = obj.speedY * 3 / 4;
                } else {
                    obj.speedY = 0;
                }
                drawMap(0, 0);
            } else if (obj.cursorMoveX != 0 || obj.cursorMoveY != 0) {
                //移動の処理
                if (Math.abs(obj.cursorMoveX) < 10) {
                    obj.x -= obj.cursorMoveX;
                    obj.cursorMoveX = 0;
                } else if (obj.cursorMoveX > 0) {
                    obj.x -= 10;
                    obj.cursorMoveX -= 10;
                } else if (obj.cursorMoveX < 0) {
                    obj.x += 10;
                    obj.cursorMoveX += 10;
                }
                if (Math.abs(obj.cursorMoveY) < 10) {
                    obj.x -= obj.cursorMoveY;
                    obj.cursorMoveY = 0;
                } else if (obj.cursorMoveY > 0) {
                    obj.y -= 10;
                    obj.cursorMoveY -= 10;
                } else if (obj.cursorMoveY < 0) {
                    obj.y += 10;
                    obj.cursorMoveY += 10;
                }
                //座標チェック
                if (obj.x > 0) { obj.x = 0; }
                if (obj.y > 0) { obj.y = 0; }
                if (obj.x < obj.mapWidth * -1 + obj.cW / getScale()) {
                    obj.x = (obj.mapWidth - obj.cW / getScale()) * -1;
                }
                if (obj.y < obj.mapHeight * -1 + obj.cH / getScale()) {
                    obj.y = (obj.mapHeight - obj.cH / getScale()) * -1;
                }
                drawMap(0, 0);
            } else if (scaleObj.frame >= 1) {
                scaleObj.frame--;
                //拡大縮小
                if (scaleObj.centerX == 0 && scaleObj.centerY == 0) {
                    var tmp_x = Math.round(obj.x * -1 + obj.cW / getScale() / 2);
                    var tmp_y = Math.round(obj.y * -1 + obj.cH / getScale() / 2);
                    scaleObj.diffScale = Math.floor((scaleObj.targetScale - obj.scale) / scaleFrameBase * (scaleFrameBase - scaleObj.frame) * 10) / 10;
                    //中心を再設定
                    setCenter(tmp_x, tmp_y);
                } else {
                    scaleObj.diffScale = Math.floor((scaleObj.targetScale - obj.scale) / scaleFrameBase * (scaleFrameBase - scaleObj.frame) * 10) / 10;
                    drawMap(Math.round(-scaleObj.centerX * (getScale() - obj.scale) / obj.scale), Math.round(-scaleObj.centerY * (getScale() - obj.scale) / obj.scale));
                }
                if (scaleObj.frame == 0) {
                    obj.x += Math.round(obj.moveX);
                    obj.y += Math.round(obj.moveY);
                    obj.moveX = 0;
                    obj.moveY = 0;
                    obj.scale = getScale();
                    scaleObj.centerX = 0;
                    scaleObj.centerY = 0;
                    scaleObj.diffScale = 0;
                    drawMap(0, 0);
                }
            }
        }
        //ダブルクリック
        if (mouseObj.frame > 0) {
            mouseObj.frame--;
        }
    }

    /**
    * 路線図の移動処理
    */
    function drawMap(moveX, moveY) {
        //はみ出しチェック
        if (obj.mapWidth > (obj.cW / getScale())) {
            if (obj.x + moveX > 0) {
                moveX = obj.x * -1;
                obj.speedX = 0;
                obj.cursorMoveX = 0;
            } else if (obj.x + moveX < obj.mapWidth * -1 + obj.cW / getScale()) {
                moveX = (obj.mapWidth - obj.cW / getScale()) * -1 - obj.x;
                obj.speedX = 0;
                obj.cursorMoveX = 0;
            }
        } else {
            moveX = 0;
            obj.x = 0;
            obj.speedX = 0;
            obj.cursorMoveX = 0;
        }
        if (obj.mapHeight > (obj.cH / getScale())) {
            if (obj.y + moveY > 0) {
                moveY = obj.y * -1;
                obj.speedY = 0;
                obj.cursorMoveY = 0;
            } else if (obj.y + moveY < obj.mapHeight * -1 + obj.cH / getScale()) {
                moveY = (obj.mapHeight - obj.cH / getScale()) * -1 - obj.y;
                obj.speedY = 0;
                obj.cursorMoveY = 0;
            }
        } else {
            moveY = 0;
            obj.y = 0;
            obj.speedY = 0;
            obj.cursorMoveY = 0;
        }
        //決定した移動距離
        obj.moveX = moveX / getScale();
        obj.moveY = moveY / getScale();
        //画像ロード
        drawImage(true);
        //駅リストロード
        loadStation();
    }


    /**
    * 路線図を実際に描画する関数
    */
    function drawImage(flag) {
        //はみ出しチェック
        if (obj.mapWidth <= (obj.cW / getScale())) { obj.x = 0; }
        if (obj.mapHeight <= (obj.cH / getScale())) { obj.y = 0; }
        //他がロード中の場合はロードしない
        if (flag == 0 && nowLoading == 1) {
            return;
        } else {
            nowLoading = 1;
            drawImageObj(flag);
        }
    }

    /**
    * キャンバスへ路線図を描画
    */
    function drawImageObj(flag) {
        try {
            var reload = false;
            //android2.0,2.1用
            if (oldFlag) {
                // 縮小
                ctx.save();
                var rate = Math.sqrt(320 / screen.width);
                ctx.scale(rate, rate);
            }
            //画像ロード処理
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            for (var i = 0; i < Math.ceil(obj.mapWidth / tileSize); i++) {
                for (var j = 0; j < Math.ceil(obj.mapHeight / tileSize); j++) {
                    if (((obj.x + obj.moveX) + i * tileSize + tileSize) * getScale() >= cacheSize * -1 &&
                        ((obj.y + obj.moveY) + j * tileSize + tileSize) * getScale() >= cacheSize * -1 &&
                        ((obj.x + obj.moveX) + i * tileSize) * getScale() <= obj.cW + cacheSize &&
                        ((obj.y + obj.moveY) + j * tileSize) * getScale() <= obj.cH + cacheSize) {
                        //画像ファイルをロードしていない場合
                        if (imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))].src == "") {
                            //画像をロード
                            imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))] = new Image();
                            imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))].src = apiURL + "v1/png/railmap/data?key=" + key + "&id=" + obj.prefix + "&x=" + i * tileSize + "&y=" + j * tileSize + "&width=" + tileSize + "&height=" + tileSize;
                        }
                        ctx.drawImage(imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))], Math.floor((obj.x + obj.moveX) + i * tileSize) * getScale(), Math.floor((obj.y + obj.moveY) + j * tileSize) * getScale(), Math.floor(tileSize * getScale()), Math.floor(tileSize * getScale()));
                        if (imgArray[(i + j * Math.ceil(obj.mapWidth / tileSize))].complete) {
                            if (!oldFlag) {
                                //駅情報読込中は白く塗る
                                var mapNo = (i + j * Math.ceil(obj.mapWidth / tileSize));
                                if (typeof stationList[mapNo] == 'undefined') {
                                    ctx.fillRect(Math.floor((obj.x + obj.moveX) + i * tileSize) * getScale(), Math.floor((obj.y + obj.moveY) + j * tileSize) * getScale(), Math.floor(tileSize * getScale()), Math.floor(tileSize * getScale()));
                                }
                            }
                        } else {
                            if (!oldFlag) {
                                //ロード中は塗りつぶし
                                ctx.clearRect(Math.floor((obj.x + obj.moveX) + i * tileSize) * getScale(), Math.floor((obj.y + obj.moveY) + j * tileSize) * getScale(), Math.floor(tileSize * getScale()), Math.floor(tileSize * getScale()));
                                ctx.beginPath();
                            }
                            reload = true;
                        }
                    }
                }
            }

            if (oldFlag) {
                ctx.restore();
            }

            ctx.fillStyle = "rgb(255, 255, 255)";
            //空白部分は白で塗りつぶし
            if (obj.mapWidth * getScale() <= obj.cW) {
                ctx.fillRect(Math.ceil(obj.mapWidth * getScale()), 0, obj.cW - Math.ceil(obj.mapWidth * getScale()), obj.cH);
            }
            if (obj.mapHeight * getScale() <= obj.cH) {
                ctx.fillRect(0, Math.ceil(obj.mapHeight * getScale()), obj.cW, obj.cH - Math.ceil(obj.mapHeight * getScale()));
            }

            //駅の選択
            ctx.lineWidth = Math.ceil(getScale()) + 1;
            for (var i = 0; i < stationMarkList.length; i++) {
                if (typeof stationMarkList[i].stationNameType != 'undefined' && (stationMarkType != 0 || typeof stationMarkList[i].stationIconType == 'undefined')) {
                    //駅名
                    if ((obj.x + obj.moveX) * -1 <= (stationMarkList[i].stationName_x + stationMarkList[i].stationName_w) &&
                        (obj.y + obj.moveY) * -1 <= (stationMarkList[i].stationName_y + stationMarkList[i].stationName_h) &&
                        (obj.x + obj.moveX) * -1 + obj.cW * getScale() >= stationMarkList[i].stationName_x &&
                        (obj.y + obj.moveY) * -1 + obj.cH * getScale() >= stationMarkList[i].stationName_y) {
                        if (typeof stationMarkList[i].stationIconType == 'undefined') {
                            //塗りつぶす
                            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                            ctx.fillRect(Math.round((stationMarkList[i].stationName_x - (obj.x + obj.moveX) * -1 - 1) * getScale()), Math.round((stationMarkList[i].stationName_y - (obj.y + obj.moveY) * -1 - 1) * getScale()), Math.round((stationMarkList[i].stationName_w + 2) * getScale()), Math.round((stationMarkList[i].stationName_h + 2) * getScale()));
                        } else {
                            ctx.strokeStyle = "rgb(255, 0, 0)";
                            ctx.strokeRect(Math.round((stationMarkList[i].stationName_x - (obj.x + obj.moveX) * -1) * getScale()), Math.round((stationMarkList[i].stationName_y - (obj.y + obj.moveY) * -1) * getScale()), Math.round(stationMarkList[i].stationName_w * getScale()), Math.round(stationMarkList[i].stationName_h * getScale()));
                        }
                    }
                }
                if (typeof stationMarkList[i].stationIconType != 'undefined' && stationMarkType != 1) {
                    //駅のアイコン
                    if ((obj.x + obj.moveX) * -1 <= (stationMarkList[i].stationIcon_x + stationMarkList[i].stationIcon_w) &&
                        (obj.y + obj.moveY) * -1 <= (stationMarkList[i].stationIcon_y + stationMarkList[i].stationIcon_h) &&
                        (obj.x + obj.moveX) * -1 + obj.cW * getScale() >= stationMarkList[i].stationIcon_x &&
                        (obj.y + obj.moveY) * -1 + obj.cH * getScale() >= stationMarkList[i].stationIcon_y) {
                        if (stationMarkList[i].stationIconType == 2) {
                            //円
                            ctx.beginPath();
                            ctx.fillStyle = "rgb(255, 0, 0)";
                            ctx.arc(Math.round((stationMarkList[i].stationIcon_x + stationMarkList[i].stationIcon_w / 2 - (obj.x + obj.moveX) * -1) * getScale()), Math.round((stationMarkList[i].stationIcon_y + stationMarkList[i].stationIcon_h / 2 - (obj.y + obj.moveY) * -1) * getScale()), Math.round(stationMarkList[i].stationIcon_h / 2 * getScale()), 0, Math.PI * 2, false);
                            ctx.fill();
                        } else {
                            //四角
                            ctx.fillStyle = "rgb(255, 0, 0)";
                            ctx.fillRect(Math.round((stationMarkList[i].stationIcon_x - (obj.x + obj.moveX) * -1) * getScale()), Math.round((stationMarkList[i].stationIcon_y - (obj.y + obj.moveY) * -1) * getScale()), Math.round(stationMarkList[i].stationIcon_w * getScale()), Math.round(stationMarkList[i].stationIcon_h * getScale()));
                        }
                    }
                }
            }

            if (oldFlag) {
                // 縮小
                ctx.save();
                var rate = Math.sqrt(320 / screen.width);
                ctx.scale(rate, rate);
            }
            //カーソル
            if (cursorObj.flag) {
                if (!cursorImg) {
                    cursorImg = new Image();
                    cursorImg.src = imagePath + "mapCursor.png";
                }
                var cursor_x;
                var cursor_y;
                if (cursorObj.x >= 0) {
                    cursor_x = cursorObj.x;
                } else {
                    cursor_x = obj.cW + cursorObj.x - 120;
                }
                if (cursorObj.y >= 0) {
                    cursor_y = cursorObj.y;
                } else {
                    cursor_y = obj.cH + cursorObj.y - 120;
                }
                if (cursorImg.complete) {
                    ctx.drawImage(cursorImg, cursor_x, cursor_y);
                } else {
                    reload = true;
                }
            }

            //倍率
            if (scaleObj.flag) {
                if (!scaleImg) {
                    scaleImg = new Image();
                    scaleImg.src = imagePath + "mapScale.png";
                }
                var scale_x;
                var scale_y;
                if (scaleObj.x >= 0) {
                    scale_x = scaleObj.x;
                } else {
                    scale_x = obj.cW + scaleObj.x - 40;
                }
                if (scaleObj.y >= 0) {
                    scale_y = scaleObj.y;
                } else {
                    scale_y = obj.cH + scaleObj.y - 80;
                }
                if (scaleImg.complete) {
                    ctx.drawImage(scaleImg, scale_x, scale_y);
                } else {
                    reload = true;
                }
            }

            //路線図選択
            if (changeObj.flag) {
                if (!changeImg) {
                    changeImg = new Image();
                    changeImg.src = imagePath + "mapSelect.png";
                }
                var change_x;
                var change_y;
                if (changeObj.x >= 0) {
                    change_x = changeObj.x;
                } else {
                    change_x = obj.cW + changeObj.x - 104;
                }
                if (changeObj.y >= 0) {
                    change_y = changeObj.y;
                } else {
                    change_y = obj.cH + changeObj.y - 30;
                }
                if (changeImg.complete) {
                    ctx.drawImage(changeImg, change_x, change_y);
                } else {
                    reload = true;
                }
            }

            //概観図イメージ
            if (naviMapObj.flag) {
                //概観図をロード
                if (!miniMap) {
                    miniMap = new Image();
                    miniMap.src = apiURL + naviURL + obj.miniMapFile;
                    miniMapObj = new Object();
                    miniMapObj.loaded = false;
                }
                if (miniMap.complete && miniMapObj.loaded) {
                    ctx.drawImage(miniMap, miniMapObj.x, miniMapObj.y);
                } else {
                    reload = true;
                }
                if (obj.miniMapSubFile.length > 0) {
                    //概観図2をロード
                    if (!miniMapSub) {
                        miniMapSub = new Image();
                        miniMapSub.src = apiURL + naviURL + obj.miniMapSubFile;
                        miniMapSubObj = new Object();
                        miniMapSubObj.loaded = false;
                    }
                    if (miniMapSub.complete && miniMapSubObj.loaded) {
                        ctx.drawImage(miniMapSub, miniMapSubObj.pos, 0, miniMapObj.w, miniMapSubObj.h, miniMapSubObj.x, miniMapSubObj.y, miniMapObj.w, miniMapSubObj.h);
                    } else {
                        reload = true;
                    }
                } else {
                    miniMapSubObj = new Object();
                }
            }

            if (oldFlag) {
                ctx.restore();
            }

            //概観図の線
            if (naviMapObj.flag) {
                if (miniMap.complete) {
                    ctx.strokeStyle = "rgb(0, 0, 0)";
                    ctx.lineWidth = 1;
                    //概観図用の描画領域(割合)
                    var m_x = (obj.x + obj.moveX) / obj.mapWidth * -1;
                    var m_y = (obj.y + obj.moveY) / obj.mapHeight * -1;
                    var m_w = obj.cW / obj.mapWidth;
                    var m_h = obj.cH / obj.mapHeight;
                    //概観図のサイズを取得
                    miniMapObj.w = miniMap.width;
                    miniMapObj.h = miniMap.height;
                    //概観図の位置を設定
                    if (naviMapObj.x >= 0) {
                        miniMapObj.x = naviMapObj.x;
                    } else {
                        miniMapObj.x = obj.cW + naviMapObj.x - miniMapObj.w;
                    }
                    if (naviMapObj.y >= 0) {
                        miniMapObj.y = naviMapObj.y;
                    } else {
                        if (obj.miniMapSubFile.length > 0) {
                            miniMapObj.y = obj.cH + naviMapObj.y - miniMapObj.h - miniMapSubObj.h;
                        } else {
                            miniMapObj.y = obj.cH + naviMapObj.y - miniMapObj.h;
                        }
                    }
                    //外枠
                    ctx.strokeRect(miniMapObj.x, miniMapObj.y, miniMapObj.w, miniMapObj.h);
                    //枠
                    var lineWidth = Math.round(m_w * miniMapObj.w / getScale());
                    if (lineWidth > miniMapObj.w) { lineWidth = miniMapObj.w; } //画面サイズ以下の場合
                    var lineHeight = Math.round(m_h * miniMapObj.h / getScale());
                    if (lineHeight > miniMapObj.h) { lineHeight = miniMapObj.h; } //画面サイズ以下の場合
                    //線の描画
                    ctx.strokeRect(miniMapObj.x + Math.round(m_x * miniMapObj.w), miniMapObj.y + Math.round(m_y * miniMapObj.h), lineWidth, lineHeight);
                    miniMapObj.loaded = true;
                    if (obj.miniMapSubFile.length > 0) {
                        if (miniMapSub.complete) {
                            //概観図の位置を設定
                            miniMapSubObj.x = miniMapObj.x;
                            miniMapSubObj.y = miniMapObj.y + miniMapObj.h;
                            //拡大図は制御が必要
                            miniMapSubObj.w = miniMapSub.width;
                            miniMapSubObj.h = miniMapSub.height;
                            //表示位置を制御
                            miniMapSubObj.pos = Math.round((m_x + m_w / 2) * miniMapSubObj.w) - miniMapObj.w / 2;
                            if (miniMapSubObj.pos < 0) { miniMapSubObj.pos = 0; }
                            if (miniMapSubObj.pos > (miniMapSubObj.w - miniMapObj.w)) { miniMapSubObj.pos = miniMapSubObj.w - miniMapObj.w; }
                            //外枠
                            ctx.strokeRect(miniMapSubObj.x, miniMapSubObj.y, miniMapObj.w, miniMapSubObj.h);
                            //枠
                            var lineWidth2 = Math.round(m_w * miniMapSubObj.w);
                            if (lineWidth2 > miniMapSubObj.w) { lineWidth2 = miniMapSubObj.w; } //画面サイズ以下の場合
                            var lineHeight2 = Math.round(m_h * miniMapSubObj.h);
                            if (lineHeight2 > miniMapSubObj.h) { lineHeight2 = miniMapSubObj.h; } //画面サイズ以下の場合
                            //線の描画
                            ctx.strokeRect(miniMapSubObj.x + Math.round(m_x * miniMapSubObj.w) - miniMapSubObj.pos, miniMapSubObj.y + Math.round(m_y * miniMapSubObj.h), lineWidth2 / getScale(), lineHeight2 / getScale());
                            miniMapSubObj.loaded = true;
                        }
                    }
                }
            }

            if (reload) {
                setTimeout(function () { drawImage(true); }, 0);
            } else {
                nowLoading = 0;
            }
        } catch (e) {
            if (oldFlag) {
                ctx.restore();
            }
            //再読み込み
            setTimeout(function () { drawImage(true); }, 0);
        }
    }

    /**
    * マウス・タッチイベント
    */
    function mouseDownListner(e) {
        if (scaleObj.frame > 0) {
            //処理中は動作しない
            return;
        }
        var rect = e.target.getBoundingClientRect();
        //前の座標を保存
        var doubleCheckX = mouseObj.mouseX1;
        var doubleCheckY = mouseObj.mouseY1;
        //ユーザーエージェント
        var isiPad = navigator.userAgent.match(/iPad/i) != null;
        var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
        var isAndroid = navigator.userAgent.match(/Android/i) != null;
        //加速処理はキャンセル
        obj.speedX = 0;
        obj.speedY = 0;
        //移動もキャンセル
        obj.cursorMoveX = 0;
        obj.cursorMoveY = 0;
        //座標取得
        if (isiPad || isiPhone || isAndroid) {
            if (e.touches.length == 2 && scaleObj.flag) {
                //マルチタッチ
                mouseDownFlag = false;
                multiTouchFlag = true;
                touchObj.centerX = Math.floor(((e.touches[0].clientX - rect.left) + (e.touches[1].clientX - rect.left)) / 2);
                touchObj.centerY = Math.floor(((e.touches[0].clientY - rect.top) + (e.touches[1].clientY - rect.top)) / 2);
                touchObj.defScale = Math.floor(Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2), Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)) / 5) / 10;
            } else {
                //iPad & iPhone & Android用処理
                mouseObj.mouseX1 = e.touches[0].clientX - rect.left;
                mouseObj.mouseY1 = e.touches[0].clientY - rect.top;
            }
        } else {
            //PC用処理
            mouseObj.mouseX1 = e.clientX - rect.left;
            mouseObj.mouseY1 = e.clientY - rect.top;
        }
        if (!multiTouchFlag) {
            //マルチタッチ中は処理しない
            clickStationObj = null;
            if (mouseObj.frame >= 1 && scaleObj.flag && scaleObj.doubleClickZoom) {
                //ダブルタップチェック
                if (typeof doubleCheckX != 'undefined' && typeof doubleCheckY != 'undefined') {
                    if (Math.abs(doubleCheckX - mouseObj.mouseX1) < 20 && Math.abs(doubleCheckY - mouseObj.mouseY1) < 20) {
                        mouseObj.frame = 0;
                        scaleObj.centerX = mouseObj.mouseX1;
                        scaleObj.centerY = mouseObj.mouseY1;
                        if (scaleObj.continuousZoom) {
                            scaleObj.frame = scaleFrameBase;
                        } else {
                            scaleObj.frame = 1;
                        }
                        if (getScale() < 2) {
                            scaleObj.targetScale = getScale() + 1;
                        } else if (getScale() < 4) {
                            scaleObj.targetScale = getScale() + 2;
                            if (scaleObj.targetScale > 4) { scaleObj.targetScale = 4; }
                        } else {
                            scaleObj.targetScale = 1;
                        }
                        return;
                    }
                }
            }
            mouseObj.frame = 30;
            //路線図クリックのチェック
            if (mouseObj.mouseX1 / getScale() > obj.x && mouseObj.mouseX1 / getScale() < obj.x + obj.mapWidth) {
                if (mouseObj.mouseY1 / getScale() > obj.y && mouseObj.mouseY1 / getScale() < obj.y + obj.mapHeight) {
                    mouseObj.dragDivX = 0;
                    mouseObj.dragDivY = 0;
                    obj.old_x = obj.x + obj.moveX;
                    obj.old_y = obj.y + obj.moveY;
                    if (obj.dragging) {
                        mouseDownFlag = true;
                    }
                }
            }
            //やじるし
            if (cursorObj.flag) {
                if (obj.moveX == 0 && obj.moveY == 0) {
                    if (cursorCheck(mouseObj.mouseX1, mouseObj.mouseY1)) {
                        //加速なし
                        obj.speedX = 0;
                        obj.speedY = 0;
                        //移動なし
                        mouseObj.frame = 0;
                        dragEnd();
                        return;
                    }
                }
            }
            //拡大縮小
            if (scaleObj.flag && scaleObj.frame == 0) {
                if (scaleCheck(mouseObj.mouseX1, mouseObj.mouseY1)) {
                    //移動なし
                    mouseObj.frame = 0;
                    dragEnd();
                    //同じだったらキャンセル
                    if (getScale() == scaleObj.targetScale) {
                        scaleObj.frame = 0;
                    }
                    return;
                }
            }
            //概観図
            if (naviMapObj.flag) {
                if (checkMap(mouseObj.mouseX1, mouseObj.mouseY1)) {
                    //移動なし
                    mouseObj.frame = 0;
                    dragEnd();
                    return;
                }
            }
            //路線図選択
            if (changeObj.flag) {
                if (changeCheck(mouseObj.mouseX1, mouseObj.mouseY1)) {
                    mouseObj.frame = 0;
                    dragEnd();
                    openMapList();
                    return;
                }
            }

            //クリックした駅を記録
            clickStation(mouseObj.mouseX1 / getScale() - obj.x, mouseObj.mouseY1 / getScale() - obj.y);
        }
    }

    /**
    * 倍率変更ボタンの処理
    */
    function scaleCheck(x, y) {
        //倍率変更ボタン
        var scale_x;
        var scale_y;
        if (scaleObj.x >= 0) {
            scale_x = scaleObj.x;
        } else {
            scale_x = obj.cW + scaleObj.x - 40;
        }
        if (scaleObj.y >= 0) {
            scale_y = scaleObj.y;
        } else {
            scale_y = obj.cH + scaleObj.y - 80;
        }
        if (x > scale_x && x < scale_x + 40 && y > scale_y && y < scale_y + 40) {
            //拡大
            if (getScale() < 2) {
                scaleObj.targetScale = getScale() + 1;
            } else {
                scaleObj.targetScale = getScale() + 2;
                if (scaleObj.targetScale > 4) { scaleObj.targetScale = 4; }
            }
            if (scaleObj.continuousZoom) {
                scaleObj.frame = scaleFrameBase;
            } else {
                scaleObj.frame = 1;
            }
            return true;
        } else if (x > scale_x && x < scale_x + 40 && y > scale_y + 40 && y < scale_y + 80) {
            //縮小
            if (getScale() > 3) {
                scaleObj.targetScale = getScale() - 2;
            } else {
                scaleObj.targetScale = getScale() - 1;
                if (scaleObj.targetScale < 1) { scaleObj.targetScale = 1; }
            }
            if (scaleObj.continuousZoom) {
                scaleObj.frame = scaleFrameBase;
            } else {
                scaleObj.frame = 1;
            }
            return true;
        }
        return false;
    }

    /**
    * カーソルボタンの処理
    */
    function cursorCheck(x, y) {
        var cursor_x;
        var cursor_y;
        if (cursorObj.x >= 0) {
            cursor_x = cursorObj.x;
        } else {
            cursor_x = obj.cW + cursorObj.x - 120;
        }
        if (cursorObj.y >= 0) {
            cursor_y = cursorObj.y;
        } else {
            cursor_y = obj.cH + cursorObj.y - 120;
        }
        if (x > cursor_x && x < cursor_x + 40 && y > cursor_y && y < cursor_y + 40) {
            //左上
            obj.cursorMoveX = -Math.round(200 / getScale());
            obj.cursorMoveY = -Math.round(200 / getScale());
            return true;
        } else if (x > cursor_x + 40 && x < cursor_x + 80 && y > cursor_y && y < cursor_y + 40) {
            //上
            obj.cursorMoveX = 0;
            obj.cursorMoveY = -Math.round(200 / getScale());
            return true;
        } else if (x > cursor_x + 80 && x < cursor_x + 120 && y > cursor_y && y < cursor_y + 40) {
            //右上
            obj.cursorMoveX = Math.round(200 / getScale());
            obj.cursorMoveY = -Math.round(200 / getScale());
            return true;
        } else if (x > cursor_x && x < cursor_x + 40 && y > cursor_y + 40 && y < cursor_y + 80) {
            //左
            obj.cursorMoveX = -Math.round(200 / getScale());
            obj.cursorMoveY = 0;
            return true;
        } else if (x > cursor_x + 80 && x < cursor_x + 120 && y > cursor_y + 40 && y < cursor_y + 80) {
            //右
            obj.cursorMoveX = Math.round(200 / getScale());
            obj.cursorMoveY = 0;
            return true;
        } else if (x > cursor_x && x < cursor_x + 40 && y > cursor_y + 80 && y < cursor_y + 120) {
            //左下
            obj.cursorMoveX = -Math.round(200 / getScale());
            obj.cursorMoveY = Math.round(200 / getScale());
            return true;
        } else if (x > cursor_x + 40 && x < cursor_x + 80 && y > cursor_y + 80 && y < cursor_y + 120) {
            //下
            obj.cursorMoveX = 0;
            obj.cursorMoveY = Math.round(200 / getScale());
            return true;
        } else if (x > cursor_x + 80 && x < cursor_x + 120 && y > cursor_y + 80 && y < cursor_y + 120) {
            //右下
            obj.cursorMoveX = Math.round(200 / getScale());
            obj.cursorMoveY = Math.round(200 / getScale());
            return true;
        }
        return false;
    }

    /**
    * 路線図変更ボタンの処理
    */
    function changeCheck(x, y) {
        var change_x;
        var change_y;
        if (changeObj.x >= 0) {
            change_x = changeObj.x;
        } else {
            change_x = obj.cW + changeObj.x - 104;
        }
        if (changeObj.y >= 0) {
            change_y = changeObj.y;
        } else {
            change_y = obj.cH + changeObj.y - 30;
        }
        if (x > change_x && x < change_x + 104 && y > change_y && y < change_y + 30) {
            return true;
        }
        return false;
    }

    /**
    * 概観図のクリックをチェック
    */
    function checkMap(x, y) {
        //概観図1のクリックチェック
        if (miniMapObj) {
            if (x >= miniMapObj.x &&
                y >= miniMapObj.y &&
                x <= (miniMapObj.x + miniMapObj.w) &&
                y <= (miniMapObj.y + miniMapObj.h)) {
                var center_x = Math.round(((x - miniMapObj.x) / miniMapObj.w) * obj.mapWidth);
                var center_y = Math.round(((y - miniMapObj.y) / miniMapObj.h) * obj.mapHeight);
                setCenter(center_x, center_y);
                return true;
            }
        }
        //概観図2のクリックチェック
        if (obj.miniMapSubFile.length > 0) {
            if (miniMapSubObj) {
                if (x >= miniMapSubObj.x &&
                    y >= miniMapSubObj.y &&
                    x <= (miniMapSubObj.x + miniMapObj.w) &&
                    y <= (miniMapSubObj.y + miniMapSubObj.h)) {
                    var center_x = Math.round(((x - miniMapSubObj.x + miniMapSubObj.pos) / miniMapSubObj.w) * obj.mapWidth);
                    var center_y = Math.round(((y - miniMapSubObj.y) / miniMapSubObj.h) * obj.mapHeight);
                    setCenter(center_x, center_y);
                    return true;
                }
            }
        }
        return false;
    }

    /**
    * 指定した座標を中心にする
    */
    function setCenter(x, y) {
        //加速はキャンセル
        if (mouseDownFlag) {
            dragEnd();
        }
        //中心を移動する
        obj.x = Math.round(x * -1 + obj.cW / getScale() / 2);
        obj.y = Math.round(y * -1 + obj.cH / getScale() / 2);
        //位置を補正
        if (obj.mapWidth > obj.cW / getScale()) {
            if (obj.x > 0) { obj.x = 0; }
            if (obj.x < obj.mapWidth * -1 + obj.cW / getScale()) { obj.x = Math.round(obj.mapWidth - obj.cW / getScale()) * -1; }
        } else {
            obj.x = 0;
        }
        if (obj.mapHeight > obj.cH / getScale()) {
            if (obj.y > 0) { obj.y = 0; }
            if (obj.y < obj.mapHeight * -1 + obj.cH / getScale()) { obj.y = Math.round(obj.mapHeight - obj.cH / getScale()) * -1; }
        } else {
            obj.y = 0;
        }
        //描画
        drawMap(0, 0);
    }

    /**
    * マウスムーブのリスナー
    */
    function mouseMoveListner(e) {
        //縦スクロールをしない（iPad & iPhone & Android）
        e.preventDefault();
        if (multiTouchFlag) {
            touchObj.scale = Math.floor(Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2), Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)) / 5) / 10 - touchObj.defScale;
        } else if (mouseDownFlag) {
            //縦スクロールをしない（iPad & iPhone & Android）
            e.preventDefault();
            //ユーザーエージェント
            var isiPad = navigator.userAgent.match(/iPad/i) != null;
            var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
            var isAndroid = navigator.userAgent.match(/Android/i) != null;
            //座標取得
            var rect = e.target.getBoundingClientRect();
            if (isiPad || isiPhone || isAndroid) {
                //iPad & iPhone & Android用処理
                mouseObj.mouseX2 = e.touches[0].clientX - rect.left;
                mouseObj.mouseY2 = e.touches[0].clientY - rect.top;
            } else {
                //PC用処理
                mouseObj.mouseX2 = e.clientX - rect.left;
                mouseObj.mouseY2 = e.clientY - rect.top;
            }
            if (mouseObj.mouseX2 < 0 || mouseObj.mouseX2 > obj.cW || mouseObj.mouseY2 < 0 || mouseObj.mouseY2 > obj.cH) dragEnd();
            mouseObj.dragDivX = (mouseObj.mouseX2 - mouseObj.mouseX1);
            mouseObj.dragDivY = (mouseObj.mouseY2 - mouseObj.mouseY1);
            //移動量チェック
            if (Math.abs(mouseObj.dragDivX) > 10 || Math.abs(mouseObj.dragDivY) > 10) {
                clickStationObj = null;
                mouseObj.frame = 0;
            }
        }
    }

    /**
    * ドラッグ終了リスナー
    */
    function mouseUpListner(e) {
        if (multiTouchFlag) {
            multiTouchFlag = false;
            obj.x += Math.round(obj.moveX);
            obj.y += Math.round(obj.moveY);
            obj.moveX = 0;
            obj.moveY = 0;
            obj.scale = getScale();
            touchObj.scale = 0;
            touchObj.centerX = 0;
            touchObj.centerY = 0;
            touchObj.defScale = 0;
            drawMap(0, 0);
        } else if (mouseDownFlag) {
            //チェック
            if (clickStationObj != null && typeof callBackFunctionBind['click'] == 'function') {
                setTimeout(function () { callBackFunctionBind['click'](clickStationObj); }, 0);
                mouseDownFlag = false;
                return;
            }
            dragEnd();
        }
    }

    /**
    * ドラッグ終了時に呼び出し
    */
    function dragEnd() {
        mouseDownFlag = false;
        if (obj.mapWidth > obj.cW / getScale()) {
            obj.x += Math.round(mouseObj.dragDivX / getScale());
            if (obj.x > 0) { obj.x = 0; }
            if (obj.x < obj.mapWidth * -1 + obj.cW / getScale()) { obj.x = Math.round(obj.mapWidth - obj.cW / getScale()) * -1; }
        } else {
            obj.x = 0;
        }
        if (obj.mapHeight > obj.cH / getScale()) {
            obj.y += Math.round(mouseObj.dragDivY / getScale());
            if (obj.y > 0) { obj.y = 0; }
            if (obj.y < obj.mapHeight * -1 + obj.cH / getScale()) { obj.y = Math.round(obj.mapHeight - obj.cH / getScale()) * -1; }
        } else {
            obj.y = 0;
        }
        drawMap(0, 0);
    }

    /**
    * 駅のクリック領域を定義
    */
    function stationArea(mapNo) {
        var min_x = 0;
        var min_y = 0;
        var max_x = 0;
        var max_y = 0;
        var n = 0;
        while (typeof stationList[mapNo][n] != 'undefined') {
            for (var i = 0; i < stationList[mapNo][n]["mark"].length; i++) {
                if (stationList[mapNo][n]["mark"][i]["markType"] == 2) {
                    //丸
                    if (min_x > (stationList[mapNo][n]["mark"][i]["mark_x"] - stationList[mapNo][n]["mark"][i]["mark_size"])) {
                        min_x = stationList[mapNo][n]["mark"][i]["mark_x"] - stationList[mapNo][n]["mark"][i]["mark_size"];
                    }
                    if (min_y > (stationList[mapNo][n]["mark"][i]["mark_y"] - stationList[mapNo][n]["mark"][i]["mark_size"])) {
                        min_y = stationList[mapNo][n]["mark"][i]["mark_y"] - stationList[mapNo][n]["mark"][i]["mark_size"];
                    }
                    if (max_x < (stationList[mapNo][n]["mark"][i]["mark_x"] + stationList[mapNo][n]["mark"][i]["mark_size"])) {
                        max_x = stationList[mapNo][n]["mark"][i]["mark_x"] + stationList[mapNo][n]["mark"][i]["mark_size"];
                    }
                    if (max_y < (stationList[mapNo][n]["mark"][i]["mark_y"] + stationList[mapNo][n]["mark"][i]["mark_size"])) {
                        max_y = stationList[mapNo][n]["mark"][i]["mark_y"] + stationList[mapNo][n]["mark"][i]["mark_size"];
                    }
                } else {
                    //四角
                    if (min_x > stationList[mapNo][n]["mark"][i]["mark_x"]) {
                        min_x = stationList[mapNo][n]["mark"][i]["mark_x"];
                    }
                    if (min_y > stationList[mapNo][n]["mark"][i]["mark_y"]) {
                        min_y = stationList[mapNo][n]["mark"][i]["mark_y"];
                    }
                    if (max_x < stationList[mapNo][n]["mark"][i]["mark_w"]) {
                        max_x = stationList[mapNo][n]["mark"][i]["mark_w"];
                    }
                    if (max_y < stationList[mapNo][n]["mark"][i]["mark_h"]) {
                        max_y = stationList[mapNo][n]["mark"][i]["mark_h"];
                    }
                }
            }
            n++;
        }
        stationListArea[mapNo] = new Object();
        stationListArea[mapNo]["min_x"] = min_x;
        stationListArea[mapNo]["min_y"] = min_y;
        stationListArea[mapNo]["max_x"] = max_x;
        stationListArea[mapNo]["max_y"] = max_y;
    }

    /**
    * 駅リストを取得開始
    */
    function getStationDataAPI(mapNo, mapStationUrl) {
        var JSON_object = {};
        var http_request;
        if (window.XDomainRequest) {
            //IE9用
            http_request = new XDomainRequest();
            http_request.onload = function () {
                JSON_object = JSON.parse(http_request.responseText);
                parseStationList(mapNo, JSON_object);
            };
        } else {
            http_request = new XMLHttpRequest();
            http_request.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (http_request.readyState == done && http_request.status == ok) {
                    JSON_object = JSON.parse(http_request.responseText);
                    parseStationList(mapNo, JSON_object);
                }
            };
        }
        http_request.open("GET", mapStationUrl, true);
        http_request.send(null);
    }

    /**
    * 駅リストを解析する処理
    */
    function parseStationList(mapNo, JSON_object) {
        //初期化
        stationList[mapNo] = new Array();
        stationList[mapNo] = stationList[mapNo].concat(parseStation(JSON_object));
        stationArea(mapNo);
        stLoading = 0;
        //駅のマークチェック
        checkStationMark();
        //再描画
        drawImage(true);
    }

    /**
    * 駅の形を設定
    */
    function getSharpe(str) {
        if (str == "rect") {
            return 1;
        } else if (str == "circle") {
            return 2;
        } else {
            return 3;
        }
    }

    /**
    * 駅のマークを取得
    */
    function getMarkData(markObject) {
        var tmp_mark = new Object();
        tmp_mark["markType"] = getSharpe(markObject.shape);
        tmp_mark["mark_x"] = parseInt(markObject.x);
        tmp_mark["mark_y"] = parseInt(markObject.y);
        if (getSharpe(markObject.shape) == 2) {
            //円
            tmp_mark["mark_size"] = parseInt(markObject.r);
        } else {
            //四角
            tmp_mark["mark_w"] = parseInt(markObject.width);
            tmp_mark["mark_h"] = parseInt(markObject.height);
        }
        //文字
        if (markObject.isText == "true") {
            tmp_mark["mark_isText"] = true;
        } else {
            tmp_mark["mark_isText"] = false;
        }
        return tmp_mark;
    }

    /**
     * 駅オブジェクトを生成
     */
    function createCStation(Point) {
        var CStation = new Object();
        //駅コード
        CStation.code = parseInt(Point.Station.code);
        //駅名
        CStation.name = Point.Station.Name;
        //駅よみ
        CStation.yomi = Point.Station.Yomi;
        //緯度
        CStation.lati = Point.GeoPoint.lati;
        CStation.lati_d = Point.GeoPoint.lati_d;
        //経度
        CStation.longi = Point.GeoPoint.longi;
        CStation.longi_d = Point.GeoPoint.longi_d;
        //県コード
        CStation.kenCode = parseInt(Point.Prefecture.code);
        //駅種別
        CStation.type = Point.Station.Type;
        //アイコン種別
        CStation.mark = new Array();
        if (typeof Point.MarkCoordinates != 'undefined') {
            if (typeof Point.MarkCoordinates.length == 'undefined') {
                CStation.mark = CStation.mark.concat(getMarkData(Point.MarkCoordinates));
            } else {
                for (var j = 0; j < Point.MarkCoordinates.length; j++) {
                    CStation.mark = CStation.mark.concat(getMarkData(Point.MarkCoordinates[j]));
                }
            }
        }
        return CStation;
    }

    /**
    * 駅の座標情報を取得
    */
    function parseStation(JSON_object) {
        var stList = JSON_object.ResultSet.RailMap;
        var tmp_stationList = new Array();
        if (typeof stList.Point != 'undefined') {
            if (typeof stList.Point.length == 'undefined') {
                tmp_stationList.push(createCStation(stList.Point));
            } else {
                for (var i = 0; i < stList.Point.length; i++) {
                    tmp_stationList.push(createCStation(stList.Point[i]));
                }
            }
        }
        return tmp_stationList;
    }

    /**
    * 駅リストを取得するURLを設定
    */
    function loadStation() {
        if (stLoading == 1 || nowLoading == 1) {
            setTimeout(function () { loadStation(); }, frame);
            return;
        } else {
            stLoading = 1;
        }
        try {
            for (var i = 0; i < Math.ceil(obj.mapWidth / tileSize); i++) {
                for (var j = 0; j < Math.ceil(obj.mapHeight / tileSize); j++) {
                    if (((obj.x + obj.moveX) + i * tileSize + tileSize) * getScale() >= cacheSize * -1 &&
                        ((obj.y + obj.moveY) + j * tileSize + tileSize) * getScale() >= cacheSize * -1 &&
                        ((obj.x + obj.moveX) + i * tileSize) * getScale() <= obj.cW + cacheSize &&
                        ((obj.y + obj.moveY) + j * tileSize) * getScale() <= obj.cH + cacheSize) {
                        if (!stationListLoaded[(i + j * Math.ceil(obj.mapWidth / tileSize))]) {
                            stationListLoaded[(i + j * Math.ceil(obj.mapWidth / tileSize))] = true;
                            //リスト読み込み
                            var mapNo = (i + j * Math.ceil(obj.mapWidth / tileSize));
                            var url = apiURL + "v1/json/railmap/detail?key=" + key + "&id=" + obj.prefix + "&x=" + i * tileSize + "&y=" + j * tileSize + "&width=" + tileSize + "&height=" + tileSize;
                            getStationDataAPI(mapNo, url);
                            //再読み込み
                            setTimeout(function () { loadStation(); }, frame);
                            return;
                        }
                    }
                }
            }
            stLoading = 0;
        } catch (e) {
            //再読み込み
            setTimeout(function () { loadStation(); }, frame);
        }
    }

    /**
    * 駅がクリックされたかをチェックする
    */
    function clickStation(x, y) {
        for (var i = 0; i < Math.ceil(obj.mapWidth / tileSize); i++) {
            for (var j = 0; j < Math.ceil(obj.mapHeight / tileSize); j++) {
                var mapNo = (i + j * Math.ceil(obj.mapWidth / tileSize));
                if (typeof stationListArea[mapNo] != 'undefined') {
                    if (x >= stationListArea[mapNo]["min_x"] + i * tileSize &&
                        y >= stationListArea[mapNo]["min_x"] + j * tileSize &&
                        x <= stationListArea[mapNo]["max_x"] + i * tileSize &&
                        y <= stationListArea[mapNo]["max_y"] + j * tileSize) {
                        var n = 0;
                        while (typeof stationList[mapNo][n] != 'undefined') {
                            for (var k = 0; k < stationList[mapNo][n]["mark"].length; k++) {
                                if (stationList[mapNo][n]["mark"][k]["markType"] == 2) {
                                    //丸
                                    if (x - i * tileSize >= stationList[mapNo][n]["mark"][k]["mark_x"] - stationList[mapNo][n]["mark"][k]["mark_size"] &&
                                        y - j * tileSize >= stationList[mapNo][n]["mark"][k]["mark_y"] - stationList[mapNo][n]["mark"][k]["mark_size"] &&
                                        x - i * tileSize <= stationList[mapNo][n]["mark"][k]["mark_x"] + stationList[mapNo][n]["mark"][k]["mark_size"] &&
                                        y - j * tileSize <= stationList[mapNo][n]["mark"][k]["mark_y"] + stationList[mapNo][n]["mark"][k]["mark_size"]) {
                                        selectStation(stationList[mapNo][n]);
                                        return true;
                                    }
                                } else {
                                    //四角
                                    if (x - i * tileSize >= stationList[mapNo][n]["mark"][k]["mark_x"] &&
                                        y - j * tileSize >= stationList[mapNo][n]["mark"][k]["mark_y"] &&
                                        x - i * tileSize <= stationList[mapNo][n]["mark"][k]["mark_w"] &&
                                        y - j * tileSize <= stationList[mapNo][n]["mark"][k]["mark_h"]) {
                                        selectStation(stationList[mapNo][n]);
                                        return true;
                                    }
                                }
                            }
                            n++;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
    * マークを点灯するかチェックする
    */
    function checkStationMark() {
        for (var i = 0; i < Math.ceil(obj.mapWidth / tileSize); i++) {
            for (var j = 0; j < Math.ceil(obj.mapHeight / tileSize); j++) {
                var mapNo = (i + j * Math.ceil(obj.mapWidth / tileSize));
                if (typeof stationList[mapNo] != 'undefined') {
                    if (((obj.x + obj.moveX) + i * tileSize + tileSize) * getScale() >= 0 &&
                        ((obj.y + obj.moveY) + j * tileSize + tileSize) * getScale() >= 0 &&
                        ((obj.x + obj.moveX) + i * tileSize - tileSize) * getScale() <= obj.cW &&
                        ((obj.y + obj.moveY) + j * tileSize - tileSize) * getScale() <= obj.cH) {
                        var n = 0;
                        while (typeof stationList[mapNo][n] != 'undefined') {
                            for (var k = 0; k < stationMarkList.length; k++) {
                                if (stationMarkList[k].station == stationList[mapNo][n].name || stationMarkList[k].station == stationList[mapNo][n].code) {
                                    for (var l = 0; l < stationList[mapNo][n]["mark"].length; l++) {
                                        //データをセット
                                        if (stationList[mapNo][n]["mark"][l]["mark_isText"]) {
                                            if (stationList[mapNo][n]["mark"][l]["mark_w"] != 0 && stationList[mapNo][n]["mark"][l]["mark_h"] != 0) {
                                                stationMarkList[k].stationNameType = stationList[mapNo][n]["mark"][l]["markType"];
                                                stationMarkList[k].stationName_x = stationList[mapNo][n]["mark"][l]["mark_x"] + tileSize * i;
                                                stationMarkList[k].stationName_y = stationList[mapNo][n]["mark"][l]["mark_y"] + tileSize * j;
                                                stationMarkList[k].stationName_w = stationList[mapNo][n]["mark"][l]["mark_w"] - stationList[mapNo][n]["mark"][l]["mark_x"];
                                                stationMarkList[k].stationName_h = stationList[mapNo][n]["mark"][l]["mark_h"] - stationList[mapNo][n]["mark"][l]["mark_y"];
                                            }
                                        }
                                        if (!stationList[mapNo][n]["mark"][l]["mark_isText"]) {
                                            if (stationList[mapNo][n]["mark"][l]["markType"] == 2) {
                                                //円
                                                if (stationList[mapNo][n]["mark"][l]["mark_size"] != 0) {
                                                    stationMarkList[k].stationIconType = stationList[mapNo][n]["mark"][l]["markType"];
                                                    stationMarkList[k].stationIcon_x = stationList[mapNo][n]["mark"][l]["mark_x"] + tileSize * i - stationList[mapNo][n]["mark"][l]["mark_size"];
                                                    stationMarkList[k].stationIcon_y = stationList[mapNo][n]["mark"][l]["mark_y"] + tileSize * j - stationList[mapNo][n]["mark"][l]["mark_size"];
                                                    stationMarkList[k].stationIcon_w = stationList[mapNo][n]["mark"][l]["mark_size"] * 2 + 1;
                                                    stationMarkList[k].stationIcon_h = stationList[mapNo][n]["mark"][l]["mark_size"] * 2 + 1;
                                                }
                                            } else {
                                                //四角
                                                if (stationList[mapNo][n]["mark"][l]["mark_w"] != 0 && stationList[mapNo][n]["mark"][l]["mark_h"] != 0) {
                                                    stationMarkList[k].stationIconType = stationList[mapNo][n]["mark"][l]["markType"];
                                                    stationMarkList[k].stationIcon_x = stationList[mapNo][n]["mark"][l]["mark_x"] + tileSize * i;
                                                    stationMarkList[k].stationIcon_y = stationList[mapNo][n]["mark"][l]["mark_y"] + tileSize * j;
                                                    stationMarkList[k].stationIcon_w = stationList[mapNo][n]["mark"][l]["mark_w"] - stationList[mapNo][n]["mark"][l]["mark_x"];
                                                    stationMarkList[k].stationIcon_h = stationList[mapNo][n]["mark"][l]["mark_h"] - stationList[mapNo][n]["mark"][l]["mark_y"];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            n++;
                        }
                    }
                }
            }
        }
    }

    /**
    * マークを路線図上にセットする
    */
    function showOnStation(stList, style) {
        stationMarkType = style;
        stationMarkList = new Array();
        if (stList instanceof Array) {
            for (var i = 0; i < stList.length; i++) {
                stationMarkList = stationMarkList.concat(getStationMark(stList[i]));
            }
        } else {
            stationMarkList = stationMarkList.concat(getStationMark(stList));
        }
        checkStationMark();
        drawMap(0, 0);
    }

    /**
    * マークのオブジェクトを作成
    */
    function getStationMark(station) {
        var tmpStationMark = new Object();
        tmpStationMark.station = station;
        return tmpStationMark;
    }

    /**
    * 駅がクリックされた際に呼び出される関数
    */
    function selectStation(stationData) {
        //alert("「"+stationData["name"]+"」をクリックしました");
        clickStationObj = stationData;
    }

    /**
    * 駅リスト取得中は選択できない仕様
    */
    function selectStationError() {
        //  alert("駅リスト取得中はクリックできません");
    }

    /**
    * 倍率変更関数
    */
    function changeScale(n) {
        var tmp_x = Math.round(obj.x * -1 + obj.cW / getScale() / 2);
        var tmp_y = Math.round(obj.y * -1 + obj.cH / getScale() / 2);
        obj.scale = n;
        //中心を再設定
        setCenter(tmp_x, tmp_y);
    }

    /**
    * 倍率の指定
    */
    function setScale(n) {
        scaleObj.targetScale = n;
        if (scaleObj.continuousZoom) {
            scaleObj.frame = scaleFrameBase;
        } else {
            scaleObj.frame = 1;
        }
    }

    /**
    * 概観図設定
    */
    function viewMiniMap(flag) {
        naviMapObj.flag = flag;
        drawMap(0, 0);
    }

    /**
    * カーソル設定
    */
    function viewCursor(flag) {
        cursorObj.flag = flag;
        drawMap(0, 0);
    }

    /**
    * 路線図情報の取得
    */
    function searchMapList(callbackFunction) {
        mapList = new Array();
        var url = apiURL + "v1/json/railmap/list?key=" + key;
        var JSON_object = {};
        var http_request;
        if (window.XDomainRequest) {
            //IE9用
            http_request = new XDomainRequest();
            http_request.onload = function () {
                JSON_object = JSON.parse(http_request.responseText);
                if (typeof JSON_object.ResultSet.RailMap != 'undefined') {
                    if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                        mapList.push(setMapList(JSON_object.ResultSet.RailMap));
                    } else {
                        for (var i = 0; i < JSON_object.ResultSet.RailMap.length; i++) {
                            mapList.push(setMapList(JSON_object.ResultSet.RailMap[i]));
                        }
                    }
                }
                if (typeof callbackFunction == 'function') {
                    callbackFunction(true);
                }
            };
            http_request.onerror = function () {
                // エラー時の処理
                if (typeof callbackFunction == 'function') {
                    callbackFunction(false);
                }
            };
        } else {
            http_request = new XMLHttpRequest();
            http_request.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (http_request.readyState == done && http_request.status == ok) {
                    JSON_object = JSON.parse(http_request.responseText);
                    if (typeof JSON_object.ResultSet.RailMap.length == 'undefined') {
                        mapList.push(setMapList(JSON_object.ResultSet.RailMap));
                    } else {
                        for (var i = 0; i < JSON_object.ResultSet.RailMap.length; i++) {
                            mapList.push(setMapList(JSON_object.ResultSet.RailMap[i]));
                        }
                    }
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(true);
                    }
                } else if (http_request.readyState == done && http_request.status != ok) {
                    // エラー時の処理
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(false);
                    }
                }
            };
        }
        http_request.open("GET", url, true);
        http_request.send(null);
    }

    /**
    * 路線図リストを返却
    */
    function getMapList() {
        function clone(obj) {
            var f = function () { };
            f.prototype = obj;
            return new f;
        }
        return clone(mapList).sort(function (a, b) {
            var x = a.groupIndex;
            var y = b.groupIndex;
            if (x > y) return 1;
            if (x < y) return -1;
            return 0;
        });
    }

    /**
    * JSONデータを解析
    */
    function setMapList(json) {
        var mapData = new Object();
        mapData.name = json.Name;
        mapData.groupName = json.GroupName;
        mapData.displayName = json.DisplayName;
        mapData.id = json.id;
        mapData.prefix = json.id;
        mapData.groupIndex = parseInt(json.groupIndex);
        mapData.width = parseInt(json.width);
        mapData.height = parseInt(json.height);
        if (typeof json.Point != 'undefined') {
            mapData.kenCode = parseInt(json.Point.Prefecture.code);
            mapData.defaultStation = parseInt(json.Point.Station.code);
            mapData.type = json.Point.Station.Type;
        }    
        if (mapData.prefix == "jpnx1" || mapData.prefix == "jpnx2" || mapData.prefix == "jpnx4") {
            mapData.navi = "jp_small.png";
            if (mapData.prefix == "jpnx2" || mapData.prefix == "jpnx4") {
                mapData.navi2 = "jp_large.png";
            }
        } else {
            mapData.navi = mapData.prefix + ".png";
        }
        if (mapData.prefix == "jpnx4") {
            mapData.selected = "selected";
        }
        mapData.version = json.Version;
        return mapData;
    }

    /**
    * 路線図選択画面
    */
    function openMapList() {
        document.getElementById(baseId + ':mapList').innerHTML = '<div class="exp_mapLoad">路線図リスト読み込み中</div>';
        document.getElementById(baseId + ':selectWindow').style.display = "block";
        if (typeof mapList != 'undefined') {
            viewMapList();
        } else {
            searchMapList(setMapObject);
        }
    }

    /**
    * 路線図一覧取得のコールバック
    */
    function setMapObject(isSuccess) {
        if (!isSuccess) {
            document.getElementById(baseId + ':mapList').innerHTML = '<div class="exp_mapLoad">路線図一覧が取得できませんでした</div>';
        } else {
            viewMapList();
        }
    }

    /**
    * 路線図リストの出力
    */
    function viewMapList() {
        var buffer = '';
        var tmp_mapList = getMapList();
        buffer += '<div class="exp_mapListArea">';
        //都市近郊はグループがないので、この時点で出力
        var tmpMapGroup = "都市近郊";
        var tmpMapGroupSub = "";
        buffer += '<div class="exp_group">';
        buffer += '<div class="exp_mapHierarchy" id="' + baseId + ':groupSelect:' + String(0) + ':none"></div>';
        buffer += '<div class="exp_mapGroupSelect" id="' + baseId + ':groupSelect:' + String(0) + ':active" style="display:none;"></div>';
        buffer += '<a href="Javascript:void(0);" id="' + baseId + ':selectGroup:' + String(0) + '">' + tmpMapGroup + '</a>';
        buffer += '</div>';
        buffer += '<div id="' + baseId + ':group:' + String(0) + '" style="display:none;">';
        for (var i = 0; i < tmp_mapList.length; i++) {
            if (typeof tmp_mapList[i].groupName != 'undefined') {
                //グループ表示
                var endFlag = false;
                var groupList = tmp_mapList[i].groupName.split("/");
                if (groupList[0] != tmpMapGroup) {
                    tmpMapGroup = groupList[0];
                    buffer += '</div>';
                    if (tmpMapGroupSub != "") { buffer += '</div>'; }
                    buffer += '<div class="exp_group">';
                    buffer += '<div class="exp_mapHierarchy" id="' + baseId + ':groupSelect:' + String(tmp_mapList[i].groupIndex) + ':none"></div>';
                    buffer += '<div class="exp_mapGroupSelect" id="' + baseId + ':groupSelect:' + String(tmp_mapList[i].groupIndex) + ':active" style="display:none;"></div>';
                    buffer += '<a href="Javascript:void(0);" id="' + baseId + ':selectGroup:' + String(tmp_mapList[i].groupIndex) + '">' + tmpMapGroup + '</a>';
                    buffer += '</div>';
                    buffer += '<div id="' + baseId + ':group:' + String(tmp_mapList[i].groupIndex) + '" style="display:none;">';
                    endFlag = true;
                }
                if (groupList.length > 1) {
                    if (groupList[1] != tmpMapGroupSub) {
                        tmpMapGroupSub = groupList[1];
                        if (!endFlag) {
                            buffer += '</div>';
                        }
                        buffer += '<div class="exp_groupSub">';
                        buffer += '<div class="exp_mapHierarchySub" id="' + baseId + ':groupSubSelect:' + String(tmp_mapList[i].groupIndex) + ':none"></div>';
                        buffer += '<div class="exp_mapGroupSelectSub" id="' + baseId + ':groupSubSelect:' + String(tmp_mapList[i].groupIndex) + ':active" style="display:none;"></div>';
                        buffer += '<a href="Javascript:void(0);" id="' + baseId + ':selectGroupSub:' + String(tmp_mapList[i].groupIndex) + '">' + tmpMapGroupSub + '</a>';
                        buffer += '</div>';
                        buffer += '<div id="' + baseId + ':group:sub:' + String(tmp_mapList[i].groupIndex) + '" style="display:none;">';
                    }
                }
            }
            //路線図の表示
            buffer += '<div class="exp_mapItem">';
            if (tmp_mapList[i].id == obj.prefix) {
                buffer += '<div class="exp_mapSelectCheck"></div>';
            }
            buffer += '<a href="Javascript:void(0);" id="' + baseId + ':selectMap:' + tmp_mapList[i].id + '">' + tmp_mapList[i].name + '</a>';
            buffer += '</div>';
        }
        buffer += '</div>';
        buffer += '</div>';
        buffer += '</div>';
        document.getElementById(baseId + ':mapList').innerHTML = buffer;
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
            if (eventIdList[1] == "windowClose") {
                // ウィンドウを閉じる
                document.getElementById(baseId + ':selectWindow').style.display = "none";
            } else if (eventIdList[1] == "selectGroup") {
                // 上位のグループを選択
                if (document.getElementById(baseId + ":group:" + eventIdList[2]).style.display == "none") {
                    document.getElementById(baseId + ":group:" + eventIdList[2]).style.display = "block";
                    document.getElementById(baseId + ":groupSelect:" + eventIdList[2] + ":none").style.display = "none";
                    document.getElementById(baseId + ":groupSelect:" + eventIdList[2] + ":active").style.display = "block";
                } else {
                    document.getElementById(baseId + ":group:" + eventIdList[2]).style.display = "none";
                    document.getElementById(baseId + ":groupSelect:" + eventIdList[2] + ":none").style.display = "block";
                    document.getElementById(baseId + ":groupSelect:" + eventIdList[2] + ":active").style.display = "none";
                }
            } else if (eventIdList[1] == "selectGroupSub") {
                // 詳細なグループを選択
                if (document.getElementById(baseId + ":group:sub:" + eventIdList[2]).style.display == "none") {
                    document.getElementById(baseId + ":group:sub:" + eventIdList[2]).style.display = "block";
                    document.getElementById(baseId + ":groupSubSelect:" + eventIdList[2] + ":none").style.display = "none";
                    document.getElementById(baseId + ":groupSubSelect:" + eventIdList[2] + ":active").style.display = "block";
                } else {
                    document.getElementById(baseId + ":group:sub:" + eventIdList[2]).style.display = "none";
                    document.getElementById(baseId + ":groupSubSelect:" + eventIdList[2] + ":none").style.display = "block";
                    document.getElementById(baseId + ":groupSubSelect:" + eventIdList[2] + ":active").style.display = "none";
                }
            } else if (eventIdList[1] == "selectMap") {
                // ウィンドウを閉じる
                document.getElementById(baseId + ':selectWindow').style.display = "none";
                if (obj.prefix != eventIdList[2]) {
                    // 路線図の選択
                    setMapStation(eventIdList[2]);
                }
            }
        }
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (String(name).toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (String(name).toLowerCase() == String("cursor").toLowerCase()) {
            viewCursor(value);
        } else if (String(name).toLowerCase() == String("scale").toLowerCase()) {
            setScale(value);
        } else if (String(name).toLowerCase() == String("navi").toLowerCase()) {
            viewMiniMap(value);
        } else if (String(name).toLowerCase() == String("continuousZoom").toLowerCase()) {
            scaleObj.continuousZoom = value;
        } else if (String(name).toLowerCase() == String("doubleClickZoom").toLowerCase()) {
            scaleObj.doubleClickZoom = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    /**
    * 外部から路線図を移動する関数
    */
    function mapMove(x, y) {
        obj.cursorMoveX = x;
        obj.cursorMoveY = y;
        //加速なし
        obj.speedX = 0;
        obj.speedY = 0;
        //移動なし
        mouseObj.frame = 0;
    }

    /**
    * 表示している路線図のIDを取得
    */
    function getMapPrefix() {
        return obj.prefix;
    }

    /**
    * 表示している路線図の名称を取得
    */
    function getMapName() {
        return obj.name;
    }


    /**
    * 路線図の中心座標を取得
    */
    function getMapCenterPoint(tmp_x, tmp_y, tmp_prefix) {
        var tmpObject = new Object();
        tmpObject.x = tmp_x;
        tmpObject.y = tmp_y;
        tmpObject.prefix = tmp_prefix;
        tmpObject.getX = function () { return Math.round((obj.cW / 2 - obj.x) / getScale()); };
        tmpObject.getY = function () { return Math.round((obj.cH / 2 - obj.y) / getScale()); };
        tmpObject.getMapPrefix = function () { return obj.prefix; };
        return tmpObject;
    };

    // 外部参照可能な関数リスト
    this.dispMap = dispMap;
    this.dispMapStation = dispMapStation;
    this.dispMapCenterPoint = dispMapCenterPoint;
    this.showOnStation = showOnStation;
    this.bind = bind;
    this.unbind = unbind;
    this.setConfigure = setConfigure;
    this.getMapPrefix = getMapPrefix;
    this.getMapName = getMapName;
    this.getMapCenterPoint = getMapCenterPoint;
    this.userInterface = new CUserInterface(mapMove, setScale);
    this.searchMapList = searchMapList;
    this.getMapList = getMapList;

    // 定数リスト
    this.STYLE_STATION_POINT = 0;
    this.STYLE_STATION_NAME = 1;
    this.STYLE_STATION_ALL = 2;
    this.TYPE_TRAIN = "train";
    this.TYPE_PLANE = "plane";
    this.TYPE_SHIP = "ship";
    this.TYPE_BUS = "bus";
    this.TYPE_WALK = "walk";
    this.TYPE_STRANGE = "strange";
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
};

/**
 * 路線図インターフェース
 */
var CUserInterface = function (p1, p2) {
    this.mapMove = p1;
    this.setScale = p2;
};

/**
 * 路線図座標インターフェース
 */
var CMapPoint = function (tmp_x, tmp_y, tmp_prefix) {
    var x = tmp_x;
    var y = tmp_y;
    var prefix = tmp_prefix;
    function getX() { return x; };
    function getY() { return y; };
    function getMapPrefix() { return prefix; };
    this.getX = getX;
    this.getY = getY;
    this.getMapPrefix = getMapPrefix;
};
