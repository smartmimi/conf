/*
无效，待施工
*/
let headers = $response.headers;
let headjson = JSON.stringify(headers);
let headflow = headjson["subscription-userinfo"];
$notification.post("佩奇流量","查询",headflow);
$done({});
