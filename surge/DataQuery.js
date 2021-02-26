/*
无效，待施工
*/
let headers = $response.headers;
let headjson = JSON.stringify(headers);
$notification.post("佩奇流量",,headjson);
$done({});
