module.exports = function () {
	var i;
	var len = arguments.length;
	
	for (i = 0; i < len; i++) {
		var v = arguments[i];
		
		if (v === undefined || v === null || v === '') {
			return true;
		} else {
			return false;
		}
	}
}
