define(['app','angularAMD'],function (app, angularAMD) {
    'use strict';
    describe('app', function () {
        it('is defined.', function () {
            expect(app).toBeDefined();
        });

        it('is able to register', function () {
            expect(app.register).toBeDefined();
        });

        describe('angularAMD', function () {
            it('is created.', function () {
                expect(angularAMD).toBeDefined();
            });
            it('has app defined.', function () {
                expect(app.name).toBe(angularAMD.appname());
            });
        });

        describe('cached property', function () {
            it('controllerProvider', function () {
                expect(angularAMD.getCachedProvider("$controllerProvider")).toBeDefined();
            });
            it('compileProvider', function () {
                expect(angularAMD.getCachedProvider("$compileProvider")).toBeDefined();
            });
            it('filterProvider', function () {
                expect(angularAMD.getCachedProvider("$filterProvider")).toBeDefined();
            });
            it('animateProvider', function () {
                expect(angularAMD.getCachedProvider("$animateProvider")).toBeDefined();
            });
            it('provide', function () {
                expect(angularAMD.getCachedProvider("$provide")).toBeDefined();
            });
            it('injector', function () {
                expect(angularAMD.getCachedProvider("$injector")).toBeDefined();
            });
        });
    });
});