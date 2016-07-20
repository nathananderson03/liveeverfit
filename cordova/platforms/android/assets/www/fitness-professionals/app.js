'use strict';

define(['app'], function (app) {
    app.register.controller('fitness-professionalsCtrl', ['$scope', 'restricted',
        function ($scope) {
            $scope.restricted();
        }]);
    app.register.controller("fitness-professionalsController", ["localStorageService", "geolocation", "$scope", "$http", "$resource", "rest", "tokenError", "specialtyTags",
        function (localStorageService, geolocation, $scope, $http, $resource) {
            var filterProfessionalCollection = $resource("http://:url/users/professionals?:filter", {
                    url: $scope.restURL,
                    filter: '@filter'
                }),
                locationlCollection = $resource("http://:url/users/location", {
                    url: $scope.restURL
                }),
                tagCollection = $resource("http://:url/all-tags", {
                    url: $scope.restURL
                });
                
            $scope.tagSelected = [];
            $scope.specialtySearch = "";
            $scope.profession = [];
            $scope.professionSelected = {};
            $scope.gender = [];
            $scope.genderSelected = {};
            $scope.location = [];
            $scope.accepting = [];
            $scope.locations = [];
            $scope.page = 1;
            $scope.bigMarkerSize = new google.maps.Size(35, 58);
            $scope.locationsJson = locationlCollection.get(function () {
                $scope.locationsJson.results.forEach(function (entry) {
                    $scope.locations.push(entry.location);
                });
            }, $scope.checkTokenError);
            $scope.professionOnClick = function (value) {
                if ($scope.profession.indexOf(value) == -1) {
                    $scope.profession.push(value);
                    $scope.professionSelected[value] = true;
                }
                else {
                    $scope.profession.splice($scope.profession.indexOf(value), 1);
                    $scope.professionSelected[value] = false;
                }
                $scope.filter();
            };
            $scope.genderOnClick = function (value) {
                if ($scope.gender.indexOf(value) == -1) {
                    $scope.gender.push(value);
                    $scope.genderSelected[value] = true;
                }
                else {
                    $scope.gender.splice($scope.gender.indexOf(value), 1);
                    $scope.genderSelected[value] = false;

                }
                $scope.filter();
            };
            $scope.locationOnChange = function () {
                if ($scope.location.length <= 0) {
                    $scope.location = [];
                }
                $scope.filter();
            };
            $scope.findMe = function () {
                $scope.findMeLoading = true;
                geolocation.getLocation().then(function (data) {
                    angular.extend($scope.map, {
                        center: data.coords,
                        zoom: 10
                    });
                    delete $http.defaults.headers.common['Authorization'];
                    $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                        params: {
                            latlng: data.coords.latitude + ',' + data.coords.longitude,
                            sensor: true
                        }
                    }).then(function (res) {
                        var types = {},
                            city = null,
                            state = null;
                        for (var i = 0; i < res.data.results[0].address_components.length; i++) {
                            types[res.data.results[0].address_components[i].types[0]] = i;
                        }
                        city = (!(types['locality'] === undefined) ? res.data.results[0].address_components[types['locality']]['short_name'] : !(types['sublocality'] === undefined) ? res.data.results[0].address_components[types['sublocality']]['short_name'] : !(types['neighborhood'] === undefined) ? res.data.results[0].address_components[types['neighborhood']]['short_name'] + ' ' : '');
                        state = (!(types['administrative_area_level_1'] === undefined) ? res.data.results[0].address_components[types['administrative_area_level_1']]['short_name'] + ' ' : '').trim();

                        $scope.location = city + ', ' + state;
                        $scope.filter();
                        $scope.findMeLoading = false;
                    });
                    $http.defaults.headers.common['Authorization'] = localStorageService.get('Authorization');
                });
            };
            $scope.loadSpecialty = function (query) {
                var tagTemp, deferred;
                deferred = $scope.q.defer();
                tagTemp = tagCollection.get({search:query}, function(){
                    deferred.resolve(tagTemp.results);
                });  
                return deferred.promise;
            };
            $scope.tags = tagCollection.get($.noop(), $scope.checkTokenError);
            $scope.addTag = function (tag) {
                // Ensures that no two tags are replicated
                if ($scope.specialtySearch.indexOf(tag) == -1) {
                    $scope.specialtySearch.push(tag);
                    $scope.tagSelected.push(tag.name);
                }
                else {
                    var temp = $scope.specialtySearch.indexOf(tag);
                    $scope.specialtySearch.splice(temp, 1);
                    $scope.tagSelected.splice(temp, 1);
                }
                $scope.filter()
            };
            $scope.onTagAdd = function (tag) {
                $scope.tagSelected = [];
                $scope.specialtySearch.forEach(function (item) {
                    $scope.tagSelected.push(item.name);
                });
                $scope.filter()
            };
            $scope.onDeleteTag = function (tag) {
                var temp = $scope.tagSelected.indexOf(tag.name);
                $scope.tagSelected.splice(temp, 1);
                $scope.filter()
            };
            //This section is for the google map
            $scope.map = {
                center: {
                    latitude: 38.719805,
                    longitude: -98.613281
                },
                zoom: 4,
                control: {}
            };
            $scope.proMouseOver = function (professional) {
                professional.marker.icon.size = professional.marker.icon.scaledSize = $scope.bigMarkerSize;
                $scope.map.control.refresh(professional.marker.coords);
            };
            $scope.proMouseOut = function (professional) {
                professional.marker.icon.size = professional.marker.icon.scaledSize = null;
                $scope.map.control.refresh(professional.marker.coords);
            };
            //filter function
            $scope.filter = function () {
                $scope.page = 1;
                var filterPros = filterProfessionalCollection.get({
                    profession: $scope.profession,
                    gender: $scope.gender,
                    location: $scope.location,
                    accepting: $scope.accepting,
                    tags: $scope.tagSelected
                }, function () {
                    $scope.professionals = filterPros.results;
                    $scope.next = filterPros.next;
                    angular.forEach($scope.professionals, function (value, key) {
                        var professional = $scope.professionals[key],
                            profession = {
                                "Instructor": '<path fill="rgb(250,250,250)" d="m17.0715 14.292c1.483-0.643 3.117-0.848 4.722-0.839 1.525 0.047 3.01 0.555 4.323 1.315 1.403 0.856 2.714 1.863 3.895 3.007 1.138-1.113 2.407-2.083 3.757-2.925 1.55-0.932 3.36-1.511 5.183-1.381 1.959 0.051 3.96 0.544 5.567 1.702 1.651 1.165 2.775 2.993 3.187 4.962 0.36401 1.704 0.409 3.506-0.083 5.189 -0.817 2.8-2.73299 5.114-4.80299 7.102 -3.978 3.828-7.952 7.66-11.932 11.489 -0.463 0.473-1.288 0.475-1.752 0.002 -4.377-4.221-8.751-8.443-13.129-12.663 -1.364-1.541-2.658-3.219-3.342-5.184 -0.365-0.979-0.603-2.009-0.632-3.056 -0.005-1.28 0.126-2.576 0.533-3.795 0.686-2.196 2.377-4.047 4.506-4.925l-0.00001 0z"/>',
                                "Nutritionist": '<path fill="rgb(250,250,250)" d="m17.0715 14.292c1.483-0.643 3.117-0.848 4.722-0.839 1.525 0.047 3.01 0.555 4.323 1.315 1.403 0.856 2.714 1.863 3.895 3.007 1.138-1.113 2.407-2.083 3.757-2.925 1.55-0.932 3.36-1.511 5.183-1.381 1.959 0.051 3.96 0.544 5.567 1.702 1.651 1.165 2.775 2.993 3.187 4.962 0.36401 1.704 0.409 3.506-0.083 5.189 -0.817 2.8-2.73299 5.114-4.80299 7.102 -3.978 3.828-7.952 7.66-11.932 11.489 -0.463 0.473-1.288 0.475-1.752 0.002 -4.377-4.221-8.751-8.443-13.129-12.663 -1.364-1.541-2.658-3.219-3.342-5.184 -0.365-0.979-0.603-2.009-0.632-3.056 -0.005-1.28 0.126-2.576 0.533-3.795 0.686-2.196 2.377-4.047 4.506-4.925l-0.00001 0z"/>',
                                "Trainer": '<path fill="rgb(250,250,250)" d="m27.3495 9.717c1.709-0.572 3.606-0.568 5.318-0.003 0.168 0.073 0.338 0.142 0.51 0.21 0.14 0.065 0.277 0.132 0.419 0.195 1.137 0.617 2.096 1.525 2.866 2.559 1.36401 1.988 1.632 4.597 0.927 6.877 -0.731 2.056-2.342 3.785-4.341 4.652 -1.428 0.62-3.041 0.718-4.564 0.463 -2.678-0.5-4.948-2.559-5.86-5.106 -0.471-1.552-0.514-3.24-0.062-4.8 0.365-1.252 1.086-2.381 2.025-3.282 0.648-0.648 1.409-1.179 2.243-1.559 0.172-0.066 0.347-0.134 0.519-0.206zM18.9365 24.782c1.047-0.896 2.441-1.346 3.813-1.325 0.159 0.005 0.315 0.053 0.468 0.098 0.291 0.224 0.602 0.419 0.923 0.594 0.884 0.637 1.832 1.196 2.873 1.536 1.704 0.648 3.621 0.746 5.369 0.202 0.39-0.121 0.778-0.251 1.155-0.408 0.636-0.247 1.238-0.577 1.796-0.969 0.486-0.344 1.019-0.618 1.496-0.974 1.061-0.207 2.184 0.062 3.145 0.53 1.134 0.511 1.946 1.526 2.541 2.586l0.086 0.025c-0.011 0.047-0.033 0.14-0.04601 0.188l0.15 0.018c-0.014 0.047-0.03699 0.142-0.05099 0.189l0.104 0.011c0.065 0.146 0.134 0.291 0.2 0.436 0.81899 2.042 1.16599 4.248 1.223 6.438 0.096 1.149 0.039 2.342-0.398 3.424 -0.06699 0.147-0.13699 0.295-0.208 0.444l-0.035 0.031c-0.708 1.273-2.078 2.078-3.488 2.316 -0.442 0.053-0.887 0.097-1.334 0.099 -5.878-0.004-11.753 0.002-17.631-0.003 -1.256-0.008-2.534-0.354-3.535-1.134 -0.424-0.355-0.784-0.782-1.086-1.247 -0.067-0.15-0.131-0.301-0.201-0.448l-0.046-0.023c-0.395-1.07-0.497-2.227-0.399-3.36 0.078-2.451 0.443-4.957 1.537-7.179l0.097-0.012c-0.007-0.039-0.021-0.113-0.028-0.149 0.438-0.692 0.901-1.383 1.51-1.934z"/>'
                            },
                            gender = {
                                M: "26,140,255",
                                F: "255,0,102",
                                '': "125,135,144"
                            };
                        professional.marker = {
                            coords: {
                                latitude: value.lat,
                                longitude: value.lng
                            },
                            icon: {
                                url: encodeURI('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="50" viewBox="0 0 60 100"><path fill="rgb(' + gender[professional.gender] + ')" d="m50.532 9.799c-4.024-4.941-9.865-8.389-16.158-9.428 -1.444-0.252-2.907-0.371-4.37-0.371l-0.008 0c-1.463 0-2.926 0.119-4.37 0.371 -6.293 1.039-12.134 4.486-16.158 9.427 -4.099 4.957-6.345 11.398-6.237 17.828 0.158 2.438 0.861 4.801 1.734 7.07 1.508 5.257 6.578 11.108 6.578 11.108 6.28 6.377 7.42 8.29 9.586 11.821 1.594 2.969 2.752 5.15 4.25 9.875 3.49 11.716 3.72 27.245 4.617 32.451l0 0.049c0.001-0.008-0.001-0.017 0-0.024 0.001 0.008 0 0.017 0 0.024l0-0.049c1-5.20499 1.132-20.73499 4.621-32.451 1.498-4.724 2.658-6.906 4.252-9.875 2.166-3.531 3.307-5.443 9.587-11.82 0 0 5.071-5.852 6.579-11.108 0.873-2.269 1.576-4.631 1.734-7.07 0.108-6.43-2.138-12.871-6.237-17.828z"/>' + profession[professional.profession] + '</svg>')
                            },
                            events: {
                                click: function () {
                                    if ($scope.openedWindow) {
                                        $scope.openedWindow.show = false;
                                    }
                                    $scope.openedWindow = professional.marker.window;
                                    professional.marker.window.show = true;
                                    $scope.$apply();
                                },
                                mouseover: function (marker) {
                                    marker.icon.size = marker.icon.scaledSize = $scope.bigMarkerSize;
                                    $scope.$apply();
                                },
                                mouseout: function (marker) {
                                    marker.icon.size = marker.icon.scaledSize = null;
                                    $scope.$apply();
                                }
                            },
                            window: {
                                show: false,
                                options: {
                                    boxClass: 'custom-info-window',
                                    closeBoxURL: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" width="21" height="21" viewBox="0 0 450 450" xml:space="preserve"><path fill="#1A8CFF" d="M107.1 39c10.3-3.4 22.6-1.2 30.4 6.6 28.4 28.3 56.7 56.7 85 85 2.5 2.5 4.8 5.2 7.6 7.3 3.4-2.5 5.9-6 8.9-8.9 25.5-25.5 51-51 76.5-76.5 4.2-4.2 8.3-8.6 13.5-11.5 6.3-3.5 13.9-4 20.9-2.8 6.9 1.4 12.6 5.8 17.3 10.7 13.3 13.4 26.8 26.6 39.9 40.1 9 9 10.9 24 4.9 35.1 -3.5 6.2-9 11-14 16 -25.2 25.2-50.3 50.3-75.5 75.5 -2.4 2.4-5 4.6-7 7.4 0.6 0.9 1.3 1.7 2 2.4 27.9 27.8 55.7 55.7 83.5 83.5 5.4 5.4 11.3 11 13.3 18.6 1.9 7.4 1.5 15.7-2.2 22.5 -2.6 4.8-6.6 8.7-10.5 12.6 -12.7 12.6-25.2 25.5-38.1 37.9 -11.1 10.8-30.8 10.6-41.4-0.7 -28.2-28.1-56.3-56.3-84.5-84.4 -2.5-2.4-4.7-5.1-7.5-7.1 -2.4 1.9-4.4 4.2-6.6 6.3 -26.6 26.7-53.3 53.3-80 80 -5.2 5.3-10.8 10.8-18.2 12.8 -7.6 1.9-16.2 1.4-23.1-2.6 -3.7-2.1-6.8-5.2-9.8-8.2 -13.3-13.4-26.7-26.6-39.9-40 -10.7-10.9-10.7-30.2 0.1-41 28.3-28.4 56.7-56.6 85-85 2.5-2.5 5.2-4.8 7.3-7.6 -0.6-1-1.4-1.8-2.2-2.6 -29.2-29.1-58.3-58.3-87.6-87.5 -4.4-4.2-8.2-9.3-9.6-15.3 -1.6-7-1.3-14.6 2.1-21 2.7-5.4 7.1-9.6 11.3-13.8 11.5-11.5 23-23 34.5-34.5C97.2 44.4 101.7 40.8 107.1 39z"/></svg>',
                                    closeBoxMargin: '3px'
                                }
                            }
                        };
                    });
                }, $scope.checkTokenError);
            };
            $scope.filter();
            //Pagination
            $scope.getPros = function () {
                $scope.page = $scope.page + 1;
                var newPros = filterProfessionalCollection.get({
                    profession: $scope.profession,
                    gender: $scope.gender,
                    location: $scope.location,
                    accepting: $scope.accepting,
                    tags: $scope.tagSelected,
                    page: $scope.page
                }, function () {
                    $scope.professionals = $scope.professionals.concat(newPros.results);
                    $scope.next = newPros.next;
                    angular.forEach($scope.professionals, function (value, key) {
                        var professional = $scope.professionals[key],
                            profession = {
                                "Instructor": '<path fill="rgb(250,250,250)" d="m17.0715 14.292c1.483-0.643 3.117-0.848 4.722-0.839 1.525 0.047 3.01 0.555 4.323 1.315 1.403 0.856 2.714 1.863 3.895 3.007 1.138-1.113 2.407-2.083 3.757-2.925 1.55-0.932 3.36-1.511 5.183-1.381 1.959 0.051 3.96 0.544 5.567 1.702 1.651 1.165 2.775 2.993 3.187 4.962 0.36401 1.704 0.409 3.506-0.083 5.189 -0.817 2.8-2.73299 5.114-4.80299 7.102 -3.978 3.828-7.952 7.66-11.932 11.489 -0.463 0.473-1.288 0.475-1.752 0.002 -4.377-4.221-8.751-8.443-13.129-12.663 -1.364-1.541-2.658-3.219-3.342-5.184 -0.365-0.979-0.603-2.009-0.632-3.056 -0.005-1.28 0.126-2.576 0.533-3.795 0.686-2.196 2.377-4.047 4.506-4.925l-0.00001 0z"/>',
                                "Nutritionist": '<path fill="rgb(250,250,250)" d="m17.0715 14.292c1.483-0.643 3.117-0.848 4.722-0.839 1.525 0.047 3.01 0.555 4.323 1.315 1.403 0.856 2.714 1.863 3.895 3.007 1.138-1.113 2.407-2.083 3.757-2.925 1.55-0.932 3.36-1.511 5.183-1.381 1.959 0.051 3.96 0.544 5.567 1.702 1.651 1.165 2.775 2.993 3.187 4.962 0.36401 1.704 0.409 3.506-0.083 5.189 -0.817 2.8-2.73299 5.114-4.80299 7.102 -3.978 3.828-7.952 7.66-11.932 11.489 -0.463 0.473-1.288 0.475-1.752 0.002 -4.377-4.221-8.751-8.443-13.129-12.663 -1.364-1.541-2.658-3.219-3.342-5.184 -0.365-0.979-0.603-2.009-0.632-3.056 -0.005-1.28 0.126-2.576 0.533-3.795 0.686-2.196 2.377-4.047 4.506-4.925l-0.00001 0z"/>',
                                "Trainer": '<path fill="rgb(250,250,250)" d="m27.3495 9.717c1.709-0.572 3.606-0.568 5.318-0.003 0.168 0.073 0.338 0.142 0.51 0.21 0.14 0.065 0.277 0.132 0.419 0.195 1.137 0.617 2.096 1.525 2.866 2.559 1.36401 1.988 1.632 4.597 0.927 6.877 -0.731 2.056-2.342 3.785-4.341 4.652 -1.428 0.62-3.041 0.718-4.564 0.463 -2.678-0.5-4.948-2.559-5.86-5.106 -0.471-1.552-0.514-3.24-0.062-4.8 0.365-1.252 1.086-2.381 2.025-3.282 0.648-0.648 1.409-1.179 2.243-1.559 0.172-0.066 0.347-0.134 0.519-0.206zM18.9365 24.782c1.047-0.896 2.441-1.346 3.813-1.325 0.159 0.005 0.315 0.053 0.468 0.098 0.291 0.224 0.602 0.419 0.923 0.594 0.884 0.637 1.832 1.196 2.873 1.536 1.704 0.648 3.621 0.746 5.369 0.202 0.39-0.121 0.778-0.251 1.155-0.408 0.636-0.247 1.238-0.577 1.796-0.969 0.486-0.344 1.019-0.618 1.496-0.974 1.061-0.207 2.184 0.062 3.145 0.53 1.134 0.511 1.946 1.526 2.541 2.586l0.086 0.025c-0.011 0.047-0.033 0.14-0.04601 0.188l0.15 0.018c-0.014 0.047-0.03699 0.142-0.05099 0.189l0.104 0.011c0.065 0.146 0.134 0.291 0.2 0.436 0.81899 2.042 1.16599 4.248 1.223 6.438 0.096 1.149 0.039 2.342-0.398 3.424 -0.06699 0.147-0.13699 0.295-0.208 0.444l-0.035 0.031c-0.708 1.273-2.078 2.078-3.488 2.316 -0.442 0.053-0.887 0.097-1.334 0.099 -5.878-0.004-11.753 0.002-17.631-0.003 -1.256-0.008-2.534-0.354-3.535-1.134 -0.424-0.355-0.784-0.782-1.086-1.247 -0.067-0.15-0.131-0.301-0.201-0.448l-0.046-0.023c-0.395-1.07-0.497-2.227-0.399-3.36 0.078-2.451 0.443-4.957 1.537-7.179l0.097-0.012c-0.007-0.039-0.021-0.113-0.028-0.149 0.438-0.692 0.901-1.383 1.51-1.934z"/>'
                            },
                            gender = {
                                M: "26,140,255",
                                F: "255,0,102",
                                '': "125,135,144"
                            };
                        professional.marker = {
                            coords: {
                                latitude: value.lat,
                                longitude: value.lng
                            },
                            icon: {
                                url: encodeURI('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="50" viewBox="0 0 60 100"><path fill="rgb(' + gender[professional.gender] + ')" d="m50.532 9.799c-4.024-4.941-9.865-8.389-16.158-9.428 -1.444-0.252-2.907-0.371-4.37-0.371l-0.008 0c-1.463 0-2.926 0.119-4.37 0.371 -6.293 1.039-12.134 4.486-16.158 9.427 -4.099 4.957-6.345 11.398-6.237 17.828 0.158 2.438 0.861 4.801 1.734 7.07 1.508 5.257 6.578 11.108 6.578 11.108 6.28 6.377 7.42 8.29 9.586 11.821 1.594 2.969 2.752 5.15 4.25 9.875 3.49 11.716 3.72 27.245 4.617 32.451l0 0.049c0.001-0.008-0.001-0.017 0-0.024 0.001 0.008 0 0.017 0 0.024l0-0.049c1-5.20499 1.132-20.73499 4.621-32.451 1.498-4.724 2.658-6.906 4.252-9.875 2.166-3.531 3.307-5.443 9.587-11.82 0 0 5.071-5.852 6.579-11.108 0.873-2.269 1.576-4.631 1.734-7.07 0.108-6.43-2.138-12.871-6.237-17.828z"/>' + profession[professional.profession] + '</svg>')
                            },
                            events: {
                                click: function () {
                                    if ($scope.openedWindow) {
                                        $scope.openedWindow.show = false;
                                    }
                                    $scope.openedWindow = professional.marker.window;
                                    professional.marker.window.show = true;
                                    $scope.$apply();
                                },
                                mouseover: function (marker) {
                                    marker.icon.size = marker.icon.scaledSize = $scope.bigMarkerSize;
                                    $scope.$apply();
                                },
                                mouseout: function (marker) {
                                    marker.icon.size = marker.icon.scaledSize = null;
                                    $scope.$apply();
                                }
                            },
                            window: {
                                show: false,
                                options: {
                                    boxClass: 'custom-info-window',
                                    closeBoxURL: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" width="21" height="21" viewBox="0 0 450 450" xml:space="preserve"><path fill="#1A8CFF" d="M107.1 39c10.3-3.4 22.6-1.2 30.4 6.6 28.4 28.3 56.7 56.7 85 85 2.5 2.5 4.8 5.2 7.6 7.3 3.4-2.5 5.9-6 8.9-8.9 25.5-25.5 51-51 76.5-76.5 4.2-4.2 8.3-8.6 13.5-11.5 6.3-3.5 13.9-4 20.9-2.8 6.9 1.4 12.6 5.8 17.3 10.7 13.3 13.4 26.8 26.6 39.9 40.1 9 9 10.9 24 4.9 35.1 -3.5 6.2-9 11-14 16 -25.2 25.2-50.3 50.3-75.5 75.5 -2.4 2.4-5 4.6-7 7.4 0.6 0.9 1.3 1.7 2 2.4 27.9 27.8 55.7 55.7 83.5 83.5 5.4 5.4 11.3 11 13.3 18.6 1.9 7.4 1.5 15.7-2.2 22.5 -2.6 4.8-6.6 8.7-10.5 12.6 -12.7 12.6-25.2 25.5-38.1 37.9 -11.1 10.8-30.8 10.6-41.4-0.7 -28.2-28.1-56.3-56.3-84.5-84.4 -2.5-2.4-4.7-5.1-7.5-7.1 -2.4 1.9-4.4 4.2-6.6 6.3 -26.6 26.7-53.3 53.3-80 80 -5.2 5.3-10.8 10.8-18.2 12.8 -7.6 1.9-16.2 1.4-23.1-2.6 -3.7-2.1-6.8-5.2-9.8-8.2 -13.3-13.4-26.7-26.6-39.9-40 -10.7-10.9-10.7-30.2 0.1-41 28.3-28.4 56.7-56.6 85-85 2.5-2.5 5.2-4.8 7.3-7.6 -0.6-1-1.4-1.8-2.2-2.6 -29.2-29.1-58.3-58.3-87.6-87.5 -4.4-4.2-8.2-9.3-9.6-15.3 -1.6-7-1.3-14.6 2.1-21 2.7-5.4 7.1-9.6 11.3-13.8 11.5-11.5 23-23 34.5-34.5C97.2 44.4 101.7 40.8 107.1 39z"/></svg>',
                                    closeBoxMargin: '3px'
                                }
                            }
                        };
                    });
                }, $scope.checkTokenError);
            };
        }]);
    app.register.service('specialtyTags', function ($q, $rootScope) {
        $rootScope.q = $q
    });

    return app;
});