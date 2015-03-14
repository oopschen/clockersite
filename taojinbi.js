/**
 * <p>自动获取淘金币</p>
 * <p>
 * Usage:
 *    <code>
 *      capserjs taojinbi.js username password
 *    </code>
 * </p>
 * @author ray
 * @since 1.0
 * @date 2015.02.15
 */

var casperjs = require("casper").create({
  "pageSettings": {
    loadImages: false,  
    loadPlugins: false
  },
  // logLevel: "debug", verbose: true,
  viewportSize: {width: 1280, height:800},  
  waitTimeout: 1600  
});

// parse user
var cmdArgs = casperjs.cli.args, user, pwd;
if (2 > cmdArgs.length) {
  casperjs.die("need args: username password", 1);
}

user = cmdArgs[0];
pwd = cmdArgs[1];


// taojinbi index
casperjs.start("http://taojinbi.taobao.com/index.htm", function() {
  // click login 
  var loginBtnSelector = "div.my-btns a.J_GoLoginBtn";
  if (!this.exists(loginBtnSelector)) {
    this.die("Login Btn not found", 1);
    return;
  }
  this.wait(2000);
  this.click(loginBtnSelector);
});


// login frame
casperjs.waitForSelector('iframe', function() {
  this.withFrame(0, function() {
    this.waitForSelector('form', function() {
      this.fill(
        "form",
        {
          "TPL_username": user,
          "TPL_password": pwd
        },
        true
      );
      this.wait(2000);

    }, function() {
      this.die('login form not found', 1);

    });
  });


}, function() {
  this.die('login iframe not found', 1);
});

var btnDivSel = 'div#content div.my-btns';
casperjs.waitForSelector(btnDivSel, function() {
  var takeTips = btnDivSel + ' p.take-tips';
  if (this.exists(takeTips)) {
    this.echo("Coin already get: " + this.fetchText(takeTips + ' em:nth-child(1)') + ' days.');
    return;
  }

  // check click already
  var clickBtnSelector = btnDivSel + " a.J_GoTodayBtn";
  this.click(clickBtnSelector);

  this.waitForSelector(takeTips, function() {
    this.echo("Coin get: " + this.fetchText(takeTips + ' em:nth-child(1)') + ' days.');
  }, function() {
    this.die('clock fail', 1);
  });

}, function() {
  this.die("login fail", 1);

});

casperjs.run();
