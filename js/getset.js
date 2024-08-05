
// JavaScript to be used in all extensions possibly!

var logging = false;

// Async function to set an item in chrome.storage.local
async function setItem(key, value) {
	try {
		log("Inside setItem: " + key + ": " + value);

		// Remove the item from chrome.storage.local first (if necessary)
		await chrome.storage.local.remove(key);

		// Set the item in chrome.storage.local
		await chrome.storage.local.set({ [key]: value });
	} catch (e) {
		log("Error inside setItem");
		log(e);
	}
	log("Return from setItem " + key + ": " + value);
}

// Async function to get an item from chrome.storage.local
async function getItem(key) {
	log("Get Item: " + key);
	try {
		const result = await chrome.storage.local.get(key);
		const value = result[key] !== undefined ? result[key] : "null";

		log("Returning value: " + value);
		return value;
	} catch (e) {
		log("Error inside getItem() for key: " + key);
		log(e);
		return "null";
	}
}

// Async function to clear all items from chrome.storage.local
async function clearStrg() {
	log("About to clear chrome.storage.local");
	try {
		await chrome.storage.local.clear();
		log("Cleared");
	} catch (e) {
		log("Error clearing storage");
		log(e);
	}
}

function log(txt) {
	if (logging) {
		console.log(txt);
	}
}
