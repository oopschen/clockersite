// Package main provides main entry for clocker project.
// Usage:
// clocker -u username -p userpwd sitename
package main

import (
	"flag"
	"github.com/oopschen/clocksite/clocker"
	"github.com/oopschen/clocksite/sys"
	"strings"
)

func main() {
	var (
		username, userpwd string
	)

	flag.StringVar(&username, "u", "", "user name for site")
	flag.StringVar(&userpwd, "p", "", "user password for site")
	flag.Parse()

	if "" == username {
		sys.Logger.Printf("user name can not be null\n")
		return
	}

	if "" == userpwd {
		sys.Logger.Printf("user password can not be null\n")
		return
	}

	remainArgs := flag.Args()
	if nil == remainArgs || 1 > len(remainArgs) {
		sys.Logger.Printf("site name can not be found\n")
		return
	}

	siteName := remainArgs[0]
	acc := &clocker.Account{
		Username:   username,
		Userpasswd: userpwd,
	}

	processClockerAction(strings.ToLower(siteName), acc)
}

func processClockerAction(siteName string, acc *clocker.Account) {
	var clk clocker.Clocker
	switch {
	case "xiami" == siteName:
		clk = &clocker.XiamiClocker{}
		break
	default:
		sys.Logger.Printf("site name (%s) no supported\n", siteName)
		return
	}

	if !clk.Login(acc) {
		sys.Logger.Printf("Login: %s\n", clk.Error())
		return
	}

	if !clk.ClockOn() {
		sys.Logger.Printf("Clock: %s\n", clk.Error())
		return
	}

	sys.Logger.Printf("Clock: Success\n")
}
