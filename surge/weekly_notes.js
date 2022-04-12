const weekly_notes_boxjs_title = $persistentStore.read("weekly_notes_title");
const weekly_notes_boxjs = {};
//拼接boxjs内容
if(weekly_notes_boxjs_title){
  for(i=0;i<=6;i++){
    weekly_notes_boxjs[i] = $persistentStore.read(`weekly_notes_${i}`);
  }
}

var tnow = new Date();
var tnoww = tnow.getDay();
$done({
title:"周"+`${tnoww==0?"日":tnoww}`+"信息提醒",
icon:"greetingcard",
content:tlist[tnow]
})
