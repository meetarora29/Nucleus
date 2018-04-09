//TODO: Store and get variables. Better way to check for url.
var electrons=["netflix", "primevideo"];
var protons=["codechef"];

var elapsed=0;
// chrome.storage.sync.clear();
chrome.storage.sync.get(['elapsed'], function (result) {
    console.log("Elapsed is: "+result.elapsed);
    if(result.elapsed)
        elapsed=result.elapsed;
});

var minutes=1000;
var limit=minutes*(60);
chrome.storage.local.set({limit: limit}, function () {
    console.log("Value is: "+limit);
});

var prev_date=new Date();
prev_date.setHours(0, 0, 0, 0);
console.log(prev_date);

var id=0;

function check_new_day() {
    var current_date=new Date();
    current_date.setHours(0, 0, 0, 0);
    console.log(current_date);
    if (current_date>prev_date) {
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
    chrome.storage.local.set({elapsed: elapsed}, function () {
        console.log("Local value is: "+elapsed);
    });
}

function tock() {
    check_new_day();

    elapsed--;
    console.log(elapsed);
    chrome.storage.local.set({elapsed: elapsed}, function () {
        console.log("Local value is: "+elapsed);
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
    else {
        clearInterval(id);
        console.log("Windows Focus Lost");
    }
});

chrome.windows.onRemoved.addListener(function () {
    chrome.storage.sync.set({limit: limit, elapsed: elapsed}, function () {
        console.log("Value synced");
    })
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});