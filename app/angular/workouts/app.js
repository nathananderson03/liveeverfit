'use strict';

define(['app', 'videojs'], function (app) {
    app.register.controller('workoutsCtrl', ['$scope', 'restricted',
        function ($scope) {
            $scope.restricted();
        }]);

    app.register.controller('workoutsController', ["$sce", "$stateParams", "$resource", "rest", "tokenError", "localStorageService", "$scope", "$anchorScroll", "promiseService",
        function ($sce, $stateParams, $resource, rest, tokenError, localStorageService, $scope) {
            $scope.usrImg = localStorageService.get('user_img');
            $scope.user_id = localStorageService.get('user_id');

            $scope.page = 1;
            $scope.difficulty = [];
            $scope.videoSelected = [];
            $scope.tagSelected = [];
            $scope.iframeHidden = true;
            $scope.difficultySelected = {};
            $scope.video = {}; // for 1 video
            $scope.videos = []; //for video list
            $scope.videoSearch = ''; // this is the search bar string
            $scope.videoTitles = [] // for typeahead
            $scope.next = true;
            $scope.isBeginner = true;
            $scope.isIntermediate = true;
            $scope.isAdvanced = true;
            // make this into 
            $scope.comments = []
            $scope.commentPage = 1;
            $scope.commentNext = false;
            $scope.commentText = '';
            var tagCollection = $resource(":protocol://:url/tags/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL
                }),
                tagResource = $resource(":protocol://:url/tags/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: '@id'
                }, {
                    update: {
                        method: 'PUT'
                    }
                }),
                likeResource = $resource(":protocol://:url/workouts/video/likes/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: '@id'
                }, {
                    update: {
                        method: 'PUT'
                    }
                });
            var videoCollection = $resource(":protocol://:url/workouts/video/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL
                }),
                commentCollection = $resource(":protocol://:url/workouts/video/comments/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: '@id'
                }),
                videoResource = $resource(":protocol://:url/workouts/video/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: '@id'
                }, {
                    update: { method: 'PUT' }
                }),
                commentResource = $resource(":protocol://:url/workouts/comments/:id/", {
                    protocol: $scope.restProtocol,
                    url: $scope.restURL,
                    id: '@id'
                }, {
                    update: { method: 'PUT' }
                }),
                getVideo = function () {
                    if ($scope.videojs && typeof $scope.videojs.dispose === 'function') {
                        try {
                            $scope.videojs.dispose();
                        }
                        catch (error) {

                        }
                    }
                    if ($stateParams.id) {
                        $scope.videoStatus = 'loading';
                        $scope.video = videoResource.get({id: $stateParams.id}, function () {
                            $scope.video.rtmp_url = $sce.trustAsResourceUrl("rtmp://54.236.203.1:1935/vod/_definst_/mp4:" + $scope.video.url_video);
                            //This link might now work with the temp wowoza, try deleting content after vod
                            $scope.video.http_url = $sce.trustAsResourceUrl("http://54.236.203.1:1935/vod/content/" + $scope.video.url_video + "/playlist.m3u8");
                            $scope.videoStatus = 'difficultySelected';
                            commentCollection.get({id: $stateParams.id}, function (data) {
                                $scope.commentNext = data.next;
                                $scope.comments = data.results;

                            });
                            setTimeout(function () {
                                $scope.videojs = videojs('selectedVideo', {
                                    techOrder: [ "flash", "html5"],
                                    poster: 'http://beta.liveeverfit.com/media/' + $scope.video.img
                                });
                                $scope.videojs.height($scope.videojs.el().offsetWidth * 0.75);
                                $(window).resize(function () {
                                    $scope.videojs.height($scope.videojs.el().offsetWidth * 0.75);
                                });
                            }, 10);
                        })
                    }
                    else {
                        $scope.videoStatus = false;
                        setTimeout(function () {
                            $scope.videojs = videojs('promoVideo', {
                                techOrder: [ "flash", "html5"],
                                poster: 'http://beta.liveeverfit.com/media/promo-video.png'
                            });
                            $scope.videojs.height($scope.videojs.el().offsetWidth * 0.75);
                            $(window).resize(function () {
                                $scope.videojs.height($scope.videojs.el().offsetWidth * 0.75);
                            });
                        }, 10);
                    }
                },
                filterVideoCollection = $resource(":protocol://:url/workouts/video?:filter", {
                    protocol: $scope.restProtocol,
                    filter: '@filter',
                    url: $scope.restURL
                });
            //initialize video array
            var initVideos = filterVideoCollection.get({}, function () {
                $scope.next = initVideos.next;
                $scope.videos = initVideos.results;
            });

            $scope.videoTitleCollection = $resource("http://:url/workouts/titles", {
                url: $scope.restURL
            });
            $scope.loadVideoTitles = function (query) {
                var deferred = $scope.q.defer();
                var filtering = {
                    search: query,
                };
                $scope.videoTitles = $scope.videoTitleCollection.query(filtering, function () {
                    deferred.resolve($scope.videoTitles);
                });

                return deferred.promise;
            };

            $scope.likeVideo = function () {
                likeResource.update({
                    id: $stateParams.id,
                    user_pk: localStorageService.get("user_id")
                }, function (data) {
                    $scope.video.user_likes = data.user_likes;
                    if (data.user_likes) {
                        $scope.video.likes += 1;
                    } else {
                        $scope.video.likes -= 1;
                    }
                });
            };

            $scope.getPros = function () {
                $scope.page = $scope.page + 1;
                $scope.filtering = {
                    difficulty: $scope.difficulty,
                    tags: $scope.tagSelected,
                    search: $scope.videoSelected,
                    page: $scope.page
                };
                var newVideos = filterVideoCollection.get($scope.filtering, function () {
                    $scope.videos = $scope.videos.concat(newVideos.results);
                    $scope.next = newVideos.next;
                });
                //$scope.videos = ;
            };

            $scope.getComments = function () {
                $scope.commentPage = $scope.commentPage + 1;
                commentCollection.get({
                    page: $scope.commentPage,
                    id: $stateParams.id
                    }, function (newComments) {
                        $scope.comments = $scope.comments.concat(newComments.results);
                        $scope.commentNext = newComments.next;
                });
            };

            $scope.submitComment = function () {
                var scope = this;
                commentCollection.save({
                    id: $stateParams.id,
                    video: $stateParams.id,
                    user: localStorageService.get("user_id"),
                    comment: scope.commentText
                }, function (data) {
                    $scope.comments.unshift(data)
                    scope.commentText = "";
                });
            };
            $scope.deleteComment = function (index, comment){
                var commentObj = {
                            id: comment.id
                };
                index = $scope.comments.indexOf(comment)
                $scope.comments.splice(index, 1);
                commentResource.delete(commentObj, function () {

                });
            };

            window.handleIframe = function (iframe) {
                var $iframe = $(iframe);
                $iframe.height($iframe.width() * 0.75);
                $(window).resize(function () {
                    $iframe.height($iframe.width() * 0.75);
                });
                $iframe.removeClass("hidden");
            };

            videojs.options.flash.swf = "common/videojs/dist/video-js/video-js.swf";

            $scope.$on('$stateChangeSuccess', getVideo);


            $scope.difficultyOnClick = function (value) {
                if ($scope.difficulty.indexOf(value) == -1) {
                    $scope.difficultySelected[value] = true;
                    $scope.difficulty.push(value);
                }
                else {
                    var temp = $scope.difficulty.indexOf(value);
                    $scope.difficultySelected[value] = false;
                    $scope.difficulty.splice(temp, 1);
                }
                $scope.filter();
                
                if (value == 'beginner') {
                $scope.isBeginner = !$scope.isBeginner;
                console.log('fired');
                } else if (value == 'intermediate') {
                $scope.isIntermediate = !$scope.isIntermediate;
                } else if (value == 'advanced') {
                $scope.isAdvanced = !$scope.isAdvanced;
                }
                //console.log(value);
            };
            $scope.filter = function () {
                $scope.page = 1
                $scope.commentPage = 1;
                $scope.filtering = {
                    difficulty: $scope.difficulty,
                    tags: $scope.tagSelected,
                    search: $scope.videoSelected
                };
                var vids = filterVideoCollection.get($scope.filtering, function () {
                    $scope.videos = vids.results;
                    $scope.next = vids.next;
                });


            };

            /*ANYTHING TAG RELATED, kept it in same scope in order make things less complicated
             on review decide on how to do this*/

            $scope.tags = tagCollection.get(function () {
            }, $scope.checkTokenError);


            $scope.addTag = function (tag) {


                if ($scope.videoSearch.indexOf(tag) == -1) {
                    $scope.videoSearch.push(tag);
                    $scope.tagSelected.push(tag.name);
                }
                else {
                    var temp = $scope.videoSearch.indexOf(tag);
                    $scope.videoSearch.splice(temp, 1);
                    $scope.tagSelected.splice(temp, 1);
                }


                $scope.filter()
            }
            $scope.onTagAdd = function (tag) {
                $scope.names = [];

                $scope.tags.results.forEach(function (obj) {
                    $scope.names.push(obj.name);
                });

                if ($scope.names.indexOf(tag.name) == -1) {
                    $scope.videoSelected.push(tag.name);
                }
                else {
                    $scope.tagSelected.push(tag.name);
                }


                $scope.filter()

            }
            $scope.onDeleteTag = function (tag) {
                if ($scope.tagSelected.indexOf(tag.name) != -1) {
                    var temp = $scope.tagSelected.indexOf(tag.name);

                    $scope.tagSelected.splice(temp, 1);
                    $scope.filter()

                }
                ;
                if ($scope.videoSelected.indexOf(tag.name) != -1);
                var temp = $scope.videoSelected.indexOf(tag.name);

                $scope.videoSelected.splice(temp, 1);
                $scope.filter()

            };


        }]);

    app.register.service('promiseService', function ($q, $rootScope) {

        $rootScope.q = $q

    });
});
