/*
无效，待施工
*/
let headers = $response.headers;
let sub = headers["subscription-userinfo"].toString();
let upload = /upload=[0-9][0-9]{1,}/;
let upload1 = upload.exec(sub);
let upload2 = /[0-9][0-9]{1,}/;
let upload3 = upload2.exec(upload1);
let r1 = (upload3 / (1024 * 1024 * 1024)).toFixed(2);
let download = /download=[0-9][0-9]{1,}/;
let download1 = download.exec(sub);
let download2 = /[0-9][0-9]{1,}/;
let download3 = download2.exec(download1);
let r2 = (download3 / (1024 * 1024 * 1024)).toFixed(2);
let total = /total=[0-9][0-9]{1,}/;
let total1 = total.exec(sub);
let total2 = /[0-9][0-9]{1,}/;
let total3 = total2.exec(total1);
let r3 = (total3 / (1024 * 1024 * 1024)).toFixed(2);
let r4 = (r3 - r1 - r2).toFixed(2);
let flow = "上传：" + r1 +" G\n下载：" + r2 + " G\n剩余：" + r4 +" G";
$notification.post("佩奇流量查询",flow,);
$done({});
