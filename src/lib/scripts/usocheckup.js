// @name        <?php echo $metadata['name']."\n" ?>
// @copyright   <?php echo $metadata['copyright']."\n" ?>
// @license     <?php echo $metadata['license']."\n" ?>
// @version     1.0.<?php echo $metadata['version']."\n" ?>
// @changelog   <?php echo $metadata['changelog']."\n" ?>
// @metadata    <?php echo $metadata['metadata']."\n" ?>

var usoCheckup = function() {
  var usoCheckup = {
    lastForce: 0,
    get backoff() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>backoff", 0)); },
    set backoff(value){ Math.floor((GM_setValue("<?php echo $metadata['xmlns'] ?>backoff", value))); },
    get age() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>age", 1)); },
    set age(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>age", Math.floor(value)); },
    get newVersion() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>newVersion", 0)); },
    set newVersion(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>newVersion", parseInt(value)); },
    get calculate() { return function(max) {
      var hours = Math.round(Math.exp(usoCheckup.backoff) * (1 / (Math.exp(4) / 24)));
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
      if (usoCheckup.enabled && (Math.floor((new Date().getTime())/1000) - usoCheckup.age >= interval))
        usoCheckup.request();
    }},
    widget: {
<?php if ( !$trim ) { ?>      "alert": function (details) {
        if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(usoCheckup.localMeta["uso"]["version"])) {
          if (confirm([
            usoCheckup.localMeta["name"],
            "",
            usoCheckup.locales["updateAvailable"],
            ((usoCheckup.updateUrl["default"] === "install") && !details.mismatched && !details.unlisted)
              ? usoCheckup.locales["installConfirm"]
              : usoCheckup.locales["showConfirm"]
          ].join("\n"))) {
            if (details.mismatched || details.unlisted)
              usoCheckup.openUrl(usoCheckup.updateUrl["show"]);
            else
              usoCheckup.openUrl(usoCheckup.updateUrl[usoCheckup.updateUrl["default"]]);
            }
        } 
        else if (details.forced)
          alert([
            usoCheckup.localMeta["name"],
            "",
            usoCheckup.locales["updateUnavailable"]
          ].join("\n"));
      },
      "query": function() {
        GM_registerMenuCommand(
          usoCheckup.localMeta["name"] + ": " + usoCheckup.locales["queryWidget"],
          function() {
            usoCheckup.request(true); 
          }
        );
      },
      "toggle": function() {
        GM_registerMenuCommand(
          usoCheckup.localMeta["name"] + ": " + usoCheckup.locales["toggleWidget"],
          function() {
            if (usoCheckup.enabled === true) {
              usoCheckup.enabled = false;
              alert([
                usoCheckup.localMeta["name"],
                "",
                usoCheckup.locales["updaterOff"]
              ].join("\n"));
            }
            else {
              usoCheckup.enabled = true
              alert([
                usoCheckup.localMeta["name"],
                "",
                usoCheckup.locales["updaterOn"]
              ].join("\n"));
            }
          }
        );
      }<?php } ?>
    },
    get enabled() { return GM_getValue("<?php echo $metadata['xmlns'] ?>enabled", true); },
    set enabled(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>enabled", value ? true : false); },
    get maxage() { return GM_getValue("<?php echo $metadata['xmlns'] ?>maxage", parseInt("<?php echo $days ?>")); },
    set maxage(value){
      if (typeof value !== "number" || value < 0)
        value = parseInt("<?php echo $days ?>");
      GM_setValue("<?php echo $metadata['xmlns'] ?>maxage", value);
    },
    get updateUrl() { return {
      "default": "<?php echo $default_method ?>",
      "install": "<?php echo $install_uri ?>",
      "show": "<?php echo $show_uri ?>"
    }},
    get openUrl() { return function(url) { <?php if ( $open_method == "window" ) { ?>window.location.href = url;<?php } else { ?>GM_openInTab(url);<?php } ?> }},
    get locales() { return {
      "lang": "<?php echo $strings['lang'] ?>",
      "updateAvailable": "<?php echo $strings['update_available'] ?>",
      "updateUnavailable": "<?php echo $strings['update_unavailable'] ?>",
      "updateMismatched": "<?php echo $strings['update_mismatched'] ?>",
      "updateUnlisted": "<?php echo $strings['update_unlisted'] ?>",
      "queryWidget": "<?php echo $strings['query_widget'] ?>",
      "toggleWidget": "<?php echo $strings['toggle_widget'] ?>",
      "updaterOff": "<?php echo $strings['updater_off'] ?>",
      "updaterOn": "<?php echo $strings['updater_on'] ?>",
      "showConfirm": "<?php echo $strings['show_confirm'] ?>",
      "installConfirm": "<?php echo $strings['install_confirm'] ?>"
    }},
    get updaterMeta() { return <?php echo json_encode($metadata) ?>; },
    get localMeta() { return <?php echo $meta_string ?>; },
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
    get request() { return function(force) {
      if (Math.floor((new Date().getTime())/1000 ) - usoCheckup.lastForce > 15 * 60) {
        GM_xmlhttpRequest({
          method: "GET",
          url: "https://userscripts.org/scripts/source/<?php echo $script_id ?>.meta.js",
          onload: function(xhr) {
            if (xhr.status == 200) {
              var details = {};
              details.remoteMeta = usoCheckup.parseMeta(xhr.responseText);
              if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(usoCheckup.localMeta["uso"]["version"])
                && parseInt(usoCheckup.localMeta["uso"]["version"]) >= usoCheckup.newVersion
              ) {
                usoCheckup.backoff = 1;
                usoCheckup.newVersion = details.remoteMeta["uso"]["version"];
              }
              else if (!force)
                usoCheckup.backoff += 1;
  
              if (details.remoteMeta["name"] !== usoCheckup.localMeta["name"]
                || details.remoteMeta["namespace"] !== usoCheckup.localMeta["namespace"]
              ) {
                usoCheckup.enabled = false;
                details.mismatched = true;
              }
              details.unlisted = (details.remoteMeta["uso"]["unlisted"] === "") ? true: false;
              details.forced = (force) ? true: false;
              usoCheckup.widget["alert"](details);
            }
            else
              usoCheckup.enabled = false;
  
            usoCheckup.age = Math.floor((new Date().getTime())/1000);
          }
        });
        usoCheckup.lastForce = Math.ceil((new Date().getTime())/1000);
      }
    }},
    get widgets() { return function(widget, callback) {
      widget = widget.toLowerCase();
      switch (widget) {
        case "alert":
          if (typeof callback === "function")
            usoCheckup.widget[widget] = callback;
          break;
        default:
          if (typeof callback === "function")
            usoCheckup.widget[widget] = callback;
          else
            usoCheckup.widget[widget](); 
          break;
      }
    }}
  };

  var interval = usoCheckup.calculate(usoCheckup.maxage) * 60 * 60;

  if (top.location == location)
    <?php if ( $open_method != "window" ) { ?>if (typeof GM_openInTab === "function")<?php } else { ?>if (typeof GM_xmlhttpRequest === "function") <?php } ?><?="\n"?>
      usoCheckup.check();

  return {
    get enabled() { return usoCheckup.enabled; },
    set enabled(value) { usoCheckup.enabled = value; },
    get maxage() { return usoCheckup.maxage },
    set maxage(value) { usoCheckup.maxage = value; },
    get updateUrl() { return usoCheckup.updateUrl; },
    get openUrl() { return function(url) { usoCheckup.openUrl(url); }},
    get locales() { return usoCheckup.locales; },
    get updaterMeta() { return usoCheckup.updaterMeta; },
    get localMeta() { return usoCheckup.localMeta; },
    get parseMeta() { return function(metadataBlock) { return usoCheckup.parseMeta(metadataBlock); }},
    get request() { return function(force) { usoCheckup.request(force) }},
    get widgets() { return function(widget, callback) { usoCheckup.widgets(widget, callback); }}
  };
}();