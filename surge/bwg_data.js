const veid = $persistentStore.read("bwgid") ;
const api_key = $persistentStore.read("bwgkey") ;
if (!(veid&&api_key)){
  $done({
   title: "搬瓦工流量",
   style: "error",
   content: "请在boxjs中完善信息"
  })
};
let url = "https://api.64clouds.com/v1/getServiceInfo?veid="+veid+"&api_key="+api_key;
$httpClient.get(url, function(error, response, data){
  let resp = JSON.parse(data)
  if (resp["error"]){
    $done({
    title: "搬瓦工流量",
    style: "error",
    content: "api验证失败，请检查后重试"
    });
  }else{
    let data_next_reset = resp["data_next_reset"];
    let datares = (resp["data_counter"] / (1024 * 1024 * 1024)).toFixed(2);
    let datatotal = (resp["plan_monthly_data"] / (1024 * 1024 * 1024)).toFixed(0);
    let reset = redate(data_next_reset);
    $done({
     title: "搬瓦工流量"+ "   "+nowtime(),
     icon : "externaldrive.connected.to.line.below",
     content: "已用： " + datares + "GB｜"+datatotal+" GB\n"+ precent(datares,datatotal) +"\n重置： " + reset
     });
    }
});
function redate(datein) {
  let da = new Date(datein * 1000);
  let year = da.getFullYear();
  let month = da.getMonth() + 1;
  let date = da.getDate();
  return [year, month, date].join("-");
}
function nowtime(){
 let now = new Date();
 let time = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
 return time
}
function precent(res,total){
  let num = Number(((res / total)*10).toFixed(0));
  let precentprint = '';
  for (var i =1;i<=10;i++){
    if (i <= num) {
      precentprint += '🔴';
    }else{
      precentprint += '🟢';
    }
  };
  return precentprint;
}
