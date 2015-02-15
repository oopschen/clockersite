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
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36"
  }
});

// parse user
var cmdArgs = casperjs.cli.args, user, pwd;
if (2 > cmdArgs.length) {
  casperjs.die("need args: username password", 1);
}

user = cmdArgs[0];
pwd = cmdArgs[1];


var getCoin = function() {
  var btnSelector = "div#content div.my-btns";
  if (!this.exists(btnSelector)) {
    this.die("Coin btn not found", 1);
    return;
  }

  // TODO check click already
  var clickBtnSelector = btnSelector + " > a.J_GoTodayBtn";
  if (!this.exists(btnSelector)) {
    this.die("Coin btn not found", 1);
    return;
  }

  this.thenClick(clickBtnSelector, function() {
    // TODO check
  })
};

// taojinbi index
casperjs.start("http://taojinbi.taobao.com/index.htm", function() {
  // click login 
  var loginBtnSelector = "div#J_LoginInfoHd a.h";
  if (!this.exists(loginBtnSelector)) {
    this.die("Login Btn not found", 1);
    return;
  }

  this.click(loginBtnSelector);

  this.waitForSelector("div#J_Static > form#J_StaticForm", function() {
    this.fillSelectors(
      "form#J_StaticForm",
      {
        "input#TPL_username_1": user,
        "input#TPL_password_1": pwd
      },
      true
    );

    this.waitForSelector("div#content div.my-btns", getCoin, function() {
      this.die("Invalid Coin btn" + this.getHTML(), 1);
      
    }, 2000);

  }, function() {
    this.die("Invalid login form", 1)

  }, 2000);

});

casperjs.run();
