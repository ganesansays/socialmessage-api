var gulp = require('gulp');
var mocha = require('gulp-mocha');
var util = require('gulp-util');
var cover = require('gulp-coverage');
var istanbul = require('istanbul');
 
gulp.task('test', function () {
    return gulp.src(['test/**/*.js'], { read: false })
            .pipe(cover.instrument({
              pattern: ['api/**/*.js'],
              debugDirectory: 'debug'
            }))
            .pipe(mocha({ reporter: 'spec' }))
            .pipe(cover.gather())
            .pipe(cover.format())
            .pipe(gulp.dest('reports')) 
            .on('error', util.log)
            .once('end', function () {
              process.exit();
            });
});
 
gulp.task('watch-test', function () {
    gulp.watch(['views/**', 'public/**', 'app.js', 'framework/**', 'test/**'], ['test']);
});