'use strict';

define(['app'], function(app) {

    app.register.controller('contactCtrl', ['$scope','restricted',
    	function($scope) {
    		$scope.restricted();
    }]);


    app.register.controller('contactFormCtrl', ['$scope','$state','$resource','rest',
        function($scope,$state,$resource) {

            $scope.name = "";
            $scope.email = "";
            $scope.message = "";

            var contactResource =  $resource("http://:url/contact/contact/", {
                url: $scope.restURL
            });


            $scope.submit = function(valid){
            	if(valid == true){
            		$scope.contact = contactResource.save({name: $scope.name, email: $scope.email, message: $scope.message}, function() {
            		},function(error){
            			$scope.errMessage = error.data;
            		});
            		$state.go('home');
            	}
            };

    }]);

    
});