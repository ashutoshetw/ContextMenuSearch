async function initialise(){
	showpage(1);
	await restore_options();
}

chrome.storage?.onChanged?.addListener(async (changes) => {
    await restore_options();
});

function showToast(message, isError = false) {
    var toast = document.getElementById("toast");
    toast.className = isError ? "showError" : "show";
    toast.innerHTML = message;
    setTimeout(function() { toast.className = toast.className.replace(isError ? "showError" : "show", ""); }, 3000);
}

async function save_import()
{
	await setItem("_allSearch", document.getElementById("exporttext").value);
	var status = document.getElementById("status_import");

	showToast("New Configuration Imported");
}

async function save_otheroptions()
{	
	var ask_bg = document.getElementById("ask_bg").checked;
	var ask_next = document.getElementById("ask_next").checked;
	var ask_options = document.getElementById("ask_options").checked;

	await setItem("_askBg", ask_bg);
	await setItem("_askNext", ask_next);
	await setItem("_askOptions", ask_options);
	
	var status = document.getElementById("status_otheroptions");

	showToast("Options Saved");
}

async function save_options()
{
	var optionsList = document.getElementById("options_list_ul");
	var maxindex = optionsList.childElementCount;
	var _all = new Array(maxindex);
	
	for(var i=0; i<maxindex;i++)
	{
		curnum = optionsList.children[i].getAttribute('index');
		var itemNode = optionsList.children[i];

		const title = itemNode.querySelector("#listItemName"+curnum)?.value ?? "";
		const link = itemNode.querySelector("#listItemLink"+curnum)?.value ?? "";
		var isEnabled = itemNode.querySelector("#listItemEnab"+curnum)?.checked ?? false;
		const isSubmenu = itemNode.querySelector("#listItemSubmenu"+curnum) != null;
		const isGroup = itemNode.querySelector("#listItemGroup"+curnum) != null;

		const type = isSubmenu ? "1" : isGroup ? "0" : "-1";

        _all[i] = new Array(4);
        _all[i][0] = type;
        _all[i][1] = title;
        _all[i][2] = link;
        _all[i][3] = isEnabled;
	}

	var valid = validate_settings(_all);

	if(valid) {
        var stringified = JSON.stringify(_all);
        await setItem("_allSearch", stringified);

        var ask_bg = document.getElementById("ask_bg").checked;
        var ask_next = document.getElementById("ask_next").checked;

        await setItem("_askBg", ask_bg);
        await setItem("_askNext", ask_next);

        var status = document.getElementById("status");

        showToast("Options Saved");
    }
}

function validate_settings(allSearch) {
    // Initialize isValid to true and errorMessage to an empty string
    let isValid = true;
    let errorMessage = "";
    var itemWithError = -1;
    var itemNameWithError = "";

    // Loop through each item in allSearch
    for (let i = 0; i < allSearch.length; i++) {
        itemWithError = i;
        const item = allSearch[i];

        // Check if the item is an array and has exactly 4 elements
        if (!Array.isArray(item) || item.length !== 4) {
            isValid = false;
            errorMessage = "Invalid item structure.";
            break;
        }

        const [type, title, link, isEnabled] = item;

        itemNameWithError = title;

        // Check if the first element is one of the valid types ("-1", "0", "1")
        if (!["-1", "0", "1"].includes(type)) {
            isValid = false;
            errorMessage = "Invalid type.";
            break;
        }

        // Check if the third element (link) is a non-empty string
        if (typeof link == 'string' && link.trim() !== "") {
            // Check title only if the link is a valid string
            // Check if the second element (title) is a non-empty string
            if (typeof title !== 'string' || title.trim() === "") {
                isValid = false;
                errorMessage = "Empty display label is not allowed";
                break;
            }
        }

        // Check if the fourth element (isEnabled) is a boolean
        if (typeof isEnabled !== 'boolean') {
            isValid = false;
            errorMessage = "Invalid isEnabled value.";
            break;
        }

        // Check if item with type "1" is preceded by either item of type "0" or item of type "1"
        if (type === "1") {
            if (i === 0) {
                isValid = false;
                errorMessage = "A submenu item should be placed below a Group or another submenu item.";
                break;
            } else {
                const prevType = allSearch[i - 1][0];
                if (!["0", "1"].includes(prevType)) {
                    isValid = false;
                    errorMessage = "A submenu item should be placed below a Group or another submenu item.";
                    break;
                }
            }
        }
    }

    if (!isValid) {
        showToast(`Error in item ${itemWithError + 1} ${itemNameWithError}: ${errorMessage}`, true);
    }

    return isValid;
}

async function restore_options() 
{
	var optionsList = document.getElementById("options_list_ul");
	optionsList.innerHTML = "";
	var stringified = await getItem("_allSearch");
	
	document.getElementById("exporttext").value = stringified;
	var parsedArray = JSON.parse(stringified) || [];
	
	for(var i=0;i<parsedArray.length;i++)
	{
	    const item = parsedArray[i];

	    if(item && item.length == 4 && item[0] == "0") {
            add_group(item);
        } else if(item && item.length == 4 && item[0] == "1") {
            add_submenuitem(item);
        } else if(item && item.length == 4 && item[1] != "" && item[2] != "") {
	        add_item(item);
	    } else {
	        add_separator(item);
	    }
	}
	
	var ask_bg = await getItem("_askBg");
	var ask_next = await getItem("_askNext");
	var ask_options = await getItem("_askOptions");

	console.log(ask_bg)

	if(ask_bg==true) document.getElementById("ask_bg").checked = "true";
	if(ask_next==true) document.getElementById("ask_next").checked = "true";
	if(ask_options==true) document.getElementById("ask_options").checked = "true";

    const old_search_items = window.localStorage.getItem("_allsearch");
	document.getElementById("exporttext_old").value = old_search_items;
}

function remove(j)
{
	var listOfSearchOptions = document.getElementById("options_list_ul");
	var listItemToRemove = document.getElementById("listItem"+j);
	console.log("Removing item with index: " + j, listItemToRemove);
	listOfSearchOptions.removeChild(listItemToRemove);
}

function createListItem(curnum, innerContent) {
    var newListItem = document.createElement('li');
    newListItem.setAttribute('index', curnum);
    newListItem.setAttribute('id', 'listItem' + curnum);

    var innerHTML = `
        <div align='center'>
            <div class='dragIcon' style='width:20px;'></div>
            ${innerContent}
            <input type='checkbox' class='checkStyle' id='listItemEnab${curnum}' style='width:40px;'}>
            <button index='${curnum}' class='removeButtonStyle' id='listItemRemoveButton${curnum}' style='width:40px;'>X</button>
        </div>
    `;
    newListItem.innerHTML = innerHTML;

    // Add event listener to the remove button
    newListItem.querySelector(`#listItemRemoveButton${curnum}`).addEventListener('click', function(event) {
        var index = event.target.getAttribute('index');
        remove(index);
    });

    return newListItem;
}

function add_item(item) {
    var optionsList = document.getElementById('options_list_ul');
    var curnum = optionsList.childElementCount;
    const innerHTML = `
          <input type='text' class='listItemName' id='listItemName${curnum}' size='20' maxlength='30'>
          <input type='text' class='listItemLink' id='listItemLink${curnum}' size='80' maxlength='200'>
      `;
    var newListItem = createListItem(curnum, innerHTML);
    optionsList.appendChild(newListItem);

    // Set data to the new list item using querySelector
    newListItem.querySelector("#listItemName" + curnum).value = item[1];
    newListItem.querySelector("#listItemLink" + curnum).value = item[2];
    if (item[3]) newListItem.querySelector("#listItemEnab" + curnum).checked = item[3];
}

function add_separator(item) {
    var optionsList = document.getElementById('options_list_ul');
    var curnum = optionsList.childElementCount;
    const innerHTML = `
          <hr style='width:138px;'></hr>
          <hr style='width:458px;'></hr>
      `;
    var newListItem = createListItem(curnum, innerHTML);
    optionsList.appendChild(newListItem);

    item = item || ["-1", "", "", true];

    // Set data to the new list item using querySelector
    if (item[3]) newListItem.querySelector("#listItemEnab" + curnum).checked = item[3];
}

function add_group(item) {
    var optionsList = document.getElementById('options_list_ul');
    var curnum = optionsList.childElementCount;
    const innerHTML = `
          <input type='text' class='listItemName' id='listItemName${curnum}' size='20' maxlength='30'/>
          <p id='listItemGroup${curnum}' style='width:460px;' class='listItemLink'>Submenu items below this will show up in a submenu</p>
      `;
    var newListItem = createListItem(curnum, innerHTML);
    optionsList.appendChild(newListItem);

    item = item || ["-1", "Group Name", "", true];

    // Set data to the new list item using querySelector
    newListItem.querySelector("#listItemName" + curnum).value = item[1];
    if (item[3]) newListItem.querySelector("#listItemEnab" + curnum).checked = item[3];
}

function add_submenuitem(item) {
    var optionsList = document.getElementById('options_list_ul');
    var curnum = optionsList.childElementCount;
    const innerHTML = `
          <img id='listItemSubmenu${curnum}' height="20px" width="20px" src="css/submenu.svg">
          <input type='text' class='listSubItemName' id='listItemName${curnum}' size='20' maxlength='30'/>
          <input type='text' class='listItemLink' id='listItemLink${curnum}' size='80' maxlength='200'>
      `;
    var newListItem = createListItem(curnum, innerHTML);
    optionsList.appendChild(newListItem);

    item = item || ["-1", "Submenu Label", "Submenu Link", true];

    // Set data to the new list item using querySelector
    newListItem.querySelector("#listItemName" + curnum).value = item[1];
    newListItem.querySelector("#listItemLink" + curnum).value = item[2];
    if (item[3]) newListItem.querySelector("#listItemEnab" + curnum).checked = item[3];
}

async function add_option()
{
	var nname = document.getElementById("newname").value;
	var nlink = document.getElementById("newlink").value;

	var stringified = await getItem("_allSearch");
	var parsedArray = JSON.parse(stringified);

    var length = (parsedArray?.length ?? 0);
    var newoptions = new Array(length + 1);

    for(var i=0;i<length;i++)
	{
		newoptions[i] = new Array(4);
		newoptions[i] = parsedArray[i].slice(0);
	}
	
	newoptions[i] = new Array(4);
	newoptions[i][0] = "-1";
	newoptions[i][1] = nname;
	newoptions[i][2] = nlink;
	newoptions[i][3] = true;
	
	var newstring = JSON.stringify(newoptions);
	await setItem("_allSearch", newstring);
	
	document.getElementById("newname").value = "";
	document.getElementById("newlink").value = "";
	var status = document.getElementById("status_addmanually");

	showToast("New Item Added");
	setTimeout(function() {showpage(2);}, 1250);
}

function resetdefault()
{
	clearStrg();
	restore_options();
}

async function add_from_list()
{
	var numoptions = document.getElementById("numoptions").value;

	for(var j=1; j<=numoptions; j++)
	{
		if(document.getElementById("s"+j).checked)
		{
			var nname = document.getElementById("names"+j).value;
			var nlink = document.getElementById("links"+j).value;
		
			var stringified = await getItem("_allSearch");
			var parsedArray = JSON.parse(stringified);

			var length = (parsedArray?.length ?? 0);
			var newoptions = new Array(length + 1);

			for(var i=0;i<length;i++)
			{
				newoptions[i] = new Array(4);
				newoptions[i] = parsedArray[i].slice(0);
			}
			
			newoptions[i] = new Array(4);
			newoptions[i][0] = "-1";
			newoptions[i][1] = nname;
			newoptions[i][2] = nlink;
			newoptions[i][3] = true;
			
			var newstring = JSON.stringify(newoptions);
			await setItem("_allSearch", newstring);
			document.getElementById("s"+j).checked = false;
		}
	}

	showToast("New Items Added");
	setTimeout(function() {showpage(2);}, 1250);
}	


function showpage(page){
	for(var i=1; i<=4; i++){
		if(i==page) document.getElementById("page"+i).style.display = "block";
		else document.getElementById("page"+i).style.display = "none";
	}	
}


$(document).ready(function(){ 
    initialise();
	$(function() {
		$("#options_list_ul").sortable({ opacity: 0.3, cursor: 'move', update: function() {
			console.log("Reordered");
		}});
		
		$("#showpage_1").click(function() {
		  showpage(1);
		});
		
		$("#showpage_2").click(function() {
		  showpage(2);
		});	
		
		$("#showpage_3").click(function() {
		  showpage(3);
		});	
		
		$("#showpage_4").click(function() {
		  showpage(4);
		});
		
		$("#add_option").click(function() {
		  add_option();
		});
		
		$("#add_from_list").click(function() {
		  add_from_list();
		});
		
		$("#save_options").click(function() {
		  save_options();
		});

		$("#add_separator").click(function() {
		  add_separator();
		});

		$("#add_group").click(function() {
		  add_group();
		});

		$("#add_submenuitem").click(function() {
		  add_submenuitem();
		});
		
		$("#resetdefault").click(function() {
		  resetdefault();
		});
		
		$("#save_otheroptions").click(function() {
		  save_otheroptions();
		});
		
		$("#save_import").click(function() {
		  save_import();
		});
		
	});

});