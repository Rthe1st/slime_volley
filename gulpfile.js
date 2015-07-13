var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    gulpUtil = require('gulp-util'),
    babelify = require('babelify');

var outDir = './public';

//scripts
gulp.task('scripts', function () {
    return browserify('./source/scripts/socketSetUp.js', {debug: true})
        .transform(babelify)
        .bundle()
        .on('error', function (err) {
            gulpUtil.log('failed browserify');
            gulpUtil.log(err);
            this.emit('end');
        })
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest(outDir + '/scripts'));
});

gulp.task('game_engine', function () {
    return gulp.src(['./node_modules/phaser/build/phaser.min.js', './node_modules/phaser/build/phaser.map'])
        .pipe(gulp.dest(outDir + '/scripts/lib'));
});

//html
gulp.task('html', function () {
    return gulp.src('./source/html/*.html')
        .pipe(gulp.dest(outDir + '/html'));
});

//clean
//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([outDir + '/html', outDir + '/scripts'], callback)
});

//default
gulp.task('default', ['clean'], function () {
    gulp.start('scripts', 'html', 'game_engine');
});

gulp.task('extrapoTest', [], function () {
    return browserify('./source/scripts/extrapolationTests.js', {debug: true})
        .transform(babelify)
        .bundle()
        .on('error', function (err) {
            gulpUtil.log('failed browserify');
            gulpUtil.log(err);
            this.emit('end');
        })
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest(outDir + '/scripts'));
});

//watch
gulp.task('watch', function () {
    gulp.watch('source/html/**/*.html', ['html']);
    gulp.watch('source/scripts/**/*.js', ['scripts']);
});
