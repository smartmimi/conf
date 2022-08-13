//请从 https://market.aliyun.com/products/57002003/cmapi00037970.html#sku=yuncode3197000001 获取 AppCode （免费），
//在Boxjs里填写查询地区及AppCode https://raw.githubusercontent.com/smartmimi/conf/master/boxjs/cookie.boxjs.json
//地区填写标准。省、直辖市，请填写全程“河北省”“北京市”。其他城市填写名字即可，“济南”“石家庄”
const boxjsarea = $persistentStore.read("covid19area") ;
const key = $persistentStore.read("alihealthkey") ;
var area = boxjsarea.split(",");
if (!boxjsarea){
  $done({
   title: "新冠疫情查询",
   style: "error",
   content: "请在boxjs中完善信息"
  })
};
const headers = {"Authorization" : "APPCODE "+key};
const url = "https://ncovdata.market.alicloudapi.com/ncov/cityDiseaseInfoWithTrend";
let ala ="";
const request = {
    url: url,
    headers: headers,
};

async function yiqing() {
$httpClient.get(request, function(error, response, data) {
  const res = JSON.parse(data);
  const arrres = getArrFromObj(res);
  $done({
    title: "疫情查询:当前确诊 " + res["country"]["time"].slice(5),
    body: getR(arrres).replace(/ $/, "")
  });
});
}


function getArrFromObj(obj) {
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
  return rtn;
}
function getR(arrres) {
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
      }else if(j == arrres.length -1){
        ala = ala + area[i] + ":无数据 ";
        //console.log(area[i]+"查无数据")
      }
    }
  }
  return ala;
}

yiqing()
