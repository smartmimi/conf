function httpAPI(path = "", method = "POST", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
            resolve(result);
        });
    });
}
!(async () => {
let mitm_status = (await httpAPI("/v1/features/mitm","GET"));
let rewrite_status = (await httpAPI("/v1/features/rewrite","GET"));
let scripting_status = (await httpAPI("/v1/features/scripting","GET"));
$done({
    title:"功能开关显示",
    content:"Mitm:"+icon_status(mitm_status.enabled)+"  Rewrite:"+icon_status(rewrite_status.enabled)+"  Scripting:"+icon_status(scripting_status.enabled),
    icon: "gearshape",
   // "icon-color":params.color
});
})();
function icon_status(status){
  if (status){
    return "\u2611";
  } else {
      return "\u2757"
    }
}
