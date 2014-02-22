
// JavaScript to be used in all extensions possibly!

var logging  = false;

function setItem(key, value) {
	try {
		log("Inside setItem:" + key + ":" + value);
		window.localStorage.removeItem(key);
		window.localStorage.setItem(key, value);
	}catch(e) {
		log("Error inside setItem");
		log(e);
	}
	log("Return from setItem" + key + ":" +  value);
}
function getItem(key) {
	var value;
	log('Get Item:' + key);
	try {
		value = window.localStorage.getItem(key);
	}catch(e) {
		log("Error inside getItem() for key:" + key);
		log(e);
		value = "null";
	}
	log("Returning value: " + value);
	return value;
}

function clearStrg() {
	log('about to clear local storage');
	window.localStorage.clear();
	log('cleared');
}

function log(txt) {
	if(logging) {
		console.log(txt);
	}
}
