//请从 https://market.aliyun.com/products/57002003/cmapi00037970.html#sku=yuncode3197000001 获取 AppCode （免费），
//在Boxjs里填写查询地区及AppCode https://raw.githubusercontent.com/smartmimi/conf/master/boxjs/cookie.boxjs.json
//地区填写标准。省、直辖市，请填写全程"河北省""北京市"。其他城市填写名字即可，"济南""石家庄"
const boxjsarea = $persistentStore.read("covid19area");
const key = $persistentStore.read("alihealthkey");
var area = boxjsarea.split(",");
if (!boxjsarea) {
  $done({
    title: "新冠疫情查询",
    style: "error",
    content: "请在boxjs中完善信息"
  });
}
const headers = { Authorization: "APPCODE " + key };
const url =
  "https://ncovdata.market.alicloudapi.com/ncov/cityDiseaseInfoWithTrend";
const request = {
  url: url,
  headers: headers
};

async function yiqing() {
  let res = await getData();
  let arrres = await getArrFromObj(res);
  let getrr = await getR(arrres);
  $done({
    title: "疫情:确诊 " + res["country"]["time"].slice(5),
    icon: "heart.circle",
    content: getrr.replace(/ $/, "")
  });
}

function getArrFromObj(obj) {
  return new Promise(function (resolve, reject) {
    const rtn = [];
    const iter = obj => {
      rtn.push({
        地区: obj.childStatistic,
        治愈: obj.totalCured,
        死亡: obj.totalDeath,
        确诊: obj.totalConfirmed
      });
      const matchprov = Object.keys(obj).filter(i => i.match(/^provinceArray/));
      if (matchprov.length) {
        obj[matchprov[0]].forEach(iter);
      }
      const matchcity = Object.keys(obj).filter(i => i.match(/^cityArray/));
      if (matchcity.length) {
        obj[matchcity[0]].forEach(iter);
      }
    };
    iter(obj);
    resolve(rtn);
  });
}
function getR(arrres) {
  var ala = "";
  return new Promise(function (resolve, reject) {
    for (var i = 0; i < area.length; i++) {
      //console.log("area:"+area[i]);
      for (var j = 0; j < arrres.length; j++) {
        //console.log(arrres[j]["地区"])
        if (arrres[j]["地区"] == area[i]) {
          let nowConfirmed =
            Number(arrres[j]["确诊"]) -
            Number(arrres[j]["治愈"]) -
            Number(arrres[j]["死亡"]);
          ala = ala + area[i] + ":" + nowConfirmed + "  ";
          //console.log(ala);
          break;
        } else if (j == arrres.length - 1) {
          ala = ala + area[i] + ":无数据 ";
          //console.log(area[i] + "查无数据");
        }
      }
    }
    resolve(ala);
  });
}
function getData() {
  return new Promise((resolve, reject) =>
    $httpClient.get(request, (err, resp, data) => {
      resolve(JSON.parse(data));
    })
  );
}

yiqing();
