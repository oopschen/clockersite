// Package clocker provides clocker on for http://www.xiami.com
package clocker

import (
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"
)

type XiamiClocker struct {
	err    error
	client *http.Client
}

type XiamiError struct {
	msg string
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

// TODO
func (c *XiamiClocker) ClockOn() bool {
	return true
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
