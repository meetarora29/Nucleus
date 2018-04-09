function update() {
    chrome.storage.local.get(['elapsed'], function (result) {
        console.log("Elapsed is: " + result.elapsed);
        document.getElementById("timer").innerText = result.elapsed;
    });
}

update();
setInterval(update, 1000);

