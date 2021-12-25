var p2pareanames = {"10": "北海道 石狩", "15": "北海道 渡島", "20": "北海道 檜山", "25": "北海道 後志", "30": "北海道 空知", "35": "北海道 上川", "40": "北海道 留萌", "45": "北海道 宗谷", "50": "北海道 網走", "55": "北海道 胆振", "60": "北海道 日高", "65": "北海道 十勝", "70": "北海道 釧路", "75": "北海道 根室", "100":"青森津軽","105":"青森三八上北","106":"青森下北","110":"岩手沿岸北部","111":"岩手沿岸南部","115":"岩手内陸","120":"宮城北部","125":"宮城南部","130":"秋田沿岸","135":"秋田内陸","140":"山形庄内","141":"山形最上","142":"山形村山","143":"山形置賜","150":"福島中通り","151":"福島浜通り","152":"福島会津","200":"茨城北部","205":"茨城南部","210":"栃木北部","215":"栃木南部","220":"群馬北部","225":"群馬南部","230":"埼玉北部","231":"埼玉南部","232":"埼玉秩父","240":"千葉北東部","241":"千葉北西部","242":"千葉南部","250":"東京","255":"伊豆諸島北部","260":"伊豆諸島南部","265":"小笠原","270":"神奈川東部","275":"神奈川西部","300":"新潟上越","301":"新潟中越","302":"新潟下越","305":"新潟佐渡","310":"富山東部","315":"富山西部","320":"石川能登","325":"石川加賀","330":"福井嶺北","335":"福井嶺南","340":"山梨東部","345":"山梨中・西部","350":"長野北部","351":"長野中部","355":"長野南部","400":"岐阜飛騨","405":"岐阜美濃","410":"静岡伊豆","411":"静岡東部","415":"静岡中部","416":"静岡西部","420":"愛知東部","425":"愛知西部","430":"三重北中部","435":"三重南部","440":"滋賀北部","445":"滋賀南部","450":"京都北部","455":"京都南部","460":"大阪北部","465":"大阪南部","470":"兵庫北部","475":"兵庫南部","480":"奈良","490":"和歌山北部","495":"和歌山南部","500":"鳥取東部","505":"鳥取中・西部","510":"島根東部","514":"島根隠岐","515":"島根西部","520":"岡山北部","525":"岡山南部","530":"広島北部","535":"広島南部","540":"山口北部","541":"山口西部","545":"山口中・東部","550":"徳島北部","555":"徳島南部","560":"香川","570":"愛媛東予","575":"愛媛中予","576":"愛媛南予","580":"高知東部","581":"高知中部","582":"高知西部","600":"福岡福岡","601":"福岡北九州","602":"福岡筑豊","605":"福岡筑後","610":"佐賀北部","615":"佐賀南部","620":"長崎北部","625":"長崎南部","630":"長崎壱岐・対馬","635":"長崎五島","640":"熊本阿蘇","641":"熊本熊本","645":"熊本球磨","646":"熊本天草・芦北","650":"大分北部","651":"大分中部","655":"大分西部","656":"大分南部","660":"大分北部平野部","661":"大分北部山沿い","665":"大分南部平野部","666":"大分南部山沿い","670":"鹿児島薩摩","675":"鹿児島大隅","680":"種子島・屋久島","685":"鹿児島奄美","700":"沖縄本島北部","701":"沖縄本島中南部","702":"沖縄久米島","705":"沖縄八重山","706":"沖縄宮古島","710":"沖縄大東島","050":"北海道 網走","045":"北海道 宗谷","035":"北海道 上川","040":"北海道 留萌","075":"北海道 根室","070":"北海道 釧路","065":"北海道 十勝","055":"北海道 胆振","060":"北海道 日高","010":"北海道 石狩","030":"北海道 空知","025":"北海道 後志","015":"北海道 渡島","020":"北海道 檜山", "900": "", "901": "", "905": ""}; //地域未設定(900),地域不明(901),日本以外(905)は非表示
var p2ptypes = {551: '地震情報', 552: '津波予報', 554: '緊急地震速報 発表検出', 555: '各地域ピア数', 561: '地震感知情報', 9611: '地震感知情報 解析結果'};

var map;
var setupMap = new Promise((resolve, reject) => {
    map = L.map('map').setView([36, 137], 7);
    map.attributionControl.addAttribution('地図データ：<a href="https://www.data.jma.go.jp/developer/gis.html">気象庁GISデータ</a>を加工')
    map.attributionControl.addAttribution('データ：<a href="https://p2pquake.net/json_api_v2/">P2P地震情報</a>')
    $.getJSON('p2puserquake_area.geojson', (data) => {
        L.geoJson(data, {
            color: '#ddd', 
            fillColor: '#ddd'
        }).addTo(map);
        resolve();
    });
});

var connection = null;
var closecount = 0;
var reconnectingtoast;
var connectws = () => {
    connection = new WebSocket("wss://api.p2pquake.net/v2/ws");
    connection.onopen = (e) => {
        console.log("Websocket: Connected to p2pquake api websocket.");
        console.log(e.data);
        $.toast({
            heading: '接続完了',
            text: 'p2p地震情報のWebSocketに接続しました。',
            icon: 'success',
            hideAfter: 5 * 1000
        });
        if (reconnectingtoast) {reconnectingtoast.close();}
        closecount = 0;
    };
    connection.onerror = (error) => {
        console.error('Websocket: Error occurred - '+error.data);
        $.toast({
            heading: 'エラーが発生しました。',
            text: error.data,
            icon: 'error',
            hideAfter: 30 * 1000
        });
    };
    connection.onmessage = (e) => {
        console.log('Websocket: Message received');
        console.log(JSON.parse(e.data));
        ongetData(JSON.parse(e.data));
    }
    connection.onclose = () => {
        if (reconnectingtoast) {reconnectingtoast.close();}
        console.log('Websocket: Connection closed');
        closecount++;
        if (closecount > 2) {
            $.toast({
                heading: '切断されました',
                text: 'WebSocketが切断されました。また、複数回再接続を試みましたが失敗しました。このメッセージ以降情報は表示されません。時間を空けた後、再読み込みしてください。',
                icon: 'error',
                hideAfter: false,
                allowToastClose: false
            });
        } else {
            $.toast({
                heading: '切断されました',
                text: 'WebSocketが切断されました。30秒後に再接続を試みます。',
                icon: 'error',
                hideAfter: 30 * 1000
            });
            setTimeout(()=>{
                reconnectingtoast = $.toast({
                    text: '再接続しています...',
                    hideAfter: false
                });
                connectws();
            }, 30* 1000);
        }
    };
};

Promise.all([setupMap])
.then(() => {
    connectws();

    //過去50件の地震感知情報の中から最近のarea_confidencesが1以上のデータを表示
    $.getJSON('https://api.p2pquake.net/v2/history?codes=9611&limit=50', (data) => {
        ongetData(data.find(d => Object.keys(d.area_confidences).length > 0));
    });
});

const ongetData = (data) => {
    if (!data) return;
    console.log('OnMessage: '+p2ptypes[data.code]+'を受信しました。');
    if (data.code === 9611 && Object.keys(data["area_confidences"]).length > 0) {
        console.log('OnMessage: '+p2ptypes[data.code]+'を受信しました。描画処理を開始します。');
        $('#count').text(data.count);
        var started_at = new Date(data.started_at);
        var updated_at = new Date(data.updated_at);
        $('#starttime').text(started_at.toLocaleTimeString());
        $('#endtime').text(updated_at.toLocaleTimeString());
        $('#persec').text(Math.round(((updated_at.getTime()-started_at.getTime())/1000)/data.count*100)/100);
        $('#areas').html(getAreasText(data));
        updateColors(data);
    }
}

const getAreaByDisplay = (display, data) => {
    console.log(data);
    return Object.entries(data["area_confidences"]).filter(d=>d[1].display==display);
}
const getAreasText = (data) => {
    var out = "";
    if (getAreaByDisplay('A', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度A</strong>';
        for (const area of getAreaByDisplay('A', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    if (getAreaByDisplay('B', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度B</strong>';
        for (const area of getAreaByDisplay('B', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    if (getAreaByDisplay('C', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度C</strong>';
        for (const area of getAreaByDisplay('C', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    if (getAreaByDisplay('D', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度D</strong>';
        for (const area of getAreaByDisplay('D', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    if (getAreaByDisplay('E', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度E</strong>';
        for (const area of getAreaByDisplay('E', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    if (getAreaByDisplay('F', data).length !== 0) {
        out = out + '<div class="area"><strong>信頼度F</strong>';
        for (const area of getAreaByDisplay('F', data)) {
            out = out + " " + "<span>" + p2pareanames[area[0]] + '</span>';
        }
        out = out + '</div>';
    }
    return out;
}
const updateColors = (data) => {
    var targetLayers = [];
    for (const layer of Object.values(map._layers)) {
        if (layer.feature && layer.feature.properties.p2pcode) {
            if (data.area_confidences[layer.feature.properties.p2pcode] || data.area_confidences[layer.feature.properties.p2pcode] == -1) {
                layer.setStyle(getColor(data.area_confidences[layer.feature.properties.p2pcode].confidence));
                if (data.area_confidences[layer.feature.properties.p2pcode].confidence !== -1) {
                    targetLayers.push(layer);
                }
            } else {
                layer.setStyle({color: '#ddd', fillColor: '#ddd', fillOpacity: 0.2});
            }
        }
    }
    map.fitBounds(L.featureGroup(targetLayers).getBounds());
}
const getColor = (confidence) => {
    if (confidence <= 0) {
        return {color: '#ddd', color: '#ddd', fillOpacity: 0.2};
    } else if (confidence <= 0.1) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 85%)', fillOpacity: 0.8};
    } else if (confidence <= 0.2) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 80%)', fillOpacity: 0.8};
    } else if (confidence <= 0.3) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 75%)', fillOpacity: 0.8};
    } else if (confidence <= 0.4) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 70%)', fillOpacity: 0.8};
    } else if (confidence <= 0.5) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 65%)', fillOpacity: 0.8};
    } else if (confidence <= 0.6) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 60%)', fillOpacity: 0.8};
    } else if (confidence <= 0.7) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 57%)', fillOpacity: 0.8};
    } else if (confidence <= 0.8) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 55%)', fillOpacity: 0.8};
    } else if (confidence <= 0.9) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 52%)', fillOpacity: 0.8};
    } else if (confidence <= 1) {
        return {color: '#ddd', fillColor: 'hsl(35, 100%, 50%)', fillOpacity: 0.8};
    }
    return {color: '#ddd', fillColor: '#ddd', fillOpacity: 0.2};
}

