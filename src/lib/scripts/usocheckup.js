// @name        <?=$metadata['name']."\n"?>
// @copyright   <?=$metadata['copyright']."\n"?>
// @license     <?=$metadata['license']."\n"?>
// @version     1.0.<?=$metadata['version']."\n"?>
// @changelog   <?=$metadata['changelog']."\n"?>
// @metadata    <?=$metadata['metadata']."\n"?>

var usoCheckup = {

  _interval: 0,
  _lastForce: 0,
  get _backoff() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>backoff", 0)); },
  set _backoff(value) { Math.floor((GM_setValue("<?=$metadata['xmlns']?>backoff", value))); },
  get _age() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>age", 1)); },
  set _age(value) { GM_setValue("<?=$metadata['xmlns']?>age", Math.floor(value)); },
  get _newVersion() { return parseInt(GM_getValue("<?=$metadata['xmlns']?>newVersion", 0)); },
  set _newVersion(value) { GM_setValue("<?=$metadata['xmlns']?>newVersion", parseInt(value)); },

  get _calculate() { return function(max) {
    var hours = Math.round(Math.exp(this._backoff) * (1 / (Math.exp(4) / 24)));
    max *= 24;
    if (150 < hours)
      hours = Math.round(hours / 168) * 168;
    else if (20 < hours)
      hours = Math.round(hours / 24) * 24;
    if (hours >= max)
      return max;
    return hours;
  }},
  get _check() { return function() {
    if (this.enabled && (Math.floor((new Date().getTime())/1000) - this._age >= this._interval))
      this.request();
  }},

  get request() { return function(force) {
    if (Math.floor((new Date().getTime())/1000 ) - this._lastForce > 15 * 60) {
      GM_xmlhttpRequest({
        method: "GET",
        url: "https://userscripts.org/scripts/source/<?=$script_id?>.meta.js",
        onload: function(xhr) {
          if (xhr.status == 200) {
            var details = {};
            details.remoteMeta = usoCheckup.parseMeta(xhr.responseText);
            if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(usoCheckup.localMeta["uso"]["version"])
              && parseInt(usoCheckup.localMeta["uso"]["version"]) >= usoCheckup._newVersion
            ) {
              usoCheckup._backoff = 1;
              usoCheckup._newVersion = details.remoteMeta["uso"]["version"];
            }
            else if (!force)
              usoCheckup._backoff += 1;
  
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
  
          usoCheckup._age = Math.floor((new Date().getTime())/1000);
        }
      });
      this._lastForce = Math.ceil((new Date().getTime())/1000);
    }
  }},

  widget: {
<?php if ( !$trim ) { ?>    "alert": function (details) {
      if (parseInt(details.remoteMeta["uso"]["version"]) > parseInt(usoCheckup.localMeta["uso"]["version"])) {
        if (confirm([
          usoCheckup.localMeta["name"],
          "",
          usoCheckup.locale["updateAvailable"],
          ((usoCheckup.updateURI["default"] === "install") && !details.mismatched && !details.unlisted)
            ? usoCheckup.locale["installConfirm"]
            : usoCheckup.locale["showConfirm"]
        ].join("\n"))) {
          if (details.mismatched || details.unlisted)
            usoCheckup.openURI(usoCheckup.updateURI["show"]);
          else
            usoCheckup.openURI(usoCheckup.updateURI[usoCheckup.updateURI["default"]]);
          }
      } 
      else if (details.forced)
        alert([
          usoCheckup.localMeta["name"],
          "",
          usoCheckup.locale["updateUnavailable"]
        ].join("\n"));
    },
    "query": function(force) {
      if (force)
        GM_registerMenuCommand(
          usoCheckup.localMeta["name"] + ": " + usoCheckup.locale["queryWidget"],
          function() {
            usoCheckup.request(true); 
          }
        );
      else
        GM_registerMenuCommand(
          usoCheckup.localMeta["name"] + ": " + usoCheckup.locale["queryWidget"],
          function() {
            usoCheckup.request(false); 
          }
        );
    },
    "toggle": function() {
      GM_registerMenuCommand(
        usoCheckup.localMeta["name"] + ": " + usoCheckup.locale["toggleWidget"],
        function() {
          if (usoCheckup.enabled === true) {
            usoCheckup.enabled = false;
            alert([
              usoCheckup.localMeta["name"],
              "",
              usoCheckup.locale["updaterOff"]
            ].join("\n"));
          }
          else {
            usoCheckup.enabled = true
            alert([
              usoCheckup.localMeta["name"],
              "",
              usoCheckup.locale["updaterOn"]
            ].join("\n"));
          }
        }
      );
    }<?php } ?>
  },

  get enabled() { return GM_getValue("<?=$metadata['xmlns']?>enabled", true); },
  set enabled(value) { GM_setValue("<?=$metadata['xmlns']?>enabled", value ? true : false); },
  get maxage() { return GM_getValue("<?=$metadata['xmlns']?>maxage", parseInt("<?=$days?>")); },
  set maxage(value) {
    if (typeof value !== "number" || value < 1)
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
  get openURI() { return function(URI) { <?php if ( $open_method == "window" ) { ?>window.location.href = URI;<?php } else { ?>GM_openInTab(URI);<?php } ?> }}
};

usoCheckup._interval = usoCheckup._calculate(usoCheckup.maxage) * 60 * 60;

if (top.location == location)
  <?php if ( $open_method != "window" ) { ?>if (typeof GM_openInTab === "function")<?php } else { ?>if (typeof GM_xmlhttpRequest === "function") <?php } ?><?="\n"?>
    usoCheckup._check();