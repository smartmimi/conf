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

function yiqing() {
$httpClient.get(request, function(error, response, data) {
const res = JSON.parse(data);
  const arrres = getArrFromObj(res);
  $done({
    title: "疫情查询:当前确诊   更新于：" + res["country"]["time"].slice(5),
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