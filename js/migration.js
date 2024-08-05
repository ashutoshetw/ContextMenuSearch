
function fillSampleData() {
    localStorage.setItem("_asknext", true)
    localStorage.setItem("_askoptions", true)
    localStorage.setItem("_askbg", false)

    var searchItems = '[["-1","YouTube","http://www.youtube.com/results?search_query=TESTSEARCH",true],["-1","Bing","http://www.bing.com/search?q=TESTSEARCH",true],["-1","Bing Images","http://www.bing.com/images/search?q=TESTSEARCH",true],["-1","IMDB","http://www.imdb.com/find?s=all&q=TESTSEARCH",true],["-1","Wikipedia","http://en.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go",true],["-1","Yahoo!","http://search.yahoo.com/search?vc=&p=TESTSEARCH",true],["-1","Maps","https://www.google.com/maps/search/TESTSEARCH",true]]'
    localStorage.setItem("_allsearch", searchItems)
}

// Migration routine
function getLocalStorageData() {
    console.log("getLocalStorageData started")

    if(localStorage.getItem('_allsearch') == null) {
        console.log("getLocalStorageData filling sample data")
        fillSampleData()
    }

    // Access localStorage data
    const allSearch = localStorage.getItem('_allsearch');
    const asknext = localStorage.getItem('_asknext');
    const askoptions = localStorage.getItem('_askoptions');
    const askbg = localStorage.getItem('_askbg');
  
    // Create an object to store data for migration
    const dataToMigrate = {
      _allSearch: allSearch,
      _askNext: asknext,
      _askOptions: askoptions,
      _askBg: askbg
    };

    return dataToMigrate
}

// Listen for messages from the service worker to start the migration
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startMigration') {
        sendResponse({ status: 'success', data: getLocalStorageData()});
        return true; // Indicates that we will send a response asynchronously
    }
});

console.log("Migration JS loaded")
