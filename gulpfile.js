var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');

//var gulp_data = require('./gulp-data.js');
//var gulp_schema = require('./gulp-schema.js');

var allTasks = [ 'build-3rdparty-js' 
				, 'build-dl-data-js' 
				, 'build-dl-schema-js' 
				, 'build-3rdparty-css' 
				, 'build-donkeylift-css'
				, 'build-data-html'
				, 'build-schema-html'
				, 'watch'
];

var src3rd = './src/3rdparty/';

var ver3rd = {
	BOOTSTRAP : 'bootstrap-custom',
	JQUERY : 'jquery-2.1.4',
	JQUERY_UI : 'jquery-ui-1.11.4.custom',
	FONT_AWESOME : 'font-awesome-4.3.0',
	DATATABLES : 'DataTables-1.10.7',
	VIS : 'vis',

};

gulp.task('default', allTasks, function() {

	
});

//TODO
gulp.task('copy-images', function() {
});
gulp.task('copy-fonts', function() {
});

gulp.task('build-3rdparty-css', function() {
	return gulp.src([src3rd + ver3rd.BOOTSTRAP + '/css/bootstrap.min.css' 
					, src3rd + ver3rd.JQUERY_UI + '/jquery-ui.min.css' 
					, src3rd + ver3rd.FONT_AWESOME + '/css/font-awesome.min.css'
					, src3rd + ver3rd.DATATABLES + '/media/css/jquery.dataTables.min.css'
					, src3rd + ver3rd.VIS + '/vis.min.css'
		])

		.pipe(concat('3rdparty.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-3rdparty-js', function() {
	return gulp.src([src3rd + ver3rd.JQUERY + '/jquery.min.js' 
					, src3rd + ver3rd.JQUERY_UI + '/jquery-ui.min.js' 
					, './src/3rdparty/underscore/underscore.js' 
					, './src/3rdparty/backbone/backbone.js' 
					, src3rd + ver3rd.BOOTSTRAP + '/js/bootstrap.min.js' 
				])

		.pipe(concat('3rdparty.js'))
		.pipe(gulp.dest('./public/js/'));
			
});

gulp.task('build-donkeylift-css', function() {
	return gulp.src('./src/css/*.css')
		.pipe(concat('donkeylift.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-dl-data-js', function() {

	if ( ! process.env.DONKEYLIFT_API) {
		console.log("ERROR. Define env var DONKEYLIFT_API");
		process.exit(1);
	}

//	return gulp.src(["./src/js/init.js",
//					 "./src/js/models/**/*.js",
//					 "./src/js/collections/**/*.js",
//					 "./src/js/views/**/*.js",
//					 "./src/js/QueryParser.js",
//					 "./src/js/Router.js",
//					 "./src/js/app.js"
//			])

	return gulp.src(["./src/js/common/AppBase.js",
					 "./src/js/common/models/*.js",
					 "./src/js/data/models/*.js",
					 "./src/js/common/collections/*.js",
					 "./src/js/data/collections/*.js",
					 "./src/js/common/views/*.js",
					 "./src/js/data/views/*.js",
					 "./src/js/data/QueryParser.js",
					 "./src/js/data/RouterData.js",
					 "./src/js/data/AppData.js"
			])
		.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
		.pipe(concat('dl_data.js'))
		.pipe(gulp.dest('./public/js/'));
			
});

gulp.task('build-dl-schema-js', function() {

	if ( ! process.env.DONKEYLIFT_API) {
		console.log("ERROR. Define env var DONKEYLIFT_API");
		process.exit(1);
	}

	return gulp.src(["./src/js/common/AppBase.js",
					 , "./src/js/common/models/*.js"
					 , "./src/js/schema/models/*.js"
					 , "./src/js/common/collections/*.js"
					 , "./src/js/schema/collections/*.js"
					 , "./src/js/common/views/*.js"
					 , "./src/js/schema/views/*.js"
					 , "./src/js/schema/RouterSchema.js"
					 , "./src/js/schema/AppSchema.js"
			])
		.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
		.pipe(concat('dl_schema.js'))
		.pipe(gulp.dest('./public/js/'));
			
});



gulp.task('build-data-html', function() {

	var snippets = { dialogs: 
						['./src/html/common/dialogs/*.html'
						, './src/html/data/dialogs/*.html']
					, templates: 
						['./src/html/common/templates/*.html'
						, './src/html/data/templates/*.html']
					};

	return gulp.src(['./src/data.html'])

		.pipe(inject(gulp.src('./src/html/common/nav.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src(snippets.dialogs), {
		    starttag: '<!-- inject:dialogs:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))
		
		.pipe(inject(gulp.src(snippets.templates), {
		    starttag: '<!-- inject:templates:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./public/'));
});

gulp.task('build-schema-html', function() {

	var snippets = { dialogs: 
						['./src/html/common/dialogs/*.html'
						, './src/html/schema/dialogs/*.html']
					, templates: 
						['./src/html/common/templates/*.html'
						, './src/html/schema/templates/*.html']
					};

	return gulp.src(['./src/schema.html'])

		.pipe(inject(gulp.src('./src/html/common/nav.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src(snippets.dialogs), {
		    starttag: '<!-- inject:dialogs:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))
		
		.pipe(inject(gulp.src(snippets.templates), {
		    starttag: '<!-- inject:templates:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./public/'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('./src/js/**/*.js', ['build-dl-data-js', 
		'build-dl-schema-js']);
    gulp.watch('./src/html/**/*.html', ['build-data-html', 
		'build-schema-html']);
    gulp.watch('./src/data.html', ['build-data-html']);
    gulp.watch('./src/schema.html', ['build-schema-html']);
    gulp.watch('./src/css/*.css', ['build-donkeylift-css']);
});

