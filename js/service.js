chrome.runtime.onInstalled.addListener(async () => {
    // Check if data exists in chrome.storage.local
    chrome.storage.local.get((result) => {
        console.log('Got storage.local ', result);
        if (chrome.runtime.lastError || !result._allSearch || (result._allSearch?.length ?? 0) < 1) {
            // If data is not found, create the offscreen document and trigger migration
            chrome.offscreen.createDocument({
                url: chrome.runtime.getURL('background.html'),
                reasons: ['LOCAL_STORAGE'],
                justification: 'Migrating data from localStorage to chrome.storage.local',
            }).then(() => {
                console.log('Offscreen document created successfully.');
                chrome.runtime.sendMessage({ action: 'startMigration' }, (response) => {
                    console.log("Response ", response);
                    migrateToStorageLocal(response.data)
                    loadContextMenuItems();
                });
            }).catch(error => {
                console.error('Failed to create offscreen document:', error);
            });
        } else {
            loadContextMenuItems();
        }
    });
});

chrome.storage.onChanged.addListener((changes) => {
    loadContextMenuItems()
});

async function migrateToStorageLocal(data) {
    chrome.storage.local.set(data)
}

// trying to ensure loadContextMenuItems calls are not overlapping
// they can overlap if there are storage changes in quick succession
let isExecutingLoadContextMenuItems = false;
let loadContextMenuItemsQueue = [];

async function loadContextMenuItems() {
    if (isExecutingLoadContextMenuItems) {
        return new Promise((resolve, reject) => {
            loadContextMenuItemsQueue.push({ resolve, reject });
        });
    }

    isExecutingLoadContextMenuItems = true;

    try {
        console.log("loadContextMenuItems called");

        console.log("Clearing existing items");
        await new Promise((resolve) => {
            chrome.contextMenus.removeAll(() => {
                console.log('All context menu items have been removed.');
                resolve();
            });
        });

        const allData = await getAllData();

        console.log("loadContextMenuItems data = ", allData);

        _all = JSON.parse(allData._allSearch);

        numentries = _all?.length ?? 0;

        console.log(_all);
        console.log(numentries);

        for (var i = 0; i < numentries; i++) {
            if (_all[i][3]) {
                if (_all[i][1] == "" && _all[i][2] == "") {
                    //show separator
                    chrome.contextMenus.create({ id: i.toString(), "type": "separator", "contexts": ["selection"] });
                } else {
                    _all[i][0] = chrome.contextMenus.create({ id: _all[i][2], "title": _all[i][1], "contexts": ["selection"] });
                }
            }
            else _all[i][0] = -1;
        }

        var ask_options = looseCompareBooleanOrStrings(await getItem("_askOptions"), true);

        if (ask_options) {
            //show separator
            chrome.contextMenus.create({ id: "separator", "type": "separator", "contexts": ["selection"] });
            //show the item for linking to extension options
            chrome.contextMenus.create({ id: "options.html", "title": "Options", "contexts": ["selection"] });
        }
    } catch (error) {
        console.error('Error in loadContextMenuItems:', error);
    } finally {
        isExecutingLoadContextMenuItems = false;
        if (loadContextMenuItemsQueue.length > 0) {
            const nextCall = loadContextMenuItemsQueue.shift();
            loadContextMenuItems().then(nextCall.resolve).catch(nextCall.reject);
        }
    }
}

async function getAllData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get((result) => {
            // The result is an object containing the keys and their values
            if (chrome.runtime.lastError) {
                console.log("getAllData error ", chrome.runtime.lastError)
                reject(chrome.runtime.lastError); // Reject the promise if there's an error
            } else {
                console.log("getAllData success ", result)
                resolve(result); // Resolve the promise with the result object
            }
        });
    });
}

chrome.contextMenus.onClicked.addListener(searchOnClick)

function replaceAllInstances(text, searchValue, replaceValue) {
    const regex = new RegExp(searchValue, 'g');
    return text.replace(regex, replaceValue);
}

function splitBySpace(text) {
    return text.split(" ");
}

function looseCompareBooleanOrStrings(a, b) {
    return a.toString().toLowerCase() === b.toString().toLowerCase();
}

async function searchOnClick(menuInfo, tab) {
    console.log(menuInfo)
    console.log(tab)

    var ask_fg = !looseCompareBooleanOrStrings(await getItem("_askBg"), true);
    var ask_next = looseCompareBooleanOrStrings(await getItem("_askNext"), true);

    console.log("Foreground = ", ask_fg)
    console.log("Next = ", ask_next)

    const configuredLink = menuInfo.menuItemId;

    // split
    const split = splitBySpace(configuredLink);

    // loop on the output
    split.forEach((item) => {
        // open the link
        var targetURL = item;
        var encodedText = encodeURIComponent(menuInfo.selectionText);

        // replace the search term in the URL without encoding for %S
        targetURL = replaceAllInstances(targetURL, "NOENCODESEARCH", menuInfo.selectionText);

        // replace the search term in the URL with encoding for %s and TESTSEARCH
        targetURL = replaceAllInstances(targetURL, "%s", encodedText);
        targetURL = replaceAllInstances(targetURL, "TESTSEARCH", encodedText);

        chrome.tabs.create({
            url: targetURL,
            active: ask_fg,
            index: ask_next ? tab.index + 1 : undefined,
            openerTabId: tab.id
         });
    });
}

// Async function to get an item from chrome.storage.local
async function getItem(key) {
    try {
        const result = await chrome.storage.local.get(key);
        const value = result[key] !== undefined ? result[key] : "null";
        return value;
    } catch (e) {
        return "null";
    }
}