/*
无效，待施工
*/
let headers = $response.headers;
let headjson = JSON.stringify(headers); //从对象中解析出字符串
let headflow = headers["subscription-userinfo"];
$notification.post("佩奇流量","查询",headflow);
$done({});
