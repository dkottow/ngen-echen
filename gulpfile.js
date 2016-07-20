var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');

var envPath = './.env';
if (process.env.OPENSHIFT_DATA_DIR) {
	envPath = process.env.OPENSHIFT_DATA_DIR + '/.env';
}

require('dotenv').config({path: envPath});


//var gulp_data = require('./gulp-data.js');
//var gulp_schema = require('./gulp-schema.js');

var allTasks = [ 'copy-images'
				, 'copy-fonts'
				, 'copy-3rdparty-js' 
				, 'copy-3rdparty-css' 
				, 'build-3rdparty-js' 
				, 'build-dl-data-js' 
				, 'build-dl-schema-js' 
				, 'build-3rdparty-css' 
				, 'build-donkeylift-css'
				, 'build-data-html'
				, 'build-schema-html'
				, 'build-signup'
				, 'build-swaggerui'
				, 'build-apispec'
];

var src3rd = './src/3rdparty/';

var extdir = './ext/';
if (process.env.OPENSHIFT_DATA_DIR) {
	extdir = process.env.OPENSHIFT_DATA_DIR + '/ext/';
}

var ver3rd = {
	BOOTSTRAP : 'bootstrap-custom',
	JQUERY : 'jquery-2.1.4',
	JQUERY_UI : 'jquery-ui-1.11.4.custom',
	FONT_AWESOME : 'font-awesome-4.3.0',
	DATATABLES : 'DataTables-custom',
	//DATATABLES : 'DataTables-1.10.7',
	DATATABLES_EDITOR : 'Editor-1.5.6',
	VIS : 'vis',
	SWAGGER_UI : 'swagger-ui-2.1.4',

};

gulp.task('default', allTasks, function() {

	return gulp.src(['./src/index.html'])
		.pipe(gulp.dest('./public/'));
	
});

//TODO
gulp.task('copy-images', function() {
	gulp.src([
		src3rd + ver3rd.DATATABLES + '/DataTables-1.10.12/images/*.png'
		])
		.pipe(gulp.dest('./public/css/DataTables-1.10.12/images'));
		

	return gulp.src([
				//src3rd + ver3rd.DATATABLES + '/media/images/*.png'
			extdir + ver3rd.DATATABLES_EDITOR + '/images/*',
			'./src/images/*'
		])	

		.pipe(gulp.dest('./public/images/'));
});

gulp.task('copy-fonts', function() {
	return gulp.src([
				src3rd + ver3rd.BOOTSTRAP + '/fonts/*'
				, src3rd + ver3rd.FONT_AWESOME + '/fonts/*'
		])	

		.pipe(gulp.dest('./public/fonts/'));
});

gulp.task('build-3rdparty-css', function() {

	gulp.src([
				src3rd + ver3rd.JQUERY_UI + '/images/*' 
		])
		.pipe(gulp.dest('./public/css/images/'));

	return gulp.src([
				src3rd + ver3rd.BOOTSTRAP + '/css/bootstrap.min.css' 
				, src3rd + ver3rd.JQUERY_UI + '/jquery-ui.min.css' 
				, src3rd + ver3rd.FONT_AWESOME + '/css/font-awesome.min.css'
		])

		.pipe(concat('3rdparty.css'))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-3rdparty-js', function() {
	return gulp.src([
				src3rd + ver3rd.JQUERY + '/jquery.min.js' 
				, src3rd + ver3rd.JQUERY_UI + '/jquery-ui.min.js' 
				, src3rd + '/underscore/underscore.js' 
				, src3rd + '/backbone/backbone.js' 
				, src3rd + ver3rd.BOOTSTRAP + '/js/bootstrap.min.js' 
				, src3rd + '/jwt-decode/jwt-decode.min.js' 
		])

		.pipe(concat('3rdparty.js'))
		.pipe(gulp.dest('./public/js/'));
			
});

gulp.task('copy-3rdparty-js', function() {
	return gulp.src([
				//src3rd + ver3rd.DATATABLES + '/media/js/jquery.dataTables.min.js' 
				src3rd + ver3rd.DATATABLES + '/datatables.js' 
				, src3rd + ver3rd.DATATABLES + '/datatables.min.js' 
				, src3rd + ver3rd.VIS + '/vis.min.js' 
				, extdir + ver3rd.DATATABLES_EDITOR + '/js/dataTables.editor.min.js' 
				, extdir + ver3rd.DATATABLES_EDITOR + '/js/editor.autoComplete.js' 
		])

		.pipe(gulp.dest('./public/js/'));
			
});

gulp.task('copy-3rdparty-css', function() {
	return gulp.src([
				//src3rd + ver3rd.DATATABLES + '/media/css/jquery.dataTables.min.css'
				src3rd + ver3rd.DATATABLES + '/datatables.min.css'
				, src3rd + ver3rd.VIS + '/vis.min.css'
				, extdir + ver3rd.DATATABLES_EDITOR + '/css/editor.dataTables.min.css' 
		])

		.pipe(gulp.dest('./public/css/'));
			
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
		.pipe(replace("$AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID))
		.pipe(replace("$AUTH0_DOMAIN", process.env.AUTH0_DOMAIN))
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
		.pipe(replace("$AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID))
		.pipe(replace("$AUTH0_DOMAIN", process.env.AUTH0_DOMAIN))
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

gulp.task('build-swaggerui', function() {
	return gulp.src([src3rd + ver3rd.SWAGGER_UI + '/dist/**'])
	.pipe(gulp.dest('./public/docs'));

});

gulp.task('build-apispec', ['build-swaggerui'], function() {
	
	var host = process.env.DONKEYLIFT_API.replace(new RegExp('http://'), '');

	return gulp.src(['./src/docs/*'])
	.pipe(replace("$DONKEYLIFT_API", host))
	.pipe(gulp.dest('./public/docs'));

});

gulp.task('build-signup', function() {

	return gulp.src(['./src/signup.html'])
	.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
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
    gulp.watch('./src/docs/*', ['build-apispec']);
    gulp.watch('./src/signup.html', ['build-signup']);
});

