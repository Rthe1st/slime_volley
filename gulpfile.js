var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    gulpUtil = require('gulp-util'),
    babelify = require('babelify');
    babel = require("gulp-babel");
    sourcemaps = require('gulp-sourcemaps');
    concat = require('gulp-concat');

var webDir = './public';

gulp.task('clientScripts', function(){
    return browserify('./source/scripts/client/clientMain.js', {debug: true})
        .transform(babelify)
        .bundle()
        .on('error', function (err) {
            gulpUtil.log('failed browserify');
            gulpUtil.log(err);
            this.emit('end');
        })
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest(webDir + '/scripts'));
});

gulp.task('clientHtml', function () {
    return gulp.src('./source/html/*.html')
        .pipe(gulp.dest(webDir + '/html'));
});

gulp.task('clientBuild', function(){
    gulp.start('clientScripts', 'clientHtml');
});

serverDir = './server';

gulp.task('webServer', function(){
    return gulp.src(["./source/scripts/{shared,server,framework}/**/*.js"])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(serverDir));
});

gulp.task('serverBuild', function(){
    gulp.start('webServer');    
});

//clean
//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([webDir + '/*', serverDir + '*'], callback);
});

//default
gulp.task('default', ['clean'], function () {
    gulp.start('serverBuild', 'clientBuild');
});

//watch
gulp.task('watch', function () {
    gulp.watch('source/html/**/*.html', ['clientHtml']);
    gulp.watch('./source/scripts/{shared,client}/**/*.js', ['clientScripts']);
    gulp.watch('./source/scripts/{shared,framework,server}/**/*.js', ['serverBuild']);
});