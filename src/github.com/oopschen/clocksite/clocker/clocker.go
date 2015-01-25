// Package clocker provides clocker on functionality for sites
package clocker

type Account struct {
	Username, Userpasswd string
}

type Clocker interface {
	// login in
	Login(acc *Account) bool

	/**
	* <p>clock on at the site</p>
	* @return true if success, otherwise false
	 */
	ClockOn() bool

	/**
	* <p>if error occurs return the error object</p>
	* @return error object
	 */
	Error() error
}
