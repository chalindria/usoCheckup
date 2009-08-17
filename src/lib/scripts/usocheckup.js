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
        if (USO.checkup.enabled && (Math.floor((new Date().getTime())/1000) - USO.checkup.age >= interval))
          USO.checkup.request();
      }},
      get request() { return function(force) {
        GM_xmlhttpRequest({
          method: "GET",
          url: "https://userscripts.org/scripts/source/<?=$script_id?>.meta.js",
          onload: function(xhr) {
            if (xhr.status == 200) {
              var details = {};
              details.remoteMeta = USO.checkup.parseMeta(xhr.responseText);
              if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(USO.checkup.localMeta["uso"]["version"])
                && parseInt(USO.checkup.localMeta["uso"]["version"]) >= USO.checkup.newVersion
              ) {
                USO.checkup.backoff = 1;
                USO.checkup.newVersion = details.remoteMeta["uso"]["version"];
              }
              else if (!force)
                USO.checkup.backoff += 1;

              if (details.remoteMeta["name"] !== USO.checkup.localMeta["name"]
                || details.remoteMeta["namespace"] !== USO.checkup.localMeta["namespace"]
              ) {
                USO.checkup.enabled = false;
                details.mismatched = true;
              }
              details.unlisted = (details.remoteMeta["uso"]["unlisted"] === "") ? true: false;
              details.forced = (force) ? true: false;
              USO.checkup.widgets["alert"](details);
            }
            else
              USO.checkup.enabled = false;

            USO.checkup.age = Math.floor((new Date().getTime())/1000);
          }
        });
      }},
      widgets: {
<?php if ( !$trim ) { ?>        "alert": function (details) {
          if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(USO.checkup.localMeta["uso"]["version"])) {
            if (confirm([
              USO.checkup.localMeta["name"],
              "",
              USO.checkup.locale["updateAvailable"],
              ((USO.checkup.updateURI["default"] === "install") && !details.mismatched && !details.unlisted)
                ? USO.checkup.locale["installConfirm"]
                : USO.checkup.locale["showConfirm"]
            ].join("\n"))) {
              if (details.mismatched || details.unlisted)
                USO.checkup.openURI(USO.checkup.updateURI["show"]);
              else
                USO.checkup.openURI(USO.checkup.updateURI[USO.checkup.updateURI["default"]]);
              }
          } 
          else if (details.forced)
            alert([
              USO.checkup.localMeta["name"],
              "",
              USO.checkup.locale["updateUnavailable"]
            ].join("\n"));
        },
        "query": function() {
          GM_registerMenuCommand(
            USO.checkup.localMeta["name"] + ": " + USO.checkup.locale["queryWidget"],
            function() {
              USO.checkup.request(true); 
            }
          );
        },
        "toggle": function() {
          GM_registerMenuCommand(
            USO.checkup.localMeta["name"] + ": " + USO.checkup.locale["toggleWidget"],
            function() {
              if (USO.checkup.enabled === true) {
                USO.checkup.enabled = false;
                alert([
                  USO.checkup.localMeta["name"],
                  "",
                  USO.checkup.locale["updaterOff"]
                ].join("\n"));
              }
              else {
                USO.checkup.enabled = true
                alert([
                  USO.checkup.localMeta["name"],
                  "",
                  USO.checkup.locale["updaterOn"]
                ].join("\n"));
              }
            }
          );
        }<?php } ?>
      },
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
        "queryWidget": "<?=$strings['query_widget']?>",
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
      get openURI() { return function(URI) { GM_openInTab(URI); }}
    }
  };
  if (typeof window.USO !== "object") 
    window.USO = {};
  window.USO = {
    checkup: {
      get enabled() { return USO.checkup.enabled; },
      set enabled(value) { USO.checkup.enabled = value; },
      get maxage() { return USO.checkup.maxage },
      set maxage(value) { USO.checkup.maxage = value;},
      get updateURI() { return USO.checkup.updateURI;},
      get locale() { return USO.checkup.locale;},
      get updaterMeta() { return USO.checkup.updaterMeta;},
      get localMeta() { return USO.checkup.localMeta;},
      get parseMeta() { return function(metadataBlock) { USO.checkup.parseMeta(metadataBlock); }},
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
  var interval = USO.checkup.calculate(USO.checkup.maxage) * 60 * 60;

  if (top.location == location)
    <?php if ( $open_method != "window" ) { ?>if (typeof GM_openInTab === "function")
<?php } ?>
      USO.checkup.check();
})();

// Version 1.0.<?=$metadata['version']."."?>