/*
This file in the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var gulpif = require('gulp-if');
var insert = require('gulp-insert');
var rename = require('gulp-rename');
var util = require('util');

process.env.AZURE_TENANT = "46b66e86-3482-4192-842f-3472ff5fe764"; //Golder
process.env.AAD_APPLICATION_ID = "7a3c34b5-2f2b-4c45-a317-242ac3f48114"; //Data365 AAD
process.env.DATA365_SERVER = "https://data365.golder.com"; //vanity domain, currenty pointing to azd365devwuas.azurewebsites.net

process.env.DATA365_SITEASSETS_DIR = "..";

var inputs = {
    SRC_DIR: './src/',
    SRC_3RDPARTY_DIR: './src/3rdparty/',
    EXT_DIR: './ext/'
};

var ver3rd = {
    BOOTSTRAP: 'bootstrap-custom/',
    JQUERY: 'jquery-2.1.4/',
    FONT_AWESOME: 'font-awesome-4.3.0/',
    DATATABLES: 'DataTables-custom/',
    DATATABLES_EDITOR: 'Editor-1.5.6/',
    SWAGGER_UI: 'swagger-ui-master/',
};

var outputs = {
    DL_COMMON_CSS: 'dl_common.css', //donkeylift.css
    DL_3RDPARTY_CSS: 'dl_3rdparty.css', //3rdparty.css

	DL_DATA_JS: 'dl_data.js', //dl_data.js
    DL_SCHEMA_JS: 'dl_schema.js', //dl_schema.js
    DL_3RDPARTY_JS: 'dl_3rdparty.js', //3rdparty.js

	D365_DATA_JS: 'd365_data.js', 
	D365_SCHEMA_JS: 'd365_schema.js', 
	D365_API_JS: 'd365_api.js',

/*	
    JS_DIR: './SPSite/Scripts/',
	CONTENT_DIR: './SPSite/Content/',
	ASPX_DIR: './SPSite/Pages/'
*/
    JS_DIR: './SPApp/Data365/Scripts/',
	CONTENT_DIR: './SPApp/Data365/Content/',
	IMAGES_DIR: './SPApp/Data365/Images/',
	ASPX_DIR: './SPApp/Data365/Pages/'
}

var tasks = [
    'build-DataBrowser-aspx',
    'build-SchemaEditor-aspx',
    'build-WebApi-aspx',
	
	'build-d365-data-js',
    'build-d365-schema-js',
    'build-d365-api-js',
	
	'build-dl-data-js',
    'build-dl-schema-js',
    'build-dl-3rdparty-js',
    'build-dl-common-css',
	'build-dl-3rdparty-css',
	
	'copy-webapi-js',
	'copy-webapi-css',
	
	'copy-images',
	'copy-fonts'
];

gulp.task('default', tasks, function () {
    // place code for your default task here
});

gulp.task('build-DataBrowser-aspx', function () {
    var snippets = {
        dialogs: [
			inputs.SRC_DIR + 'html/common/dialogs/*.html', 
			inputs.SRC_DIR + 'html/data/dialogs/*.html'
		],
        templates: [
			inputs.SRC_DIR + 'html/common/templates/*.html', 
			inputs.SRC_DIR + 'html/data/templates/*.html'
		]
    };

    return gulp.src([ inputs.SRC_DIR + 'aspx/DataBrowser.aspx' ])

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

		.pipe(replace("$DATA365_SITEASSETS_DIR", process.env.DATA365_SITEASSETS_DIR))	
		
		.pipe(gulp.dest(outputs.ASPX_DIR));
});

gulp.task('build-SchemaEditor-aspx', function () {
    var snippets = {
        dialogs: [
			inputs.SRC_DIR + 'html/common/dialogs/*.html', 
			inputs.SRC_DIR + 'html/schema/dialogs/*.html'
		],
        templates: [
			inputs.SRC_DIR + 'html/common/templates/*.html', 
			inputs.SRC_DIR + 'html/schema/templates/*.html'
		]
    };

    return gulp.src([ inputs.SRC_DIR + 'aspx/SchemaEditor.aspx' ])

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

		.pipe(replace("$DATA365_SITEASSETS_DIR", process.env.DATA365_SITEASSETS_DIR))	

		.pipe(gulp.dest(outputs.ASPX_DIR));
});

gulp.task('build-WebApi-aspx', function () {

    return gulp.src([ inputs.SRC_DIR + 'aspx/WebApi.aspx' ])

		.pipe(replace("$DATA365_SITEASSETS_DIR", process.env.DATA365_SITEASSETS_DIR))	
		.pipe(replace("$DATA365_SERVER", process.env.DATA365_SERVER))	
		
		.pipe(gulp.dest(outputs.ASPX_DIR));
});

gulp.task('build-d365-data-js', function () {

    return gulp.src([
        inputs.SRC_DIR + "js/SharePoint/Config.js",
		inputs.SRC_DIR + "js/SharePoint/App.js",
        inputs.SRC_DIR + "js/SharePoint/Common.js",
	])
	.pipe(replace("$AZURE_TENANT", process.env.AZURE_TENANT))	
	.pipe(replace("$AAD_APPLICATION_ID", process.env.AAD_APPLICATION_ID))	
	.pipe(replace("$DATA365_SERVER", process.env.DATA365_SERVER))
	.pipe(replace("$DATA365_APPLICATION", "Donkeylift.AppData"))
/*
	.pipe(replace("$DATA365_ACCOUNT", process.env.DATA365_ACCOUNT))	
	.pipe(replace("$DATA365_DATABASE", process.env.DATA365_DATABASE))	
*/
	
	.pipe(concat(outputs.D365_DATA_JS))
	.pipe(gulp.dest(outputs.JS_DIR));
});

gulp.task('build-d365-schema-js', function () {

	return gulp.src([
		inputs.SRC_DIR + "js/SharePoint/Config.js",
		inputs.SRC_DIR + "js/SharePoint/App.js",
		inputs.SRC_DIR + "js/SharePoint/Common.js",
	])
	.pipe(replace("$AZURE_TENANT", process.env.AZURE_TENANT))	
	.pipe(replace("$AAD_APPLICATION_ID", process.env.AAD_APPLICATION_ID))	
	.pipe(replace("$DATA365_SERVER", process.env.DATA365_SERVER))	
	.pipe(replace("$DATA365_APPLICATION", "Donkeylift.AppSchema"))
/*
	.pipe(replace("$DATA365_ACCOUNT", process.env.DATA365_ACCOUNT))
	.pipe(replace("$DATA365_DATABASE", process.env.DATA365_DATABASE))	
*/
	
	.pipe(concat(outputs.D365_SCHEMA_JS))
	.pipe(gulp.dest(outputs.JS_DIR));
});

	
gulp.task('build-d365-api-js', function () {

    return gulp.src([
		
        inputs.SRC_DIR + "js/SharePoint/Config.js",
		inputs.SRC_DIR + "js/SharePoint/OpenApi.js",
		inputs.SRC_DIR + "js/SharePoint/Common.js",
		
		inputs.SRC_3RDPARTY_DIR + 'jwt-decode/jwt-decode.min.js',
		inputs.SRC_3RDPARTY_DIR + 'adal-1.0.15/adal.min.js',
	])
	.pipe(replace("$AZURE_TENANT", process.env.AZURE_TENANT))	
	.pipe(replace("$AAD_APPLICATION_ID", process.env.AAD_APPLICATION_ID))	
	.pipe(replace("$DATA365_SERVER", process.env.DATA365_SERVER))

	.pipe(concat(outputs.D365_API_JS))
	.pipe(gulp.dest(outputs.JS_DIR));
});
	
gulp.task('build-dl-data-js', function () {

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

	.pipe(replace("module.exports =", "var pegParser =")) //Applies only to QueryParser

	.pipe(concat(outputs.DL_DATA_JS))
	.pipe(gulp.dest(outputs.JS_DIR));

});

gulp.task('build-dl-schema-js', function () {

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
//		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datepicker/js/bootstrap-datepicker.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-slider/bootstrap-slider.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'clipboard.js/clipboard.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-select/js/bootstrap-select.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'momentjs/moment.min.js'
		, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js'

		, inputs.SRC_3RDPARTY_DIR + 'adal-1.0.15/adal.min.js'
		
		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/dataTables.editor.min.js'
		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/editor.bootstrap.js'
		, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'js/editor.typeahead.js'
    ])

	.pipe(concat(outputs.DL_3RDPARTY_JS))
	.pipe(gulp.dest(outputs.JS_DIR));

});

gulp.task('build-dl-common-css', function () {
    return gulp.src(inputs.SRC_DIR + 'css/*.css')
		.pipe(concat(outputs.DL_COMMON_CSS))
		.pipe(gulp.dest(outputs.CONTENT_DIR + 'css'));
});

gulp.task('build-dl-3rdparty-css', function () {

    return gulp.src([
				inputs.SRC_3RDPARTY_DIR + ver3rd.BOOTSTRAP + 'css/bootstrap.min.css'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.FONT_AWESOME + 'css/font-awesome.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'vis/vis.min.css'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.DATATABLES + 'datatables.min.css'
//				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datepicker/css/bootstrap-datepicker.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-slider/css/bootstrap-slider.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-select/css/bootstrap-select.min.css'
				, inputs.SRC_3RDPARTY_DIR + 'bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css'

//				, extdir + ver3rd.DATATABLES_EDITOR + 'css/editor.dataTables.min.css' 
				, inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + 'css/editor.bootstrap.min.css'
    ])

	.pipe(concat(outputs.DL_3RDPARTY_CSS))
	.pipe(gulp.dest(outputs.CONTENT_DIR + 'css'));
});

gulp.task('copy-fonts', function () {
    return gulp.src([
				inputs.SRC_3RDPARTY_DIR + ver3rd.BOOTSTRAP + 'fonts/*'
				, inputs.SRC_3RDPARTY_DIR + ver3rd.FONT_AWESOME + 'fonts/*'
    ])

	.pipe(gulp.dest(outputs.CONTENT_DIR + 'fonts'));
});


gulp.task('copy-images', function() {

	return gulp.src([
				//src3rd + ver3rd.DATATABLES + '/media/images/*.png'
				inputs.EXT_DIR + ver3rd.DATATABLES_EDITOR + '/images/*',
			'./src/images/*'
		])

		.pipe(gulp.dest(outputs.IMAGES_DIR));
});

gulp.task('copy-webapi-js', function () {
    return gulp.src([
        inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/swagger-ui-bundle.js',
        inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/swagger-ui-standalone-preset.js'
    ])
	.pipe(gulp.dest(outputs.JS_DIR));
});

gulp.task('copy-webapi-css', function () {
    return gulp.src([inputs.SRC_3RDPARTY_DIR + ver3rd.SWAGGER_UI + 'dist/swagger-ui.css'])
	.pipe(gulp.dest(outputs.CONTENT_DIR + 'css'));

});

	
	
