var gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    browserifyShim = require('browserify-shim'),
    source = require('vinyl-source-stream'),
    connect = require('connect')

var BUILD_FOLDER = 'build'


gulp.task('clean', function (cb) {
    del(BUILD_FOLDER,cb);
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

gulp.task("options",function() {
    return browserify({entries: ["./src/chrome/options.js"]})
        .bundle()
        .pipe(source("options.js"))
        .pipe(gulp.dest(BUILD_FOLDER));
});

gulp.task("serve",function(next) {
    var staticServer = connect();
     var staticServerPath = BUILD_FOLDER;
     staticServer.use(connect.static(staticServerPath)).listen(process.env.PORT || 8000, next); 
});

gulp.task("default",["assets","style","options"]);