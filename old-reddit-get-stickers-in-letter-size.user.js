// ==UserScript==
// @name         Get stickers for old reddit
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Replaces numbers between colons with their corresponding stickers in old.reddit.
// @author       midnightBlueNebula
// @match        https://old.reddit.com/*
// @connect      new.reddit.com
// @icon         https://www.iconpacks.net/icons/2/free-reddit-logo-icon-2436-thumb.png
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    var regExp = new RegExp(/:\d{4,}:/);
    var memorizeStickerLinks = {}; // key -> sticker title, value -> sticker link.
    

    function fetchImageThenAppend(arr, index=0){
       // This function will be called when there would be sticker numbers in page's document.
       if(!arr[index]) {
           // All comments has been processed.
           return;
       }

       let el = arr[index];

       if(!regExp.test(el.innerHTML)){
          // If this comment doesn't contains sticker number then look in next comment.
          fetchImageThenAppend(arr, ++index);
          return;
       }

       let title = el.innerHTML.match(regExp)[0];
       let linkInMemory = memorizeStickerLinks[title]
       if(linkInMemory){
           el.innerHTML = el.innerHTML.replace(title, `<img src=${linkInMemory} />`); // Replace sticker number with corresponding sticker.
           fetchImageThenAppend(arr, index);
           return;
       }
        
       let link = el.querySelector("a.bylink");
       let newLink = link.href.replace("//old", "//new");

       GM_xmlhttpRequest ( {
           method:     'GET',
           url:        newLink,
           headers: {
               "Accept": "text/html"
           },
           onload: function (responseDetails) {
               let responseStr = responseDetails.responseText;

               let temp = document.createElement("temp");
               temp.innerHTML = responseStr.trim();

               let targetEl = temp.querySelector("div.Comment");
               let targetImg = targetEl.querySelector(`img[title="${title}"]`); // Get image from new.reddit by sticker number.

               if(targetImg){
                   el.innerHTML = el.innerHTML.replace(title, `<img src=${targetImg.src} style="height: 1em"/>`); // Replace sticker number with corresponding sticker.
                   memorizeStickerLinks[title] = targetImg.src; // memorize link for this title.
                   temp.innerHTML = "";
                   // Not increasing index number to check if this comment has more sticker numbers.
                   fetchImageThenAppend(arr, index);
               } else {
                   // If numbers between colons weren't corresponding to sticker number then process next comment.
                   temp.innerHTML = "";
                   fetchImageThenAppend(arr, ++index);
               }
           }
       } );
    }


    function scanPage(){
       // Scan page if document contains sticker numbers.
       let body = document.querySelector("body");
       if(regExp.test(body.innerHTML)) {
           // This page could be containing sticker numbers.
           let divStore = Array.from(document.querySelectorAll("div.entry")); // Store all comments of the page.

           fetchImageThenAppend(divStore); // Add corresponding sticker to comments' sticker number if they contain any.
       }
    }


    scanPage();

    //Scan page again if new comments loaded.
    var body = document.querySelector("body");
    var lastHeight = body.getBoundingClientRect().height;

    function scanIfHeightChanged() {
        // Change in height means new comments loaded.
        if(lastHeight == body.getBoundingClientRect().height) {
            return; // Return, height didn't changed.
        }
        // Height changed, new comments loaded. Scan new comments.
        scanPage();
        lastHeight = body.getBoundingClientRect().height;
    }

    setInterval(scanIfHeightChanged, 100); // Check 10 times in a second if new comments added to page's document.
})();
