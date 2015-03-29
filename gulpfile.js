var gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat');


var BUILD_FOLDER = 'build'


gulp.task('clean', function (cb) {
    return del(BUILD_FOLDER,cb);
});

gulp.task('style',function() {
    
    return gulp.src(["src/chrome/*.css",
                     "src/chrome/**/*.css",
                     "!src/chrome/debug/**/*.css"
                    ])
            .pipe(concat('app.css'))
            .pipe(gulp.dest(BUILD_FOLDER));

});

gulp.task('assets',function() {
   return gulp.src(["src/chrome/*.html",
             "src/chrome/css/*",
             "src/chrome/**/*.css",
             "src/chrome/lib/*",             
             "src/chrome/*.json",
             "src/chrome/*.png"
            ],{
                 base : "./src/chrome"
             }
           ).pipe(gulp.dest(BUILD_FOLDER));    
});

