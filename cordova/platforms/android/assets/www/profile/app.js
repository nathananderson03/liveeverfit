'use strict';
define(['app', 'feed', 'calendar'], function (app) {
    app.register.controller('profileCtrl', ['$scope', 'restricted',
        function ($scope) {
            $scope.restricted();
        }]);
    app.register.controller('profileController', ['$scope', "$state", "$stateParams", '$resource', '$modal', '$http', 'localStorageService', 'rest', 'tokenError',
        function ($scope, $state, $stateParams, $resource, $modal, $http, localStorageService, tokenError) {
            angular.extend($scope, {
                calendarShow: false,
                user_id: localStorageService.get('user_id'),
                user_type: localStorageService.get('user_type'),
                entry : '',
                feed: {
                    id: undefined,
                    filter: undefined,
                    show: false
                },
                feedActive: true,
                filter: function (type) {
                    if (type == 'exempt') {
                        angular.extend($scope.feed, {
                            show: false
                        });
                    }
                    // IDK if this is neaded or if we can filter it in the backend by type...
//                    else if (type == 'transformation') {
//                        $scope.feed = {
//                            id: $scope.profile_user.id,
//                            filter: '/group/transformation',
//                            show: true
//                        };
//                    }
                    else {
                        $scope.feed = {
                            id: $scope.profile_user.id,
                            filter: type?'/'+type+'/list':'',
                            show: true
                        };
                    }
                },
                clientFilter: function() {
                    $scope.feed = {
                        id: $stateParams.view == $scope.user_id ? null : $stateParams.view,
                        filter: '/client',
                        show: true
                    };
                },
                userResource: $resource(":protocol://:url/users/profile/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@id"
                }, {update: { method: 'PUT' }}),
                entryResource : $resource(":protocol://:url/feed/entry/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@id"
                }, {update: { method: 'PUT' }}),
                followResource: $resource(":protocol://:url/users/follow/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@id"
                }, {update: { method: 'PUT' }}),
                blockResource: $resource(":protocol://:url/users/block/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@id"
                }, {update: { method: 'PUT' }}),
                connectResource: $resource(":protocol://:url/users/connect/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@id"
                }, {update: { method: 'PUT' }}),
                followToggle: function () {
                    $scope.followResource.update({id: $scope.user_id, user_id: $scope.profile_user.id}, function (data) {

                        $scope.profile_user.user_follows = data.user_follows;
                    });
                },
                blockToggle: function () {
                    $scope.blockResource.update({id: $scope.user_id, user_id: $scope.profile_user.id}, function (data) {

                        $scope.profile_user.user_blocks = data.user_blocks;
                    });
                },
                connect: function () {
                    if($scope.user_type == 'user'){
                        localStorageService.add('profesional', $scope.profile_user.id);
                        $state.go('upgrade');
                    }else{
                        $scope.connectResource.update({id: $scope.user_id, professional_id: $scope.profile_user.id}, function (data) {
                            $scope.profile_user.user_connected = data.user_connected
                        });
                    }
                },
                getProfile: function () {
                    $scope.userResource.get({id: $stateParams.view || $scope.user_id}, function (data) {
                        $scope.feedActive = true;
                        $scope.profile_user = data;
                        $scope.feed = {
                            id: $scope.profile_user.id,
                            filter: $scope.feed.filter,
                            show: $scope.feed.show
                        };
                        // Add Click functions to Map Referrals
                        angular.forEach($scope.profile_user.referrals, function (value, key) {
                            angular.extend($scope.profile_user.referrals[key], {
                                click: function () {
                                    $state.go('profile.view', {view: $scope.profile_user.referrals[key].id});
                                }
                            });
                        });

                    }, $scope.checkTokenError);
                },
                referralIcon: {
                    //url: encodeURI('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="50px" viewBox="0 0 30 50" ><path fill="#1A8CFF" d="M8.018,13.542c0.05-2.435,2.312-4.583,4.752-4.47c2.333,0.001,4.469,2.031,4.556,4.369 c0.032,1.122,0.006,2.245,0.014,3.367c0.76,0.067,1.5,0.296,2.159,0.678c1.281-0.157,2.648,0.076,3.714,0.831 c0.167,0.109,0.338,0.246,0.552,0.22c1.252,0.002,2.538,0.396,3.473,1.252c0.97,0.861,1.541,2.11,1.696,3.388 c0.192,1.532-0.075,3.078-0.454,4.561c-0.494,1.937-1.371,3.761-1.74,5.73c-0.1,0.506-0.063,1.022-0.069,1.533 c0,1.399-0.002,2.799,0,4.199c0.004,0.491-0.08,1-0.357,1.417c-0.417,0.672-1.183,1.101-1.973,1.099 c-3.639,0.012-7.277,0.004-10.914,0.005c-0.492-0.005-0.998,0.033-1.473-0.121c-0.931-0.296-1.617-1.222-1.607-2.204 c-0.006-1.558,0-3.114-0.003-4.672c-0.003-0.384,0.052-0.801-0.161-1.144c-0.56-0.883-1.372-1.564-2.167-2.226 c-0.757-0.649-1.535-1.285-2.391-1.802c-1.195-0.658-2.497-1.157-3.554-2.04c-0.573-0.479-1.006-1.163-1.045-1.922 c-0.048-1.283,0.241-2.612,0.995-3.67c0.549-0.804,1.397-1.398,2.348-1.619c1.204-0.284,2.482-0.158,3.644,0.246 C8.016,18.211,8.001,15.876,8.018,13.542z M10.346,13.729c-0.006,3.502,0,7.004-0.003,10.507 c-0.614-0.067-1.136-0.423-1.651-0.737c-0.71-0.473-1.507-0.826-2.352-0.967c-0.714-0.091-1.523-0.086-2.104,0.4 c-0.669,0.582-0.871,1.521-0.888,2.373c-0.025,0.25,0.208,0.406,0.379,0.543c0.538,0.385,1.133,0.681,1.722,0.979 c1.658,0.765,3.116,1.888,4.464,3.106c0.862,0.788,1.811,1.54,2.344,2.605c0.371,0.663,0.442,1.439,0.417,2.187 c3.888-0.002,7.773,0,11.662-0.002c-0.055-1.26,0.201-2.508,0.605-3.694c0.396-1.194,0.798-2.387,1.181-3.587 c0.407-1.321,0.671-2.725,0.469-4.107c-0.115-0.761-0.447-1.535-1.102-1.98c-0.829-0.562-1.893-0.545-2.846-0.424 c-0.208-0.192-0.351-0.458-0.597-0.612c-0.861-0.588-2.065-0.76-2.998-0.233c-0.3-0.279-0.617-0.549-0.996-0.712 c-0.984-0.446-2.184-0.245-3.045,0.38c-0.008-2.01,0.004-4.02-0.004-6.03c0.019-1.168-0.981-2.238-2.143-2.316 C11.572,11.281,10.339,12.441,10.346,13.729z M22.793,37.118c-0.51,0.172-0.865,0.722-0.772,1.26 c0.069,0.612,0.692,1.099,1.306,0.997c0.646-0.074,1.137-0.758,0.986-1.393C24.188,37.321,23.426,36.873,22.793,37.118z"/></svg>')
                    url: encodeURI('/media/referralIcon.png')
                },
                initReach: function () {
                    $scope.hideFeed();
                    $scope.map.control.refresh({
                        latitude: 38.828127,
                        longitude: -98.579404
                    });
                },
                initCalendar: function () {
                    $scope.showCalendar = true;
                    $scope.hideFeed();
                },
                map: {
                    center: {
                        latitude: 39.828127,
                        longitude: -98.579404
                    },
                    zoom: 4,
                    control: {
                    },
                    options: {
                        zoomControlOptions: {
                            style: google.maps.ZoomControlStyle.SMALL
                        }
                    }
                },
                hideFeed: function () {
                    angular.extend($scope.feed, {
                        show: false
                    });
                }
            });
            //init view
            $scope.$on('$stateChangeSuccess', $scope.getProfile);
        }
    ]);
});