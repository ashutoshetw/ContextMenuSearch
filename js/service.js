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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reload') {
        loadContextMenuItems();
        sendResponse({ status: 'success' });
    }
});

async function migrateToStorageLocal(data) {
    chrome.storage.local.set(data)
}

async function loadContextMenuItems() {
    console.log("loadContextMenuItems called")

    console.log("Clearing existing items")
    await new Promise((resolve) => {
        chrome.contextMenus.removeAll(() => {
            console.log('All context menu items have been removed.');
            resolve();
        });
    });

    const allData = await getAllData()

    console.log("loadContextMenuItems data = ", allData)

    _all = JSON.parse(allData._allSearch);

    numentries = _all?.length ?? 0;

    console.log(_all)
    console.log(numentries)

    for (var i = 0; i < numentries; i++) {
        if (_all[i][3]) {
            _all[i][0] = chrome.contextMenus.create({ id: _all[i][2], "title": _all[i][1], "contexts": ["selection"] });
        }
        else _all[i][0] = -1;
    }

    var ask_options = true;

    if (ask_options) {
        //show separator
        chrome.contextMenus.create({ id: "separator", "type": "separator", "contexts": ["selection"] });
        //show the item for linking to extension options
        chrome.contextMenus.create({ id: "options.html", "title": "Options", "contexts": ["selection"] });
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

async function searchOnClick(menuInfo, tab) {
    console.log(menuInfo)
    console.log(tab)

    var ask_fg = await getItem("_askBg") == true ? false : true;
    var ask_next = await getItem("_askNext") == true ? true : false;

    var targetURL = menuInfo.menuItemId;
    targetURL = targetURL.replace("%s", menuInfo.selectionText);
    targetURL = targetURL.replace("TESTSEARCH", menuInfo.selectionText);

    console.log("Foreground = ", ask_fg)
    console.log("Next = ", ask_next)

    if (ask_next) {
        index = tab.index + 1;
        chrome.tabs.create({ "url": targetURL, "active": ask_fg, "index": index });
    } else {
        chrome.tabs.create({ "url": targetURL, "active": ask_fg });
    }
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