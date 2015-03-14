var casperjs = require("casper").create({
  "pageSettings": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36",
    loadImages: true,  
    loadPlugins: false
  },
  // logLevel: "debug", verbose: true,
  viewportSize: {width: 1280, height:800},  
  waitTimeout: 2000  
});

// xiami account, taobao account
var MODE_TB = "TB", MODE_XIAMI="XM";
var user, pwd, mode;

var cmdArgs = casperjs.cli.args;
if (3 > cmdArgs.length) {
  casperjs.die("Need args: username password mode(tb|xm)", 1);
}

mode = cmdArgs[2].toUpperCase() == MODE_XIAMI ? MODE_XIAMI : MODE_TB;
user = cmdArgs[0];
pwd = cmdArgs[1];
var NAME_INFO_SELECTOR = "div#user div.name > strong > a";

var clockon = function() {
  // show welcome
  var nameTagInfo = this.getElementInfo(NAME_INFO_SELECTOR);
  this.echo("Welcome \"" + nameTagInfo["text"] + "\"");

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
    this.echo("You have already sign for " + info["text"]);
    return;
  }

  // clock on
  this.click(clockonEleSelector);

  this.waitForSelector(doneSelector, function() {
    this.echo("You have sign successfully", "info");

  }, function() {
    this.die("You have failed to sign, please try it again", 1);

  });

};

// open
casperjs.start("http://www.xiami.com/", function() {
  // go to login page
  var loginBtnSelector = "div#header td.login > a.first";
  if (!this.exists(loginBtnSelector)) {
    this.die("Login button not found", 1);
    return;
  }

  this.click(loginBtnSelector);
});

casperjs.then(function() {
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
});

casperjs.waitForSelector(NAME_INFO_SELECTOR, clockon, function() {
  this.die("Login fail", 1);
}, 2000);

casperjs.run();
