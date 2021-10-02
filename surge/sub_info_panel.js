/*
Surge配置参考注释，感谢@asukanana,感谢@congcong.修改自@mieqq大佬的脚本https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js

boxjs中添加订阅https://raw.githubusercontent.com/smartmimi/conf/master/boxjs/cookie.boxjs.json
示例↓↓↓ 
----------------------------------------
[Script]
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/smartmimi/conf/master/surge/sub_info_panel.js,script-update-interval=0
[Panel]
Sub_info = script-name=Sub_info

----------------------------------------

先将带有流量信息的节点订阅链接encode，用encode后的链接替换"url="后面的[机场节点链接]

可选参数 &reset_day，后面的数字替换成流量每月重置的日期，如1号就写1，8号就写8。如"&reset_day=8",不加该参数不显示流量重置信息。

可选参数 &expire，机场链接不带expire信息的，可以手动传入expire参数，如"&expire=2022-02-01",注意一定要按照yyyy-MM-dd的格式。

可选参数"title=xxx" 可以自定义标题。
----------------------------------------
*/

(async () => {
  let sub_title = $persistentStore.read("airport_title");
  let resetDay = parseInt($persistentStore.read("airport_rest_day") );
  let resetLeft = getRmainingDays(resetDay);
  let urlcode = $persistentStore.read("airport_url");
  let usage = await getDataUsage(urlcode);
  let used = usage.download + usage.upload;
  let total = usage.total;
  let prec = precent(bytesToSize(used)bytesToSize(total));
  let expire = usage.expire || $persistentStore.read("airport_expire");
  let infoList = [`使用：${bytesToSize(used)} | ${bytesToSize(total)}\n + prec`];

  if (resetLeft) {
    infoList.push(`重置：剩余${resetLeft}天`);
  }
  if (expire) {
    if (/^[\d]+$/.test(expire)) expire *= 1000;
    infoList.push(`到期：${formatTime(expire)}`);
  }

  let body = infoList.join("\n");
  $done({
	title:  sub_title+ "   "+nowtime(),
	content: body,
        icon : $persistentStore.read("airport_icon") ||"externaldrive.connected.to.line.below",
        "icon-color" :$persistentStore.read("airport_color") || "#007aff"
	});
})();

function getUrlParams(url) {
  return Object.fromEntries(
    url
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve) =>
    setTimeout(
      () =>
        $httpClient.head(request, (err, resp) => {
          if (err) $done();
          resolve(
            resp.headers[
              Object.keys(resp.headers).find(
                (key) => key.toLowerCase() === "subscription-userinfo"
              )
            ]
          );
        }),
    )
  );
}

async function getDataUsage(url) {
  let info = await getUserInfo(url);
  if (!info) {
    $notification.post("SubInfo", "", "链接响应头不带有流量信息");
    $done();
  }
  return Object.fromEntries(
    info
      .match(/\w+=\d+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, parseInt(v)])
  );
}

function getRmainingDays(resetDay) {
  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (!resetDay) return 0;
  let daysInMonth = new Date(year, month + 1, 0).getDate();
  if (resetDay > today) daysInMonth = 0;
  return daysInMonth - today + resetDay;
}
function nowtime(){
 let now = new Date();
 let time = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
 return time
}
function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return year + "年" + month + "月" + day + "日";
}
function precent(res,total){
  let num = (res / total).toFixed(0);
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
