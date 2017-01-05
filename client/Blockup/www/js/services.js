var baseUrl = 'https://kallelaine.com:8080/';
// Create the PouchDB database instance
var localDB = new PouchDB("webspeaksdb");
angular.module('services', [])

.factory('socket', function socket($rootScope) {
  var socket = io.connect(baseUrl);
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
})

.factory('Auth', function Auth($q, $http) {
  var user = null;

  try {
    user = JSON.parse(window.localStorage.getItem('user'));
  } catch(ex) { /*window.localStorage.setItem('test');*/ }

  var login = function login(name, password) {
    var deferred = $q.defer();

    var url = baseUrl + 'app/login';
    //console.log(baseUrl);
    var postData = { name: name, password: password };

    $http.post(url, postData).success(function(response) {
      if(response.success && (response.success == true || response.success == "true")) {
        user = { name: response.name, id: response.id };
        window.localStorage.setItem('user', JSON.stringify(user));
        return deferred.resolve(response);
      } else {
        return deferred.resolve('No user found');
      }
    }).error(function(error) {
      //Fail our promise.
      deferred.reject(error);
    })

    return deferred.promise;
  }

  var currentUser = function currentUser() {
    return user;
  }

  var logout = function logout() {
    user = null;
    window.localStorage.removeItem('user');
  }

  return {
    login: login,
    logout: logout,
    currentUser: currentUser
  };
})

/**
 * This service calls the remote feeds API
 * and returns the feeds response
 */
.factory("FeedService", function($http, $q) {

    // Return public API.
    return ({
        getFeed: getFeed
    });

    function getFeed(paramData) {
        paramData = paramData || {};
        var url = document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num='+ paramData.count +'&callback=JSON_CALLBACK&q=' + encodeURIComponent(paramData.url),
            request = $http.jsonp(url);

        return (request.then(handleSuccess, handleError));
    }

    // Transform the error response, unwrapping the application data from
    // the API response payload.
    function handleError(response) {
        // The API response from the server should be returned in a
        // nomralized format. However, if the request was not handled by the
        // server (or what not handles properly - ex. server error), then we
        // may have to normalize it on our end, as best we can.
        if (!angular.isObject(response.data) || !response.data.message) {
            return ($q.reject("An unknown error occurred."));
        }
        // Otherwise, use expected error message.
        return ($q.reject(response.data.message));
    }

    // I transform the successful response, unwrapping the application data
    // from the API response payload.
    function handleSuccess(response) {
        if (response.data && response.data.responseData && response.data.responseData.feed) {
            if (response.data.responseData.feed.entries) {
                if (response.data.responseData.feed.entries.length) {
                    return (response.data.responseData.feed.entries);
                }
            }
        }
    }
})

/**
 * The "Data Access Object" service
 * This service gets the feeds from local database
 * using PouchDB database object
 */
.factory("DAO", function($q) {

    // Return public API.
    return ({
        getFeed: getFeed
    });

    function getFeed() {
        var deferred = $q.defer();
        localDB.allDocs({include_docs: true, descending: true}, function(err, doc) {
            if (err) {
                deferred.reject(err);
            } else {
                var rows = [];
                for (var x in doc.rows) {
                    rows.push(doc.rows[x].doc.post);
                }
                deferred.resolve(rows);
            }
        });
        return deferred.promise;
    }

})
