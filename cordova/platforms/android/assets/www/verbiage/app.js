'use strict';
define(['app'], function(app) {
    app.register.controller('verbiageCtrl', ['$scope', 'localStorageService', function($scope, localStorageService) {
        $scope.user_type = localStorageService.get('user_type');
    }]);
});