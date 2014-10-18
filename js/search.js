var _all;
var numentries;

var newBuildNumber = 293;
setItem("_buildNumber", newBuildNumber);

function updatemenu()
{
	chrome.contextMenus.removeAll();
	
	var searchstring = getItem("_allsearch");
	
	if(searchstring==null)
	{
		setItem("_askbg","false");
		setItem("_asknext", "true");
		setItem("_askoptions", "true");
		
		_all = new Array(5);
		
		// 0th item in the array is reserved for context menu item id
		
		_all[0] = new Array(4);
		_all[0][1] = "Bing"; // Display label
		_all[0][2] = "http://www.bing.com/search?q=TESTSEARCH"; // Link
		_all[0][3] = true; // whether this option is enabled or not

		_all[1] = new Array(4);
		_all[1][1] = "Bing Images";
		_all[1][2] = "http://www.bing.com/images/search?q=TESTSEARCH";
		_all[1][3] = true;

		_all[2] = new Array(4);
		_all[2][1] = "IMDB";
		_all[2][2] = "http://www.imdb.com/find?s=all&q=TESTSEARCH";
		_all[2][3] = true;

		_all[3] = new Array(4);
		_all[3][1] = "Wikipedia";
		_all[3][2] = "http://en.wikipedia.org/wiki/Special:Search?search=TESTSEARCH&go=Go";
		_all[3][3] = true;

		_all[4] = new Array(4);
		_all[4][1] = "Yahoo!";
		_all[4][2] = "http://search.yahoo.com/search?vc=&p=TESTSEARCH";
		_all[4][3] = true;
		
		numentries = 5;
		
		var stringified = JSON.stringify(_all);
		setItem("_allsearch", stringified);		
	}
	else
	{
		_all = JSON.parse(searchstring);

		numentries = _all.length;
	}
		//alert(_all);

	for(var i=0; i<numentries; i++)
	{
		//alert(_all[i][3]);
		if(_all[i][3])
		{
			_all[i][0] = chrome.contextMenus.create({"title": _all[i][1], "contexts":["selection"], "onclick": searchOnClick});
			//alert("Menuitem created");
		}
		else _all[i][0] = -1;
	}
	
	var ask_options = getItem("_askoptions")=="true"? true : false;
	
	if(ask_options){
		//show separator
		chrome.contextMenus.create({"type": "separator", "contexts":["selection"]});
		//show the item for linking to extension options
		chrome.contextMenus.create({"title": "Options", "contexts":["selection"], "onclick": function(){chrome.tabs.create({"url":"options.html"});}});
	}
}

function searchOnClick(info, tab) 
{
	var itemindex = 0;
	for(var i=0; i<numentries; i++)
	{
		if(info.menuItemId == _all[i][0])
		{
			//alert(i);
			itemindex = i;
		}
	}
	var ask_fg = getItem("_askbg")=="true"? false : true;
	var ask_next = getItem("_asknext")=="true"? true : false;
	var index = 1000;
	
	var targetURL = _all[itemindex][2].replace("TESTSEARCH", info.selectionText);
	targetURL = targetURL.replace("%s", info.selectionText);
	
	if(ask_next)
	{
		chrome.tabs.getSelected(null, function(tab){
										index = tab.index + 1;
										chrome.tabs.create({"url":targetURL, "selected":ask_fg, "index":index});
										});
	}
	else
	{
		chrome.tabs.create({"url":targetURL, "selected":ask_fg});
	}
}

updatemenu();

// End of file;
