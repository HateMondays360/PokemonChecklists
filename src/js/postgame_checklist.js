function ChangeSpanToImages(acronym)
{
	var headers = $(".teamLogo-header");
	for(var i=0; i < headers.length; i++)
	{
		var bgimg = $(headers[i]).css('background-image');
		var imageUrl = bgimg.replace(/(url\(|\)|'|")/gi, ''); // Strip everything but the url itself
		
		$(headers[i]).html('<img class="' + acronym + 'Logo" src="' + imageUrl + '" />');
		$(headers[i]).css('background-image', 'none');
	}
	
	var smBadges = $(".badge-sm");
	for(var i=0; i < smBadges.length; i++)
	{
		var bgimg = $(smBadges[i]).css('background-image');
		var imageUrl = bgimg.replace(/(url\(|\)|'|")/gi, ''); // Strip everything but the url itself
		
		$(smBadges[i]).html('<img class="' + acronym + 'Badge" src="' + imageUrl + '" />');
		$(smBadges[i]).css('background-image', 'none');
	}
	
	var mdBadges = $(".badge-md");
	for(var i=0; i < mdBadges.length; i++)
	{
		var bgimg = $(mdBadges[i]).css('background-image');
		var imageUrl = bgimg.replace(/(url\(|\)|'|")/gi, ''); // Strip everything but the url itself
		
		$(mdBadges[i]).html('<img class="' + acronym + 'Badge" src="' + imageUrl + '" />');
		$(mdBadges[i]).css('background-image', 'none');
	}
}

function GetChecklistData(path)
{
	var json = null;
	$.ajax({
		'async': false,
		'global': false,
		'url': path,
		'dataType': "json",
		'success': function(data) {
			json = data;
		}
		,'error': function(x, y, err) {
			console.log(err);
		}
	});
	
	return json;
}

function Render(dataKey, dataFile, binKey)
{
	window.binKey = binKey;
	var data = GetChecklistData(dataFile);

	var chkIndex = 0;
	
	for(var t=0; t < data[dataKey].length; t++)
	{
		chkIndex++;
		
		var task = data[dataKey][t];
		var divTask = $("<div class='task'></div>");
		
		var targetID = "#row" + task.row;
		if (task.col !== undefined)
		{
			targetID +=  " > #col" + task.col;
		}
		var targetDiv = $(targetID);
		
		//Build Task checkbox
		var chk = BuildCheckbox(chkIndex, task);
		divTask.html( chk.prop('outerHTML') );
		
		// Check for subtasks
		divTask = RenderSubTasks(divTask, chkIndex, task);
		divTask.append("<div class='clearfix'></div>");
		
		targetDiv.append(divTask);
	}
}

function RenderSubTasks(divTask, chkIndex, task)
{
	var id = task.id;
	
	if (task.subtasks !== undefined)
	{
		var subtasks = task.subtasks;

		subtasks = subtasks.filter(function( obj ) {
			return obj.hide == undefined
		});
	
		// Should these subtasks be split into multiple columns?
		var splitCols = 1;
		if (task.splitCol !== undefined)
		{
			splitCols = task.splitCol;
		}

		// Should these subtasks be sorted?
		var sortMethod = task.sort;
		if (sortMethod !== undefined)
		{
			if (sortMethod === "alpha")
			{
				subtasks = sortByKey( subtasks, "task" );
			}
		}
		
		var maxRowCount = subtasks.length / splitCols;
		
		var rowCount = 0;
		var x = Math.floor(12 / splitCols);
		var colDiv = "<div class='col-sm-" + x + "'></div>";
		var targetCol = $(colDiv);
		
		for(var t=0; t < subtasks.length; t++)
		{
			rowCount++;
			chkIndex++;
			
			var subtask = subtasks[t];
			subtask.parentid = id;
			var divSubtask = $("<div class='subtask'></div>");
			
			//Build Task checkbox
			var chk = BuildCheckbox(chkIndex, subtask);
			divSubtask.html( chk.prop('outerHTML') );
			targetCol.append(divSubtask);
			
			if (rowCount >= maxRowCount)
			{
				divTask.append(targetCol);
				rowCount = 0;
				targetCol = $(colDiv);
			}
		}
		
		if (rowCount > 0)
		{
			divTask.append(targetCol);
		}
	}
	
	return divTask;
}

function BuildCheckbox(chkIndex, task)
{
	var id = task.id;
	var parentid = task.parentid;
	
	if (parentid !== undefined)
	{
		id = parentid + id;
	}
	
	var text = task.task;
	var formats = task.formats;
	var tasktip = task.tooltip;
	var spoiler = "";
	var tooltip = "";	
	
	if (task.spoiler !== undefined)
	{
		spoiler = " <span class=\"spoiler\">" + task.spoiler + "</span> ";
	}

	if (task.tooltip !== undefined)
	{
		tooltip = "title=\"" + tasktip + "\""
	}
	
	var formattedText = text + spoiler;
	if (formats !== undefined)
	{
		formattedText = FormatText(formattedText, formats);
	}

	var chkValue = Retrieve(id);
	var checked = chkValue !== null && chkValue ? "checked" : "";
	var chk = $("<label class=\"postgame_chkLabel\"" + tooltip + "for='" + id + "'><input class=\"postgame_chk\" type='checkbox' id='" + id + "' " + checked + " />" + formattedText + "</label>");
	
	return chk;
}

function FormatText(text, formats)
{
	if (formats !== undefined)
	{
		for(var f = 0; f < formats.length; f++)
		{
			var all = formats[f].all;
			var word = formats[f].word;
			var format = formats[f].format;
			
			if (word !== undefined && word.length > 0)
			{
				text = text.replace(word,"<span class='" + format + "'>" + word + "</span>");
			}
			else if (all !== undefined && all.length > 0)
			{
				text = "<span class='" + all + "'>" + text + "</span>";
			}
		}
	}
	
	return text;
}

function sortByKey(array, key)
{
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function startsWith(str, start)
{	
	return str.slice(0, start.length) == start;
}

function chk_onClick(e, binKey)
{
	window.binKey = binKey;
	var id = e.target.id;
	
	markSubtasks(id);
	
	SaveCheckboxState(id);
}

function SaveCheckboxState(id)
{
	var key = window.binKey + id;
	
	if ( $("#"+id).is(":checked"))
	{
		localStorage.setItem(key, "true");
	}
	else
	{
		localStorage.removeItem(key);
	}
}

function markSubtasks(taskid)
{
	if (taskid.indexOf("sub") === -1 && startsWith(taskid, "task"))
	{
		var taskState = $("#"+taskid).is(":checked");
		var subtasks = $("#"+taskid).closest(".task").find(".subtask");
		
		if (subtasks !== undefined || subtasks !== null)
		{
			for(var s=0; s < subtasks.length; s++)
			{
				var chk = $(subtasks[s]).find(".postgame_chk");
				chk.prop('checked', taskState);
				
				SaveCheckboxState(chk.attr("id"));
			}
		}
	}
}

function Retrieve(id)
{
	var key = window.binKey + id;
	return localStorage.getItem( key );
}

function ResetAll()
{
	// Reset all local store keys with binKey
	var storeKeys = []; // Array to hold the keys
	// Iterate over localStorage and insert the keys that meet the condition into storeKeys
	for (var i = 0; i < localStorage.length; i++)
	{
		if (localStorage.key(i).indexOf(window.binKey) > -1)
		{
			storeKeys.push(localStorage.key(i));
		}
	}

	// Iterate over storeKeys and remove the items by key
	for (var i = 0; i < storeKeys.length; i++)
	{
		localStorage.removeItem(storeKeys[i]);
	}
	
	// Reload the page
	location.reload(true);
}