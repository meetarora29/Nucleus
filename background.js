//TODO: Minimize Condition. Better way to check for url.
var electrons=["netflix", "primevideo"];
var protons=["codechef"];

// Interval ID
var id=0;

var elapsed=0;

var prev_date=new Date();
console.log("S: " +prev_date);

var minutes=1000;
var limit=minutes*(60);

// chrome.storage.sync.clear();
// chrome.storage.local.clear();

chrome.storage.sync.get(['elapsed', 'date', 'limit'], function (result) {
    console.log("Synced Elapsed is: "+result.elapsed+" Date: "+result.date + " Limit: "+result.limit);
    if(result.elapsed)
        elapsed=result.elapsed;
    if(result.date)
        prev_date=new Date(result.date);
    if (result.limit)
        limit=result.limit;
    console.log("C: "+prev_date);

	// Taking more recent values if applicable
	chrome.storage.local.get(['elapsed', 'date', 'limit'], function (result) {
		console.log("Local Elapsed is: "+result.elapsed+" Date: "+result.date + " Limit: "+result.limit);
		if (result.date)
			result.date=new Date(result.date);
		if(result.date > prev_date) {
			prev_date=result.date;
			if (result.limit)
				limit=result.limit;
			if (result.elapsed)
				elapsed=result.elapsed;
		}
		console.log("L: "+result.date);
		console.log("F: " +prev_date);
	});

	check_new_day();
	store_values(prev_date);
});


function check_new_day() {
    var current_date=new Date();
    current_date.setHours(0, 0, 0, 0);

    if (current_date>prev_date) {
        console.log(current_date);
        elapsed=0;
        prev_date=current_date;
    }
}

function limit_exceed() {
    if (elapsed>=limit) {
        clearInterval(id);
        chrome.tabs.query({active:true, lastFocusedWindow:true}, function (result) {
            chrome.tabs.update(result[0].id, {url: "popup.html"});
        });
        return true;
    }
    return false;
}

function tick() {
    check_new_day();

    if (limit_exceed())
        return;
    elapsed++;
    console.log(elapsed);
    chrome.storage.local.set({'elapsed': elapsed, 'date': new Date().toString()}, function () {
        console.log("Local value is: "+elapsed + " at " + new Date());
    });
}

function tock() {
    check_new_day();

    elapsed--;
    console.log(elapsed);
    chrome.storage.local.set({'elapsed': elapsed, 'date': new Date().toString()}, function () {
        console.log("Local value is: "+elapsed + " at " + new Date());
    });
}

function timer(url) {
    var flag=0;

    for (var i in electrons) {
        if (url.indexOf(electrons[i]) > -1) {
            clearInterval(id);
            id = setInterval(tick, 1000);
            flag=1;
            break;
        }
        else
            clearInterval(id);
    }
    for (i in protons) {
        if (url.indexOf(protons[i]) > -1) {
            clearInterval(id);
            id = setInterval(tock, 1000);
            break;
        }
        else if (flag===0)
            clearInterval(id);
    }
}

function store_values(date) {
    chrome.storage.sync.set({'limit': limit, 'elapsed': elapsed, 'date': date.toString()}, function () {
        console.log("Value Synced");
    });
    chrome.storage.local.set({'limit': limit, 'elapsed': elapsed, 'date': date.toString()}, function () {
        console.log("Local Values Set");
    });
}


chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === 'saveData') {
        store_values(new Date());
    }
});

chrome.alarms.create('saveData', {
    periodInMinutes: 1
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log("Tab Changed: "+tab.url);
        timer(tab.url);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.status==='complete') {
        chrome.tabs.query({active:true, lastFocusedWindow:true}, function (tabs) {
            if (tabs[0].id===tabId) {
                console.log("Tab Updated: " + tabs[0].url);
                timer(tabs[0].url);
            }
        });
    }
});

chrome.windows.onFocusChanged.addListener(function (windowId) {
    if (windowId!==chrome.windows.WINDOW_ID_NONE) {
        chrome.tabs.query({active:true, windowId: windowId}, function (result) {
            timer(result[0].url);
            console.log("After window change: "+result[0].url);
        });
    }
    // else {
    //     clearInterval(id);
    //     console.log("Windows Focus Lost");
    // }
});

chrome.windows.onRemoved.addListener(function () {
    store_values(new Date());
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});