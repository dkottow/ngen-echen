var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');
var markdown = require('gulp-markdown');
var insert = require('gulp-insert');
var rename = require('gulp-rename');

var envPath = './.env';
if (process.env.OPENSHIFT_DATA_DIR) {
	envPath = process.env.OPENSHIFT_DATA_DIR + '/.env';
}

require('dotenv').config({path: envPath});


//var gulp_data = require('./gulp-data.js');
//var gulp_schema = require('./gulp-schema.js');

var allTasks = [ 'copy-images'
				, 'copy-fonts'
				, 'copy-excel' 
				, 'build-3rdparty-js' 
				, 'build-dl-data-js' 
				, 'build-dl-schema-js' 
				, 'build-dl-signup-js' 
				, 'build-3rdparty-css' 
				, 'build-donkeylift-css'
				, 'build-data-html'
				, 'build-schema-html'
				, 'build-index-html'
				, 'build-signup-html'
				, 'build-api-swagger'
				, 'build-api-js'
				, 'build-api-html'
				, 'build-auth-md'
				, 'build-docs'
				, 'build-docs-html'
				, 'build-samples'
				, 'build-samples-html'
];

var src3rd = './src/3rdparty/';

var extdir = './ext/';
if (process.env.OPENSHIFT_DATA_DIR) {
	extdir = process.env.OPENSHIFT_DATA_DIR + '/ext/';
}

var ver3rd = {
	BOOTSTRAP : 'bootstrap-custom',
	JQUERY : 'jquery-2.1.4',
	FONT_AWESOME : 'font-awesome-4.3.0',
	DATATABLES : 'DataTables-custom',
	DATATABLES_EDITOR : 'Editor-1.5.6',
	SWAGGER_UI : 'swagger-ui-2.1.4',
};

var outputs = {
	DL_COMMON_CSS: 'dl_common.css', //donkeylift.css
	DL_3RDPARTY_CSS: 'dl_3rdparty.css', //3rdparty.css
	DL_DATA_JS: 'dl_data.js', //dl_data.js
	DL_SCHEMA_JS: 'dl_schema.js', //dl_schema.js
	DL_3RDPARTY_JS: 'dl_3rdparty.js', //3rdparty.js
}

gulp.task('default', allTasks, function() {

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

gulp.task('copy-excel', function() {
	return gulp.src([extdir + 'ngen-ko/DonkeyExcel.xlsm'])	
		.pipe(gulp.dest('./public/'));
});

gulp.task('build-3rdparty-css', function() {

	return gulp.src([
				src3rd + ver3rd.BOOTSTRAP + '/css/bootstrap.min.css' 
				, src3rd + ver3rd.FONT_AWESOME + '/css/font-awesome.min.css'
				, src3rd + '/vis/vis.min.css'
				, src3rd + ver3rd.DATATABLES + '/datatables.min.css'
				, src3rd + '/bootstrap-datepicker/css/bootstrap-datepicker.min.css'
				, src3rd + '/bootstrap-slider/css/bootstrap-slider.min.css'
				, src3rd + '/bootstrap-select/css/bootstrap-select.min.css'

//				, extdir + ver3rd.DATATABLES_EDITOR + '/css/editor.dataTables.min.css' 
				, extdir + ver3rd.DATATABLES_EDITOR + '/css/editor.bootstrap.min.css' 
		])

		.pipe(concat(outputs.DL_3RDPARTY_CSS))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('build-3rdparty-js', function() {
	return gulp.src([
				src3rd + ver3rd.JQUERY + '/jquery.min.js' 
				, src3rd + '/underscore/underscore.js' 
				, src3rd + '/backbone/backbone.js' 
				, src3rd + ver3rd.BOOTSTRAP + '/js/bootstrap.min.js' 
				, src3rd + '/jwt-decode/jwt-decode.min.js' 
				, src3rd + '/typeahead/typeahead.bundle.js' 
				, src3rd + '/JSON-Patch-master/dist/json-patch-duplex.min.js' 
				, src3rd + '/vis/vis.min.js' 
				, src3rd + ver3rd.DATATABLES + '/datatables.min.js' 
				, src3rd + '/jquery-sortable/jquery-sortable-min.js' 
				, src3rd + '/bootstrap-datepicker/js/bootstrap-datepicker.min.js'
				, src3rd + '/bootstrap-slider/bootstrap-slider.min.js'
				, src3rd + '/clipboard.js/clipboard.min.js'
				, src3rd + '/bootstrap-select/js/bootstrap-select.min.js'

				, extdir + ver3rd.DATATABLES_EDITOR + '/js/dataTables.editor.min.js' 
				, extdir + ver3rd.DATATABLES_EDITOR + '/js/editor.bootstrap.js' 
				, extdir + ver3rd.DATATABLES_EDITOR + '/js/editor.typeahead.js' 
		])

		.pipe(concat(outputs.DL_3RDPARTY_JS))
		.pipe(gulp.dest('./app/js/'));
			
});

gulp.task('build-donkeylift-css', function() {
	return gulp.src('./src/css/*.css')
		.pipe(concat(outputs.DL_COMMON_CSS))
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
		.pipe(replace("$DONKEYLIFT_DEMO", process.env.DONKEYLIFT_DEMO))
		.pipe(replace("$AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID))
		.pipe(replace("$AUTH0_DOMAIN", process.env.AUTH0_DOMAIN))
		.pipe(replace("module.exports =", "var pegParser =")) //Applies only to QueryParser
		.pipe(concat(outputs.DL_DATA_JS))
		.pipe(gulp.dest('./app/js/'));
			
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
		.pipe(replace("$DONKEYLIFT_DEMO", process.env.DONKEYLIFT_DEMO))
		.pipe(replace("$AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID))
		.pipe(replace("$AUTH0_DOMAIN", process.env.AUTH0_DOMAIN))
		.pipe(concat(outputs.DL_SCHEMA_JS))
		.pipe(gulp.dest('./app/js/'));
			
});


gulp.task('build-dl-signup-js', function() {

	if ( ! process.env.DONKEYLIFT_API) {
		console.log("ERROR. Define env var DONKEYLIFT_API");
		process.exit(1);
	}

	return gulp.src(["./src/js/dl_signup.js"
			])
		.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
		.pipe(gulp.dest('./app/js/'));
			
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

		.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
		    starttag: '<!-- inject:google_analytics:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./app/'));
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

		.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
		    starttag: '<!-- inject:google_analytics:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./app/'));
});

gulp.task('build-api-swagger', function() {
	return gulp.src([src3rd + ver3rd.SWAGGER_UI + '/dist/**'])
	.pipe(gulp.dest('./app/api'));

});


gulp.task('build-api-js', ['build-api-swagger'], function() {
	var host = process.env.DONKEYLIFT_API.replace(new RegExp('http://'), '');

	return gulp.src(['./src/api/dl_swagger.js'])

		.pipe(replace("$DONKEYLIFT_API", host))
		.pipe(replace("$AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID))
		.pipe(replace("$AUTH0_DOMAIN", process.env.AUTH0_DOMAIN))

		.pipe(gulp.dest('./app/api'));
});

gulp.task('build-api-html', ['build-api-js'], function() {
	return gulp.src(['./src/api/index.html'])

		.pipe(inject(gulp.src('./src/html/common/nav-login.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
		    starttag: '<!-- inject:google_analytics:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./app/api'));
});	


gulp.task('build-auth-md', ['build-docs'], function() {

	var pre = ['<html>'
		, '<head>'
		, '<link rel="stylesheet" href="github-markdown.css">'
	    , '<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.6.0/styles/github.min.css">'
		, '<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.6.0/highlight.min.js"></script>'
		, '<script>hljs.initHighlightingOnLoad();</script>'
		, '</head>'
		, '<body><div class="markdown-body">'].join('\n');

	var post = ['</div>', '</body>', '</html>'].join('\n');

	return gulp.src(['./src/docs/AccessControl.md'])
	.pipe(markdown())
	.pipe(insert.wrap(pre, post))
	.pipe(rename('access_control.html'))
	.pipe(gulp.dest('./public/docs/'));
});

gulp.task('build-docs', function() {
	
	return gulp.src(['./src/docs/*'])
	.pipe(gulp.dest('./public/docs/'));
});

gulp.task('build-docs-html', ['build-docs'], function() {
	return gulp.src(['./src/docs/index.html', './src/docs/guides.html', './src/docs/betty.html'])

	.pipe(inject(gulp.src('./src/html/common/nav-signup.html'), {
	    starttag: '<!-- inject:nav:{{ext}} -->',
	    transform: function (filePath, file) {
	      return file.contents.toString('utf8')
   		}
  	}))

	.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
	    starttag: '<!-- inject:google_analytics:{{ext}} -->',
	    transform: function (filePath, file) {
	      return file.contents.toString('utf8')
   		}
  	}))

	.pipe(gulp.dest('./public/docs/'));
});

gulp.task('build-samples', function() {
	
	return gulp.src(['./src/docs/samples/*'])
	.pipe(gulp.dest('./public/docs/samples/'));
});

gulp.task('build-samples-html', ['build-samples'], function() {
	
	return gulp.src(['./src/docs/samples/*.html'])

	.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
	.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
	    starttag: '<!-- inject:google_analytics:{{ext}} -->',
	    transform: function (filePath, file) {
	      return file.contents.toString('utf8')
   		}
  	}))

	.pipe(gulp.dest('./public/docs/samples/'));
});

gulp.task('build-index-html', function() {

	return gulp.src(['./src/index.html'])

		.pipe(inject(gulp.src('./src/html/common/nav-signup.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
		    starttag: '<!-- inject:google_analytics:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./public/'));
	
});

gulp.task('build-signup-html', function() {

	return gulp.src(['./src/signup.html'])

		.pipe(inject(gulp.src('./src/html/common/nav-signup.html'), {
		    starttag: '<!-- inject:nav:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(inject(gulp.src('./src/html/common/google_analytics.html'), {
		    starttag: '<!-- inject:google_analytics:{{ext}} -->',
		    transform: function (filePath, file) {
		      return file.contents.toString('utf8')
    		}
  		}))

		.pipe(gulp.dest('./app/'));
	
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('./src/js/**/*.js', [
		'build-dl-data-js'
		, 'build-dl-schema-js'
		, 'build-dl-signup-js'
	]);
    gulp.watch('./src/html/**/*.html', [
		'build-data-html' 
		, 'build-schema-html'
		, 'build-signup-html'
		, 'build-index-html'
	]);
    gulp.watch('./src/data.html', ['build-data-html']);
    gulp.watch('./src/schema.html', ['build-schema-html']);
    gulp.watch('./src/css/*.css', ['build-donkeylift-css']);
    gulp.watch('./src/api/*', ['build-api-html']);
    gulp.watch('./src/docs/samples/*', ['build-samples', 'build-samples-html']);
    gulp.watch('./src/signup.html', ['build-signup-html']);
    gulp.watch('./src/index.html', ['build-index-html']);
});

