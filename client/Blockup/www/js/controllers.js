// TODO: Merge login and chat tab, so that there no more login tab
angular.module('starter.controllers', ['services'])

.controller('LoginCtrl', function($scope, $state, Auth) {

	//input model
	$scope.user = { name: '', password: '' };

	$scope.login = function login(user) {
		Auth.login(user.name, user.password).then(function(data) {
			console.log('auth passed.')
			if(data.success) {
				console.log('auth was successful.')

				$state.go('app.chat', null, {reload:true});
			} else {
				alert('Username / Password not valid. Try again');
			}
		})
	}
})
.controller('AppCtrl', function($scope, $state, $filter, socket, Auth) {
	//Ensure they are authed first.
	if(Auth.currentUser() == null) {
		$state.go('app.login');
		return;
	}

	//input models
	$scope.draft = { message: '' };
	$scope.channel = { name: '' };

	//App info
	$scope.channels = [];
	$scope.listeningChannels = [];
	$scope.activeChannel = null;
	$scope.userName = Auth.currentUser().name;
	$scope.messages = [];

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//Socket.io listeners
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

	socket.on('channels', function channels(channels){
		console.log('channels', channels);

		console.log(channels);
		$scope.channels = channels;
		$scope.channels = channels;
	});

	socket.on('message:received', function messageReceived(message) {
		$scope.messages.push(message);
	});

	socket.emit('user:joined', {name: Auth.currentUser().name});

	socket.on('user:joined', function(user) {
		console.log('user:joined');
		$scope.messages.push(user);
	});

	$scope.listenChannel = function listenChannel (channel) {
		socket.on('messages:channel:' + channel, function messages(messages) {
			console.log('got messages: ', messages);
			console.log(messages.length);
			for(var i = 0, j = messages.length; i < j; i++) {
				var message = messages[i];
				console.log('message');
				console.log(message);
					console.log('apply with function');
				$scope.messages.push(message);
			}
		});

		socket.on('message:channel:' + channel, function message(message) {
			console.log('got message: ' + message);
			if(channel != $scope.activeChannel) {
				return;
			}
			$scope.messages.push(message);
		});

		socket.on('message:remove:channel:' + channel, function(removalInfo) {
			console.log('removalInfo to remove: ', removalInfo);
			var expires = removalInfo.message.expires;
			var expireMessageIndex = $filter('messageByExpires')($scope.messages, expires);
			if(expireMessageIndex) {
				$scope.messages.splice(expireMessageIndex, 1);
			}

		});

		$scope.listeningChannels.push(channel);

	}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Controller methods
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

	$scope.joinChannel = function joinChannel(channel) {
		$scope.activeChannel = channel;
		$scope.messages = [];

		$scope.channel.name = '';

		//Listen to channel if we dont have it already.
		if($scope.listeningChannels.indexOf(channel) == -1) {
			$scope.listenChannel(channel);
		}

		socket.emit('channel:join', { channel: channel, name: Auth.currentUser().name });
	}

	$scope.sendMessage = function sendMessage(draft) {
		if(!draft.message || draft.message == null || typeof draft == 'undefined' || draft.length == 0) {
			return;
		}
		socket.emit('message:send', { message: draft.message, name: Auth.currentUser().name, channel: $scope.activeChannel });
		$scope.draft.message = '';
	};

	$scope.logout = function logout() {
		Auth.logout();
		$state.go('app.info', null, {reload:true});
	}

	//Auto join the lobby
	$scope.joinChannel('Lobby');
})

.constant("config", {
    'FEED_URL': 'http://tutor-listing-61060.netlify.com/test.xml',
    'PAGE_SIZE': 30
})

.controller("FeedController", function($scope, config, DAO, FeedService, $ionicLoading, $ionicPopup) {

	  $scope.feeds = [];  // Feeds to be shown on UI
    $scope.localFeeds = []; // Feeds from local DB

    // Watch the feeds property
    // If new feed is found, add it to DB
    $scope.$watch("feeds", function(newPosts, oldPosts) {
        if (newPosts.length) {
            _.each(newPosts, function(newPost) {

                // If the new post is not present in local DB
                // add it to the DB
                var exists = _.findWhere($scope.localFeeds, {link: newPost.link});
                if (_.isUndefined(exists)) {
                    var feed = {
                        // We use the URL of post as document ID
                        _id: newPost.link,
                        post: newPost
                    }

                    // Add the new post to local DB
                    localDB.post(feed, function callback(err, result) {
                        if (!err) {
                          console.log('Successfully posted a feed!');
                        }
                    })
                }
            })
        }
    })

    /**
     * Get the feeds from local DB using DAO service
     */
    $scope.getLocalFeed = function() {
        var localFeed = DAO.getFeed();
        localFeed.then(function(response) {
            if (response && response.length) {
                $scope.feeds = response;
                $scope.localFeeds = response;

                // Hide the loader
                $ionicLoading.hide();
            } else {
                // If no feeds are found in local DB
                // call the feeds API
                $scope.getRemoteFeed();
            }
        }, function() {
            // In case of error, call feeds API
            $scope.getRemoteFeed();
        })
    }

    /**
     * Get the feeds from remote feeds API using FeedService
     */
    $scope.getRemoteFeed = function() {
        if (!$scope.isOnline()) {
            $ionicPopup.alert({
                title: 'Oops!',
                template: 'You seem to be offline?'
            }).then(function() {
                $ionicLoading.hide();
                $scope.$broadcast('scroll.refreshComplete');
            })
        } else {
            FeedService
                .getFeed({url: config.FEED_URL, count: config.PAGE_SIZE})
                .then(function(response) {
                    $scope.feeds = response;
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                }, function() {
                }, function() {
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                })
        }
    }

    /**
     * Called on application load and loads the feeds
     */
    $scope.initFeed = function() {
        $scope.getLocalFeed();
    }

    /**
     * Called on "pull to refresh" action
     */
    $scope.refreshFeed = function() {
        $scope.getRemoteFeed();
    }

    $scope.isOnline = function() {
        var networkState = null;

        if (navigator.connection) {
            networkState = navigator.connection.type;
        }

        if (networkState && networkState === Connection.NONE) {
            return false;
        }
        if (navigator.onLine) {
            return true;
        } else {
            return false;
        }
    }

    // Initialize the feeds
    $scope.initFeed();
})

.controller('ForumController', function($scope, $timeout,$ionicModal) {
  $scope.items = ['Kiusaaminen voi olla rikos', 'Koulukiusaaminen', 'Työpaikkakiusaaminen', 'Nettikiusaaminen', 'Masennus', 'Tarinatuokio'];

	$ionicModal.fromTemplateUrl('templates/bottom-sheet.html', {
    scope: $scope,
    viewType: 'bottom-sheet',
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.createPost = function(u) {
    $scope.items.push(u.name);
    $scope.modal.hide();
  };
	$scope.doRefresh = function() {

    console.log('Refreshing!');
    $timeout( function() {
      //simulate async response
      $scope.items.push('Uusi keskustelu nro:' + Math.floor(Math.random() * 1000) + 4);

      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');

    }, 1000);

  };
})

.directive('ionBottomSheet', [function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      controller: [function() {}],
      template: '<div class="modal-wrapper" ng-transclude></div>'
    };
  }])
.directive('ionBottomSheetView', function() {
  return {
    restrict: 'E',
    compile: function(element) {
      element.addClass('bottom-sheet modal');
    }
  };

})
