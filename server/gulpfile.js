const gulp = require('gulp');
const zip = require('gulp-zip');
const minify = require('gulp-minify');

gulp.task('pack', () => {
    return gulp.src(['json/**/*.*', 'package.json', 'build/**/*.js'], { base: '.' })
        .pipe(minify({
            ext: {
                src: '.js',
                min: '.js'
            },
        }))
        .pipe(zip('server.zip'))
        .pipe(gulp.dest('../'));
});

gulp.task('pack-dev', () => {
    return gulp.src(['json/', 'package.json', 'src/', '.editorconfig', 'gulpfile.js', 'tsconfig.json', 'tslint.json', '.vscode/'], { base: '.' })
        .pipe(zip('server-src.zip'))
        .pipe(gulp.dest('../'));
});
