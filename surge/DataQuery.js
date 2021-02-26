/*
无效，待施工
*/
let headers = $response.headers;
let headjson = JSON.parse(headers);
$notification.post("headjson");
$done({});
