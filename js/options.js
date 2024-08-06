async function initialise(){
	showpage(1);
	await restore_options();
}

function updatemenu() {
	chrome.runtime.sendMessage({ action: 'reload' }, (response) => {
		// Handle the response if needed
		if (response && response.status === 'success') {
			console.log('Service worker function executed successfully');
		} else {
			console.log('Service worker function execution failed');
		}
	});
}

async function save_import()
{
	await setItem("_allSearch", document.getElementById("exporttext").value);
	var status = document.getElementById("status_import");
	status.innerHTML = "New Configuration Saved.";
	setTimeout(function() {status.innerHTML = "";},1250);
	
	updatemenu();
}

async function save_otheroptions()
{	
	var ask_bg = document.getElementById("ask_bg").checked;
	var ask_next = document.getElementById("ask_next").checked;
	
	await setItem("_askBg", ask_bg);
	await setItem("_askNext", ask_next);
	
	var status = document.getElementById("status_otheroptions");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {status.innerHTML = "";},1250);
	
	updatemenu();
}

async function save_options()
{
	var optionsList = document.getElementById("options_list_ul");
	var maxindex = optionsList.childElementCount;
	var _all = new Array(maxindex);
	
	for(var i=0; i<maxindex;i++)
	{
		curnum = optionsList.children[i].getAttribute('index');
		_all[i] = new Array(4);
		_all[i][0] = "-1";
		_all[i][1] = document.getElementById("listItemName"+curnum).value;
		_all[i][2] = document.getElementById("listItemLink"+curnum).value;
		_all[i][3] = document.getElementById("listItemEnab"+curnum).checked;
	}
	
	var stringified = JSON.stringify(_all);
	await setItem("_allSearch", stringified);
	
	var ask_bg = document.getElementById("ask_bg").checked;
	var ask_next = document.getElementById("ask_next").checked;
	
	await setItem("_askBg", ask_bg);
	await setItem("_askNext", ask_next);
	
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {status.innerHTML = "";},1250);
	
	updatemenu();
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
		add_item();
	}
	for(var i=0;i<parsedArray.length;i++)
	{
		document.getElementById("listItemName"+i).value = parsedArray[i][1];
		document.getElementById("listItemLink"+i).value = parsedArray[i][2];
		if(parsedArray[i][3]) document.getElementById("listItemEnab"+i).checked = "true";
		document.getElementById("listItemRemoveButton"+i).onclick = function(event){
			index = event.target.getAttribute("index");
			remove(index);
		};
	}
	
	var ask_bg = await getItem("_askBg");
	var ask_next = await getItem("_askNext");

	console.log(ask_bg)

	if(ask_bg==true) document.getElementById("ask_bg").checked = "true";
	if(ask_next==true) document.getElementById("ask_next").checked = "true";
}

function remove(j)
{
	var listOfSearchOptions = document.getElementById("options_list_ul");
	var listItemToRemove = document.getElementById("listItem"+j);
	listOfSearchOptions.removeChild(listItemToRemove);
}

function add_item()
{
	var optionsList = document.getElementById("options_list_ul");
	var curnum = optionsList.childElementCount;
	
	var appendListHTML = "<li index='"+curnum+"' id='listItem"+curnum+"'>\
							<div align='center'>\
							<div class='dragIcon'></div>\
							<input type='text' class='listItemName' id='listItemName"+curnum+"' size='20' maxlength='30'>\
							<input type='text' class='listItemLink' id='listItemLink"+curnum+"' size='80' maxlength='200'>\
							<input type='checkbox' class='checkStyle' id='listItemEnab"+curnum+"'>\
							<button index="+curnum+" class='removeButtonStyle' id='listItemRemoveButton"+curnum+"'>X</button>\
							</div></li>"
	document.getElementById("options_list_ul").innerHTML += appendListHTML;
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

	await restore_options();
	await save_options();
	
	document.getElementById("newname").value = "";
	document.getElementById("newlink").value = "";
	var status = document.getElementById("status_addmanually");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {status.innerHTML = ""; showpage(2);},1250);
}

function resetdefault()
{
	clearStrg();
	updatemenu();
	restore_options();
}

async function AddFromList()
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
		
			await restore_options();
			await save_options();
		}
	}
	var status = document.getElementById("status_addfromlist");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {status.innerHTML = ""; showpage(2);},1250);
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
		
		$("#AddFromList").click(function() {
		  AddFromList();
		});
		
		$("#save_options").click(function() {
		  save_options();
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