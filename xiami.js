var casperjs = require("casper").create({
  "logLevel": "info",
  "pageSettings": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"
  },
  "verbose": true
});

// xiami account, taobao account
var MODE_TB = "TB", MODE_XIAMI="XM";
var user, pwd, mode;

var cmdArgs = casperjs.cli.args;
if (3 > cmdArgs.length) {
  casperjs.die("need args: username password mode(tb|xm)", 1);
  casperjs.exit(1);
}

mode = cmdArgs[2].toUpperCase() == MODE_XIAMI ? MODE_XIAMI : MODE_TB;
user = cmdArgs[0];
pwd = cmdArgs[1];
var NAME_INFO_SELECTOR = "div#user div.name > strong > a";

var clockon = function() {
  // show welcome
  var nameTagInfo = this.getElementInfo(NAME_INFO_SELECTOR);
  this.log("Welcome \"" + nameTagInfo["text"] + "\"");

  // find to sign elements
  var clockonEleSelector = "div#user div.action > b.icon.tosign";
  if (!this.exists(clockonEleSelector)) {
    this.die("Clockon element not found", 1);
    return;
  }

  // check has already clock on
  var doneSelector = clockonEleSelector + ".done";
  if (this.exists(doneSelector)) {
    var info = this.getElementInfo(doneSelector);
    this.log("You have already sign for " + info["text"] + " days", "info");
    return;
  }

  // clock on
  this.thenClick(clockonEleSelector, function () {
    // check clock on
    if (this.exists(doneSelector)) {
      this.log("You have sign successfully", "info");
      return;
    }


    this.die("You have failed to sign, please try it again", 1);

  });

};

// open
casperjs.start("http://www.xiami.com/", function() {
  this.log("Open Index page", "info");

  // go to login page
  var loginBtnSelector = "div#header td.login > a.first";
  if (!this.exists(loginBtnSelector)) {
    this.die("Login button not found", 1);
    return;
  }

  this.thenClick(loginBtnSelector, function() {
    if (MODE_XIAMI == mode) {
      // xiami mode
      if (!this.exists("#login a.xiami.current")) {
        this.die("Xiami login tab not found", 1);
        return;
      }

      this.fillSelectors(
        "div#xiami-login > form[method]",
        {
          "input#email": user,
          "input#password": pwd
        },
        true
      );

    } else {
      // taobao mode
      var tabSelector = "div#login a.taobao";
      if (!this.exists(tabSelector)) {
        this.die("Taobao login tab not found", 1);
        return;
      }

      this.thenClick(tabSelector, function () {
        this.withFrame(0, function () {
          this.withFrame(0, function () {
            this.fillSelectors(
              "form#login-form",
              {
                "input#fm-login-id": user,
                "input#fm-login-password": pwd
              },
              true
            );
          });
          
        });

      });

    }

    this.waitForSelector(NAME_INFO_SELECTOR, clockon, 2000);

  });

  
});

casperjs.run();