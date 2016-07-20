var tests = [];

for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/test_/.test(file)) {
            dump(file);
            tests.push(file);
        }
    }
}

require.config({
    //base is defined at karma.config.js which is the basePath
    baseUrl: "/base/",
    paths: {
        'angular': 'common/angular/angular',
        'angularLocalStorage': 'common/angular-local-storage/angular-local-storage',
        'angularResource': 'common/angular-resource/angular-resource.min',
        'angularAMD': 'common/angularAMD/angularAMD',
        'ngload': 'common/angularAMD/ngload',
        'uiRouter': 'common/angular-ui-router/release/angular-ui-router.min',
        'uiBootstrap': 'common/angular-bootstrap/ui-bootstrap.min',
        'routeResolver': 'common/router/routeResolver',
        'autoFillEvent': 'common/autofill-event/src/autofill-event',
        'app': 'app'
    },

    //Angular does not support AMD out of the box, put it in a shim
    shim: {
        'angular': {
            exports: 'angular'
        },
        'angularAMD': ['angular'],
        "angularLocalStorage": ['angular'],
        "angularResource": ['angular'],
        "uiRouter": ['angular'],
        "uiBootstrap": ['angular'],
        "autoFillEvent": ['angular']
    },

    //kick start the application
    deps: tests,
    callback: window.__karma__.start
});
