var casperjs = require("casper").create({
  pageSettings: {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
    loadImages: true,  
    loadPlugins: false 
  },
  //logLevel: "info", verbose: true,
  viewportSize: {width: 1280, height:800},  
  waitTimeout: 1600  
});

var webserver = require('webserver').create(),
    webServerPort = 7777,
    captchaFormat = 'jpeg',
    webService, webPort;

// parse parameters
var cmdArgs = casperjs.cli.args, user, pwd;
if (2 > cmdArgs.length) {
  casperjs.die("Need args: username password", 1);
}

user = cmdArgs[0];
pwd = cmdArgs[1];
var calls = [xiamiClockon, taojinbiClockon], curCallInx = 0;
var EV_TAOBAO_INPUT_NAME = "taobao.input.name",
    EV_TAOBAO_INPUT_PWD = 'taobao.input.pwd',
    EV_TAOBAO_INPUT_CAPTCHA = 'taobao.input.captcha',
    EV_TAOBAO_LOGIN = 'taobao.login',
    EV_TAOBAO_NEXT_SIGN_ON = 'taobao.next';
var isLoginFin = 0;
// end

// xiami 
function doXiamiClockJob() {
  if (!this.exists('div#user')) {
    this.echo("Xiami: user info 404 on page");
    nextClock.call(this);
    return;
  }
  // show welcome
  var userName = this.fetchText("div#user div.name > strong > a");
  this.echo("Xiami: Welcome \"" + userName + "\"");

  // find to sign elements
  var clockonEleSelector = "div#user div.action > b.icon.tosign";
  if (!this.exists(clockonEleSelector)) {
    this.echo("Xiami: Clockon element not found");
    nextClock.call(this);
    return;
  }

  // check has already clock on
  var doneSelector = clockonEleSelector + ".done";
  if (this.exists(doneSelector)) {
    var info = this.fetchText(doneSelector);
    this.echo("Xiami: You have already sign for " + info);
    nextClock.call(this);
    return;
  }

  // clock on
  this.thenClick(clockonEleSelector, function () {
    // check clock on
    if (this.exists(doneSelector)) {
      this.echo("Xiami: You have sign successfully");
      nextClock.call(this);
      return;
    }


    this.echo("Xiami: You have failed to sign, please try it again");
    nextClock.call(this);

  });

};

function xiamiClockon() {
  this.open("http://www.xiami.com").then(function() {
    var loginBtnSelector = "div#header td.login a.first";
    this.waitForSelector(loginBtnSelector, function() {
      this.click(loginBtnSelector);
      this.waitForSelector("div#login", function() {
        this.click("div#login a.taobao");
        this.waitForSelector("div#login div.block > iframe", function() {
          this.withFrame(0, function() {
            this.waitForSelector("div#alibaba-login > iframe", function() {
              this.withFrame(0, function() {
                var loginBtnSelector = "input#has-login-submit";
                if (!this.exists(loginBtnSelector)) {
                  this.echo("Xiami: alibaba login btn 404");
                  nextClock.call(this);
                  return;
                }

                this.click(loginBtnSelector);
                this.waitForSelector("div#user div.name", function() {
                  doXiamiClockJob.call(this);

                }, function() {
                  this.echo("Xiami: login fail");
                  nextClock.call(this);

                });

              });
              // frame

            }, function() {
              this.echo("Xiami: alibaba login page 404");
              nextClock.call(this);

            });
            // wait selector

          });
          // frame

        }, function() {
          this.echo("Xiami: Taobao tab 404");
          nextClock.call(this);

        });

      }, function() {
        this.echo("Xiami: login page 404");
        nextClock.call(this);

      });

    }, function() {
      // already login
      doXiamiClockJob.call(this);

    });

  });
};
// end

// taojinbi
function doTaojinbiClock() {
  var btnSelector = "div#content div.my-btns";
  if (!this.exists(btnSelector)) {
    this.echo("Taojinbi: Coin btn not found");
    nextClock.call(this);
    return;
  }

  // check click already
  var tipsSelector = btnSelector + " > p.take-tips";
  if (this.exists(tipsSelector)) {
    var tipsInfo = this.getElementInfo(tipsSelector);
    this.echo("Taojinbi: you have clock on -->" + tipsInfo["html"]);
    nextClock.call(this);
    return;

  }

  var clickBtnSelector = btnSelector + " > a.J_GoTodayBtn";
  if (!this.exists(btnSelector)) {
    this.echo("Taojinbi: Coin btn not found");
    nextClock.call(this);
    return;
  }

  this.click(clickBtnSelector);
  this.waitForSelector(tipsSelector, nextClock, function() {
    this.echo('Taojinbi: sign fail');
    nextClock.call(this);

  });

};

function taojinbiClockon() {
  this.open("http://taojinbi.taobao.com/").then(function() {
    var loginInfoSelector = "li#J_LoginInfo";
    this.waitForSelector(loginInfoSelector, doTaojinbiClock, function() {
      this.echo("Taojinbi: login 404");
      nextClock.call(this);
    });
  });
};
// end

// wait for user input code
function wait4UserInputCode(cb) {
  var port = webServerPort;
  var self = this;
  while (!webService && !(webService = webserver.listen((webPort = port++), function(req, res) {
    if ('GET' == req.method) {
      var html = ['<html><body>'];
      html[html.length] = '<div>';
      html[html.length] = '<form method="post">';
      html[html.length] = '<table>';

      html[html.length] = '<tr>';
      html[html.length] = '<td colspan="2"><img src="data:image/'
        + captchaFormat
        + ';base64,'
        + self.captureBase64(captchaFormat, 'img#J_StandardCode_m') + '" /></td>';
      html[html.length] = '</tr>';

      html[html.length] = '<tr>';
      html[html.length] = '<td>code</td>';
      html[html.length] = '<td><input type="text" name="code" /></td>';
      html[html.length] = '</tr>';

      html[html.length] = '<tr>';
      html[html.length] = '<td colspan="2"><input type="submit" value="Submit" /></td>';
      html[html.length] = '</tr>';

      html[html.length] = '</table>';
      html[html.length] = '</form>';
      html[html.length] = '</div>';
      html[html.length] = '</body></html>';

      res.statusCode = 200;
      res.write(html.join(""));
      res.close();

    } else if ('POST' == req.method) {
      var code = req.post["code"];
      if (!code) {
        res.statusCode= 200
        res.write("<html><body>Input valid captcha, <a href='http://localhost:" + (--port) + "'>click here</a></body></html>");
        res.close();

      } else {
        res.statusCode= 200
        res.write("<html><body>code <strong>" + code + "</strong> copied!!!</body></html>");
        res.close();

        // call back
        cb.call(self, code);
      }

    }

  })));

  this.echo("Visit http://localhost:" + webPort + " to input captcha");
};

function nextClock() {
  this.emit(EV_TAOBAO_NEXT_SIGN_ON);
};

// listen on event
casperjs.on(EV_TAOBAO_NEXT_SIGN_ON, function() {
  if (curCallInx < calls.length) {
    calls[curCallInx++].call(this);
  } else {
    this.echo("All clocks is done!!!");
  }
});

casperjs.on(EV_TAOBAO_INPUT_NAME, function() {
  // input name
  this.sendKeys('form[id*="Form"] input[name="TPL_username"]', user);
  this.waitForResource(/^https:\/\/log\.mmstat\.com\/member.*$/ig, function() {
    // wait for nick check
    this.waitForResource(/.*member\/request_nick_check\.do.*$/, function() {
      this.emit(EV_TAOBAO_INPUT_PWD);
    }, function() {
      this.die('Taobao: username check not found.', 1);

    });

  }, function() {
    this.die('Taobao: username mmstat not found.', 1);

  });
  
});

casperjs.on(EV_TAOBAO_INPUT_PWD, function() {
  // input password
  this.sendKeys('form[id*="Form"] input[name="TPL_password"]', pwd);
  this.waitForResource(/^https:\/\/log\.mmstat\.com\/member.*$/ig, function() {
    this.emit(EV_TAOBAO_INPUT_CAPTCHA);

  }, function() {
    this.die('Taobao: userpwd mmstat not found.', 1);

  });
  
});

casperjs.on(EV_TAOBAO_INPUT_CAPTCHA, function() {
  // input captcha
  var form = 'form[id*="Form"]';
  if (!this.visible(form + ' div.field-checkcode')) {
    this.emit(EV_TAOBAO_LOGIN);
    return;
  }

  // check capcha
  wait4UserInputCode.call(this, function(code) {
    this.sendKeys(form + ' input[name="TPL_checkcode"]', code);

    this.waitForResource(/^https:\/\/log\.mmstat\.com\/member.*$/ig, function() {
      this.emit(EV_TAOBAO_LOGIN);

    }, function() {
      this.die('Taobao: captcha mmstat not found.', 1);

    });

  }); 
});

casperjs.on(EV_TAOBAO_LOGIN, function() {
  this.click('form[id*="Form"] button[type="submit"]');
  isLoginFin = 1;
});

// ===============================================================
// main entry
casperjs.start("http://www.taobao.com/");
  
// click to redirect
var redirectBtnSelector = 'div#J_SiteNav li#J_LoginInfo a.h';
// wait for captcha code
casperjs.waitForSelector(redirectBtnSelector, function() {
  this.mouse.move(redirectBtnSelector);
  this.mouse.click(redirectBtnSelector);
}, function() {
  this.die('Taobao: login button not found', 1);
});
  
// wait for login page
casperjs.waitForResource(/^https.*\/member\/login.jhtml.*$/ig, function() {
  this.emit(EV_TAOBAO_INPUT_NAME);
}, function() {
  this.die('Taobao: login page not found', 1);
});

function wait4Login() {
  this.waitFor(function() {
    return 1 == isLoginFin;
  }, function() {}, wait4Login, 10000);
};

wait4Login.call(casperjs);

casperjs.waitForSelector("li#J_LoginInfo", nextClock, function() {
  var messageSelector = "div#J_Message";
  this.capture('/mnt/taobao_login_fail.png');
  if (this.visible(messageSelector)) {
    var errText = this.fetchText(messageSelector + " > p.error");
    this.die("Taobao: " + errText, 1);

  } else {
    this.die("Taobao: login fail, please check file@taobao_login_fail.png", 1);

  }

});

casperjs.run();
