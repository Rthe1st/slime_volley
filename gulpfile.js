var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    gulpUtil = require('gulp-util'),
    babelify = require('babelify');
    babel = require("gulp-babel");
    sourcemaps = require('gulp-sourcemaps');
    cached = require('gulp-cached');
    remember = require('gulp-remember');
    watchify = require('watchify');

var webDir = './public';

gulp.task('clientScripts', function(){
    var bundler = browserify({
        entries: ['./source/scripts/client/clientMain.js'],
        debug: true,// Gives us sourcemapping
        transform: [babelify],
        cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
    });
    var watcher = watchify(bundler);

    return watcher
    .on('update', function(){
        var updateStart = Date.now();
        console.log('Updating!');
        watcher.bundle() // Create new bundle that uses the cache for high performance
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest(webDir + '/scripts'));
        console.log('Updated!', (Date.now() - updateStart) + 'ms');
    }).bundle()
    .on('error', function (err) {
        gulpUtil.log('failed browserify');
        gulpUtil.log(err);
        this.emit('end');
    })
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest(webDir + '/scripts'));
});

var htmlSource = './source/html/*.html';

gulp.task('clientHtml', function () {
    return gulp.src(htmlSource)
        .pipe(cached('client_html'))
        .pipe(gulp.dest(webDir + '/html'));
});

var serverDir = './server';

var serverSource = ["./source/scripts/server/*.js", "./source/scripts/framework/*/server.js", "./source/scripts/framework/{groupings,components}/*.js"];
//use gulp.watch and cache to update these
gulp.task('webServer', function(){
    return gulp.src(serverSource)
        .pipe(cached('webserver'))
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(remember('webserver'))
        .pipe(gulp.dest(serverDir));
});

//clean
//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([webDir + '/*', serverDir + '*'], callback);
});

//default
gulp.task('default', ['clean'], function () {
    gulp.start('clientScripts', 'clientHtml', 'webServer');
});

//watch
gulp.task('watch', function () {
    gulp.start('clean');
    gulp.start('clientScripts', 'clientHtml', 'webServer');
    gulp.watch(htmlSource, ['clientHtml']);
    gulp.watch(serverSource, ['webServer']);
});
