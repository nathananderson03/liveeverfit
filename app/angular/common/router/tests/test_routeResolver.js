'use strict'

define(['app', 'angularAMD', 'routeResolver', '/base/test_app.js'], function (app, angularAMD, routeResolver) {
    'use strict';
    describe("Route Resolver Test:", function () {
        describe("Route Resolver Provider", function () {
            //define variables to use in this scope
            var route, path, scope;
            beforeEach(function () {
                angularAMD.inject(function ($rootScope, $controller, routeResolver) {
                    scope = $rootScope.$new();
                    route = routeResolver.route;
                });
            });
            it('should not be able to resolve about inside app folder', function () {
                path = route.resolve('/app', 'app');
                expect(path.templateUrl).toBe('app/index.html');
                expect(path.controller).toBe('appCtrl');
                expect(path.url).toBe('/app');
            });
            it('should be able to resolve widgets inside app folder', function () {
                path = route.resolve('/about', 'about')
                expect(path.templateUrl).toBe('about/index.html');
                expect(path.controller).toBe('aboutCtrl');
                expect(path.url).toBe('/about');
            });
        });
    });
});