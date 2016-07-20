'use strict';
var nico = false;
define(['app', 'feed'], function (app) {
    app.register.controller('groupsCtrl', ['$scope', 'restricted',
        function ($scope) {
            $scope.restricted();
        }]);
    app.register.controller('groupsController', ['$scope', "$state", "$stateParams", '$resource', '$http', 'localStorageService', 'rest', 'tokenError',
        function ($scope, $state, $stateParams, $resource, $http, localStorageService, tokenError) {
            angular.extend($scope, {
                group: '',
                user_id: localStorageService.get('user_id'),
                user_type: localStorageService.get('user_type'),
                entry : '',
                feed: {
                    id: undefined,
                    filter: undefined,
                    show: false
                },
                feedActive: true,
                filterType: undefined,
                filter: function (type) {
                    $scope.filterType = type;
                    $scope.feed = {
                        filter: '/group/'+ $scope.group + ($scope.filterType?'/' + $scope.filterType:''),
                        show: true,
                        entryTags : [$scope.group]
                    };
                },
                fanaticsResource: $resource(":protocol://:url/users/group/:group/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: "@group"
                }, {update: { method: 'PUT' }}),
                getGroup: function () {
                    if($stateParams.group) {
                        $scope.group = $stateParams.group;
                        $scope.feedActive = true;
                        $scope.feed = {
                            filter: '/group/'+ $scope.group + ($scope.filterType?'/' + $scope.filterType:''),
                            show: $scope.feed.show,
                            entryTags : [$scope.group]
                        };
                    }
                },
                hideFeed: function () {
                    angular.extend($scope.feed, {
                        show: false
                    });
                },
                fanatics: [],
                getFanatics: function() {
                    $scope.hideFeed();
                    $scope.fanaticsResource.get({group: $scope.group}, function(data) {
                        $scope.fanatics = data.results;
                    });
                }
            });
            //init view
            $scope.$on('$stateChangeSuccess', $scope.getGroup);
        }
    ]);
});