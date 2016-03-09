var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');
var merge = require('merge-stream');

var allTasks = ['build-3rdparty-js', 
			'build-app-js', 
			'build-3rdparty-css', 
			'build-app-css',
			'build-html',
			'watch'
];

var ver3rdParty = {
	'bootstrap' : 'bootstrap-custom',
	'jquery' : 'jquery-2.1.4',
	'jquery-ui' : 'jquery-ui-1.11.4.custom',
	'font-awesome': 'font-awesome-4.3.0',
	'DataTables': 'DataTables-1.10.7',

};

gulp.task('default', allTasks, function() {

	
});

//TODO
gulp.task('copy-images', function() {
});
gulp.task('copy-fonts', function() {
});

gulp.task('build-3rdparty-css', function() {
	return gulp.src(['./src/3rdparty/' + ver3rdParty['bootstrap'] + '/css/bootstrap.min.css', 
				'./src/3rdparty/' + ver3rdParty['jquery-ui'] + '/jquery-ui.min.css', 
				'./src/3rdparty/' + ver3rdParty['font-awesome'] + '/css/font-awesome.min.css', 
				'./src/3rdparty/' + ver3rdParty['DataTables'] + '/media/css/jquery.dataTables.min.css', 
			])

		.pipe(concat('3rdparty.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-3rdparty-js', function() {
	return gulp.src(['./src/3rdparty/' + ver3rdParty['jquery'] + '/jquery.min.js', 
				'./src/3rdparty/' + ver3rdParty['jquery-ui'] + '/jquery-ui.min.js', 
				'./src/3rdparty/' + ver3rdParty['DataTables'] + '/media/js/jquery.dataTables.min.js', 
				'./src/3rdparty/underscore/underscore.js', 
				'./src/3rdparty/backbone/backbone.js', 
				'./src/3rdparty/' + ver3rdParty['bootstrap'] + '/js/bootstrap.min.js', 
				])

		.pipe(concat('3rdparty.js'))
		.pipe(gulp.dest('./public/js/'));
			
});

/*
gulp.task('build-3rdparty-css', function() {
	return gulp.src(['./src/3rdparty/bootstrap/css/bootstrap.min.css', 
					'./src/3rdparty/jquery-ui/jquery-ui.min.css', 
					'./src/3rdparty/font-awesome/css/font-awesome.min.css', 
					'./src/3rdparty/DataTables/media/css/jquery.dataTables.min.css', 
				])

		.pipe(concat('3rdparty.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-3rdparty-js', function() {
	return gulp.src(['./src/3rdparty/jquery/jquery.min.js', 
					'./src/3rdparty/jquery-ui/jquery-ui.min.js', 
					'./src/3rdparty/DataTables/media/js/jquery.dataTables.min.js', 
					'./src/3rdparty/underscore/underscore.js', 
					'./src/3rdparty/backbone/backbone.js', 
					'./src/3rdparty/bootstrap/js/bootstrap.min.js', 
				])

		.pipe(concat('3rdparty.js'))
		.pipe(gulp.dest('./public/js/'));
			
});
*/

gulp.task('build-app-css', function() {
	return gulp.src('./src/css/*.css')
		.pipe(concat('donkeylift.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-app-js', function() {

	if ( ! process.env.DONKEYLIFT_API) {
		console.log("ERROR. Define env var DONKEYLIFT_API");
		process.exit(1);
	}

	return gulp.src(["./src/js/init.js",
					 "./src/js/models/**/*.js",
					 "./src/js/collections/**/*.js",
					 "./src/js/views/**/*.js",
					 "./src/js/QueryParser.js",
					 "./src/js/Router.js",
					 "./src/js/app.js"
			])
		.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
		.pipe(concat('donkeylift.js'))
		.pipe(gulp.dest('./public/js/'));
			
});



gulp.task('build-html', function() {
	var dataBrowser = gulp.src(['./src/index.html'])

		.pipe(inject(gulp.src('./src/html/nav.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src(['./src/html/dialogs/*.html']), {
		    starttag: '<!-- inject:dialogs:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))
		
		.pipe(inject(gulp.src(['./src/html/templates/*.html']), {
		    starttag: '<!-- inject:templates:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))
		
		.pipe(gulp.dest('./public/'));

	var soilBrowser = gulp.src(['./src/soil-browser.html'])

		.pipe(inject(gulp.src(['./src/html/templates/*.html']), {
		    starttag: '<!-- inject:templates:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))
	
		.pipe(gulp.dest('./public/'));


	return merge(dataBrowser, soilBrowser);
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('./src/js/**/*.js', ['build-app-js']);
    gulp.watch('./src/html/**/*.html', ['build-html']);
    gulp.watch('./src/index.html', ['build-html']);
    gulp.watch('./src/soil-browser.html', ['build-html']);
    gulp.watch('./src/css/*.css', ['build-app-css']);
});

