// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'ngSanitize'])

//This filter will give us the index of the item in the array or null if not found.
.filter('messageByExpires', function() {
  return function(messages, messageExpires) {
    for(var i = 0, j = messages.length; i < j; i++) {
      var message = messages[i];
      if(message.expires == messageExpires) {
        return i;
      }
    }
    return null; //nothing found
  }
})


.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
     url: "/app",
     abstract: true,
     templateUrl: "templates/menu.html",
     controller: 'AppCtrl'
   })


   .state('app.login', {
     url: "/login",
     views: {
       'tab-login': {
         templateUrl: "templates/login.html",
         controller: "LoginCtrl"
       }
     }
   })

    .state('app.chat', {
     url: "/chat",
     views: {
       'tab-chat': {
         templateUrl: "templates/chat.html"
       }
     }
   })

   .state('app.browse', {
     cache: false,
     url: "/browse",
     controller:"FeedController",
     views: {
       'tab-browse': {
         templateUrl: "templates/browse.html"
       }
     }
   })

   .state('app.blog', {
     url: "/blog",
     views: {
       'tab-blog': {
         templateUrl: "templates/blog.html",
         controller: "ForumController"
       }
     }
   })

   .state('app.forum', {
     url: "/forum",
     templateUrl: "templates/forum"
   })

   .state('app.info', {
     url: "/info",
     views: {
       'tab-info': {
         templateUrl: "templates/info.html",
       }
     }
   })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/info');
});
