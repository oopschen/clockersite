var casperjs = require("casper").create({
  pageSettings: {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
    loadImages: true,  
    loadPlugins: true  
  },
  /*
  logLevel: "debug",
  verbose: true,
  */
  viewportSize: {width: 1280, height:800},  
  waitTimeout: 1600  
});

var webserver = require('webserver').create(),
    webServerPort = 7777,
    captchaFormat = 'jpeg',
    webService;

// parse parameters
var cmdArgs = casperjs.cli.args, user, pwd;
if (2 > cmdArgs.length) {
  casperjs.die("Need args: username password", 1);
}

user = cmdArgs[0];
pwd = cmdArgs[1];
var nextEventName = 'taobao.nexte';
var calls = [xiamiClockon, taojinbiClockon], curCallInx = 0;
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
  while (!(webService = webserver.listen(port++, function(req, res) {
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

        self.unwait();
        // call back
        cb.call(self, code);


      }

    }

  })));

  this.echo("Visit http://localhost:" + (port - 1) + " to input captcha, you have 10 seconds");
  this.wait(10000);

};

function nextClock() {
  this.emit(nextEventName);
};

function afterLoginCallback() {
  this.waitForSelector("li#J_LoginInfo", nextClock, function() {
    var messageSelector = "div#J_Message";
    if (this.visible(messageSelector)) {
      this.die("Taobao: " + this.fetchText(messageSelector + " > p.error"), 1);
    } else {
      this.capture('/mnt/taobao_login_fail.png');
      this.die("Taobao: login fail, please check file@taobao_login_fail.png", 1);

    }

  });

};
  
// listen on event
casperjs.on(nextEventName, function() {
  if (curCallInx < calls.length) {
    calls[curCallInx++].call(this);
  } else {
    this.echo("All clocks is done!!!");
  }
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
  this.die('Login button not found', 1);
});
  
casperjs.waitForResource(/^https.*\/member\/login.jhtml.*$/ig, function() {
  var form = "form#J_StaticForm";
  var args = {  
    'TPL_password': pwd
  };

  if (this.exists('form#J_Form')) {
    form = "form#J_Form";
  } else {
    args['TPL_username'] = user;

  }

  this.fill(form, args, false);

  // check nick url
  this.waitForResource(/^https:\/\/log\.mmstat\.com\/member.*$/ig, function() {}, function() {
    this.die('Taobao: log memeber url not found', 1);
  });
  // wait for nick check
  this.waitForResource(/.*member\/request_nick_check\.do.*$/, function() {}, function() {
    this.die('Taobao: nick check resource not found', 1);
  });

  this.waitUntilVisible(form + " div.field-checkcode", function() {
    // check capcha
    wait4UserInputCode.call(this, function(code) {
      var checkCodeSelector = form + ' input[name="TPL_checkcode"]';
      this.waitForSelector(checkCodeSelector, function() {
        this.sendKeys(checkCodeSelector, code);
        this.click(form + ' button[type="submit"]');
        afterLoginCallback.call(this);

      }, function() {
        this.die('Taobao: captcha code input not found', 1);

      });

    });
  }, function() {
    this.click(form + ' button[type="submit"]');
    afterLoginCallback.call(this);

  });

}, function() {
  this.die('Go to login page', 1);
});

casperjs.run();