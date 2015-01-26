// Package clocker provides clocker on for http://www.xiami.com
package clocker

import (
	"encoding/json"
	"fmt"
	"github.com/oopschen/clocksite/sys"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var (
	signInResPattern *regexp.Regexp
)

func init() {
	pattern, err := regexp.Compile(`[0-9]+`)
	if nil != err {
		sys.Logger.Printf("sign in pattern compile: %s\n", err)
		return
	}

	signInResPattern = pattern
}

type XiamiClocker struct {
	err    error
	client *http.Client
}

type XiamiError struct {
	msg string
}

type jsonUserInfo struct {
	Is int
}

type jsonDataInfo struct {
	UserInfo jsonUserInfo
}

type jsonHomeInfo struct {
	Data jsonDataInfo
}

func (e *XiamiError) Error() string {
	return e.msg
}

func (c *XiamiClocker) Login(acc *Account) bool {
	/*
		1. visit main page get some cookies
		2. post to login url
		3. check result
	*/
	var err error
	// set error when quit
	defer func() {
		if nil != err {
			c.err = err
		}

	}()

	// init cookie jar
	cJar, err := cookiejar.New(nil)
	if nil != err {
		return false
	}

	c.client = &http.Client{
		Jar: cJar,
	}

	// index page
	indexURL := "http://www.xiami.com/"
	xiamiTokenCookieName := "_xiamitoken"
	resp, err := c.client.Get(indexURL)
	if nil != err {
		return false
	}
	resp.Body.Close()

	xiamiToken := c.findCookieByName(indexURL, xiamiTokenCookieName)
	if nil == xiamiToken {
		err = &XiamiError{msg: "xiami token 404"}
		return false
	}

	// login page
	loginUrl := fmt.Sprintf("https://login.xiami.com/member/login?callback=jQuery%d", time.Now().UnixNano())
	postData := url.Values{}
	postData.Add(xiamiTokenCookieName, xiamiToken.Value)
	postData.Add("done", "http%3A%2F%2Fwww.xiami.com")
	postData.Add("from", "web")
	postData.Add("email", acc.Username)
	postData.Add("password", acc.Userpasswd)
	postData.Add("submit", "登+录")

	resp, err = c.client.PostForm(loginUrl, postData)
	if nil != err {
		return false
	}

	defer resp.Body.Close()

	if 200 != resp.StatusCode {
		err = &XiamiError{msg: fmt.Sprintf("login: code=%d", resp.StatusCode)}
		return false
	}

	if nil == c.findCookieByName(indexURL, "user") {
		err = &XiamiError{msg: "login: cookie user 404"}
		return false
	}

	return true
}

func (c *XiamiClocker) ClockOn() bool {
	/*
		1. visit home info
		2. parse json value data.userinfo.is from http://www.xiami.com/index/home
		3. if is == 1 then already clock on
		4. http://www.xiami.com/task/signin  post
	*/
	var (
		homeURL = "http://www.xiami.com/index/home"
		err     error
	)

	defer func() {
		if nil != err {
			c.err = err
		}
	}()

	// visit home
	resp, err := c.client.Get(homeURL)
	if nil != err {
		return false
	}

	defer resp.Body.Close()

	if 200 != resp.StatusCode {
		err = &XiamiError{msg: fmt.Sprintf("get home: code=%d", resp.StatusCode)}
		return false
	}

	// parse json
	isClockOn, err := parseIsClockOn(resp.Body)
	if isClockOn {
		sys.Logger.Printf("Already clock on\n")
		return true
	}

	sys.Logger.Printf("Clock on ING....\n")
	// post sign
	respSign, err := c.client.PostForm("http://www.xiami.com/task/signin", nil)
	if nil != err {
		return false
	}

	defer respSign.Body.Close()
	if 200 != respSign.StatusCode {
		err = &XiamiError{msg: fmt.Sprintf("task signin: code=%d", resp.StatusCode)}
		return false
	}

	body, err := ioutil.ReadAll(respSign.Body)
	if nil != err {
		return false
	}

	bodyStr := string(body)
	if signInResPattern.MatchString(bodyStr) {
		sys.Logger.Printf("you have already sign in for %s days\n", bodyStr)
		return true
	}

	sys.Logger.Printf("Sign in error: body=%s, resp=%#v\n", bodyStr, respSign)
	return false
}

func (c *XiamiClocker) Error() error {
	return c.err
}

func (c *XiamiClocker) findCookieByName(domain, name string) *http.Cookie {
	cookieUrl, err := url.Parse(domain)
	if nil != err {
		c.err = err
		return nil
	}

	cookies := c.client.Jar.Cookies(cookieUrl)
	if nil == cookies {
		return nil
	}

	queryName := strings.ToLower(name)
	for _, co := range cookies {
		if strings.ToLower(co.Name) == queryName {
			return co
		}
	}
	return nil
}

func parseIsClockOn(r io.Reader) (bool, error) {
	decoder := json.NewDecoder(r)
	res := &jsonHomeInfo{}
	err := decoder.Decode(res)
	if nil != err {
		return false, err
	}

	return res.Data.UserInfo.Is == 1, nil
}
