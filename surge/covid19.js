const read = $persistentStore.read("covid19area") ;
var list = read.split(",");
const url = "https://view.inews.qq.com/g2/getOnsInfo?name=disease_h5";
var ala="";
if (!read){
  $done({
   title: "新冠疫情查询",
   style: "error",
   content: "请在boxjs中完善信息"
  })
};
function nowtime(){
 let now = new Date();
 let time = now.getHours()+":"+now.getMinutes();
 // +":"+now.getSeconds();
 return time
}
function num(location, result) {
  var loc = location;
  var resu = result;
  var loc_new = new RegExp(loc + "[\\s\\S]*?confirm[\\s\\S]{3}(\\d+)");
  var loc_now = new RegExp(loc + "[\\s\\S]*?nowConfirm[\\s\\S]{3}(\\d+)");
  var loc_wzz = new RegExp(loc + "[\\s\\S]*?wzz[\\s\\S]{3}(\\d+)");
  let loc_new_res = loc_new.exec(resu);
  let loc_now_res = loc_now.exec(resu);
  let loc_wzz_res = loc_wzz.exec(resu);
  if (loc_new_res) {
    //console.log("已获取" + loc + "的信息");
    ala = ala +loc +"   : " +equalWidth(loc_new_res[1])+equalWidth(loc_now_res[1])+equalWidth(loc_wzz_res[1])+"\n";
  } else {
    //console.log("获取" + loc + "的信息失败");
    ala = ala + loc + "   :   查无数据\n";
  }
};
$httpClient.get(url, function(error, response, data){
  let res = data;
  for (var i = 0; i < list.length; i++) {
    num(list[i], res);
    if (i == list.length - 1) {
     $done({
       title: "疫情查询:新增 | 现存 | 无症状"+ "   "+nowtime(),
       icon : "heart.circle",
       content: ala.replace(/\n$/, "")
     });
    }
  }
});
const dictWidth = {
  0: 31,
  1: 22,
  2: 30,
  3: 31,
  4: 32,
  5: 31,
  6: 32,
  7: 28,
  8: 32,
  9: 32
};
function equalWidth(str) {
  let unmWidth = 0;
  function getWidth() {
    for (var i = 0; i < str.length; i++) {
      unmWidth += dictWidth[str[i]];
      if (i == str.length - 1) {
        //console.log(unmWidth);
        return Number(unmWidth);
      }
    }
  };
  let totalWidth = Number((((200 - getWidth())*10)/132).toFixed(0))+Number(str.length);
  //console.log(str.padStart(totalWidth," "));
  return str.padStart(totalWidth," ");
}