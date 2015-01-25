// Package clocker provides clocker on for http://www.xiami.com
package clocker

import (
	_ "github.com/oopschen/clocksite/sys"
)

type XiamiClocker struct {
	acc Account
	err error
}

// TODO
func (c *XiamiClocker) Login(acc *Account) bool {
	/*
		1. visit main page get some cookies
		2. post to login url
		3. check result
	*/
	return true
}

// TODO
func (c *XiamiClocker) ClockOn() bool {
	return true
}

// TODO
func (c *XiamiClocker) Error() error {
	return nil
}
