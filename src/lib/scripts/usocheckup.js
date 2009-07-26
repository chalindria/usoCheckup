// @name        <?=$metadata['name']."\n"?>
// @copyright   <?=$metadata['copyright']."\n"?>
// @license     <?=$metadata['license']."\n"?>
// @version     1.0.<?=$metadata['version'].".1\n"?>
// @changelog   <?=$metadata['changelog']."\n"?>
// @metadata    <?=$metadata['metadata']."\n"?>

(function() {
  var USO = {
    checkup: {
      lastForce: 0,
      get backoff() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>backoff", 0)); },
      set backoff(value){ Math.floor((GM_setValue("<?=$metadata['xmlns']?>backoff", value))); },
      get age() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>age", 1)); },
      set age(value){ GM_setValue("<?=$metadata['xmlns']?>age", Math.floor(value)); },
      get newVersion() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>newVersion", 0)); },
      set newVersion(value){ GM_setValue("<?=$metadata['xmlns']?>newVersion", parseInt(value)); },
      get calculate() { return function(max) {
        var hours = Math.round(Math.exp(USO.checkup.backoff) * (1 / (Math.exp(4) / 24)));
        max *= 24;
        if (150 < hours)
          hours = Math.round(hours / 168) * 168;
        else if (20 < hours)
          hours = Math.round(hours / 24) * 24;
        if (hours >= max)
          return max;
        return hours;
      }},
      get check() { return function() {
        if (window.USO.checkup.enabled && (Math.floor((new Date().getTime())/1000) - USO.checkup.age >= interval))
          USO.checkup.request();
      }},
      get request() { return function(force) {
        GM_xmlhttpRequest({
          method: "GET",
          url: "https://userscripts.org/scripts/source/<?=$script_id?>.meta.js",
          onload: function(xhr) {
            if (xhr.status == 200) {
              window.USO.checkup.remoteMeta = window.USO.checkup.parseMeta(xhr.responseText);
              if (parseInt(window.USO.checkup.remoteMeta["uso"]["version"]) > parseInt(window.USO.checkup.localMeta["uso"]["version"])
                && parseInt(window.USO.checkup.localMeta["uso"]["version"]) >= USO.checkup.newVersion
              ) {
                USO.checkup.backoff = 1;
                USO.checkup.newVersion = window.USO.checkup.remoteMeta["uso"]["version"];
              }
              else if (!force)
                USO.checkup.backoff += 1;

              if (window.USO.checkup.remoteMeta["name"] !== window.USO.checkup.localMeta["name"]
                || window.USO.checkup.remoteMeta["namespace"] !== window.USO.checkup.localMeta["namespace"]
              ) {
                window.USO.checkup.enabled = false;
                var mismatched = true;
              }
              var unlisted = (window.USO.checkup.remoteMeta["uso"]["unlisted"] === "") ? true: false;
              USO.checkup.widgets["alert"](force ? true : false, mismatched ? true : false, unlisted);
            }
            else
              window.USO.checkup.enabled = false;

            USO.checkup.age = Math.floor((new Date().getTime())/1000);
          }
        });
      }},
      widgets: {
<?php if ( !$trim ) { ?>        "alert": function (forced, mismatched, unlisted) {
          if (parseInt(window.USO.checkup.remoteMeta["uso"]["version"]) > parseInt(window.USO.checkup.localMeta["uso"]["version"])) {
            if (confirm([
              window.USO.checkup.localMeta["name"],
              "",
              window.USO.checkup.locale["updateAvailable"],
              ((window.USO.checkup.updateURI["default"] === "install") && !mismatched && !unlisted)
                ? window.USO.checkup.locale["installConfirm"]
                : window.USO.checkup.locale["showConfirm"]
            ].join("\n"))) {
              if (mismatched || unlisted)
                window.USO.checkup.openURI(window.USO.checkup.updateURI["show"]);
              else
                window.USO.checkup.openURI(window.USO.checkup.updateURI[window.USO.checkup.updateURI["default"]]);
              }
          } 
          else if (forced)
            alert([
              window.USO.checkup.localMeta["name"],
              "",
              window.USO.checkup.locale["updateUnavailable"]
            ].join("\n"));
        },
        "request": function() {
          GM_registerMenuCommand(
            window.USO.checkup.localMeta["name"] + ": " + window.USO.checkup.locale["requestWidget"],
            function() {
              USO.checkup.request(true); 
            }
          );
        },
        "toggle": function() {
          GM_registerMenuCommand(
            window.USO.checkup.localMeta["name"] + ": " + window.USO.checkup.locale["toggleWidget"],
            function() {
              if (window.USO.checkup.enabled === true) {
                window.USO.checkup.enabled = false;
                alert([
                  window.USO.checkup.localMeta["name"],
                  "",
                  window.USO.checkup.locale["updaterOff"]
                ].join("\n"));
              }
              else {
                window.USO.checkup.enabled = true
                alert([
                  window.USO.checkup.localMeta["name"],
                  "",
                  window.USO.checkup.locale["updaterOn"]
                ].join("\n"));
              }
            }
          );
        }<?php } ?>
      }
    }
  };
  if (typeof window.USO !== "object") 
    window.USO = {};
  window.USO = {
    checkup: {
      get enabled() { return GM_getValue("<?=$metadata['xmlns']?>enabled", true); },
      set enabled(value){ GM_setValue("<?=$metadata['xmlns']?>enabled", value ? true : false); },
      get maxage() { return GM_getValue("<?=$metadata['xmlns']?>maxage", parseInt("<?=$days?>")); },
      set maxage(value){
        if (typeof value !== "number" || value < 0)
          value = parseInt("<?=$days?>");
        GM_setValue("<?=$metadata['xmlns']?>maxage", value);
      },
      get updateURI() { return {
        "default": "<?=$default_method?>",
        "install": "<?=$install_uri?>",
        "show": "<?=$show_uri?>"
      }},
      get locale() { return {
        "updateAvailable": "<?=$strings['update_available']?>",
        "updateUnavailable": "<?=$strings['update_unavailable']?>",
        "updateMismatched": "<?=$strings['update_mismatched']?>",
        "updateUnlisted": "<?=$strings['update_unlisted']?>",
        "requestWidget": "<?=$strings['request_widget']?>",
        "toggleWidget": "<?=$strings['toggle_widget']?>",
        "updaterOff": "<?=$strings['updater_off']?>",
        "updaterOn": "<?=$strings['updater_on']?>",
        "showConfirm": "<?=$strings['show_confirm']?>",
        "installConfirm": "<?=$strings['install_confirm']?>"
      }},
      get updaterMeta() { return <?=json_encode($metadata)?>; },
      get localMeta() { return <?=$meta_string?>; },
      get parseMeta() { return function(metadataBlock) {
          metadataBlock = metadataBlock.toString();
          var headers = {};
          var line, name, prefix, header, key, value;
            var lines = metadataBlock.split(/\n/).filter(/\/\/ @/);
            for each (line in lines) {
              [, name, value] = line.match(/\/\/ @(\S+)\s*(.*)/);
              switch (name) {
                case "licence":
                  name = "license";
                  break;
              }
              [key, prefix] = name.split(/:/).reverse();
              if (prefix) {
                if (!headers[prefix]) 
                  headers[prefix] = new Object;
                header = headers[prefix];
              } else
                header = headers;
              if (header[key] && !(header[key] instanceof Array))
                header[key] = new Array(header[key]);
              if (header[key] instanceof Array)
                header[key].push(value);
              else
                header[key] = value;
            }
            headers["licence"] = headers["license"];
          return headers;
        }},
      get widgets() { return function(widget, callback) {
          widget = widget.toLowerCase();
          switch (widget) {
            case "alert":
              if (typeof callback === "function") USO.checkup.widgets[widget] = callback;
              break;
            default:
              if (typeof callback === "function") USO.checkup.widgets[widget] = callback; USO.checkup.widgets[widget](); 
              break;
          }
        }},
      get request() { return function(force) {
       if (Math.floor((new Date().getTime())/1000 ) - USO.checkup.lastForce > 15 * 60) {
        USO.checkup.request(force ? true : false);
        USO.checkup.lastForce = Math.ceil((new Date().getTime())/1000);
       }
      }},
      get openURI() { return function(URI) { <?php if ( $open_method == "window" ) { ?>window.location.href = URI;<?php } else { ?>GM_openInTab(URI);<?php } ?> }}
    }
  };
  var interval = USO.checkup.calculate(window.USO.checkup.maxage) * 60 * 60;

  if (top.location == location)
    <?php if ( $open_method != "window" ) { ?>if (typeof GM_openInTab === "function")
<?php } ?>
      USO.checkup.check();
})();

// Version 1.0.<?=$metadata['version']."."?>