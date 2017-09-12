﻿/*
This file in the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');
var markdown = require('gulp-markdown');
var insert = require('gulp-insert');
var rename = require('gulp-rename');

//require('dotenv').config();
process.env.DONKEYLIFT_API = "https://azd365testwuas.azurewebsites.net";
process.env.DONKEYLIFT_DEMO = 1;

var inputs = {
    SRC_DIR: '../src/',
    SRC_3RDPARTY_DIR: '../src/3rdparty/',
    EXT_DIR: '../ext/'
};

var ver3rd = {
    BOOTSTRAP: 'bootstrap-custom/',
    JQUERY: 'jquery-2.1.4/',
    FONT_AWESOME: 'font-awesome-4.3.0/',
    DATATABLES: 'DataTables-custom/',
    DATATABLES_EDITOR: 'Editor-1.5.6/',
    SWAGGER_UI: 'swagger-ui-2.1.4/',
};

var outputs = {
    DL_COMMON_CSS: 'dl_common.css', //donkeylift.css
    DL_3RDPARTY_CSS: 'dl_3rdparty.css', //3rdparty.css
    DL_DATA_JS: 'dl_data.js', //dl_data.js
    DL_SCHEMA_JS: 'dl_schema.js', //dl_schema.js
    DL_3RDPARTY_JS: 'dl_3rdparty.js', //3rdparty.js
    JS_DIR: './Scripts/',
    CSS_DIR: './Content/css/',
}

var allTasks = [
    'DataBrowser',
    'SchemaEditor',
    'build-dl-data-js',
    'build-dl-schema-js',
    'build-dl-3rdparty-js',
    'build-dl-swagger-js',
    'build-dl-common-css',
    'build-dl-3rdparty-css',
];


gulp.task('default', allTasks, function () {
    // place code for your default task here
});


gulp.task('DataBrowser', function () {
    var snippets = {
        dialogs: ['../src/html/common/dialogs/*.html', '../src/html/data/dialogs/*.html'],
        templates: ['../src/html/common/templates/*.html', '../src/html/data/templates/*.html']
    };

    return gulp.src(['./src/DataBrowser.aspx'])

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

		.pipe(gulp.dest('./Pages/'));

});

gulp.task('SchemaEditor', function () {
    var snippets = {
        dialogs: ['../src/html/common/dialogs/*.html', '../src/html/schema/dialogs/*.html'],
        templates: ['../src/html/common/templates/*.html', '../src/html/schema/templates/*.html']
    };

    return gulp.src(['./src/SchemaEditor.aspx'])

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

		.pipe(gulp.dest('./Pages/'));
});


gulp.task('build-dl-data-js', function () {

    if (!process.env.DONKEYLIFT_API) {
        console.log("ERROR. Define env var DONKEYLIFT_API");
        process.exit(1);
    }

    return gulp.src([
        inputs.SRC_DIR + "js/common/AppBase.js",
		inputs.SRC_DIR + "js/common/models/*.js",
		inputs.SRC_DIR + "js/data/models/*.js",
		inputs.SRC_DIR + "js/common/collections/*.js",
		inputs.SRC_DIR + "js/data/collections/*.js",
		inputs.SRC_DIR + "js/common/views/*.js",
		inputs.SRC_DIR + "js/data/views/*.js",
		inputs.SRC_DIR + "js/data/QueryParser.js",
		inputs.SRC_DIR + "js/data/RouterData.js",
		inputs.SRC_DIR + "js/data/AppData.js"
    ])

	.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
	.pipe(replace("$DONKEYLIFT_DEMO", process.env.DONKEYLIFT_DEMO))
	.pipe(replace("module.exports =", "var pegParser =")) //Applies only to QueryParser
	.pipe(concat(outputs.DL_DATA_JS))
	.pipe(gulp.dest(outputs.JS_DIR));

});

gulp.task('build-dl-schema-js', function () {

    if (!process.env.DONKEYLIFT_API) {
        console.log("ERROR. Define env var DONKEYLIFT_API");
        process.exit(1);
    }

    return gulp.src([
        inputs.SRC_DIR + "js/common/AppBase.js",
		inputs.SRC_DIR + "js/common/models/*.js",
		inputs.SRC_DIR + "js/schema/models/*.js",
		inputs.SRC_DIR + "js/common/collections/*.js",
		inputs.SRC_DIR + "js/schema/collections/*.js",
		inputs.SRC_DIR + "js/common/views/*.js",
		inputs.SRC_DIR + "js/schema/views/*.js",
		inputs.SRC_DIR + "js/schema/RouterSchema.js",
		inputs.SRC_DIR + "js/schema/AppSchema.js"
    ])

	.pipe(replace("$DONKEYLIFT_API", process.env.DONKEYLIFT_API))
	.pipe(replace("$DONKEYLIFT_DEMO", process.env.DONKEYLIFT_DEMO))
	.pipe(concat(outputs.DL_SCHEMA_JS))
	.pipe(gulp.dest(outputs.JS_DIR));
});

gulp.task('build-dl-3rdparty-js', function () {
    return gulp.src([
		inputs.SRC_3RDPARTY_DIR + ver3rd.JQUERY + 'jquery.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'underscore/underscore.js'
		, inputs.SRC_3RDPARTY_DIR + 'backbone/backbone.js'
		, inputs.SRC_3RDPARTY_DIR + ver3rd.BOOTSTRAP + 'js/bootstrap.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'jwt-decode/jwt-decode.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'typeahead/typeahead.bundle.js'
		, inputs.SRC_3RDPARTY_DIR + 'JSON-Patch-master/dist/json-patch-duplex.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'vis/vis.min.js'
		, inputs.SRC_3RDPARTY_DIR + ver3rd.DATATABLES + 'datatables.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'jquery-sortable/jquery-sortable-min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datepicker/js/bootstrap-datepicker.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-slider/bootstrap-slider.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'clipboard.js/clipboard.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-select/js/bootstrap-select.min.js'

		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/dataTables.editor.min.js'
		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/editor.bootstrap.js'
		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/editor.typeahead.js'
    ])

		.pipe(concat(outputs.DL_3RDPARTY_JS))
		.pipe(gulp.dest(outputs.JS_DIR));

});

gulp.task('build-dl-swagger-js', ['copy-api-swagger-js', 'copy-api-swagger-lib-js', 'copy-api-swagger-dist'], function () {
    var host = process.env.DONKEYLIFT_API.replace(new RegExp('http://'), '');

    return gulp.src([inputs.SRC_DIR + 'api/dl_swagger.js'])

		.pipe(replace("$DONKEYLIFT_API", host))
		.pipe(gulp.dest(outputs.JS_DIR + 'api'));
});

gulp.task('copy-api-swagger-js', function () {
    return gulp.src([
        inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/swagger-ui.min.js'
    ])
	.pipe(gulp.dest(outputs.JS_DIR + 'api'));
});

gulp.task('copy-api-swagger-lib-js', function () {
    return gulp.src([
        inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/lib/*.js',
    ])
	.pipe(gulp.dest(outputs.JS_DIR + 'api/lib'));

});

gulp.task('copy-api-swagger-dist', function () {
    return gulp.src([inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/**'])
	.pipe(gulp.dest('./Content/api'));

});


gulp.task('build-dl-common-css', function () {
    return gulp.src(inputs.SRC_DIR + 'css/*.css')
		.pipe(concat(outputs.DL_COMMON_CSS))
		.pipe(gulp.dest(outputs.CSS_DIR));
});

gulp.task('build-dl-3rdparty-css', ['copy-fonts'], function () {

    return gulp.src([
				inputs.SRC_3RDPARTY_DIR + ver3rd.BOOTSTRAP + 'css/bootstrap.min.css'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.FONT_AWESOME + 'css/font-awesome.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'vis/vis.min.css'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.DATATABLES + 'datatables.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datepicker/css/bootstrap-datepicker.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-slider/css/bootstrap-slider.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-select/css/bootstrap-select.min.css'

//				, extdir + ver3rd.DATATABLES_EDITOR + 'css/editor.dataTables.min.css' 
				, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'css/editor.bootstrap.min.css'
    ])

	.pipe(concat(outputs.DL_3RDPARTY_CSS))
	.pipe(gulp.dest(outputs.CSS_DIR));
});

gulp.task('copy-fonts', function () {
    return gulp.src([
				inputs.SRC_3RDPARTY_DIR + ver3rd.BOOTSTRAP + 'fonts/*'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.FONT_AWESOME + 'fonts/*'
    ])

	.pipe(gulp.dest('./Content/fonts'));
});



