const url =
  "此处引号内填写api地址";
$input.text({
  type: $kbType.toString(),
  placeholder: "写点啥？",
  handler: function (text) {
    var headers = {
      "Content-Type": "application/json"
    };
    var body = {
      content: text
    };
    $http.request({
      method: "POST",
      url: url,
      header: headers,
      body: body,
      handler: function (resp) {
        var html = resp.data;
        $console.log(html);
        var mes = html.message;
        var code = html.code;
        if (code == -1) {
          $ui.error(mes);
        } else if (code == 0) {
          $ui.success(mes);
        } else {
          $ui.error("状态码不对");
        }
      }
    });
  }
});
