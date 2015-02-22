var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    notify = require('gulp-notify'),
    del = require('del');

//scripts
gulp.task('scripts', function(){
    gulp.start('game_engine');
    return browserify('./source/scripts/mechanics.js', {debug:true})
        .bundle()
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest('./build/scripts'))
        .pipe(notify({ message: 'scripts task complete' }));
});

gulp.task('game_engine', function(){
    return gulp.src(['./node_modules/phaser/build/phaser.min.js','./node_modules/phaser/build/phaser.map'])
        .pipe(gulp.dest('./build/scripts/lib'))
        .pipe(notify({ message: 'game_engine task complete' }));
});

//html
gulp.task('html', function(){
    return gulp.src('./source/html/*.html')
        .pipe(gulp.dest('./build/html'))
        .pipe(notify({ message: 'html task complete' }));
});

//clean
//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function(callback){
    del(['./build/html', './build/scripts'], callback)
});

//default
gulp.task('default',['clean'], function (){
    gulp.start('scripts', 'html');
});

//watch
gulp.task('watch', function(){
    gulp.watch('source/html/**/*.html', ['html']);
    gulp.watch('source/scripts/**/*.js', ['scripts']);
});
