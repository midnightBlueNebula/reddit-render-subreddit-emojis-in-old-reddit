// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://old.reddit.com/*
// @connect      new.reddit.com
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let regExp = new RegExp(/:\d{4,}:/);    

    function fetchImageThenAppend(arr, index=0){
       if(!arr[index]) {
           return;
       }

       let el = arr[index];

       if(!regExp.test(el.innerHTML)){
          fetchImageThenAppend(arr, ++index);
          return;
       }

       let title = el.innerHTML.match(regExp)[0];
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
               let targetImg = targetEl.querySelector(`img[title="${title}"]`);

               if(targetImg){
                   el.innerHTML = el.innerHTML.replace(regExp, `<img src=${targetImg.src} />`);
                   temp.innerHTML = "";
                   fetchImageThenAppend(arr, index);
               } else {
                   temp.innerHTML = "";
                   fetchImageThenAppend(arr, ++index);
               }
           }
       } );
    }


    function scanPage(){
       let body = document.querySelector("body");
       if(regExp.test(body.innerHTML)) {
           let divStore = Array.from(document.querySelectorAll("div.entry"));

           fetchImageThenAppend(divStore);
       }
    }

    scanPage();

    document.addEventListener("scroll", scanPage);
})();
