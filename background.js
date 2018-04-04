var electrons=["netflix", "primevideo"];

var elapsed=0;
// chrome.storage.sync.clear();
chrome.storage.sync.get(['elapsed'], function (result) {
    console.log("Elapsed is: "+result.elapsed);
    if(result.elapsed)
        elapsed=result.elapsed;
});

var minutes=100;
var limit=minutes*(60)*(1000);
var id=0;

function tick() {
    elapsed++;
    console.log(elapsed);
    chrome.storage.local.set({elapsed: elapsed}, function () {
        console.log("Value is: "+elapsed);
    });
}

function timer(url) {
    for (var i in electrons) {
        if (url.indexOf(electrons[i]) > -1) {
            clearInterval(id);
            id = setInterval(tick, 1000);
            break;
        }
        else
            clearInterval(id);
    }
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log(tab.url);
        timer(tab.url);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.status==='complete') {
        chrome.tabs.query({active:true, lastFocusedWindow:true}, function (tabs) {
            if (tabs[0].id===tabId) {
                console.log("Current: " + tabs[0].url);
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
});

chrome.windows.onRemoved.addListener(function () {
    chrome.storage.sync.set({limit: limit, elapsed: elapsed}, function () {
        console.log("Value synced");
    })
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({limit: limit}, function () {
        console.log("Value is: "+limit);
    });

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});