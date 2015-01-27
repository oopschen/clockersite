// Package main provides main entry for clocker project.
// Usage:
// clocker -u username -p userpwd sitename
package main

import (
	"flag"
	"fmt"
	"github.com/oopschen/clocksite/clocker"
	"github.com/oopschen/clocksite/sys"
	"strings"
)

func main() {
	var (
		username, userpwd string
		isHelp            bool
	)

	flag.StringVar(&username, "u", "", "user name for site")
	flag.StringVar(&userpwd, "p", "", "user password for site")
	flag.BoolVar(&isHelp, "h", false, "show help")
	flag.Parse()

	if isHelp {
		printHelp()
		return
	}

	if "" == username {
		fmt.Printf("user name can not be null\n")
		printHelp()
		return
	}

	if "" == userpwd {
		fmt.Printf("user password can not be null\n")
		printHelp()
		return
	}

	remainArgs := flag.Args()
	if nil == remainArgs || 1 > len(remainArgs) {
		fmt.Printf("site name can not be found\n")
		printHelp()
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

func printHelp() {
	fmt.Printf("Help user to clock on at site.\n\tUsage:\n\t\tclocksite -u user -p pwd sitename\n\tSupport site names: xiami\n")
}
