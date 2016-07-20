'use strict';

define(['app'], function (app) {
    app.register.controller('settingsCtrl', ['$scope', '$resource', '$modal', '$http', 'localStorageService', 'rest', 'tokenError','specialtyTags',
        function ($scope, $resource, $modal, $http, localStorageService, tokenError) {

            Stripe.setPublishableKey("pk_test_xO4m1cYHr0GCBYbSH2GxdXp8");
            $scope.user_id = localStorageService.get('user_id');
            $scope.tags = [];
            $scope.webURL = window.location.host;
            // holds the address to format it into 1 variable
            //$scope.addressHolder = '';
            $scope.tempAddressPay = {
            formatted_address:'',
            street_line2:'',
            };
            $scope.address = {
                street_line1: '',
                street_line2: '',
                city: '',
                state: '',
                country: '',
                zipcode: '',
                lat: '',
                lng: ''
            };
            $scope.tempAddress = {
                formatted_address:'',
                street_line2:'',
            };

            var userResource = $resource(":protocol://:url/users/:id/", {
                protocol: $scope.restProtocol,
                url: $scope.restURL,
                id: $scope.user_id
            }, {update: { method: 'PATCH' }});
            var professionalResource = $resource(":protocol://:url/users/professionals/:id/", {
                protocol: $scope.restProtocol,
                url: $scope.restURL,
                id: $scope.user_id
            }, {update: { method: 'PATCH' }});
            var creditcardResource = $resource(":protocol://:url/users/creditcards/:id/", {
                protocol: $scope.restProtocol,
                url: $scope.restURL,
                id: $scope.user_id
            }, {update: { method: 'PATCH' }});

            //init
            $scope.profile_user = userResource.get(function () {
                if ($scope.profile_user.type == "professional") {
                    $scope.profileResource = professionalResource
                } else {
                    $scope.profileResource = userResource
                }
                //holds a formatted variable
                $scope.tempAddress.formatted_address = $scope.profile_user.primary_address.street_line1 + $scope.profile_user.primary_address.street_line2 
                                        + $scope.profile_user.primary_address.city + $scope.profile_user.primary_address.state;
                


                // Lazy load credit card information so delay is unnoticed to user
                creditcardResource.get(function (data) {
                    $scope.profile_user.creditcard = data.creditcard;
                });

            }, $scope.checkTokenError);

            $scope.passwordChange = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/passwordChange.html',
                    controller: passwordInstanceCtrl,
                    size: size
                });
                modalInstance.result.then(function () {
                }, function () {
                });
            };
            $scope.emailChange = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/emailChange.html',
                    controller: emailChangeCtrl,
                    size: size,
                    resolve: {
                        email: function () {
                            return  $scope.profile_user.email;
                        },
                        id: function () {
                            return $scope.profile_user.id;
                        },
                        profileResource: function () {

                            return $scope.profileResource
                        }
                    }
                });
                modalInstance.result.then(function (email) {
                    $scope.profile_user.email = email;
                }, function () {
                });
            };
            $scope.photoChange = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/photoChange.html',
                    controller: 'photoChangeCtrl'
                });
                modalInstance.result.then(function (data) {
                    data.path = data.path.substring(6);
                    $scope.profile_user.img = data.path;
                    localStorageService.add('user_img',"/media" + $scope.profile_user.img);
                }, $.noop());
            };
            $scope.paymentDetail = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/paymentDetail.html',
                    controller: paymentDetailCtrl,
                    size: size,
                    resolve: {
                        email: function () {
                            return  $scope.profile_user.email;
                        },
                        profile_user: function () {
                            return  $scope.profile_user;
                        },
                        profileResource: function () {
                            return $scope.profileResource
                        }
                    }
                });
                modalInstance.result.then(function () {
                }, function () {
                });
            };
            $scope.addCertification = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/addCertification.html',
                    controller: addCertificationCtrl,
                    size: size,
                    resolve: {
                        email: function () {
                            return  $scope.profile_user.email;
                        },
                        profileResource: function () {
                            return $scope.profileResource
                        },
                        profile_user: function () {
                            return  $scope.profile_user;
                        }
                    }
                });
                modalInstance.result.then(function (certs) {
                    var temp = {};
                    $scope.profile_user.certifications.push(certs);
                    temp["certifications"] = $scope.profile_user.certifications
                    $scope.profileResource.update({id: $scope.profile_user.id, }, temp);
                }, function () {
                });
            };
            $scope.deleteCertification = function (removeCert) {
                var certs = $scope.profile_user.certifications
                var index = certs.indexOf(removeCert);
                var temp = {}
                //remove the cert
                $scope.profile_user.certifications.splice(index, 1);
                // convert to clean format to return back to server
                certs = angular.toJson($scope.profile_user.certifications)
                temp["certifications"] = $scope.profile_user.certifications
                $scope.profileResource.update({id: $scope.profile_user.id}, temp);

            };
            $scope.updateProfile = function () {
                var resourceType;
                var temp = $scope.profile_user;
                var img = temp['img'];
                var ref = temp['referred_by'];
                delete temp['img'];
                delete temp['referred_by'];
                
                $scope.tags = [];
                $scope.profile_user.tags.forEach(function (obj) {
                    $scope.tags.push(obj.name)
                });
                // returning tags in list form
                temp.tags = $scope.tags


                
                var obj = $scope.profileResource.update({id: $scope.profile_user.id}, temp,
                    function(){
                        temp['img'] = img;
                        temp['referred_by'] = ref;
                });
            };
            $scope.cancelMembership = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: 'settings/modals/cancelMembership.html',
                    controller: cancelMembershipCtrl,
                    size: size,
                    resolve: {
                        email: function () {
                            return  $scope.profile_user.email;
                        },
                        profileResource: function () {
                            return $scope.profileResource
                        },
                        profile_user: function () {
                            return  $scope.profile_user;
                        }
                    }
                });
            };

            var tagCollection = $resource(":protocol://:url/all-tags/",{
                protocol: $scope.restProtocol,
                url: $scope.restURL,
            },{update: { method: 'PATCH' }});


            $scope.tagsCall = tagCollection.get($scope.user, function(){
                $scope.temTags = $scope.tagsCall.results;

            },function(error) {
                $scope.message = error.data;
            });
            
            $scope.onTagAdd = function (tag) {
                $scope.tags = [];
                $scope.profile_user.tags.forEach(function (obj) {
                    $scope.tags.push(obj.name)
                });
            }
            $scope.onDeleteTag = function (tag) {
                if ($scope.tags.indexOf(tag.text) != -1) {
                    var temp = $scope.tags.indexOf(tag.name);
                    $scope.tags.splice(temp, 1);
                }
            };
            $scope.loadSpecialty = function (query) {
                var tagTemp, deferred;
                deferred = $scope.q.defer();
                tagTemp = tagCollection.get({search:query}, function(){
                    deferred.resolve(tagTemp.results);
                });  
                return deferred.promise;
            };

            $scope.setAddress = function($data) {
                if ($scope.tempAddress.formatted_address !== "undefined")
                {
                    $scope.address = $scope.addressesInputs[$data];
                    if ($scope.address !== undefined){
                        $scope.address.street_line2 = (!($scope.tempAddress.street_line2 === undefined)?$scope.tempAddress.street_line2 + ' ':'');
                    }
                    $scope.profile_user.primary_address = $scope.address;
                    //set lat and lng of the user for google map marker
                    $scope.profile_user.lat = $scope.address.lat
                    $scope.profile_user.lng = $scope.address.lng
                    $scope.profile_user.location = $scope.address.city + ', ' + $scope.address.state

                }
            };

            //$Google GeoLocation
            $scope.addressesInputs = {};
            $scope.getLocation = function(val) {
                delete $http.defaults.headers.common['Authorization']
                return $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                    address: val,
                    sensor: false,
                    components:'country:USA'
                    }
                }).then(function(res){
                    $scope.addressesInputs = {};
                    var addresses = [];
                    var types = {};
                    angular.forEach(res.data.results, function(item){
                        for (var i = 0; i < item.address_components.length; i++) {
                            var addressType = item.address_components[i].types[0];
                            types[addressType] = i;
                        };
                        addresses.push(item.formatted_address);
                        for (var i = 0; i < item.address_components.length; i++) {
                            $scope.addressesInputs[item.formatted_address] = {
                                street_line1: (!(types['street_number'] === undefined)?item.address_components[types['street_number']]['short_name'] + ' ':'') + (!(types['route'] === undefined)?item.address_components[types['route']]['long_name'] + ' ':''),
                                city: (!(types['locality'] === undefined)?item.address_components[types['locality']]['short_name']:!(types['sublocality'] === undefined)?item.address_components[types['sublocality']]['short_name']:!(types['neighborhood'] === undefined)?item.address_components[types['neighborhood']]['short_name'] + ' ':''),
                                state: (!(types['administrative_area_level_1'] === undefined)?item.address_components[types['administrative_area_level_1']]['short_name'] + ' ':''),
                                country: (!(types['country'] === undefined)?item.address_components[types['country']]['long_name'] + ' ':''),
                                zipcode: (!(types['postal_code'] === undefined || item.address_components[types['postal_code']] === undefined)?item.address_components[types['postal_code']]['short_name']:''),
                                lat: item.geometry.location.lat,
                                lng: item.geometry.location.lng
                            };
                        };
                    });
                    $http.defaults.headers.common['Authorization'] = localStorageService.get('Authorization');
                    return addresses;
                });
            };


    }]);


    app.register.service('specialtyTags', function ($q, $rootScope) {
        $rootScope.q = $q
    });



    var passwordInstanceCtrl = function ($scope, $resource, $modalInstance, localStorageService) {
        var AuthChange = $resource(":protocol://:url/accounts/change-password", {
            protocol: $scope.restProtocol,
            url: $scope.restURL
        });

        $scope.user = {
            token: localStorageService.get('rest_token'),
            current_password: '',
            password: '',
            password2: ''
        };

        $scope.closeAlert = function (error) {
            delete $scope.message[error];
        };

        $scope.ok = function () {
            // AutoFill Fix
            angular.element(document.getElementsByTagName('input')).checkAndTriggerAutoFillEvent();
            $scope.authToken = AuthChange.save($scope.user, function () {
                localStorageService.clearAll();
                window.location = "/";
            }, function (error) {
                $scope.message = error.data;
            });
        }

        $scope.cancel = function () {
            $modalInstance.dismiss();
        };
    };
    var emailChangeCtrl = function ($scope, $resource, $modalInstance, localStorageService, email, id, profileResource) {
        $scope.email = email;
        $scope.message = '';
        $scope.closeAlert = function (error) {
            delete $scope.message[error];
        };
        $scope.ok = function (emailEdit) {
            profileResource.update({id: id}, {email: emailEdit, id: id}).$promise.then(function () {
                $modalInstance.close(emailEdit);
            }, function (error) {
                $scope.message = error.data;
            })
        };
        $scope.cancel = function () {
            $modalInstance.dismiss();
        };
    };


    var paymentDetailCtrl = function ($scope, $resource, $modalInstance, localStorageService, $http, profile_user, profileResource) {
        $scope.message = '';

        if (profile_user.creditcard) {
            $scope.creditcard = {
                name: profile_user.creditcard.name,
                number: profile_user.creditcard.number,
                cvc: profile_user.creditcard.cvc,
                exp_month: profile_user.creditcard.exp_month,
                exp_year: profile_user.creditcard.exp_year,
                address_line1: profile_user.creditcard.address_line1,
                address_line2: profile_user.creditcard.address_line2,
                address_city: profile_user.creditcard.address_city,
                address_country: profile_user.creditcard.address_country,
                address_state: profile_user.creditcard.address_state,
                address_zip: profile_user.creditcard.address_zip,
            }

        } else {
            $scope.creditcard = {
                name: "",
                number: "",
                cvc: "",
                exp_month: "",
                exp_year: "",
                address_line1: "",
                address_line2: "",
                address_city: "",
                address_country: "",
                address_state: "",
                address_zip: ""
            }
        }

        $scope.ok = function () {
            var stripeToken;
            var paymentResource = $resource(":protocol://:url/users/modify-payment-details/:id", {
                id: profile_user.id,
                protocol: $scope.restProtocol,
                url: $scope.restURL
            }, {update: { method: 'PATCH' }});
            $http.defaults.headers.common['Authorization'] = localStorageService.get('Authorization');
            Stripe.createToken({
                name: $scope.creditcard.name,
                number: $scope.creditcard.number,
                cvc: $scope.creditcard.cvc,
                exp_month: $scope.creditcard.exp_month,
                exp_year: $scope.creditcard.exp_year,
                address_line1: $scope.creditcard.address_line1,
                address_line2: $scope.creditcard.address_line2,
                address_city: $scope.creditcard.address_city,
                address_country: $scope.creditcard.address_country,
                address_state: $scope.creditcard.address_state,
                address_zip: $scope.creditcard.address_zip,
            }, function (status, response) {
                if (response.error) {
                    $scope.message = [response.error.message];
                    $scope.$apply();
                }
                else {
                    $scope.message = '';
                    $scope.$apply()
                    stripeToken = response['id'];
                    response = paymentResource.update({id: profile_user.id, stripeToken: stripeToken}, function () {
                    })
                    $modalInstance.close();

                }
            });
        };

        $scope.cancel = function () {
            // console.log($scope.profile_user);
            $modalInstance.dismiss();
        };

        //$Google GeoLocation
        $scope.addressesInputs = {};
        $scope.getLocation = function(val) {
            delete $http.defaults.headers.common['Authorization']
            return $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                address: val,
                sensor: false,
                components:'country:USA'
                }
            }).then(function(res){
                $scope.addressesInputs = {};
                var addresses = [];
                var types = {};
                angular.forEach(res.data.results, function(item){
                    for (var i = 0; i < item.address_components.length; i++) {
                        var addressType = item.address_components[i].types[0];
                        types[addressType] = i;
                    };
                    addresses.push(item.formatted_address);
                    for (var i = 0; i < item.address_components.length; i++) {
                        $scope.addressesInputs[item.formatted_address] = {
                            street_line1: (!(types['street_number'] === undefined)?item.address_components[types['street_number']]['short_name'] + ' ':'') + (!(types['route'] === undefined)?item.address_components[types['route']]['long_name'] + ' ':''),
                            city: (!(types['locality'] === undefined)?item.address_components[types['locality']]['short_name']:!(types['sublocality'] === undefined)?item.address_components[types['sublocality']]['short_name']:!(types['neighborhood'] === undefined)?item.address_components[types['neighborhood']]['short_name'] + ' ':''),
                            state: (!(types['administrative_area_level_1'] === undefined)?item.address_components[types['administrative_area_level_1']]['short_name'] + ' ':''),
                            country: (!(types['country'] === undefined)?item.address_components[types['country']]['long_name'] + ' ':''),
                            zipcode: (!(types['postal_code'] === undefined || item.address_components[types['postal_code']] === undefined)?item.address_components[types['postal_code']]['short_name']:''),
                            lat: item.geometry.location.lat,
                            lng: item.geometry.location.lng
                        };
                    };
                });
                $http.defaults.headers.common['Authorization'] = localStorageService.get('Authorization');
                return addresses;
            });
        };


        $scope.setAddressPay = function() {
            if ($scope.tempAddressPay.formatted_address !== "undefined")
            {
                $scope.creditcard.address_line1 = (!($scope.addressesInputs[$scope.tempAddressPay.formatted_address] === undefined)?$scope.addressesInputs[$scope.tempAddressPay.formatted_address].street_line1 + ' ':'');
                $scope.creditcard.address_city = (!($scope.addressesInputs[$scope.tempAddressPay.formatted_address] === undefined)?$scope.addressesInputs[$scope.tempAddressPay.formatted_address].city + ' ':'');
                $scope.creditcard.address_country = (!($scope.addressesInputs[$scope.tempAddressPay.formatted_address] === undefined)?$scope.addressesInputs[$scope.tempAddressPay.formatted_address].country + ' ':'');
                $scope.creditcard.address_state = (!($scope.addressesInputs[$scope.tempAddressPay.formatted_address] === undefined)?$scope.addressesInputs[$scope.tempAddressPay.formatted_address].state + ' ':'');
                $scope.creditcard.address_zip = (!($scope.addressesInputs[$scope.tempAddressPay.formatted_address] === undefined)?$scope.addressesInputs[$scope.tempAddressPay.formatted_address].zipcode + ' ':'');

                if ($scope.creditcard !== undefined){
                    $scope.creditcard.address_line2 = (!($scope.tempAddressPay.street_line2 === undefined)?$scope.tempAddressPay.street_line2 + ' ':'');
                }
            }
        };

    };



    var addCertificationCtrl = function ($scope, $resource, $modalInstance, localStorageService, profileResource, profile_user) {
        $scope.message = '';

        $scope.certifications = {
            certification_name: "",
            certification_number: "",
        };

        $scope.closeAlert = function (error) {
            delete $scope.message[error];
        };

        $scope.ok = function (valid) {
            $modalInstance.close($scope.certifications);
        }

        $scope.cancel = function () {
            $modalInstance.dismiss();
        };
    };
    var cancelMembershipCtrl = function ($scope, $resource, $modalInstance, localStorageService, profileResource, profile_user) {

        $scope.closeAlert = function (error) {
            delete $scope.message[error];
        };

        $scope.ok = function (valid) {
            var membershipResource = $resource(":protocol://:url/users/modify-membership/:id", {
                id: profile_user.id,
                protocol: $scope.restProtocol,
                url: $scope.restURL
            }, {update: { method: 'PATCH' }});
            membershipResource.get(function (data) {
                // console.log(data)
            })
            $modalInstance.close();
        }

        $scope.cancel = function () {
            $modalInstance.dismiss();
        };
    };

    app.register.controller('photoChangeCtrl', ['$scope', '$resource', '$modalInstance', '$upload', 'localStorageService', 'fileReader',
        function ($scope, $resource, $modalInstance, $upload, localStorageService, fileReader) {
            $scope.user_id = localStorageService.get('user_id');
            $scope.message = {};
            $scope.closeAlert = function (error) {
                delete $scope.message[error];
            };
            $scope.onFileSelect = function ($files) {
                $scope.uploadImg = $files[0];
                $scope.upload = $upload.upload({
                    url: $scope.restProtocol + '://' + $scope.restURL + '/upload-image/upload-profile-picture',
                    file: $scope.uploadImg
                }).progress(function (evt) {
                    $scope.percent = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function (data) {
                    fileReader.readAsDataUrl($scope.uploadImg, $scope).then(function (result) {
                        $scope.imgSrc = result;
                        $scope.percent = undefined;
                    });
                    delete $scope.uploadImg;
                    $scope.returnData = data;
                }).error(function (data) {
                    $scope.percent = false;
                    angular.extend($scope.message, data);
                });
            };
            $scope.ok = function () {
                if($scope.cords) {
                    var cords = $scope.cords,
                        widthHeight = $scope.widthHeight;
                    $scope.upload = $upload.upload({
                        url: $scope.restProtocol + '://' + $scope.restURL + '/upload-image/crop-profile-picture',
                        data: {
                            id: $scope.returnData.id,
                            cropping: cords.x + ',' + cords.y + ',' + cords.x2 + ',' + cords.y2,
                            WidthHeight: widthHeight.w + ',' + widthHeight.h,
                            user_id: $scope.user_id
                        }
                    }).progress(function (evt) {
                        $scope.percent = parseInt(100.0 * evt.loaded / evt.total);
                    }).success(function (data) {
                        $modalInstance.close(data);
                    }).error(function (data) {
                        $scope.percent = undefined;
                        angular.extend($scope.message, data);
                    });
                }
                else {
                    angular.extend($scope.message, {
                        "image": ["Image not cropped."]
                    });
                }
            };
            $scope.cancel = function () {
                $modalInstance.dismiss();
            };
        }]);
    app.register.directive('cropImg', ['$window',
        function ($window, shareImg) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    src: '='
                },
                link: function (scope, element) {
                    var clear = function () {
                        if (element.myImg) {
                            element.myImg.remove();
                            delete element.myImg;
                        }
                    };
                    scope.$on('$destroy', clear);
                    scope.$watch('src', function (src) {
                        clear();
                        if (!src) return;
                        element.after('<img style="display: none;"/>');
                        element.myImg = element.next();
                        element.myImg.attr('src', src);
                        element.myImg.on('load', function () {
                            var width = this.width,
                                height = this.height;
                            element.myImg.addClass('crop-img').show()
                            .Jcrop({
                                minSize: [500, 500],
                                trueSize: [width, height],
                                onSelect: function (cords) {
                                    scope.$parent.$parent.$apply(function () {
                                        scope.$parent.$parent.cords = cords;
                                        scope.$parent.$parent.widthHeight = {
                                            w: width,
                                            h: height
                                        };
                                    });
                                },
                                setSelect: [0,0,500,500],
                                aspectRatio: 1
                            });
                        })
                    });
                }
            };
        }]);
});





