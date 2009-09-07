// @name        <?php echo $metadata['name']."\n" ?>
// @copyright   <?php echo $metadata['copyright']."\n" ?>
// @license     <?php echo $metadata['license']."\n" ?>
// @version     1.0.<?php echo $metadata['version']."\n" ?>
// @changelog   <?php echo $metadata['changelog']."\n" ?>
// @metadata    <?php echo $metadata['metadata']."\n" ?>

var <?php echo $metadata['xmlns'] ?> = function() {
  var <?php echo $metadata['xmlns'] ?> = {
    lastRequest: 0,
    get backoff() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>:backoff", 0)); },
    set backoff(value){ Math.floor((GM_setValue("<?php echo $metadata['xmlns'] ?>:backoff", value))); },
    get age() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>:age", 1)); },
    set age(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>:age", Math.floor(value)); },
    get newVersion() { return parseInt(GM_getValue("<?php echo $metadata['xmlns'] ?>:newVersion", 0)); },
    set newVersion(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>:newVersion", parseInt(value)); },
    get calculate() { return function(max) {
      var hours = Math.round(Math.exp(this.backoff) * (1 / (Math.exp(4) / 24)));
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
      if (this.enabled && (Math.floor((new Date().getTime())/1000) - this.age >= interval))
        this.request();
    }},
    widget: {
<?php if ( !$custom ) { ?>      "alert": function (details) {
        if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(<?php echo $metadata['xmlns'] ?>.localMeta["uso"]["version"])) {
          if (confirm([
            <?php echo $metadata['xmlns'] ?>.localMeta["name"],
            "",
            <?php echo $metadata['xmlns'] ?>.string["updateAvailable"],
            ((<?php echo $metadata['xmlns'] ?>.updateUrl["default"] === "install") && !details.mismatched && !details.unlisted)
              ? <?php echo $metadata['xmlns'] ?>.string["installConfirm"]
              : <?php echo $metadata['xmlns'] ?>.string["showConfirm"]
          ].join("\n"))) {
            if (details.mismatched || details.unlisted)
              <?php echo $metadata['xmlns'] ?>.openUrl(<?php echo $metadata['xmlns'] ?>.updateUrl["show"]);
            else
              <?php echo $metadata['xmlns'] ?>.openUrl(<?php echo $metadata['xmlns'] ?>.updateUrl[<?php echo $metadata['xmlns'] ?>.updateUrl["default"]]);
            }
        } 
        else if (details.forced)
          alert([
            <?php echo $metadata['xmlns'] ?>.localMeta["name"],
            "",
            <?php echo $metadata['xmlns'] ?>.string["updateUnavailable"]
          ].join("\n"));
      },
      "query": function() {
        GM_registerMenuCommand(
          <?php echo $metadata['xmlns'] ?>.localMeta["name"] + ": " + <?php echo $metadata['xmlns'] ?>.string["queryWidget"],
          function() {
            <?php echo $metadata['xmlns'] ?>.request(true); 
          }
        );
      },
      "toggle": function() {
        GM_registerMenuCommand(
          <?php echo $metadata['xmlns'] ?>.localMeta["name"] + ": " + <?php echo $metadata['xmlns'] ?>.string["toggleWidget"],
          function() {
            if (<?php echo $metadata['xmlns'] ?>.enabled === true) {
              <?php echo $metadata['xmlns'] ?>.enabled = false;
              alert([
                <?php echo $metadata['xmlns'] ?>.localMeta["name"],
                "",
                <?php echo $metadata['xmlns'] ?>.string["updaterOff"]
              ].join("\n"));
            }
            else {
              <?php echo $metadata['xmlns'] ?>.enabled = true
              alert([
                <?php echo $metadata['xmlns'] ?>.localMeta["name"],
                "",
                <?php echo $metadata['xmlns'] ?>.string["updaterOn"]
              ].join("\n"));
            }
          }
        );
      }
<?php } ?>
    },
    get enabled() { return GM_getValue("<?php echo $metadata['xmlns'] ?>:enabled", true); },
    set enabled(value){ GM_setValue("<?php echo $metadata['xmlns'] ?>:enabled", value ? true : false); },
    get maxage() { return GM_getValue("<?php echo $metadata['xmlns'] ?>:maxage", parseInt("<?php echo $days ?>")); },
    set maxage(value){
      if (typeof value !== "number" || value < 0)
        value = parseInt("<?php echo $days ?>");
      GM_setValue("<?php echo $metadata['xmlns'] ?>:maxage", value);
    },
    get updateUrl() { return {
      "default": "<?php echo $default_method ?>",
      "install": "<?php echo $install_uri ?>",
      "show": "<?php echo $show_uri ?>"
    }},
    get openUrl() { return function(url) { <?php if ( $open_method == "window" ) { ?>window.location.href = url;<?php } else { ?>GM_openInTab(url);<?php } ?> }},
    string: {
      "lang": "<?php echo $strings['lang'] ?>"<?php if ( !$trim ) { ?>,
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
<?php } else echo "\n"; ?>
    },
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
      var currentRequest;
      this.age = currentRequest = Math.floor((new Date().getTime())/1000 );

      if (currentRequest - this.lastRequest > 15 * 60) {
        GM_xmlhttpRequest({
          method: "GET",
          url: "https://userscripts.org/scripts/source/<?php echo $script_id ?>.meta.js",
          onload: function(xhr) {
            if (xhr.status == 200) {
              var details = {};
              details.remoteMeta = <?php echo $metadata['xmlns'] ?>.parseMeta(xhr.responseText);
              if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(<?php echo $metadata['xmlns'] ?>.localMeta["uso"]["version"])
                && parseInt(<?php echo $metadata['xmlns'] ?>.localMeta["uso"]["version"]) >= <?php echo $metadata['xmlns'] ?>.newVersion
              ) {
                <?php echo $metadata['xmlns'] ?>.backoff = 1;
                <?php echo $metadata['xmlns'] ?>.newVersion = details.remoteMeta["uso"]["version"];
              }
              else if (!force)
                <?php echo $metadata['xmlns'] ?>.backoff += 1;
  
              if (details.remoteMeta["name"] !== <?php echo $metadata['xmlns'] ?>.localMeta["name"]
                || details.remoteMeta["namespace"] !== <?php echo $metadata['xmlns'] ?>.localMeta["namespace"]
              ) {
                <?php echo $metadata['xmlns'] ?>.enabled = false;
                details.mismatched = true;
              }
              details.unlisted = (details.remoteMeta["uso"]["unlisted"] === "") ? true: false;
              details.forced = (force) ? true: false;
              <?php echo $metadata['xmlns'] ?>.widget["alert"](details);
            }
            else
              <?php echo $metadata['xmlns'] ?>.enabled = false;
          }
        });
        this.lastRequest = Math.ceil((new Date().getTime())/1000);
      }
    }},
    get widgets() { return function(widget, callback) {
      widget = widget.toLowerCase();
      switch (widget) {
        case "alert":
          if (typeof callback === "function")
            this.widget[widget] = callback;
          break;
        default:
          if (typeof callback === "function")
            this.widget[widget] = callback;
          else
            this.widget[widget](); 
          break;
      }
    }},
    get strings() { return function(string, value) {
      if (typeof value === "string" && typeof this.string[string] === "undefined")
        this.string[string] = value;
      return this.string[string];
    }}
  };

  var interval = <?php echo $metadata['xmlns'] ?>.calculate(this.maxage) * 60 * 60;

  if (top.location == location)
    <?php if ( $open_method != "window" ) { ?>if (typeof GM_openInTab === "function")<?php } else { ?>if (typeof GM_xmlhttpRequest === "function") <?php } ?><?="\n"?>
      <?php echo $metadata['xmlns'] ?>.check();

  return {
    get enabled() { return <?php echo $metadata['xmlns'] ?>.enabled; },
    set enabled(value) { <?php echo $metadata['xmlns'] ?>.enabled = value; },
    get maxage() { return <?php echo $metadata['xmlns'] ?>.maxage },
    set maxage(value) { <?php echo $metadata['xmlns'] ?>.maxage = value; },
    get updateUrl() { return <?php echo $metadata['xmlns'] ?>.updateUrl; },
    get openUrl() { return function(url) { <?php echo $metadata['xmlns'] ?>.openUrl(url); }},
    get strings() { return function(string, value) { return <?php echo $metadata['xmlns'] ?>.strings(string, value); }},
    get updaterMeta() { return <?php echo $metadata['xmlns'] ?>.updaterMeta; },
    get localMeta() { return <?php echo $metadata['xmlns'] ?>.localMeta; },
    get parseMeta() { return function(metadataBlock) { return <?php echo $metadata['xmlns'] ?>.parseMeta(metadataBlock); }},
    get request() { return function(force) { <?php echo $metadata['xmlns'] ?>.request(force) }},
    get widgets() { return function(widget, callback) { <?php echo $metadata['xmlns'] ?>.widgets(widget, callback); }}
  };
}();
