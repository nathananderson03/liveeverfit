'use strict';
define(['app'], function (app) {
    app.register.controller('shopCtrl', ['$scope', 'restricted',
        function ($scope) {
            $scope.restricted();
        }]);
    app.register.controller('shopController', ['$scope', "$state", "$stateParams", "$sce",
        function ($scope, $state, $stateParams, $sce) {
            angular.extend($scope, {
                //url: $sce.trustAsResourceUrl('http://store.liveeverfit.com/' + ($stateParams.collection?'collections/'+$stateParams.collection:'') + ($stateParams.type?'/'+$stateParams.type:'')),
                stateChange: function() {
                    $scope.url = $sce.trustAsResourceUrl('http://store.liveeverfit.com/'  + ($state.current.name=='shop.cart'?'cart':'') + ($stateParams.collection?'collections/'+$stateParams.collection:'') + ($stateParams.type?'/'+$stateParams.type:''));
                }
            });
            //init view
            $scope.$on('$stateChangeSuccess', $scope.stateChange);
        }
    ]);
});