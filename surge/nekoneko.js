//在下一行内填写nekoneko的key，或者在boxjs内填写，以脚本内优先
const nekoneko_key = '';
//boxjs https://raw.githubusercontent.com/smartmimi/conf/master/boxjs/cookie.boxjs.json
const nekoneko_key_boxjs = $persistentStore.read("nekoneko_key");
//优先获取脚本内部key，其次从boxjs中获取
function key(){
  if(nekoneko_key){
    return nekoneko_key
  }else if(nekoneko_key_boxjs){
    return nekoneko_key_boxjs
  }else{
    push("获取key失败")
  }
}

function api() {
  $httpClient.post(
{url:"https://relay.nekoneko.cloud/api/rules",headers: {"content-type": "application/json","token":key()}},function(error, response, data){
  let res = JSON.parse(data);
  //console.log(res["status"]);
  if (res["status"] == 1) {
    var cont = "";
    for (var i = 0; i < res.data.length; i++) {
      let name = res.data[i]["name"];
      let traffic = res.data[i]["traffic"];
      let status = res.data[i]["status"];
      cont =cont + dict(status) + ":" + flow(traffic) + "G-->"+ name +  "\n";
      //console.log(cont);
      if (i == res.data.length - 1) {
        push(cont);
      }
    }
  } else if (res["status"] == 0){push(res.data)} else {push("未知错误")}
});
}

function flow(dataflow) {
  return (Number(dataflow) / (1000 * 1000 * 1000)).toFixed(2);
}
function dict(status) {
  switch (status) {
    case 0:
      return "删除中";
    case 1:
      return "运行中";
    case 2:
      return "更新中";
    case 3:
      return "添加中";
    default:
      return "状态码错误";
  }
}
function push(mes) {
$done({
title:"Nekoneko流量",
icon:"hare",
content:mes.replace(/\n$/, "")
})
}

api()
