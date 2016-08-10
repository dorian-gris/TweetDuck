(function($,$TD,TD){
  //
  // Variable: Current highlighted column jQuery object.
  //
  var highlightedColumnEle;
  
  //
  // Variable: Currently highlighted tweet jQuery object.
  //
  var highlightedTweetEle;
  
  //
  // Function: Initializes TweetD*ck events. Called after the website app is loaded.
  //
  var initializeTweetDck = function(){
    // Settings button hook
    $("[data-action='settings-menu']").click(function(){
      setTimeout(function(){
        var menu = $(".js-dropdown-content").children("ul").first();
        if (menu.length === 0)return;
        
        menu.children(".drp-h-divider").last().after([
          '<li class="is-selectable" data-std><a href="#" data-action="td-settings">'+$TD.brandName+' settings</a></li>',
          '<li class="is-selectable" data-std><a href="#" data-action="td-plugins">'+$TD.brandName+' plugins</a></li>',
          '<li class="drp-h-divider"></li>'
        ].join(""));
        
        var buttons = menu.children("[data-std]");

        buttons.on("click","a",function(){
          var action = $(this).attr("data-action");
          
          if (action === "td-settings"){
            $TD.openSettingsMenu();
          }
          else if (action === "td-plugins"){
            $TD.openPluginsMenu();
          }
        });

        buttons.hover(function(){
          $(this).addClass("is-selected");
        },function(){
          $(this).removeClass("is-selected");
        });
      },0);
    });
    
    // Notification handling
    $.subscribe("/notifications/new",function(obj){
      for(let index = obj.items.length-1; index >= 0; index--){
        onNewTweet(obj.column,obj.items[index]);
      }
    });
    
    // Setup video element replacement
    new MutationObserver(function(){
      $("video").each(function(){
        $(this).parent().replaceWith("<a href='"+$(this).attr("src")+"' rel='url' target='_blank' style='display:block; border:1px solid #555; padding:3px 6px'>&#9658; Open video in browser</a>");
      });
    }).observe($(".js-app-columns")[0],{
      childList: true,
      subtree: true
    });
    
    // Finish init and load plugins
    $TD.loadFontSizeClass(TD.settings.getFontSize());
    $TD.loadNotificationHeadContents(getNotificationHeadContents());
    
    window.TD_APP_READY = true;
    
    if (window.TD_PLUGINS){
      window.TD_PLUGINS.onReady();
    }
  };
  
  //
  // Function: Prepends code at the beginning of a function. If the prepended function returns true, execution of the original function is cancelled.
  //
  var prependToFunction = function(func, extension){
    return function(){
      return extension.apply(this,arguments) === true ? undefined : func.apply(this,arguments);
    };
  };
  
  //
  // Function: Appends code at the end of a function.
  //
  var appendToFunction = function(func, extension){
    return function(){
      var res = func.apply(this,arguments);
      extension.apply(this,arguments);
      return res;
    };
  };
  
  //
  // Function: Event callback for a new tweet.
  //
  var onNewTweet = function(column, tweet){
    if (column.model.getHasNotification()){
      var html = $(tweet.render({
        withFooter: false,
        withTweetActions: false,
        withMediaPreview: false
      }));

      html.css("border","0");
      html.find(".tweet-body").first().children("footer").remove();
      
      var url = html.find("time").first().children("a").first().attr("href") || "";
      
      $TD.onTweetPopup(html.html(),url,tweet.text.length); // TODO column
    }
    else if (column.model.getHasSound()){
      $TD.onTweetSound(); // TODO disable original
    }
  };
  
  //
  // Function: Retrieves the tags to be put into <head> for notification HTML code.
  //
  var getNotificationHeadContents = function(){
    var tags = [];
    
    $(document.head).children("link[rel='stylesheet'],meta[charset],meta[http-equiv]").each(function(){
      tags.push($(this)[0].outerHTML);
    });
    
    return tags.join("");
  };
  
  //
  // Block: Observe the app <div> element and initialize TweetD*ck whenever possible.
  //
  var app = $("body").children(".js-app");
  
  new MutationObserver(function(){
    if (window.TD_APP_READY && app.hasClass("is-hidden")){
      window.TD_APP_READY = false;
    }
    else if (!window.TD_APP_READY && !app.hasClass("is-hidden")){
      initializeTweetDck();
    }
  }).observe(app[0],{
    attributes: true,
    attributeFilter: [ "class" ]
  });
  
  //
  // Block: Hook into settings object to detect when the settings change.
  //
  TD.settings.setFontSize = appendToFunction(TD.settings.setFontSize,function(name){
    $TD.loadFontSizeClass(name);
  });
  
  TD.settings.setTheme = appendToFunction(TD.settings.setTheme,function(){
    setTimeout(function(){
      $TD.loadNotificationHeadContents(getNotificationHeadContents());
    },0);
  });
  
  //
  // Block: Force popup notification settings.
  //
  TD.controller.notifications.hasNotifications = function(){
    return true;
  };

  TD.controller.notifications.isPermissionGranted = function(){
    return true;
  };
  
  //
  // Block: Expand shortened links on hover or display tooltip.
  //
  (function(){
    var cutStart = function(str, search){
      return str.startsWith(search) ? str.substr(search.length) : str;
    };
    
    var prevMouseX = -1, prevMouseY = -1;
    var tooltipTimer, tooltipDisplayed;
    
    $(document.body).delegate("a[data-full-url]","mouseenter mouseleave mousemove",function(e){
      var me = $(this);

      if (e.type === "mouseenter"){
        var text = me.text();
        
        if (text.charCodeAt(text.length-1) !== 8230){ // horizontal ellipsis
          return;
        }
        
        if ($TD.expandLinksOnHover){
          tooltipTimer = window.setTimeout(function(){
            var expanded = me.attr("data-full-url");
            expanded = cutStart(expanded,"https://");
            expanded = cutStart(expanded,"http://");
            expanded = cutStart(expanded,"www.");

            me.attr("td-prev-text",text);
            me.text(expanded);
          },200);
        }
        else{
          tooltipTimer = window.setTimeout(function(){
            $TD.displayTooltip(me.attr("data-full-url"),false);
            tooltipDisplayed = true;
          },400);
        }
      }
      else if (e.type === "mouseleave"){
        if ($TD.expandLinksOnHover){
          var prevText = me.attr("td-prev-text");

          if (prevText){
            me.text(prevText);
          }
        }
        
        window.clearTimeout(tooltipTimer);
        
        if (tooltipDisplayed){
          tooltipDisplayed = false;
          $TD.displayTooltip(null,false);
        }
      }
      else if (e.type === "mousemove"){
        if (tooltipDisplayed && (prevMouseX !== e.clientX || prevMouseY !== e.clientY)){
          $TD.displayTooltip(me.attr("data-full-url"),false);
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
        }
      }
    });
  })();
  
  //
  // Block: Allow bypassing of t.co in context menus.
  //
  $(document.body).delegate("a","contextmenu",function(){
    $TD.setLastRightClickedLink($(this).attr("data-full-url") || "");
  });
  
  //
  // Block: Hook into the notification sound effect.
  //
  (function(){
    var soundEle = document.getElementById("update-sound");
    
    soundEle.play = prependToFunction(soundEle.play,function(){
      return $TD.muteNotifications;
    });
  })();
  
  /* TODO document.getElementById("update-sound").play = function(){
    $TD.onTweetSound();
  };*/
  
  //
  // Block: Update highlighted column.
  //
  app.delegate("section","mouseenter mouseleave",function(e){
    if (e.type === "mouseenter"){
      highlightedColumnEle = $(this);
    }
    else if (e.type === "mouseleave"){
      highlightedColumnEle = null;
    }
  });
  
  //
  // Block: Copy tweet address and update highlighted tweet.
  //
  (function(){
    var lastTweet = "";
    
    var updateHighlightedTweet = function(link, embeddedLink){
      if (lastTweet !== link){
        $TD.setLastHighlightedTweet(link,embeddedLink);
        lastTweet = link;
      }
    };
    
    app.delegate("article.js-stream-item","mouseenter mouseleave",function(e){
      if (e.type === "mouseenter"){
        highlightedTweetEle = $(this);
        
        var link = $(this).find("time").first().children("a").first();
        var embedded = $(this).find(".quoted-tweet[data-tweet-id]").first();
        
        updateHighlightedTweet(link.length > 0 ? link.attr("href") : "",embedded.length > 0 ? embedded.find(".account-link").first().attr("href")+"/status/"+embedded.attr("data-tweet-id") : "");
      }
      else if (e.type === "mouseleave"){
        highlightedTweetEle = null;
        updateHighlightedTweet("","");
      }
    });
  })();
  
  //
  // Block: Paste images when tweeting.
  //
  (function(){
    var lastPasteElement;
    var prevScrollTop;
    
    var getScroller = function(){
      return $(".js-drawer").find(".js-compose-scroller").first().children().first();
    };
    
    var clickUpload = function(){
      var button = $(".js-add-image-button").first();
      
      var scroller = getScroller();
      prevScrollTop = scroller.scrollTop();
      
      scroller.scrollTop(0);
      scroller.scrollTop(button.offset().top); // scrolls the button into view
      
      var buttonPos = button.children().first().offset(); // finds the camera icon offset
      $TD.clickUploadImage(Math.floor(buttonPos.left),Math.floor(buttonPos.top));
    };
    
    $(".js-app").delegate(".js-compose-text,.js-reply-tweetbox","paste",function(){
      lastPasteElement = $(this);
      $TD.tryPasteImage();
    });

    window.TDGF_tryPasteImage = function(){
      if (lastPasteElement){
        var parent = lastPasteElement.parent();

        if (parent.siblings(".js-add-image-button").length === 0){
          var pop = parent.closest(".js-inline-reply,.rpl").find(".js-inline-compose-pop,.js-reply-popout");

          if (pop.length === 0){
            lastPasteElement = null;
            return;
          }
          
          pop.click();
          
          var drawer = $(".js-drawer");
          var counter = 0;
          
          var interval = setInterval(function(){
            if (drawer.offset().left >= 195){
              clickUpload();
              clearInterval(interval);
            }
            else if (++counter >= 10){
              clearInterval(interval);
            }
          },51);
        }
        else{
          clickUpload();
        }
        
        lastPasteElement = null;
      }
    };
    
    window.TDGF_tryPasteImageFinish = function(){
      setTimeout(function(){
        getScroller().scrollTop(prevScrollTop);
        $(".js-drawer").find(".js-compose-text").first()[0].focus();
      },10);
    };
  })();
  
  //
  // Block: Support for extra mouse buttons.
  //
  window.TDGF_onMouseClickExtra = function(button){
    if (button === 1){ // back button
      var modal = $("#open-modal");
      
      if (highlightedColumnEle && highlightedColumnEle.closest(".js-column").is(".is-shifted-1")){
        highlightedColumnEle.find(".js-column-back").first().click();
      }
      else if (modal.is(":visible")){
        modal.find("a[rel=dismiss]").click();
      }
      else{
        $(".js-column-back").click();
      }
    }
    else if (button === 2){ // forward button
      if (highlightedTweetEle){
        highlightedTweetEle.children().first().click();
      }
    }
  };
  
  //
  // Block: Inject custom CSS and layout into the page.
  //
  (function(){
    var styleOfficial = document.createElement("style");
    document.head.appendChild(styleOfficial);
    styleOfficial.sheet.insertRule("a[data-full-url] { word-break: break-all; }",0); // break long urls
    
    if ($TD.hasCustomBrowserCSS){
      var styleCustom = document.createElement("style");
      styleCustom.innerHTML = $TD.customBrowserCSS;
      document.head.appendChild(styleCustom);
    }
  })();
})($,$TD,TD);
