#node-blanky

##What's this?
`blanky` helps to check empty value from every passed properties. If ANY value is `undefined`, `null` or `''`(no string) blanky will pass `true`.

##Install
	npm install blanky

##Example
```js
var blanky = require('blanky');

blanky(32, 'str', ''); //=> true
blanky(32, 'str'); //=> false
```
##Contributing
Free to push!

##License
MIT
