/*global Backbone, $, _ */


var Donkeylift = {
	
//set by gulp according to env vars
// e.g. DONKEYLIFT_API. "http://api.donkeylift.com";

	env: {
	    API_BASE: "https://azd365testwuas.azurewebsites.net"
	    , AUTH0_CLIENT_ID: "$AUTH0_CLIENT_ID"
	    , AUTH0_DOMAIN: "$AUTH0_DOMAIN"
	    , DEMO_FLAG: + "1"
	},

	DEMO_ACCOUNT: 'test',
	DEMO_USER: 'dkottow@golder.com',
	
	util: {
		/*** implementation details at eof ***/
		removeDiacritics: function(str) {
		  return str.replace(/[^\u0000-\u007e]/g, function(c) {
		    return diacriticsMap[c] || c;
		  });
		}
	}
	
};

function AppBase(opts) {
	var me = this;

  console.log('AppBase ctor');
	
	this.navbarView = new Donkeylift.NavbarView();
  if (Donkeylift.env.AUTH0_DOMAIN && !Donkeylift.env.DEMO_FLAG) {
    this.lock = new Auth0Lock(Donkeylift.env.AUTH0_CLIENT_ID, Donkeylift.env.AUTH0_DOMAIN);
	}

  $.ajaxPrefilter(function( options, orgOptions, jqXHR ) {
    me.ajaxPrefilter(options, orgOptions, jqXHR);
  });

	$('#toggle-sidebar').click(function() {
		me.toggleSidebar();
	}); 

	Backbone.history.start();

  new Clipboard('.btn'); //attach clipboard option

}

AppBase.prototype.ajaxPrefilter = function(options, orgOptions, jqXHR) {

  $('#ajax-progress-spinner').show();
  jqXHR.always(function() {
    $('#ajax-progress-spinner').hide();
  });
  
  //add user authentication
  if (this.account && this.account.get('auth')) {
    var id_token = this.account.get('id_token');
    jqXHR.setRequestHeader('Authorization', 'Bearer ' + id_token);

  } else if (this.account && ! this.account.get('auth')) {
    var q = 'user=' + encodeURIComponent(this.account.get('user'));
    if (options.url.indexOf('?') < 0) options.url = options.url + '?' + q;    
    else options.url = options.url + '&' + q;    
  }
}

AppBase.prototype.start = function(opts, cbAfter) {
	var me = this;

	if (Donkeylift.env.DEMO_FLAG) {
    Donkeylift.env.API_BASE = opts.server || Donkeylift.env.API_BASE;
    opts.user = opts.user || sessionStorage.getItem('dl_user') || Donkeylift.DEMO_USER
    opts.account = opts.account || sessionStorage.getItem('dl_account') || Donkeylift.DEMO_ACCOUNT
    opts.auth = opts.auth === true;
    
    //TODO ? 
		//this.loadAccount(opts, cbAfter); //loads all schemas - wont work for non-admins
		this.setAccount(opts, cbAfter);
    
  } else {
    //auth0 id_token in sessionStorage
    this.loadAccount({ 
      id_token: sessionStorage.getItem('id_token'),
      auth: true
    }, cbAfter);
  }

}

AppBase.prototype.setAccount = function(params, cbAfter) {
	var me = this;
	console.log('setAccount: ' + params);

  params.reset = params.reset || (!! params.account); 
  
	this.account = new Donkeylift.Account(params);

  this.navbarView.model = this.account;
  me.navbarView.render();

  me.menuView.render();
  $('#content').empty();

  if (params.reset) me.unsetSchema();

  me.onAccountLoaded(cbAfter);

	$('#toggle-sidebar').hide();
}

AppBase.prototype.loadAccount = function(params, cbAfter) {
	var me = this;
	console.log('loadAccount: ' + params);

	this.account = new Donkeylift.Account(params);

	this.navbarView.model = this.account;
  
  if (this.schemaListView) this.schemaListView.remove();
  this.schemaListView = new Donkeylift.SchemaListView({ model: this.account });

	this.account.fetch({ success: function() {
		me.navbarView.render();

		$('#schema-dropdown').append(me.schemaListView.render().el);
		//me.schemaListView.render();
		me.menuView.render();
		$('#content').empty();
		me.onAccountLoaded(cbAfter);
	}});

	$('#toggle-sidebar').hide();
}

AppBase.prototype.onAccountLoaded = function(cbAfter) {
  if (cbAfter) cbAfter();
  //overwrite me
}

AppBase.prototype.toggleSidebar = function() {
	if ($('#table-list').is(':visible')) {
    $('.profile-info').hide('slide');
    $('#menu').hide();
    $('#table-list').hide('slide', function() {
      $('#module').toggleClass('col-sm-16 col-sm-13');             
      $('#sidebar').toggleClass('col-sm-3 col-sm-0');
    });
	} else {
		$('#module').toggleClass('col-sm-16 col-sm-13');             
		$('#sidebar').toggleClass('col-sm-3 col-sm-0');
    $('#table-list').show('slide');
    $('#menu').show('slide');
    $('.profile-info').show('slide');
	}
}

AppBase.prototype.createTableView = function(table, params) {
	//overwrite me
}

AppBase.prototype.setTable = function(table, params) {
	console.log('app.setTable ' + params);

	var $a = $("#table-list a[data-target='" + table.get('name') + "']");
	$('#table-list a').removeClass('active');
	$a.addClass('active');

  this.unsetTable();

	this.table = table;
	this.tableView = this.createTableView(table, params);

	$('#content').html(this.tableView.el);
	this.tableView.render();
	
	this.menuView.render();
}

AppBase.prototype.resetTable = function() {
	if (this.table) this.setTable(this.table);
}

AppBase.prototype.unsetTable = function() {
	this.table = null;
	if (this.tableView) this.tableView.remove();
}

AppBase.prototype.addAncestorFieldsToSelect = function($select) {
  var aliasTables = [ this.table ]
      .concat(this.schema.get('tables').getAncestors(this.table));
        
  _.each(aliasTables, function(table) {
    var $opt = $('<optgroup label="' + table.get('name') + '"></optgroup>');
    table.get('fields').each(function(field) {
      var qn = table.getFieldQN(field);
      $opt.append($('<option></option>')
        .attr('value', qn)
        .text(field.get('name')));
    }, this);
    $select.append($opt);
  });
}

/**** schema stuff ****/

AppBase.prototype.unsetSchema = function() {
	this.schema = null;
	if (this.tableListView) this.tableListView.remove();
	this.unsetTable();
	$('#content').empty();
	this.navbarView.render();
}

AppBase.prototype.createSchema = function(name) {
	//overwrite me
}

AppBase.prototype.resetSchema = function(opts, cbAfter) {
	if (this.schema) this.setSchema(this.schema.get('name'), opts, cbAfter);
}

AppBase.prototype.setSchema = function(name, opts, cbAfter) {
	console.log('AppBase.setSchema ' + name);
	var me = this;

  if (typeof arguments[arguments.length - 1] == 'function') {
    cbAfter = arguments[arguments.length - 1];
  }
  opts = typeof opts == 'object' ? opts : {};
  
	var loadRequired = (! this.schema) || (this.schema.get('name') != name);
  var reload = opts.reload !== undefined ? opts.reload : loadRequired; 

	var updateViewsFn = function() {
		//always false if (me.tableListView) me.tableListView.remove();
		me.tableListView = new Donkeylift.TableListView({
			model: me.schema,
			collection: me.schema.get('tables')
		});
    $('#sidebar').append(me.tableListView.el);
    me.tableListView.render();
		$('#toggle-sidebar').show();

		if (me.schemaListView) me.schemaListView.render();
		me.navbarView.render();
		me.menuView.render();
	}

	if (reload) {
		this.unsetSchema();
		this.schema = this.createSchema(name); //impl in AppData / AppSchema
    this.schema.fetch(function() {
      me.account.set('principal', me.schema.get('login').principal);
      updateViewsFn();
      if (cbAfter) cbAfter();
		});

	} else {
		console.log(' ! reload ' + this.schema.get('name'));
		var currentSchema = this.schema;
		this.unsetSchema();
		this.schema = currentSchema;
		updateViewsFn();
		if (cbAfter) cbAfter();
	}
}

AppBase.prototype.getProp = function(key) {
  return this.schema.get('props').getProp(key);
}
  
AppBase.prototype.setProp = function(key, value) {
  return this.schema.get('props').setProp(key, value);
}

/******* init on script load ******/

_.templateSettings = {
    //evaluate: /\{\[([\s\S]+?)\}\}/g,   //dont use evaluate. 
    interpolate: /\{\{([\s\S]+?)\}\}/g,  //use handlebar syntax. 
};

/******* util stuff ********/

var replacementList = [
  {
    base: ' ',
    chars: "\u00A0",
  }, {
    base: '0',
    chars: "\u07C0",
  }, {
    base: 'A',
    chars: "\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F",
  }, {
    base: 'AA',
    chars: "\uA732",
  }, {
    base: 'AE',
    chars: "\u00C6\u01FC\u01E2",
  }, {
    base: 'AO',
    chars: "\uA734",
  }, {
    base: 'AU',
    chars: "\uA736",
  }, {
    base: 'AV',
    chars: "\uA738\uA73A",
  }, {
    base: 'AY',
    chars: "\uA73C",
  }, {
    base: 'B',
    chars: "\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0181",
  }, {
    base: 'C',
    chars: "\u24b8\uff23\uA73E\u1E08\u0106\u0043\u0108\u010A\u010C\u00C7\u0187\u023B",
  }, {
    base: 'D',
    chars: "\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018A\u0189\u1D05\uA779",
  }, {
    base: 'Dh',
    chars: "\u00D0",
  }, {
    base: 'DZ',
    chars: "\u01F1\u01C4",
  }, {
    base: 'Dz',
    chars: "\u01F2\u01C5",
  }, {
    base: 'E',
    chars: "\u025B\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E\u1D07",
  }, {
    base: 'F',
    chars: "\uA77C\u24BB\uFF26\u1E1E\u0191\uA77B",
  }, {
    base: 'G',
    chars: "\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E\u0262",
  }, {
    base: 'H',
    chars: "\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D",
  }, {
    base: 'I',
    chars: "\u24BE\uFF29\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197",
  }, {
    base: 'J',
    chars: "\u24BF\uFF2A\u0134\u0248\u0237",
  }, {
    base: 'K',
    chars: "\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2",
  }, {
    base: 'L',
    chars: "\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780",
  }, {
    base: 'LJ',
    chars: "\u01C7",
  }, {
    base: 'Lj',
    chars: "\u01C8",
  }, {
    base: 'M',
    chars: "\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C\u03FB",
  }, {
    base: 'N',
    chars: "\uA7A4\u0220\u24C3\uFF2E\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u019D\uA790\u1D0E",
  }, {
    base: 'NJ',
    chars: "\u01CA",
  }, {
    base: 'Nj',
    chars: "\u01CB",
  }, {
    base: 'O',
    chars: "\u24C4\uFF2F\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C",
  }, {
    base: 'OE',
    chars: "\u0152",
  }, {
    base: 'OI',
    chars: "\u01A2",
  }, {
    base: 'OO',
    chars: "\uA74E",
  }, {
    base: 'OU',
    chars: "\u0222",
  }, {
    base: 'P',
    chars: "\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754",
  }, {
    base: 'Q',
    chars: "\u24C6\uFF31\uA756\uA758\u024A",
  }, {
    base: 'R',
    chars: "\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782",
  }, {
    base: 'S',
    chars: "\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784",
  }, {
    base: 'T',
    chars: "\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786",
  }, {
    base: 'Th',
    chars: "\u00DE",
  }, {
    base: 'TZ',
    chars: "\uA728",
  }, {
    base: 'U',
    chars: "\u24CA\uFF35\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244",
  }, {
    base: 'V',
    chars: "\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245",
  }, {
    base: 'VY',
    chars: "\uA760",
  }, {
    base: 'W',
    chars: "\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72",
  }, {
    base: 'X',
    chars: "\u24CD\uFF38\u1E8A\u1E8C",
  }, {
    base: 'Y',
    chars: "\u24CE\uFF39\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE",
  }, {
    base: 'Z',
    chars: "\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762",
  }, {
    base: 'a',
    chars: "\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250\u0251",
  }, {
    base: 'aa',
    chars: "\uA733",
  }, {
    base: 'ae',
    chars: "\u00E6\u01FD\u01E3",
  }, {
    base: 'ao',
    chars: "\uA735",
  }, {
    base: 'au',
    chars: "\uA737",
  }, {
    base: 'av',
    chars: "\uA739\uA73B",
  }, {
    base: 'ay',
    chars: "\uA73D",
  }, {
    base: 'b',
    chars: "\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253\u0182",
  }, {
    base: 'c',
    chars: "\uFF43\u24D2\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184",
  }, {
    base: 'd',
    chars: "\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\u018B\u13E7\u0501\uA7AA",
  }, {
    base: 'dh',
    chars: "\u00F0",
  }, {
    base: 'dz',
    chars: "\u01F3\u01C6",
  }, {
    base: 'e',
    chars: "\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u01DD",
  }, {
    base: 'f',
    chars: "\u24D5\uFF46\u1E1F\u0192",
  }, {
    base: 'ff',
    chars: "\uFB00",
  }, {
    base: 'fi',
    chars: "\uFB01",
  }, {
    base: 'fl',
    chars: "\uFB02",
  }, {
    base: 'ffi',
    chars: "\uFB03",
  }, {
    base: 'ffl',
    chars: "\uFB04",
  }, {
    base: 'g',
    chars: "\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\uA77F\u1D79",
  }, {
    base: 'h',
    chars: "\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265",
  }, {
    base: 'hv',
    chars: "\u0195",
  }, {
    base: 'i',
    chars: "\u24D8\uFF49\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131",
  }, {
    base: 'j',
    chars: "\u24D9\uFF4A\u0135\u01F0\u0249",
  }, {
    base: 'k',
    chars: "\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
  }, {
    base: 'l',
    chars: "\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747\u026D",
  }, {
    base: 'lj',
    chars: "\u01C9",
  }, {
    base: 'm',
    chars: "\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F",
  }, {
    base: 'n',
    chars: "\u24DD\uFF4E\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5\u043B\u0509",
  }, {
    base: 'nj',
    chars: "\u01CC",
  }, {
    base: 'o',
    chars: "\u24DE\uFF4F\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\xF8\u01FF\uA74B\uA74D\u0275\u0254\u1D11",
  }, {
    base: 'oe',
    chars: "\u0153",
  }, {
    base: 'oi',
    chars: "\u01A3",
  }, {
    base: 'oo',
    chars: "\uA74F",
  }, {
    base: 'ou',
    chars: "\u0223",
  }, {
    base: 'p',
    chars: "\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755\u03C1",
  }, {
    base: 'q',
    chars: "\u24E0\uFF51\u024B\uA757\uA759",
  }, {
    base: 'r',
    chars: "\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783",
  }, {
    base: 's',
    chars: "\u24E2\uFF53\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B\u0282",
  }, {
    base: 'ss',
    chars: "\xDF",
  }, {
    base: 't',
    chars: "\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787",
  }, {
    base: 'th',
    chars: "\u00FE",
  }, {
    base: 'tz',
    chars: "\uA729",
  }, {
    base: 'u',
    chars: "\u24E4\uFF55\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289",
  }, {
    base: 'v',
    chars: "\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C",
  }, {
    base: 'vy',
    chars: "\uA761",
  }, {
    base: 'w',
    chars: "\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73",
  }, {
    base: 'x',
    chars: "\u24E7\uFF58\u1E8B\u1E8D",
  }, {
    base: 'y',
    chars: "\u24E8\uFF59\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF",
  }, {
    base: 'z',
    chars: "\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763",
  }
];

var diacriticsMap = {};
for (var i = 0; i < replacementList.length; i += 1) {
  var chars = replacementList[i].chars;
  for (var j = 0; j < chars.length; j += 1) {
    diacriticsMap[chars[j]] = replacementList[i].base;
  }
}


Donkeylift.AppBase = AppBase;


/*global Backbone, Donkeylift, $ */

Donkeylift.Account = Backbone.Model.extend({

	initialize: function(attrs) {		
		console.log("Account.initialize");		
		console.log(attrs);
		
		
		if (attrs.auth === false) {
			this.set('name', attrs.account);
			this.set('user', attrs.user);
			this.set('auth', false);

		} else {
			
			var token_attrs = jwt_decode(attrs.id_token);
			
			//root users have access to any account.
			var account = attrs.account || token_attrs.app_metadata.account;
	
			this.set('name', account);
			this.set('user', attrs.user || token_attrs.email);
			this.set('app_metadata', token_attrs.app_metadata);
			this.set('id_token', attrs.id_token);
		}

		sessionStorage.setItem('dl_user', this.get('user'));
		sessionStorage.setItem('dl_account', this.get('name'));
	},

	url	: function() { 
		return Donkeylift.env.API_BASE + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

	getDownloadLink : function(dbName, cbResult) {
		var me = this;
		var db = this.get('databases').find(function(db) { 
			return db.get('name') == dbName; 
		});
		
		var path = '/' + this.get('name') + '/' + db.get('name') + '.sqlite';
		var url = this.url() + '/' + db.get('name') + '.nonce';

		$.ajax(url, {
			type: 'POST',
			data: JSON.stringify({ path: path }),
			contentType:'application/json; charset=utf-8',
			dataType: 'json'
		}).done(function(response) {
			var link = Donkeylift.env.API_BASE + path + '?nonce=' + response.nonce;
			cbResult(null, link);
			//console.dir(response);
		});
	},
	
	principal: function() {
		return this.get('principal') || this.get('user');
	},

	isAdmin : function() {
		return this.get('auth') === false || 
			(this.get('app_metadata') && this.get('app_metadata').admin);		
	}

});


/*global Backbone, Donkeylift */

Donkeylift.Alias = Backbone.Model.extend({ 
	
	initialize: function(attrs) {
	},

	toString: function() {
		return this.get('table').get('name') + '.' 
			 + this.get('field').get('name');
	}

});

Donkeylift.Alias.parse = function(tableName, fieldName) {
	//console.log('Alias.parse ' + tableName + '.' + fieldName);
	var table = Donkeylift.app.schema.get('tables').getByName(tableName);
	var field = table.get('fields').getByName(fieldName);
	return new Donkeylift.Alias({table: table, field: field});
}


/*global Donkeylift, Backbone, _ */

function escapeStr(str) {
	return str.replace("'", "\\'");
}

Donkeylift.Field = Backbone.Model.extend({
	initialize: function(field) {
		this.set('disabled', field.disabled == true);		
		this.set('resolveRefs', true); //auto join row alias for all foreign keys
	},

	vname: function() {

		if (this.get('resolveRefs') && this.get('fk') == 1) {
			if (this.get('name').match(/id$/)) { 
				return this.get('name').replace(/id$/, "ref");
			} else {
				return this.get('name') + "_ref";
			}
/* TODO			
		} else if (this.get('name') == 'id' && resolveRefs) {
			return 'ref'; 
*/
		} else {
			return this.get('name');
		}
	},

	typeName: function() {
		return Donkeylift.Field.typeName(this.get('type'));
	},

	setType: function(typeName, typeSuffix) {
		if ( ! Donkeylift.Field.TYPES[typeName]) {
			throw new Error("setType failed. Unknown type '" + typeName + "'");
		}	
		if (typeName == 'text' && typeSuffix.length > 0) {
			var length = typeSuffix.toUpperCase() == 'MAX' ? 'MAX' : parseInt(typeSuffix);
			this.set('type', typeName + '(' + length + ')');

		} else if (typeName == 'decimal' && typeSuffix.length > 0) {
			var parts = typeSuffix.split(',');
			this.set('type', typeName + '(' + parseInt(parts[0]) + ',' + parseInt(parts[1]) + ')');

		} else {
			this.set('type', typeName);
		}
	},

	typeSuffix: function() {
		return Donkeylift.Field.typeSuffix(this.get('type'));
	},

	getProp: function(name) {
		if ( ! this.propKey) return undefined;
		return Donkeylift.app.getProp(this.propKey(name));
	},

	setProp: function(name, value) {
		if ( ! this.propKey) return;
		Donkeylift.app.setProp(this.propKey(name), value);
	},

	allProps : function() {
		//TODO
	},

	visible: function() {
		var visible = this.getProp('visible');
		if (visible === undefined) {
			visible = this.get('name')[0] != '_';	
		}  
		return visible;
	},

	attrJSON: function() {
		var attrs = _.clone(_.omit(this.attributes, 'props'));
		attrs.props = this.allProps();
		//attrs.props = this.get('props').attributes;
		return attrs;
	},

	toJSON: function() {
		//var type = Donkeylift.Field.ALIAS[this.get('type')];

		return {
			name: this.get('name'),
			type: this.get('type'),
			disabled: this.get('disabled'),
			props: this.allProps()
		};
	},

	parse: function(val, opts) {
		opts = opts || {};
		var validate = opts.validate || false;
		var resolveRefs = opts.resolveRefs || false;
		var result = null;
		var resultError = true;

		if ( ! val || val.length == 0) return result;

		var t = this.typeName();

		if (this.get('fk') == 1 && resolveRefs) {
			result = Donkeylift.Field.getIdFromRef(val);
			resultError = isNaN(result); 

		} else if (this.get('fk') == 1 && ! resolveRefs) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.text) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.integer) {
			result = parseInt(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.decimal) {
			result = parseFloat(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.date) {
			//return new Date(val);
			result = new Date(val);
			resultError = isNaN(Date.parse(val)); 
			if ( ! resultError) result = result.toISOString().substr(0,10);

		} else if (t == Donkeylift.Field.TYPES.timestamp) {
			//return new Date(val);
			result = new Date(val);
			resultError = isNaN(Date.parse(val)); 
			if ( ! resultError) result = result.toISOString();

		} else if(t == Donkeylift.Field.TYPES.float) {
			result = parseFloat(val);
			resultError = isNaN(result); 
		}

		if (validate && resultError) {
			var err;
			if (this.get('fk') == 1) {
				err = new Error("Parse '" + val + "' ref failed.");
			} else {
				err = new Error("Parse '" + val + "'" + " to " + t + " failed.");
			}
			err.field = this.vname(opts);
			throw err;
		}
		return result;
	},

	//to formatted string (pretty-print)
	toFS: function(val) {
		//console.log(val);
		var t = this.typeName();
		if (_.isNumber(val) && this.getProp('scale')) {
			return val.toFixed(this.getProp('scale'));
		} else if (t == 'date' || t == 'timestamp') {
			//JSON - Date ISO string
			return this.parse(val);
		} else if (t == 'text') {
			return _.escape(String(val));
		} else {
			return String(val);
		}
	},

	//to query string
	toQS: function(val, opts) {
		opts = opts || {};
		var resolveRefs = opts.resolveRefs || false;

		if (val === null) return "null";

		if (this.get('fk') == 1 && resolveRefs) {
			return Donkeylift.Field.getIdFromRef(val);
		} else if (this.get('fk') == 1 && ! resolveRefs) {
			return "'" + escapeStr(val) + "'";
		}

		var t = this.typeName();

		if (   t == Donkeylift.Field.TYPES.integer 
			|| t == Donkeylift.Field.TYPES.decimal
			|| t == Donkeylift.Field.TYPES.float) 
		{
			return val;

		} else {
			return "'" + escapeStr(val) + "'";
		}
	},

	setTypeByExample: function(val) {
		if (String(parseInt(val)) == val) {
			this.set('type', Donkeylift.Field.TYPES.integer);
			return;
		} 
		var num = val.replace(/[^0-9-.]/g, '');
		console.log(num);
		if (num.length > 0 && ! isNaN(num)) {
			this.set('type', Donkeylift.Field.TYPES.decimal);
			//TODO set precision
			return;
		} 
		if ( ! isNaN(Date.parse(val))) {
			this.set('type', Donkeylift.Field.TYPES.date);
			return;
		} 
		this.set('type', Donkeylift.Field.TYPES.text);
	}

});

Donkeylift.Field.create = function(name) {
	return new Donkeylift.Field({
		name: name,
		type: Donkeylift.Field.TYPES.text,
	});
}


Donkeylift.Field.TYPES = {
	text: 'text', 
	integer: 'integer', 
	decimal: 'decimal', 
	date: 'date', 
	timestamp: 'timestamp', 
	float: 'float'
};

Donkeylift.Field.PROPERTIES = [
	{ 
		'name': 'order'
		, 'type': 'Integer' 
		, 'default': 100
	}
	, { 
		'name': 'width'
		, 'type': 'Integer'
		, 'default': 16
	}
	, { 
		'name': 'scale'
		, 'type': 'Integer'
		, 'scope': [ 'Decimal' ]
		, 'default': 2
	}
/*	
	, { 
		'name': 'label',
		'type': 'Text'
	}
*/	
	, { 
		'name': 'visible'
		, 'type': 'Boolean'
		, 'default': true
	}
];	

Donkeylift.Field.typeName = function(fieldType) 
{
    var m = fieldType.match(/^[a-z]+/);
    if (m && m.length > 0) return m[0];
    return null;
}

Donkeylift.Field.typeSuffix = function(fieldType) 
{
    var m = fieldType.match(/\(([0-9]+,?[0-9]*)\)$/);
    if (m && m.length > 1) return m[1];
    return '';
}

Donkeylift.Field.toDate = function(dateISOString) {
	return new Date(dateISOString.split('-')[0],
					dateISOString.split('-')[1] - 1,
					dateISOString.split('-')[2]);
}

Donkeylift.Field.getIdFromRef = function(val) {
	if (_.isNumber(val)) return val;
	//extract fk from ref such as 'Book [12]'
	var m = val.match(/^(.*)\[([0-9]+)\]$/);
	//console.log(val + " matches " + m);
	if (m && m.length == 3) return parseInt(m[2]);
	else return NaN;
}




/*global Donkeylift, Backbone, _ */


Donkeylift.Property = Backbone.Model.extend({ 
	
	initialize : function(attrs) {
		//console.log("Row.initialize " + attrs);
	},
});		

Donkeylift.Properties = Backbone.Collection.extend({

	model: Donkeylift.Property,
	
	initialize: function(props, options) {
		this.schema = options.schema;
	},
	
	url : function() {
		return this.schema.url() + '/' + Donkeylift.Properties.TABLE;
	},

	parse : function(response) {
		console.log("Properties.parse...");
		var rows = _.map(response.rows, function(row) {			
			try {
				row[Donkeylift.Properties.FIELDS.value] = JSON.parse(row[Donkeylift.Properties.FIELDS.value]);
			} catch(err) {
				console.log("Error parsing property " + row[Donkeylift.Properties.FIELDS.value]);
				console.log(JSON.stringify(row));
			}
			return row;
		});
		return rows;
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Properties.fetch...");
		Backbone.Collection.prototype.fetch.call(this, {
			success: function() {
				console.log("Properties.fetch OK");
				if (cbAfter) cbAfter();
			},
			error: function(collection, response, options) {
				console.log("Error requesting " + me.url());		
				console.log(response);
			}
		});
	},
			
			 
	getUpdateRows : function(opts) {
		var updateRows = [];
		var insertRows = [];
		opts = opts || {};
		this.each(function(row) {
			if (row.get('own_by') == Donkeylift.Properties.SYSTEM_OWNER) {
				; //ignore system props

			} else if (opts.table && row.get('TableName') != opts.table && row.get('FieldName')) {
				; //ignore field props from other tables

			} else if (row.has('id')) {
				updateRows.push(row);

			} else {
				insertRows.push(row);		
			}
		});
		return {
			update: updateRows,
			insert: insertRows
		}
	},

	update : function(opts, cbAfter) {
		var me = this;  
		
		opts = typeof opts == 'object' ? opts : {};
		if (typeof arguments[arguments.length - 1] == 'function') {
		  cbAfter = arguments[arguments.length - 1];
		}
	  
		var rows = this.getUpdateRows(opts);
		var insertData = JSON.stringify(_.map(rows.insert, function(row) { return row.attributes; }));
		var updateData = JSON.stringify(_.map(rows.update, function(row) { return row.attributes; }));
		var url = this.url();
		$.ajax(url, {
			method: 'POST'
			, data: insertData
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log("Properties.update POST ok.");			
			//console.log(response);			
			_.each(rows.insert, function(row, idx) {
				row.set('id', response.rows[idx].id);
			});
			if (cbAfter) cbAfter();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			if (cbAfter) cbAfter(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});

		$.ajax(url, {
			method: 'PUT'
			, data: updateData
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log("Properties.update PUT ok.");			
			console.log(response);			
			if (cbAfter) cbAfter();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			if (cbAfter) cbAfter(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});		
	},

	setKeyFuncs : function() {
		this.schema.get('tables').each(function(table) {
			table.propKey = function(name) {
				var key = [ table.get('name'), name ].join('.');
				return key;		
			}
			table.get('fields').each(function(field) {
				field.propKey = function(name) {
					var key = [ 
						table.get('name'), 
						field.get('name'), 
						name ].join('.');
					return key;		
				}
			});
		});		
	},

	getProp : function(key) {
		var row = this.getRow(key);
		return row ? row.get(Donkeylift.Properties.FIELDS.value) : undefined;
	},

	setProp : function(key, value) {
		var row = this.getRow(key);

		if (row && row.get('own_by') == Donkeylift.Properties.SYSTEM_OWNER) {
			throw new Error('cannot update system property ' + key);

		} else if (row) {
			row.set(Donkeylift.Properties.FIELDS.value, value);

		} else {
			var newRow = new Donkeylift.Property();
			var key = this.parseKey(key);	
			newRow.set(Donkeylift.Properties.FIELDS.name, key.name);
			newRow.set(Donkeylift.Properties.FIELDS.table, key.table);
			newRow.set(Donkeylift.Properties.FIELDS.field, key.field);

			newRow.set(Donkeylift.Properties.FIELDS.value, value);
			this.add(newRow);			
		}
	},

	getRow: function(key) {
		key = this.parseKey(key);
		var row = this.find(function(row) {
			return key.name == row.get(Donkeylift.Properties.FIELDS.name)
				&& key.table == row.get(Donkeylift.Properties.FIELDS.table)
				&& key.field == row.get(Donkeylift.Properties.FIELDS.field);
		});
		return row;
	},

	parseKey : function(key) {
		var parts = key.split('.');
		switch(parts.length) {
			case 1:
				return { table: null, field: null, name: parts[0] };
			case 2:
				return { table: parts[0], field: null, name: parts[1] };	
			case 3:
				return { table: parts[0], field: parts[1], name: parts[2] };	
			default:
				throw new Error('undefined key structure');
		}
	}
	
});
	


Donkeylift.Properties.SYSTEM_OWNER = 'system';
Donkeylift.Properties.TABLE = '_d365Properties';
Donkeylift.Properties.FIELDS = {
	name : 'Name',
	table : 'TableName',
	field : 'FieldName',
	value : 'Value'
};
/*global Donkeylift, Backbone */

Donkeylift.Relation = Backbone.Model.extend({ 
	initialize: function(relation) {
		this.set('type', Donkeylift.Relation.Type(relation));
	}

});

Donkeylift.Relation.create = function(table) {
	return new Donkeylift.Relation({
		table: table,
		related: null, 
		field: null, 
	});	
}

Donkeylift.Relation.Type = function(relation) {
  	if (relation.field && relation.field.name == 'id') return 'one-to-one';
	else return 'many-to-one';
}

/*global _, $, Donkeylift, Backbone, jsonpatch */

Donkeylift.Schema = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Schema.initialize " + attrs.name);

		if ( ! attrs.tables) {
			this.set('tables', new Donkeylift.Tables());
		}
		//this.set('id', attrs.name); //unset me when new
		this.set('props', new Donkeylift.Properties(null, { schema: this }));
		
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON : function() {

		var tables = this.get('tables').toJSON();
		tables =  _.object(_.pluck(tables, 'name'), tables);

		return {
			name: this.get('name'),
			tables: tables
		};
	},	

/*	
	isEmpty : function() {
		var totalRowCount = this.get('tables').reduce(function(sum, table) {
			return sum + table.get('row_count');
		}, 0);	
		console.log(this.get('name') + ' has ' + totalRowCount + ' rows.');
		return totalRowCount == 0;
	},
*/

	parse : function(response) {
		console.log("Schema.parse " + response);
		response = this.parseTables(response);
		return response;
	},

	parseTables: function(response) {
		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.Table(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;		
	},

	url : function() {
		return Donkeylift.app.account.url() + '/' + this.get('name');
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Schema.fetch...");
		Backbone.Model.prototype.fetch.call(this, {
			success: function() {
				me.orgJSON = JSON.parse(JSON.stringify(me.toJSON())); //copy
				me.get('props').setKeyFuncs();
				console.log("Schema.fetch OK");
				me.get('props').fetch(function() {
					cbAfter();
				});					
			}
		});
	},

	update : function(cbAfter) {
		var me = this;
		if ( ! this.updateDebounced) {
			this.updateDebounced = _.debounce(function(cbAfter) {
				var diff = jsonpatch.compare(me.orgJSON, me.toJSON());
				console.log('Schema.update');		
				console.log(diff);		
				if (diff.length > 0) {
					me.patch(diff, function(err, result) {
						
						if (err) {
							alert(err.message); //TODO make me nicer.
						} 

						console.log(result);
						var attrs = me.parse(result);
						me.set(attrs);
						me.orgJSON = JSON.parse(JSON.stringify(me.toJSON())); //copy
						if (cbAfter) cbAfter();
						//reset schema in browser

					});
				}
			}, 1000);
		}
//TODO re-enable and fix
/*
if (cbAfter) cbAfter();
return;
*/
		this.updateDebounced(cbAfter);
	},

	patch : function(diff, cbResult) {
		console.log("Schema.patch...");
		var url = this.url();
		$.ajax(url, {
			method: 'PATCH'
			, data: JSON.stringify(diff)
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log(response);
			cbResult(null, response);

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			cbResult(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});
		
	},

	save : function(cbResult) {
		console.log("Schema.save...");

		var saveOptions = {
			url: this.url()
			, success: function(model) {

				//reload schema list
				Donkeylift.app.account.fetch({
					reset: true,
					success: function() {
						cbResult();
					},
					error: function(model, response) {
						cbResult(response);
					}
				});
			}
			, error: function(model, response) {
				console.log("Schema.save ERROR");
				console.dir(response);
				cbResult(response);
			}
		};

		//set id to (new) name
		this.set('id', this.get('name'));
		console.log("Schema.save " + saveOptions.url);

		Backbone.Model.prototype.save.call(this, null, saveOptions);
	},


	destroy: function(cbResult) {
		var destroyOptions = {
			success: function() {			
				Donkeylift.app.unsetSchema();

				//reload schema list
				Donkeylift.app.account.fetch({
					reset: true,
					success: function() {
						cbResult();
					},
					error: function(model, response) {
						cbResult(response);
					}
				});
			},
			error: function(model, response) {
				console.dir(response);
				cbResult(response);
			}
		};

		Backbone.Model.prototype.destroy.call(this, destroyOptions);
	},

	getFieldFromQN: function(fieldQName) {
		var parts = fieldQName.split('.');
		var table = this.get('tables').getByName(parts[0]);
		var field = table.get('fields').getByName(parts[1]);
		return { table: table, field: field };
	}

});

/*global Donkeylift, Backbone, _ */

//console.log("Table class def");
Donkeylift.Table = Backbone.Model.extend({ 
	
	initialize: function(table) {
		console.log("Table.initialize " + table.name);
		var fields = _.map( _.sortBy(table.fields, 'order'), 
					function(field) {
			return new Donkeylift.Field(field);
		});			
		this.set('fields', new Donkeylift.Fields(fields));
		//relations and row_alias are set in initRefs
	},

	initRefs: function(tables) {
		this.initRelations(tables);
		this.initAlias(tables);
	},

	initRelations : function(tables) {
		var relations = _.map(this.get('referencing'), function(ref) {
			//console.log('adding relation to ' + ref.fk_table + ' fk ' + ref.fk);

			var fk_table = _.find(tables, function(t) { 
				return t.get('name') == ref.fk_table;
			});
			var fk = this.get('fields').getByName(ref.fk);

			return new Donkeylift.Relation({
				table: this,
				related: fk_table,
				field: fk
			});
		}, this);
		this.set('relations', new Donkeylift.Relations(relations), {silent: true});
	},

	initAlias : function(tables) {

		//console.log('table: ' + this.get('name'));
		//console.log('row_alias: ' + this.get('row_alias'));
		var row_alias = [];
		_.each(this.get('row_alias'), function(a) {
			//console.log('alias_part: ' + a);
			var alias = a.split('.');
			var alias_table;
			var field_name;
			if (alias.length == 2) {
				var alias_table = _.find(tables, function(t) {
						return t.get('name') == alias[0];
				});
				field_name = alias[1];
			} else {
				alias_table = this;
				field_name = alias;
			}
			var alias_field = _.find(alias_table.get('fields').models, 
				function(f) {
					return f.get('name') == field_name;
			});
			row_alias.push(new Donkeylift.Alias({
						table : alias_table,
						field : alias_field
			}));

		}, this);
		this.set('row_alias', row_alias, {silent: true});
	},
	
	getProp: function(name) {
		if ( ! this.propKey) return undefined;
		return Donkeylift.app.getProp(this.propKey(name));
	},

	setProp: function(name, value) {
		if ( ! this.propKey) return;
		Donkeylift.app.setProp(this.propKey(name), value);
	},

	allProps : function() {
		//TODO
	},

	visible: function() {
		var visible = this.getProp('visible');
		if (visible === undefined) {
			visible = this.get('name')[0] != '_';	
		}  
		return visible;
	},

	getFieldQN: function(field) {
		return _.isString(field) 
			? this.get('name') + '.' + field
			: this.get('name') + '.' + field.get('name');
	},

	createView: function(options) {
		return new Donkeylift.TableView(options);
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON: function() {

		var fields = this.get('fields').map(function(field) {
			return field.toJSON();
		}); 
		//fields = _.object(_.pluck(fields, 'name'), fields);

		this.get('relations').each(function(relation) {
			var field = _.find(fields, function(f) {
				return f.name == relation.get('field').get('name');				
			});
			field.fk_table = relation.get('related').get('name');
		});

		var row_alias = _.map(this.get('row_alias'), function(a) {
			if (a.get('table') == this) return a.get('field').get('name');
			else return a.toString();	
		}, this);

		return {
			name: this.get('name')
			, row_alias: row_alias
			, access_control: this.get('access_control')
			, fields: _.object(_.pluck(fields, 'name'), fields)
		};
	},

	parse: function(row, opts) {
		opts = opts || {};
		var resolveRefs = opts.resolveRefs || false;

		return _.object(_.map(row, function(val, fn) {
			var field = this.get('fields').getByName(fn);			
			if (resolveRefs) fn = field.get('name');
			return [fn, field.parse(val, opts)];
		}, this));

	},

	dataCache: {},

	fieldValues: function(fieldName, searchTerm, callback) {
 		var me = this;

		var filterTerm = [
			fieldName, 
			Donkeylift.Filter.OPS.SEARCH, 
			"'" + searchTerm + "'"
		].join(' ');

		var params = {
			'$top': 10,
			'$select': fieldName,
			'$orderby': fieldName,
			'$filter': filterTerm
		};

		var q = _.map(params, function(v,k) { return k + "=" + encodeURIComponent(v); })
				.join('&');

		var url = this.fullUrl() + '?' + q;
		console.log(url);
		if (this.dataCache[url]) {
			//console.log(this.dataCache[url]);
			callback(this.dataCache[url]['rows'], { cached: true });

		} else {
			$.ajax(url, {
			}).done(function(response) {
				//console.dir(response.rows);
				me.dataCache[url] = response;
				callback(response.rows);
			});
		}
	},


	addFieldsByExample: function(data) {
		var rows = data.trim().split('\n');
		if (rows.length < 2)  return;

		var fieldNames = _.map(rows[0].trim().split('\t'), function(fn, idx) {
			fn = Donkeylift.util.removeDiacritics(fn.trim());
			fn = fn.replace(/\s+/g, '_').replace(/\W/g, '');
			var match = fn.match(/[a-zA-Z]\w*/);
			return match ? match[0] : 'NA' + idx;
		});
		console.log(fieldNames);
		
		var values = _.map(rows[1].trim().split('\t'), function(val) {
			return val.trim();
		});
		console.log(values);

		var fields = [];
		for(var i = 0; i < fieldNames.length; ++i) {
			var field = Donkeylift.Field.create(fieldNames[i]);
			field.setProp('order', 10*(i + 1));
			fields.push(field);

			if (values.length <= i) continue;

			field.setTypeByExample(values[i]);
		}

		this.get('fields').add(fields);
	},

	sanitizeFieldOrdering: function() {
		var orderedFields = this.get('fields').sortBy(function(f) {
			return f.getProp('order');
		});	
		for(var i = 0; i < orderedFields.length; ++i) {
			orderedFields[i].setProp('order', 10*(i + 1));
		}
	}

});

Donkeylift.Table.create = function(name) {
	var table = new Donkeylift.Table({
		name: name,
	});
	table.initRefs();
	return table;
}

Donkeylift.Table.NONEDITABLE_FIELDS = ['id', 'mod_by', 'mod_on', 'add_by', 'add_on'];
Donkeylift.Table.INITHIDE_FIELDS = ['own_by', 'mod_by', 'mod_on', 'add_by', 'add_on'];

/*global Donkeylift, Backbone, _ */

Donkeylift.Database = Donkeylift.Schema.extend({ 

	initialize : function(attrs, options) {
		console.log("Database.initialize " + (attrs.name || ''));
		Donkeylift.Schema.prototype.initialize.call(this, attrs);
	},

	parseTables : function(response) {
		console.log("Database.parseTables " + response);

		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.DataTable(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;
	},
});		

/*global Donkeylift, _, Backbone, $ */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';
var CHOWN_EXT = '.chown';
var CSV_EXT = '.csv';

Donkeylift.DataTable = Donkeylift.Table.extend({

	initialize: function(table) {
		Donkeylift.Table.prototype.initialize.apply(this, arguments);
		this.set('skipRowCounts', false); //if true nocounts=1 on api calls.
	},

	createView: function(options) {
		return new Donkeylift.DataTableView(options);
	},

	getEnabledFields: function() {
		return new Donkeylift.Fields(this.get('fields').filter(function(field) {
			return ! field.get('disabled');
		}));
	},

	fullUrl: function(ext) {
		ext = ext || ROWS_EXT;
		return Donkeylift.env.API_BASE + this.get('url') + ext;
	},

	getAllRowsUrl: function() {
		return this.lastFilterUrl;
		//return decodeURI(this.lastFilterUrl).replace(/\t/g, '%09');
	},

	sanitizeEditorData: function(req) {
		var me = this;

		try {
			var resolveRefs = this.get('fields').at(0).get('resolveRefs');
			var parseOpts = { validate: true, resolveRefs: resolveRefs };
			var rows = [];
			var method;
			switch(req.action) {
				case 'create':
					method = 'POST';
					rows = _.map(req.data, function(strRow) {
						return me.parse(strRow, parseOpts);
					});
				break;
				case 'edit':
					method = 'PUT';
					rows = _.map(req.data, function(strRow, id) {
						var row = me.parse(strRow, parseOpts);
						row.id = parseInt(id);
						return row;
					});
				break;
				case 'remove':
					method = 'DELETE';
					rows = _.map(_.keys(req.data), function(id) {
						return parseInt(id);
					});
				break;
			}

			var data = JSON.stringify(rows);

		} catch(err) {
			req.error = err;
		}

		req.data = data;
		req.method = method;
	},

	getEditorFields: function() {
		
		var editFields = _.filter(this.getEnabledFields().sortByOrder(), function(field) {
			return ! _.contains(Donkeylift.Table.NONEDITABLE_FIELDS, field.get('name'));
		});
		
		if (Donkeylift.app.account.isAdmin()) {
			return editFields;
		}
		
		var loggedUser = Donkeylift.app.schema.get('users').getByName(Donkeylift.app.account.get('user'));

		if (_.contains(['reader', 'writer'], loggedUser.get('role'))) {
			//only db-owner is allowed to change own_by fields.
			editFields = _.reject(editFields, function(field) {
				return field.get('name') == 'own_by'; 
			});
		}
		
		return editFields;
	},

	ajaxGetEditorFn: function() {
		var me = this;
		return function(U1, U2, req, success, error) {
			console.log('api call edit row ');
			console.log(req);

			if (req.error) {
				error(null, '', '');
				return;
			}

			var q = ['retmod=true'];
			var url = me.fullUrl() + '?' + q.join('&');

			$.ajax(url, {
				method: req.method,
				data: req.data,
				contentType: "application/json",
				processData: false

			}).done(function(response) {
				console.log(response);
				success({data: response.rows});

			}).fail(function(jqXHR, textStatus, errThrown) {
				error(jqXHR, textStatus, errThrown);
				console.log("Error requesting " + url);
				console.log(textStatus + " " + errThrown);
			});
		}
	},

	ajaxGetRowsFn: function() {
		var me = this;
		return function(query, callback, settings) {
			console.log('api call get rows');

			var orderClauses = [];
			for(var i = 0; i < query.order.length; ++i) {
				var orderCol = query.columns[query.order[i].column].data;
				var orderField = me.get('fields').getByName(orderCol);
				orderClauses.push(encodeURIComponent(
						orderField.vname() + ' ' + query.order[i].dir));
			}
			
			var fieldNames = me.get('fields').map(function(field) {
				return field.vname();
			});
			
			var params = {
				'$select': fieldNames.join(','),
				'$orderby': orderClauses.join(','),
				'$skip': query.start,
				'$top': query.length,
				'counts': me.get('skipRowCounts') ? 0 : 1
			}

			if (query.search.value.length == 0) {
				//sometimes necessary after back/fwd
				Donkeylift.app.filters.clearFilter(me);
			}
			var filters = Donkeylift.app.filters.clone();
			if (query.search.value.length > 0) {
				filters.setFilter({
					table: me,
					op: Donkeylift.Filter.OPS.SEARCH,
					value: query.search.value
				});
			}			

			var q = _.map(params, function(v, k) {
				return k + '=' + v;
			}).join('&');
			q = q + '&' + filters.toParam();

			var url = me.fullUrl() + '?' + q;
			console.log(url);

			me.lastFilterUrl = me.fullUrl() + '?' + filters.toParam();
			me.lastFilterQuery = { 
				order: orderClauses, 
				filters: filters,
				fields:  fieldNames
			};

			$.ajax(url, {
				cache: false
			}).done(function(response) {
				//console.log('response from api');
				//console.dir(response);

				var fragment = 'data'
							+ '/' + Donkeylift.app.schema.get('name')
							+ '/' + Donkeylift.app.table.get('name')
							+ '/' + q;

				//console.log(fragment);
				Donkeylift.app.router.updateNavigation(fragment, {
					block: 100,
					replace: true
				});

				var data = {
					data: response.rows,
					recordsTotal: response.totalCount,
					recordsFiltered: response.count,
				};

				if (me.get('skipRowCounts')) {
					//unknown number of rows.. 
					//if returned data less than queried data length, stop. 
					//otherwise make sure we get a next page.
					data.recordsFiltered = (data.data.length < query.length) 
						? query.start + data.data.length : query.start + query.length + 1;
					data.recordsTotal = data.recordsFiltered;					
				}

				callback(data);
			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
			});
		}
	},

	reload: function() {
		$('#grid').DataTable().ajax.reload();
	},

	load: function(url) {
		$('#grid').DataTable().ajax.url(url).load();
	},

	dataCache: {},

	stats : function(filter, callback) {
		var me = this;

		var fieldName = filter.get('field').vname();

		var params = { '$select' : fieldName };

		var q = _.map(params, function(v,k) { return k + "=" + v; })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = me.fullUrl(STATS_EXT) + '?' + q;

		console.log('stats ' + me.get('name') + '.' + fieldName
					+ ' ' + url);

		if (this.dataCache[url]) {
			callback(this.dataCache[url][fieldName]);

		} else {
			$.ajax(url, {
				
			}).done(function(response) {
				//console.dir(response);
				me.dataCache[url] = response;
				callback(response[fieldName]);

			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
			});
		}
	},

	options: function(filter, searchTerm, callback) {
		var me = this;

		var fieldName = filter.get('field').vname();

		var params = {
			'$top': 10,
			'$select': fieldName,
			'$orderby': fieldName
		};

		var q = _.map(params, function(v,k) { return k + "=" + encodeURIComponent(v); })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter, searchTerm);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = this.fullUrl() + '?' + q;

		console.log('options ' + this.get('name') + '.' + fieldName
					+ ' ' + url);

		if (this.dataCache[url]) {
			//console.log(this.dataCache[url]);
			callback(this.dataCache[url]['rows']);

		} else {
			$.ajax(url, {

			}).done(function(response) {
				//console.dir(response.rows);
				me.dataCache[url] = response;
				callback(response.rows);

			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
			});
		}
	},

	changeOwner: function(rowIds, owner) {
		var me = this;
		var q = 'owner=' + encodeURIComponent(owner);
		var url = this.fullUrl(CHOWN_EXT) + '?' + q;

		$.ajax(url, {
			method: 'PUT',
			data: JSON.stringify(rowIds),
			contentType: "application/json",
			processData: false

		}).done(function(response) {
			console.log(response);
			me.reload();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			var err = new Error(errThrown + " " + textStatus);
			console.log(err);
			alert(err.message);
		});
	},

	getRowsAsCSV: function(cbResult) {
		var me = this;
		if ( ! this.lastFilterQuery) return;

		var q = '$select=' + this.lastFilterQuery.fields.join(',')
			+ '&' + this.lastFilterQuery.filters.toParam()
			+ '&' + '$orderby=' + this.lastFilterQuery.order.join(',')
			+ '&' + 'format=csv'
			+ '&' + 'nocounts=1';

		var url = this.fullUrl() + '?' + q;
		console.log(url);

		$.ajax(url, {

		}).done(function(response) {
			me.dataCache[url] = response;
			cbResult(response);

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			var err = new Error(errThrown + " " + textStatus);
			console.log(err);
			alert(err.message);
			cbResult();
		});
	},

	generateCSV : function(fields, cbResult) {
		var me = this;
		if ( ! this.lastFilterQuery || ! fields || ! fields.length) return;

		var q = '$select=' + fields.join(',')
			+ '&' + '$orderby=' + this.lastFilterQuery.order.join(',')
			+ '&' + this.lastFilterQuery.filters.toParam();

		var path = this.get('url') + CSV_EXT + '?' + q;
		var url = Donkeylift.env.API_BASE + this.get('url') + '.nonce';

		$.ajax(url, {
			type: 'POST',
			data: JSON.stringify({ path: path }),
			contentType:'application/json; charset=utf-8',
			dataType: 'json'

		}).done(function(response) {
			var link = Donkeylift.env.API_BASE + me.get('url') + CSV_EXT + '?nonce=' + response.nonce;
			cbResult(null, link);
			console.log(response);

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			var err = new Error(errThrown + " " + textStatus);
			console.log(err);
			alert(err.message);
			cbResult(err);
		});
	},
	
	getPreferences: function() {
		return {
			skipRowCounts : this.get('skipRowCounts'),
			resolveRefs : this.get('fields').at(0).get('resolveRefs')
		}
	},

	setPreferences: function(prefs) {
		_.each(prefs, function(value, name) {
			switch(name) {
				case 'skipRowCounts':
					this.set('skipRowCounts', value);
					break;
				case 'resolveRefs':
					this.get('fields').each(function(field) {
						field.set('resolveRefs', value);	
					});
					break;
				default:
					console.log("unknown preference '" + name + "´");
			}
		}, this);
	},

});

/*global Donkeylift, Backbone, _ */

Donkeylift.Filter = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Filter.initialize ");			
		this.set('id', Donkeylift.Filter.Key(attrs.table, attrs.field));

	},

	values: function(opts) {
		var me = this;

		var val = _.isArray(this.get('value')) ? 
					this.get('value') : [ this.get('value') ];

		return val.map(function(v) {
			return me.get('field').toQS(v, opts);
		});
	},

	toParam: function() {
		var param;

		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			var f = this.get('field') ? this.get('field').vname() : null;
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			param = key + " search '" + this.get('value') + "'";

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			var values = this.values();
			var key = Donkeylift.Filter.Key(this.get('table'), 
						this.get('field').vname());
			param = key + " btwn " + values[0] + ',' + values[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {				
			//do not use ref string, use foreign key ids instead.
			var values = this.values({
				resolveRefs: this.get('field').get('resolveRefs') 
			});
			var key = Donkeylift.Filter.Key(this.get('table'), 
						this.get('field'));
			param = key + " in " + values.join(",");

		} else {
			//EQUAL, GREATER, LESSER
			var key = Donkeylift.Filter.Key(this.get('table'),
						this.get('field').vname());
			param = key + " " + this.get('op') + " " 
			    + this.get('field').toQS(this.get('value'));
		}

		//console.log(param);
		return param;
	},

	loadRange: function(cbAfter) {
		var field = this.get('field');
		this.get('table').stats(this, function(stats) {
			field.set('stats', stats);
			cbAfter();
		});
	},

	loadOptions: function(searchTerm, cbAfter) {
		var field = this.get('field');
		this.get('table').options(this, searchTerm, function(opts) {
			var notNulls = _.reject(opts, function(opt) { return opt[field.get('name')] === null; });
			field.set('options', notNulls);
			field.set('option_null', notNulls.length < opts.length);
			cbAfter();
		});
	},

	toStrings: function() {
		var result = { table: this.get('table').get('name'), field: '' };
		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			result.op = 'search';
			result.value = this.get('value');

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			result.op = 'between';
			result.field = this.get('field').get('name');
			result.value = this.get('value')[0] 
						+ ' and ' + this.get('value')[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {
			result.op = 'in';
			result.field = this.get('field').get('name');
			result.value = this.get('value').join(', '); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.LESSER) {
			result.op = 'lesser';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.GREATER) {
			result.op = 'greater';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 
		
		} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
			result.op = 'equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value') === null ? 'null' : this.get('value'); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.NOTEQUAL) {
			result.op = 'not equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value') === null ? 'null' : this.get('value'); 
		}
		return result;
	}

});


Donkeylift.Filter.Create = function(attrs) {

	var opts = {};

	if (attrs.op != Donkeylift.Filter.OPS.IN) {
		opts.value = attrs.value; //any value permitted
	} else if (attrs.value.length > 0) {
		opts.value = attrs.value; //IN filter requires non-empty arrays 
	}

	if (_.isObject(attrs.table)) {
		opts.table = attrs.table; //trust it
	} else if (_.isString(attrs.table)) {
		opts.table = Donkeylift.app.schema.get('tables').getByName(attrs.table);
	}

	if (_.contains(_.values(Donkeylift.Filter.OPS), attrs.op)) {
		opts.op = attrs.op; 
	}

	if (_.isObject(attrs.field)) {
		opts.field = attrs.field; //trust it
	} else if (_.isString(attrs.field)) {
		opts.field = opts.table.get('fields').getByName(attrs.field);
	} else if (attrs.op == Donkeylift.Filter.OPS.SEARCH) {
		opts.field = null;
	}
	

	if (opts.table && (opts.field !== undefined) && opts.op && (opts.value !== undefined)) {
		return new Donkeylift.Filter(opts);
	} 
	return null;
}

Donkeylift.Filter.Key = function(table, field) {		
	if (_.isObject(table)) table = table.get('name');
	if ( ! field) field = '*';
	else if (_.isObject(field)) field = field.get('name'); //not vname
	return table + '.' + field;
}

Donkeylift.Filter.OPS = {
	'SEARCH': 'search',
	'BETWEEN': 'btwn',
	'IN': 'in',
	'EQUAL': 'eq',
	'NOTEQUAL': 'ne',
	'LESSER': 'le',
	'GREATER': 'ge'
}

Donkeylift.Filter.CONJUNCTION = ' and ';

/*global Donkeylift, Backbone, _ */

Donkeylift.Preferences = Backbone.Model.extend({ 

	initialize : function(attrs) {
		console.log("Preferences.initialize " + attrs.table.get('name'));
    },

    getPreferences : function(scope) {
        if (scope == 'table') {
            return this.get('table').getPreferences();
        }
    }
});		

/*global Backbone, Donkeylift */

Donkeylift.Fields = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Field,
	
	initialize: function(attrs) {
		//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
	},

	addNew: function(field) {
		field = field || Donkeylift.Field.create('field' + this.length);
		this.add(field);
		return field;
	},

	getByName: function(name) {
		return this.find(function(field) { 
			return field.vname() == name || field.get('name') == name; 
		});
	},

	sortByOrder: function() {
		return this.sortBy(function(field) {
				return field.getProp('order');
		});
	}
});


/*global Backbone, Donkeylift */

// Tables Collection
// ---------------

Donkeylift.Relations = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Relation,
	
	addNew: function(table) {
		console.log('Relations addNew ' + table.get('name'));
		var relation = new Donkeylift.Relation.create(table);
		this.add(relation);
		return relation;
	}

});


/*global Donkeylift, Backbone, _ */

// Tables Collection
// ---------------

Donkeylift.Tables = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Table,

	initialize : function(tables) {
		_.each(tables, function(table) {				
			table.initRefs(tables);
		});
	},

	getByName: function(name) {
		return this.find(function(t) { return t.get('name') == name; });
	},

	getAll: function(opts) {
		//TODO sort by user-defined order 
		return this.sortBy(function(t) { return t.get('name'); });
	},
		
	getAncestors: function(table) {
		var result = [];
		var tables = [table];
		while(tables.length > 0) {
			var it = tables.shift();
			var fks = it.get('referencing');
			_.each(fks, function(fk) {
				var pt = this.getByName(fk.fk_table);
				if ( ! _.contains(tables, pt)) {
					result.push(pt);
					tables.push(pt);
				}
			}, this);
		}
		return result;
	}

});

/*global Donkeylift, Backbone */

Donkeylift.Filters = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Filter,
	
	toParam: function() {
		return Donkeylift.Filters.toParam(this.models);	
	},

	//used by Datable.stats & Datatable.options to get context:
	//min/max, opts
	apply: function(exFilter, searchTerm) {

		var filters = this.filter(function(f) {

			//exclude callee
			if (f.id == exFilter.id) return false;

			//exclude existing search on same table
			if (f.get('op') == Donkeylift.Filter.OPS.SEARCH 
			 && f.get('table') == exFilter.get('table')) {
				return false;
			}

			return true;
		});
		
		//add search term
		if (searchTerm && searchTerm.length > 0) {
			var searchFilter = Donkeylift.Filter.Create({
					table: exFilter.get('table'),
					field: exFilter.get('field'),
					op: Donkeylift.Filter.OPS.SEARCH,
					value: searchTerm
			});
			if (searchFilter) filters.push(searchFilter);
			else console.log('error creating searchFilter');
		}
		
		return filters;
	},

	setFilter: function(attrs) {
		var current = this.getFilter(attrs.table, attrs.field);
		if (current) this.remove(current);
		var filter = Donkeylift.Filter.Create(attrs);	
		if (filter) this.add(filter);
	},

	getFilter: function(table, field) {
		return this.get(Donkeylift.Filter.Key(table, field));
	},

	clearFilter: function(table, field) {
		var current = this.getFilter(table, field);
		if (current) this.remove(current);
	},

});

Donkeylift.Filters.toParam = function(filters) {
	var result = '';
	if (filters.length > 0) {
		var params = _.reduce(filters, function(memo, f) {
			return memo.length == 0 ? f.toParam() 
				: memo + Donkeylift.Filter.CONJUNCTION + f.toParam();
		}, '');				
		result = '$filter=' + encodeURIComponent(params);
	}
	return result;
}

/*global Backbone, Donkeylift */

// Tables Collection
// ---------------
Donkeylift.Row = Backbone.Model.extend({ 
	
	initialize : function(attrs) {
		console.log("Row.initialize " + attrs.id);
	},
});		
	

Donkeylift.Rows = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Row,

});


/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.DownloadsView = Backbone.View.extend({

	el:  '#content',
	events: {
		'click .download-database': 'evDownloadDatabaseClick'
	},

	initialize: function() {
		console.log("DownloadsView.init");
	},

	template: _.template($('#downloads-template').html()),
	db_template: _.template('<li class="list-group-item"><a href="#" data-db="{{ name }}" class="download-database">Get {{ name }}</a></li>'),
	//db_template: _.template('<li class="list-group-item"><a href="<%= link%>">Get link for <%= name%></a></li>'),

	render: function() {
		console.log("DownloadsView.render ");
		this.$el.html(this.template());
		$('#menu').empty(); //clear module menu
		var dbLinks = this.model.get('databases').map(function(db) {
			return this.db_template({
				name: db.get('name'),
			});
		}, this);
		this.$('#database-list').html(dbLinks);
	},

	evDownloadDatabaseClick: function(ev) {

		if ($(ev.target).attr('href') != '#') return true;
		
		var db = $(ev.target).attr('data-db');
		console.log('evDownloadDatabaseClick ' + db);
		this.model.getDownloadLink(db, function(err, link) {
			if (err) {
				console.log(err);
			} else {
				$(ev.target).attr('href', link);
				$(ev.target).text('Download ' + db);
			}
		});
		return false;
	},

});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
		'click #nav-login': 'evLoginClick',
		'click #nav-profile': 'evProfileClick'
	},

	initialize: function() {
	},

	navUserInfoTemplate: _.template($('#nav-user-info-template').html()),
	navProfileTemplate: _.template($('#nav-profile-template').html()),

	render: function() {
		this.renderProfileDropDown();
		this.renderUserInfo();
		return this;
	},

	renderUserInfo: function() {
		var $el = $('#user-info');
		$el.empty();	
		var html = this.navUserInfoTemplate({
			user: this.model.principal()
		});
		$el.append(html);
	},

	renderProfileDropDown: function() {
		var me = this;
		var $el = this.$('#menu-profile');
		$el.empty();	
		var html = this.navProfileTemplate({
			account: this.model.get('name')
		});
		$el.append(html);
		
		this.$('#nav-downloads').click(function(ev) { 
			me.evDownloadsClick(ev); 
		});

		this.$('#nav-logout').click(function(ev) { 
			me.evLogoutClick(ev); 
		});
	},

	evDownloadsClick: function() {
		if ( ! this.downloadsView) {
			this.downloadsView = new Donkeylift.DownloadsView();
		}
		this.downloadsView.model = Donkeylift.app.account;
		this.downloadsView.render();
	},

	evProfileClick: function() {
		if ( ! this.profileView) {
			this.profileView = new Donkeylift.ProfileView();
		} 
		this.profileView.model = Donkeylift.app.account;
		this.profileView.render();
	},

	evLogoutClick: function(ev) {
		sessionStorage.clear();
		window.location = "https://" + Donkeylift.env.AUTH0_DOMAIN + "/v2/logout";
	},

	evLoginClick: function(ev) {

		var opts = {
			signupLink: '/public/signup.html'
			, authParams: { scope: 'openid email app_metadata' } 
		};

		Donkeylift.app.lock.show(opts, function(err, profile, id_token) {
			if (err) {
				console.log("There was an error :/", err);
				return;
		  	}

			Donkeylift.app.loadAccount({ id_token: id_token, auth: true });
		});
	}

});



/*global Donkeylift, Backbone, jQuery, _, $ */


Donkeylift.ProfileView = Backbone.View.extend({

	el:  '#content',
	events: {
	},

	initialize: function() {
		console.log("ProfileView.init");
	},

	template: _.template($('#profile-template').html()),

	render: function() {
		console.log("ProfileView.render ");
		this.$el.html(this.template({
			user: this.model.get("user"),
			account: this.model.get("name"),
		}));
		$('#menu').empty(); //clear module menu
	},


});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.SchemaListView = Backbone.View.extend({
	id:  'schema-list',
	tagName: 'ul',
	className: 'dropdown-menu',

	events: {
		'click .schema-option': 'evSchemaClick',
	},

	initialize: function() {
	},

	schemaListTemplate: _.template($('#nav-schema-template').html()),

	render: function() {

		this.renderSchemaList();
		this.renderCurrentSchemaName();

		return this;
	},

	renderSchemaList: function() {
		var $ul = this.$el;
		$ul.empty();
		if (this.model.get('databases')) {
			this.model.get('databases').each(function(schema) {
				var html = this.schemaListTemplate({name: schema.get('name')});
				$ul.append(html);
			}, this);
		}
	},

	renderCurrentSchemaName: function() {
		var $span = this.$el.closest('li').find('a:first span');
		if (Donkeylift.app.schema) {
			$span.html(' DB ' + Donkeylift.app.schema.get('name'));
		} else {
			$span.html(' Choose DB ');
		}		
	},

	evSchemaClick: function(ev) {
		var name = $(ev.target).attr('data-target');
		console.log('SchemaListView.evSchemaClick ' + name);
		Donkeylift.app.setSchema(name);
	},

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableListView = Backbone.View.extend({

/*	
	id: "table-list",
	className: "list-group",
*/

	events: {
		//'click .table-item': 'evTableClick'
		'change #selectShowTables': 'evSelectShowTableChange'
	},

	initialize: function() {
		console.log("TableListView.init " + this.collection);
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	template: _.template($('#table-list-template').html()),
	itemTemplate: _.template($('#table-item-template').html()),

	render: function() {
		var me = this;
		console.log('TableListView.render ');	
		this.$el.html(this.template({ database: me.model.get('name') }));
		var tables = this.collection.getAll(); //sorted alphabetically
		_.each(tables, function(table) {
			if (table.visible()) {
				var href = "#table" 
						+ "/" + table.get('name');
				this.$('#table-list-items').append(this.itemTemplate({
					name: table.get('name'),
					href: href
				}));
			}	
			$('#selectShowTables').append(
				$('<option></option>')
					.attr('value', table.get('name'))
					.text(table.get('name'))
					.prop('selected', table.visible())						
			);
		}, this);	
		$('#selectShowTables').selectpicker('refresh');

		$('#selectShowTables').on('hidden.bs.select', function (e) {
			me.render();
		});
		return this;
	},

	evSelectShowTableChange: function(ev) {
		var me = this;
		$('#selectShowTables option').each(function() {
			var table = me.collection.getByName( $(this).val() );
			//var table = Donkeylift.app.schema.get('tables').getByName( $(this).val() );
			table.setProp('visible', $(this).prop('selected'));	
		});
	}
});




/*global Donkeylift, Backbone, $, _ */

Donkeylift.ChangeOwnerView = Backbone.View.extend({
	el:  '#modalChangeOwner',

	events: {
		'click #modalOwnerUpdate': 'evUpdateClick',
	},

	initialize: function() {
		console.log("ChangeOwnerView.init");
	},

	render: function() {
		$('#modalChangeOwner').modal();
		return this;
	},

	evUpdateClick: function() {
		var owner = $('#modalInputOwner').val();
		if (owner.length > 0) {
			Donkeylift.app.table.changeOwner(this.model.get('rowIds'), owner);
			Donkeylift.app.unsetFilters();
			console.log('update owner to ' + owner);
		}
	},

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.CSVDownloadView = Backbone.View.extend({
	el:  '#modalCSVDownload',

	events: {
		'click #modalCSVGenerate': 'evGenerateCSVClick',
	},

	initialize: function() {
		console.log("CSVDownloadView.init " + this.model.get('name'));
	},

	render: function() {
		console.log("CSVDownloadView.render ");

		var el = this.$('#modalCSVSelectFields');
		el.empty();

		Donkeylift.app.addAncestorFieldsToSelect(el);
		var fieldNames = this.model.get('fields').map(function(f) {
			return this.model.getFieldQN(f);
		}, this);
		$('#modalCSVSelectFields').val(fieldNames);

		$('#modalCSVSelectFields').selectpicker('refresh');
		$('#modalCSVDownloadLink').attr('href', '#');
		$('#modalCSVDownloadLink').addClass('disabled');
		$('#modalCSVDownloadLink').removeClass('btn-success');

		$('#modalCSVDownload').modal();
		return this;
	},

	evGenerateCSVClick: function() {
		var fieldNames = $('#modalCSVSelectFields').val();
        this.model.generateCSV(fieldNames, function(err, link) {
			if (link) {
				console.log('CSV link ' + link);
				$('#modalCSVDownloadLink').attr('href', link);
				$('#modalCSVDownloadLink').toggleClass('disabled btn-success');
			}
		});
	},

});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.DataTableView = Backbone.View.extend({

	id: 'grid-panel',
	className: 'panel',

	initialize: function() {
		console.log("DataTableView.init " + this.model);			
		this.listenTo(Donkeylift.app.filters, 'update', this.renderStateFilterButtons);
	},

	tableTemplate: _.template($('#grid-table-template').html()),
	columnTemplate: _.template($('#grid-column-template').html()),
	buttonWrapTextTemplate: _.template($('#grid-button-wrap-text-template').html()),

	renderStateFilterButtons: function() {
		var fields = this.model.getEnabledFields().sortByOrder();
		_.each(fields, function(field, idx) {
			
			var filter = Donkeylift.app.filters.getFilter(
					this.model, 
					field.get('name')
				);
			
			var active = filter ? true : false;
			var $el = this.$('#col-' + field.vname() + ' button').first();
			$el.toggleClass('filter-btn-active', active); 

		}, this);
	},

	renderTextWrapCheck: function() {
		
		this.$('#grid_length').prepend(this.buttonWrapTextTemplate());
		this.$('#grid_wrap_text').click(function(ev) {
			var currentWrap = $("table.dataTable").css("white-space");
			var toggleWrap = currentWrap == 'normal' ? 'nowrap' : 'normal';
				
			$("table.dataTable").css("white-space", toggleWrap);
			$('#grid_wrap_text span')
				.toggleClass("glyphicon-text-height glyphicon-text-width");
		});

	},

	getOptions: function(params, fields) {
		params = params || {};
		var dtOptions = {};
		
		dtOptions.lengthMenu = params.lengthMenu || [5, 10, 25, 50, 100];

		dtOptions.displayStart = params.$skip || 0;
		dtOptions.pageLength = params.$top || 10;

		dtOptions.order = [[0, 'asc']];
		if (params.$orderby) {
			var order = _.pairs(params.$orderby[0]) [0];
			for(var i = 0; i < fields.length; ++i) {
				if (fields[i].vname() == order[0]) {
					dtOptions.order[0][0] = i;
					dtOptions.order[0][1] = order[1];
					break;
				}
			}
		}

		var totalWidth = _.reduce(fields, function(s, f) {
			return s + f.getProp('width');
		}, 0);

		var columns = _.map(fields, function(field) {
			var col = {
				data: field.vname()
			}

			var width = (100 * field.getProp('width')) / totalWidth;
			col.width = String(Math.floor(width)) + '%';
			col.visible = field.visible();
			col.render = this.columnDataFn(field);

			return col;
		}, this);

		dtOptions.columns = columns;

		return dtOptions;
	},

	getEditorOptions: function() {
		var me = this;
		var dtEditorOptions = {};

		var editFields = this.model.getEditorFields();


		dtEditorOptions.fields = _.map(editFields, function(field) {
			var edField = {};

			edField.name = field.vname(); 
			edField.label = field.vname(); 

			if (field.get('type') == Donkeylift.Field.TYPES.date) {
				edField.type = 'datetime';

			} else if (field.getProp('width') > 60) {
				edField.type = 'textarea';

			} else if (field.get('fk') == 1) {
				var sourceFn = function(q, syncCb, asyncCb) {
					var fkTable = Donkeylift.app.schema
						.get('tables').getByName(field.get('fk_table'));
					
					fkTable.fieldValues('ref', q, function(rows, info) {
						var options = _.map(rows, function(row) {
							return row.ref;
						});
						//console.log(options);
						if (info && info.cached) syncCb(options);
						else asyncCb(options);
					});
				}
				edField.type = 'typeahead';
				edField.opts = {
						options: {
							hint: false
						}
						, source: sourceFn 
				};

			} else {
				edField.type = 'text';
			}
			return edField;
		});

		return dtEditorOptions;
	},

	render: function() {
		var me = this;
		
		console.log('DataTableView.render ');			
		this.$el.html(this.tableTemplate());

		var fields = this.model.getEnabledFields().sortByOrder();
		_.each(fields, function(field, idx) {
			var align = idx < fields.length / 2 ? 
				'dropdown-menu-left' : 'dropdown-menu-right';
			
			//this.$('thead > tr').append('<th>' + field.vname() + '</th>');
			var colHtml = this.columnTemplate({
				name: field.vname(),
				dropalign: align	
			});
			this.$('thead > tr').append(colHtml);
			this.$('#col-' + field.vname() + ' .field-filter').click( function(ev) {
				me.evFilterButtonClick(ev);
			});

		}, this);

		
		this.renderStateFilterButtons();

		var filter = Donkeylift.app.filters.getFilter(this.model);			
		var initSearch = {};
		if (filter) initSearch.search = filter.get('value');

		var dtOptions = this.getOptions(this.attributes.params, fields);
		var dtEditorOptions = this.getEditorOptions();
		//console.log(dtEditorOptions);

		this.dataEditor = new $.fn.dataTable.Editor({
			table: '#grid',
			idSrc: 'id',
			fields: dtEditorOptions.fields,
			display: 'bootstrap',
			formOptions: {
				main: { 
					focus: -1 
				}
			},
			ajax: this.model.ajaxGetEditorFn(),
		});

		var dtSettings = {
			serverSide: true,
			columns: dtOptions.columns,				
			ajax: this.model.ajaxGetRowsFn(),
			search: initSearch,
			lengthMenu: dtOptions.lengthMenu, 
			displayStart: dtOptions.displayStart, 
			pageLength: dtOptions.pageLength, 
			order: dtOptions.order,
			select: true,
			colReorder: true,
			//dom: "lfrtip",
			buttons: [
				{ extend: 'colvis', text: 'Show Columns' },
				{ extend: 'create', editor: this.dataEditor },
				{ extend: 'edit', editor: this.dataEditor },
				{ extend: 'remove', editor: this.dataEditor }
			]
		};


		this.dataTable = this.$('#grid').DataTable(dtSettings);

		if (filter) {
			this.$('#grid_filter input').val(filter.get('value'));
		}

		this.renderTextWrapCheck();
	
		this.addEvents();

		/* trigger preInit.dt event since the table was added dynamically
		   and this event seems to be triggered by DT on dom load.
		   see comment in datatables source about 'Initialisation' in select plugin */
		$(document).trigger('preInit.dt', this.dataTable.settings() );
		//this.dataTable.select(); 

		return this;
	},

	evFilterButtonClick: function(ev) {
		ev.stopPropagation();

		var colName = $(ev.target).closest('button').data('column');

		var filter = new Donkeylift.Filter({
			table: this.model,
			field: this.model.get('fields').getByName(colName)
		}); //TODO - avoid using ctor directly

		var th = this.$('#col-' + colName);
		Donkeylift.app.setFilterView(filter, th);

	},

	addButtonEllipsisEvent: function() {
		
		//expand ellipsis on click
		this.$('button.ellipsis-init').click(function(ev) {				
			//wrap text before expaning
			$(ev.target).parents('span').css('white-space', 'normal');	

			var fullText = $(ev.target).parents('span').attr('title');
			$(ev.target).parents('span').html(fullText);
			console.log('ellipsis click ' + $(ev.target).text());
		});
		//dont add click handler again
		this.$('button.ellipsis-init').removeClass('ellipsis-init');
	},

	addEvents: function() {
		var me = this;

		this.dataTable.on('draw.dt', function() {
			me.addButtonEllipsisEvent();
		});

		this.dataTable.on('page.dt', function() {
			console.log("page.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		this.dataTable.on('init.dt', function() {
			console.log("init.dt");

			me.dataTable.buttons().container()
				.removeClass('dt-buttons')
				.addClass('btn-group');

			me.dataTable.buttons().container().children()
				.removeClass('dt-button')
				.addClass('btn btn-default navbar-btn')

			$('#menu').append(me.dataTable.buttons().container());

			//customize to our bootstrap grid model which has 16, not 12 columns
			me.$('#grid_filter').parent()
				.removeClass('col-sm-6')
				.addClass('col-sm-10'); 
			me.$('#grid').parent()
				.removeClass('col-sm-12')
				.addClass('col-sm-16'); 
			me.$('#grid_paginate').parent()
				.removeClass('col-sm-7')
				.addClass('col-sm-11'); 
	
		});

		this.dataTable.on('buttons-action.dt', function (e, buttonApi, dataTable, node, config) {
			me.addButtonEllipsisEvent();
			if ($(buttonApi.node()).hasClass('buttons-columnVisibility')) {
				//set visibility prop of field according to Datatable colvis button	
				var field = me.model.get('fields').getByName(buttonApi.text());
				var visible = $(buttonApi.node()).hasClass('active');
				//TODO props vs prefs 
				field.setProp('visible', visible);
			}
		});

		//using order.dt event won't work because its fired otherwise, too

		this.$('th.sorting').click(function() {
			console.log("order.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		//using search.dt event won't work because its fired otherwise, too
/*
		this.$('input[type="search"]').blur(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});
		this.$('input[type="search"]').focus(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});
*/
		this.dataEditor.on('preSubmit', function(ev, req, action) {
			me.model.sanitizeEditorData(req);
			if (req.error) {
				me.dataEditor.error(req.error.field, req.error.message);
			}
		});

		this.dataEditor.on('submitError', function(ev, xhr, err, thrown, data) {
			me.dataEditor.error(xhr.responseText);
		});

		this.dataTable.on('column-reorder', function (e, settings, details) {
			$(document).mouseup(function() {
				var columnOrders = me.dataTable.colReorder.order();
				//console.log('column-reorder done.', columnOrders);
				_.each(columnOrders, function(pos, idx) {
					var field = settings.aoColumns[pos].data;
					//TODO props vs prefs 
					me.model.get('fields').getByName(field).setProp('order', pos);
					//console.log('col idx ' + idx + ' ' + field + ' order ' + pos) 
				});

			});
		});
	},

	columnDataFn: function(field) {

		var me = this;

		var btnExpand = '<button class="ellipsis ellipsis-init btn btn-default btn-xs"><span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span></button>'
		var w = field.getProp('width');
		var abbrFn = function (data) {
			var s = field.toFS(data);
	   		return s.length > w
				//?  '<span title="' + s.replace(/"/g, '&quot;') + '">'
				?  '<span title="' + s + '">'
					+ s.substr( 0, w)
					+ ' ' + btnExpand
				: s;
		}

		var anchorFn = undefined;
		if (field.get('name') == 'id' 
			&& me.model.get('referenced').length > 0) {
			//link to table rows referencing this id.
			anchorFn = function(id) {
				var href = '#table'
					+ '/' + me.model.get('referenced')[0].table
					+ '/' + me.model.get('name') + '.id=' + id;

				return '<a href="' + href + '">' + id + '</a>';
			}

		} else if (field.get('fk') == 1) {
			//link to referenced table row.
			anchorFn = function(ref) {
				var href = '#table'
					+ '/' + field.get('fk_table')
					+ '/id=' + Donkeylift.Field.getIdFromRef(ref)

				return '<a href="' + href + '">' + ref + '</a>';
			}
		}

		var dataFn = function (data, type, full, meta ) {

			if (type == 'display' && data) {
				return anchorFn ? anchorFn(data) : abbrFn(data);
			} else {
				return data;
			}
		}								

		return dataFn;	
	},
	
	getSelection: function() {
		return this.dataTable.rows({selected: true}).data().toArray();
	}

});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.FilterItemsView = Backbone.View.extend({

	events: {
		'click #selectNulls': 'evFilterItemsNulls',
		'click #selectAll': 'evFilterItemsAll',
		'click #selectReset': 'evFilterItemsReset',
		'click .filter-option': 'evFilterOptionClick',
		'click .filter-selected': 'evFilterSelectedClick',
		'input #inputFilterItemsSearch': 'evInputFilterSearchChange',
	},

	initialize: function () {
		console.log("FilterItemsView.init " + this.model.get('table'));
	},

	template: _.template($('#filter-option-template').html()),

	loadRender: function() {
		var me = this;
		var s = this.$('#inputFilterItemsSearch').val();
		this.model.loadOptions(s, function() {
			me.render();
		});
	},

	render: function() {
		this.$('a[href=#filterSelect]').tab('show');

		this.$('#filterSelection').empty();
		var current = Donkeylift.app.filters.getFilter(
						this.model.get('table'),
						this.model.get('field'));

		if (current && current.get('op') == Donkeylift.Filter.OPS.IN) {
			//get values from filter
			var selected = current.get('value');		
//console.log(selected);
			_.each(selected, function(val) {
				this.$('#filterSelection').append(this.template({
					name: 'filter-selected',
					value: val
				}));
			}, this);
		}

		this.$('#filterOptions').empty();
		var fn = this.model.get('field').vname();
		var opts = this.model.get('field').get('options');		
//console.log(opts);
		_.each(opts, function(opt) {
			this.$('#filterOptions').append(this.template({
				name: 'filter-option',
				value: opt[fn]
			}));
		}, this);
	},

	setFilter: function() {
		var filterValues = this.$('#filterSelection').children()
			.map(function() {
				return $(this).attr('data-target');
		}).get();

		Donkeylift.app.filters.setFilter({
			table: this.model.get('table'),
			field: this.model.get('field'),
			op: Donkeylift.Filter.OPS.IN,
			value: filterValues
		});
		
		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
	},

	clearFilter: function() {
		Donkeylift.app.filters.clearFilter(this.model.get('table'), this.model.get('field'));
		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
	},

	evFilterOptionClick: function(ev) {
		ev.stopPropagation();
		//console.log(ev.target);
		var opt = $(ev.target).attr('data-target');
		var attr = '[data-target="' + opt + '"]';

		//avoid duplicate items in filterSelection
		if (this.$('#filterSelection').has(attr).length == 0) {
			var item = this.template({
				name: 'filter-selected',
				value: opt
			});
			this.$('#filterSelection').append(item);
			this.setFilter();
		}
	},

	evFilterSelectedClick: function(ev) {
		ev.stopPropagation();
		//console.log(ev.target);
		$(ev.target).remove();
		if (this.$('#filterSelection').length > 0) {
			this.setFilter();
		} else {
			this.clearFilter();
		}
	},

	evInputFilterSearchChange: function(ev) {
		this.loadRender();
	},


	evFilterItemsReset: function() {
		this.$('#filterSelection').empty();			
		this.$('#inputFilterItemsSearch').val('');

		this.clearFilter();
		
		this.loadRender();
	},

	evFilterItemsAll: function() {
		this.$('#filterSelection').empty();			

		Donkeylift.app.filters.setFilter({
			table: this.model.get('table'),
			field: this.model.get('field'),
			op: Donkeylift.Filter.OPS.NOTEQUAL,
			value: null
		});
		Donkeylift.app.router.navigate("reload-table", {trigger: true});			

		this.loadRender();
	},

	evFilterItemsNulls: function() {
		this.$('#filterSelection').empty();			

		Donkeylift.app.filters.setFilter({
			table: this.model.get('table'),
			field: this.model.get('field'),
			op: Donkeylift.Filter.OPS.EQUAL,
			value: null
		});
		Donkeylift.app.router.navigate("reload-table", {trigger: true});			

		this.loadRender();
	},
	
});



/*global Donkeylift, Backbone, jQuery, _, $, noUiSlider */

Donkeylift.FilterRangeView = Backbone.View.extend({

	events: {
		//range filter evs
		'click #rangeReset': 'evFilterRangeResetClick',
		'change #inputFilterMin': 'evInputFilterChange',
		'change #inputFilterMax': 'evInputFilterChange',
	},

	initialize: function () {
		console.log("FilterRangeView.init " + this.model.get('table'));
	},

	canSlide: function() {
		var field = this.model.get('field');
		if (field.get('fk')) return false;
		
		var slideTypes = [
			Donkeylift.Field.TYPES.integer,
			Donkeylift.Field.TYPES.decimal,
			Donkeylift.Field.TYPES.float
		];

		return _.contains(slideTypes, Donkeylift.Field.typeName(field.get('type')));
	},

	loadRender: function() {
		var me = this;
		this.model.loadRange(function() {
			me.render();
		});
	},

	render: function() {
		this.$('a[href=#filterRange]').tab('show');

		var stats = this.model.get('field').get('stats');

		var current = Donkeylift.app.filters.getFilter(
						this.model.get('table'),
						this.model.get('field'));

		if (current && current.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			this.$("#inputFilterMin").val(current.get('value')[0]);
			this.$("#inputFilterMax").val(current.get('value')[1]);
		} else {
			this.$("#inputFilterMin").val(stats.min);
			this.$("#inputFilterMax").val(stats.max);
		}

		//console.log('el ' + this.$el.html());

		if (this.canSlide()) {

			$('#sliderRange').show();
			$('#inputSliderRange').css('width', '100%');
			var sliderValues = [ 
				parseFloat(this.$("#inputFilterMin").val()),
				parseFloat(this.$("#inputFilterMax").val())
			];

			if ($('#inputSliderRange').attr('data-slider-value').length == 0) {
				//instantiate slider

				if (this.model.get('field').get('type') == Donkeylift.Field.TYPES.integer) {
					$('#inputSliderRange').attr('data-slider-step', 1);
				} else {
					$('#inputSliderRange').attr('data-slider-step', Math.max((stats.max - stats.min) / 100, 1e-6));
				}
	
				$('#inputSliderRange').attr('data-slider-value', '[' + sliderValues.toString() + ']');
				$('#inputSliderRange').attr('data-slider-min', stats.min);
				$('#inputSliderRange').attr('data-slider-max', stats.max);
				
				$('#inputSliderRange').slider({});
				
				$('#inputSliderRange').on("slide", function(slideEvt) {
					$("#inputFilterMin").val(slideEvt.value[0]);
					$("#inputFilterMax").val(slideEvt.value[1]);
				});			

				$('#inputSliderRange').on('slideStop', function() {
					$("#inputFilterMin").change();
					$("#inputFilterMax").change();
				});
			} else {
				//just set the value
				$('#inputSliderRange').slider('setValue', sliderValues);
				//$('#inputSliderRange').attr('data-slider-value', sliderValues);
			}			
		} else {
			$('#sliderRange').hide();
		}

		var dateTypes = [
			Donkeylift.Field.TYPES.date
		];
		if (_.contains(dateTypes, this.model.get('field').get('type'))) {

			//$("#inputFilterMin").attr('type', 'date');
			//$("#inputFilterMax").attr('type', 'date');

			var opts = {
				format: 'yyyy-mm-dd',
				orientation: 'bottom'
			}

			$("#inputFilterMin").datepicker(opts);
			$("#inputFilterMax").datepicker(opts);
		}

	},

	sanitizeInputFilterValue: function(el, bounds) {

		if (/Min$/.test(el.id)) {
			bounds = [bounds[0], parseFloat($("#inputFilterMax").val()) ];
		} else {
			bounds = [ parseFloat($("#inputFilterMin").val()), bounds[1]];
		}

		var val = this.model.get('field').parse(el.value);
		if (val < bounds[0]) val = bounds[0];
		if (val > bounds[1]) val = bounds[1];
		$(el).val(val);

	},

	evInputFilterChange: function(ev) {
		var stats = this.model.get('field').get('stats');

		this.sanitizeInputFilterValue(ev.target, [stats.min, stats.max]);

		var filterValues = [$("#inputFilterMin").val(),
							$("#inputFilterMax").val() ];

		if (this.canSlide()) {
			filterValues[0] = parseFloat(filterValues[0]);
			filterValues[1] = parseFloat(filterValues[1]);
			$('#inputSliderRange').slider('setValue', filterValues, false, false);
		}

		if (filterValues[0] != stats.min || filterValues[1] != stats.max) {
			Donkeylift.app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: Donkeylift.Filter.OPS.BETWEEN,
				value: filterValues
			});
		} else {
			Donkeylift.app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
		}

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
	},

	evFilterRangeResetClick: function() {
		Donkeylift.app.filters.clearFilter(this.model.get('table'), 
								this.model.get('field'));

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
		this.render();
	},
});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterShowView = Backbone.View.extend({
	el:  '#modalShowFilters',

	events: {
	},

	template: _.template($('#show-filter-item-template').html()),

	initialize: function() {
		console.log("FilterShowView.init");
	},

	render: function() {
		var el = this.$('#modalTableFilters > tbody');
		el.empty();
		//el.children('tr:not(:first)').remove();	
		this.collection.each(function(filter) {
			el.append(this.template(filter.toStrings()));
		}, this);			

		$('#modalInputDataUrl').val(Donkeylift.app.table.getAllRowsUrl());
		$('#modalShowFilters').on('shown.bs.modal', function() {
			$('#modalInputDataUrl').select();
		});

		$('#modalShowFilters').modal();

		return this;
	},


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterView = Backbone.View.extend({

	events: {
		'click .filter-column': 'evFilterColumnClick',
		'click .nav-tabs a': 'evFilterTabClick'
	},

	initialize: function (options) {
		console.log("FilterView.init " + this.model.get('table'));

		this.rangeView = new Donkeylift.FilterRangeView({
							model: this.model, el: this.el });
		this.itemsView = new Donkeylift.FilterItemsView({
							model: this.model, el: this.el });

		var th = options.th;
		this.$th = th;
		th.find('.dropdown-menu').append(this.el);
		
		/*
		 * turn off DT ColReorder mouse events while filter dropdown is shown
		 */
		th.find('.dropdown').on('show.bs.dropdown', function() {
			th.off('mousedown.ColReorder');
		});
		th.find('.dropdown').on('hide.bs.dropdown', function() {
			//TODO? slightly hacky way of re-insantiating the event handler for ColReorder 
			$.fn.dataTable.ColReorder('#grid')._fnMouseListener(0, th);
		});

		//on filter btn click toggle dropdown 
		var btn = th.find('.field-filter');
		if ( ! btn.data('bs.dropdown')) {
			//workaround for first click to show dropdown
			btn.dropdown('toggle');
		} else {
			btn.dropdown();
		}
		
	},

	template: _.template($('#filter-template').html()),

	render: function() {
		var field = this.model.get('field');
		console.log("FilterView.render " + field.get('name'));

		this.$el.html(this.template({
			name: field.get('name'),
			specialAction: field.get('name') == 'id' ? 'All' : 'Nulls'  
		}));

		var cx = (this.$th[0].getBoundingClientRect().left 
			+ this.$th[0].getBoundingClientRect().right) / 2;	
		var setAlign = cx < window.innerWidth / 2
			? 'left' : 'right';
		var clearAlign = setAlign == 'left' ? 'right' : 'left';

		this.$el.parent().toggleClass('dropdown-menu-' + clearAlign, false);
		this.$el.parent().toggleClass('dropdown-menu-' + setAlign, true);

		if (field.get('type').startsWith(Donkeylift.Field.TYPES.text)
		 || field.get('fk') == 1) {
			this.itemsView.loadRender();
		} else {
			this.rangeView.loadRender();
		}

		return this;
	},

	evFilterColumnClick: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
	},

	evFilterTabClick: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

//console.log('evFilterTab ' + ev.target);
		if (/filterSelect$/.test(ev.target.href)) {
			this.itemsView.loadRender();
		} else if (/filterRange$/.test(ev.target.href)) {
			this.rangeView.loadRender();
		}
	}
});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.MenuDataView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #filter-show': 'evFilterShow',
		'click #selection-add': 'evSelectionAdd',
		'click #selection-filter': 'evSelectionFilter',
		'click #selection-chown': 'evSelectionChangeOwner',
		'click #csv-copy': 'evCSVCopy',
		'click #csv-download': 'evCSVDownload',
		'click #edit-prefs': 'evEditPrefs',
	},

	initialize: function(opts) {
		console.log("MenuView.init");
		this.listenTo(opts.app.selectedRows, 'update', this.updateSelectionLabel);
		this.listenTo(opts.app.selectedRows, 'reset', this.updateSelectionLabel);
	},

	template: _.template($('#data-menu-template').html()),

	render: function() {
		console.log('MenuDataView.render ');			
		if (! Donkeylift.app.table) {
			this.$el.empty();
		} else {
			this.$el.html(this.template());
		}
		return this;
	},

	updateSelectionLabel: function() {
		var selCount = Donkeylift.app.getSelection().length;
		var label = 'Selection';
		if (selCount > 0) label = label + ' (' + selCount + ')';
		$('#selection-dropdown span:first').text(label);
	},

	getShowFilterView: function() {
		if ( ! this.filterShowView) {
			this.filterShowView = new Donkeylift.FilterShowView();
		}
		return this.filterShowView;
	},

	getAllSelectedRows: function() {
		var highlightedRows = Donkeylift.app.tableView.getSelection();
		var allRows = Donkeylift.app.getSelection().clone();
		allRows.add(highlightedRows)
		return allRows.toJSON();
	},

	evFilterShow: function() {
		this.getShowFilterView().collection = Donkeylift.app.filters;
		this.getShowFilterView().render();
	},

	evSelectionAdd: function(ev) {
		var rows = Donkeylift.app.tableView.getSelection();
		Donkeylift.app.addSelection(rows);
	
		$('#selection-dropdown').dropdown('toggle');	
		return false;
	},

	evSelectionFilter: function(ev) {

		var table = Donkeylift.app.table;
		var rows = this.getAllSelectedRows();

		if (rows.length == 0) {
			$('#selection-dropdown').dropdown('toggle');	
			return false;
		}
		
		var filter = Donkeylift.Filter.Create({
			table: table,
			field: 'id',
			op: Donkeylift.Filter.OPS.IN,
			value: _.pluck(rows, 'id')
		});

		Donkeylift.app.setFilters([ filter ]);
		Donkeylift.app.resetTable();

	},

	getChangeOwnerView: function() {
		if ( ! this.changeOwnerView) {
			this.changeOwnerView = new Donkeylift.ChangeOwnerView();
		}
		return this.changeOwnerView;
	},

	evSelectionChangeOwner: function() {
		var rows = this.getAllSelectedRows();

		if (rows.length == 0) {
			$('#selection-dropdown').dropdown('toggle');	
			return false;
		}
		
		this.getChangeOwnerView().model = new Backbone.Model({ 
			rowIds: _.pluck(rows, 'id'), 
			users: Donkeylift.app.schema.get('users') 
		});
		
		this.getChangeOwnerView().render();
	},
	
	evCSVCopy: function() {
		var table = Donkeylift.app.table;
		table.getRowsAsCSV(function(result) {
			console.log(result);
			$('#csv-textarea').val(result);
			$('#modalCSVShow').modal();
		});		
	},

	getCSVDownloadView: function() {
		if ( ! this.csvDownloadView) {
			this.csvDownloadView = new Donkeylift.CSVDownloadView({ 
				model: Donkeylift.app.table 
			});
		} else {
			this.csvDownloadView.model = Donkeylift.app.table;
		}
		return this.csvDownloadView;
	},

	evCSVDownload: function() {
		var modal = this.getCSVDownloadView();
		modal.render();
	},

	getPreferencesView: function() {
		var prefs = new Donkeylift.Preferences({
			table: Donkeylift.app.table
		});
		if ( ! this.preferencesView) {
			this.preferencesView = new Donkeylift.PreferencesView({ 
				model: prefs 
			});
		} else {
			this.preferencesView.model = prefs;
		}
		return this.preferencesView;
	},

	evEditPrefs: function() {
		//TODO
		var modal = this.getPreferencesView();
		modal.render();
	}

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.PreferencesView = Backbone.View.extend({
	el:  '#modalEditPrefs',

	events: {
		'click #modalEditPrefsApply': 'evPreferencesApplyClick',
		'click #modalEditPrefsSave': 'evPreferencesSaveClick',		
	},

	initialize: function() {
		console.log("PreferencesView.init " + this.model);
	},

	render: function() {
		console.log("PreferencesView.render ");
        var tablePrefs = this.model.getPreferences('table');
        $('#modalInputSkipRowCounts').prop('checked', tablePrefs.skipRowCounts);
        $('#modalInputShowRowAlias').prop('checked', tablePrefs.resolveRefs);
		$('#modalEditPrefs').modal();
		return this;
	},

	evPreferencesApplyClick: function() {
        var tablePrefs = this.model.getPreferences('table');
        tablePrefs.skipRowCounts = $('#modalInputSkipRowCounts').is(':checked');
        tablePrefs.resolveRefs = $('#modalInputShowRowAlias').is(':checked');
        Donkeylift.app.table.setPreferences(tablePrefs);
        Donkeylift.app.resetTable();
	},

	evPreferencesSaveClick: function() {
		var table = this.model.get('table').get('name');
		Donkeylift.app.schema.get('props').update({ table: table });
	}

});



var pegParser = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = "$skip=",
        peg$c2 = { type: "literal", value: "$skip=", description: "\"$skip=\"" },
        peg$c3 = function(a) {return {name: '$skip', value: parseInt(a) }; },
        peg$c4 = "$top=",
        peg$c5 = { type: "literal", value: "$top=", description: "\"$top=\"" },
        peg$c6 = function(a) {return {name: '$top', value: parseInt(a) }; },
        peg$c7 = "$orderby=",
        peg$c8 = { type: "literal", value: "$orderby=", description: "\"$orderby=\"" },
        peg$c9 = function(orderby) { return {name: '$orderby', value: orderby}; },
        peg$c10 = "$select=",
        peg$c11 = { type: "literal", value: "$select=", description: "\"$select=\"" },
        peg$c12 = function(fields) { return {name: '$select', value: fields}; },
        peg$c13 = "$filter=",
        peg$c14 = { type: "literal", value: "$filter=", description: "\"$filter=\"" },
        peg$c15 = function(filters) { return {name: '$filter', value: filters}; },
        peg$c16 = [],
        peg$c17 = ",",
        peg$c18 = { type: "literal", value: ",", description: "\",\"" },
        peg$c19 = null,
        peg$c20 = function(term) { return term; },
        peg$c21 = function(first, rest) { return [first].concat(rest); },
        peg$c22 = function(sep, term) { return term; },
        peg$c23 = "and",
        peg$c24 = { type: "literal", value: "and", description: "\"and\"" },
        peg$c25 = "\t",
        peg$c26 = { type: "literal", value: "\t", description: "\"\\t\"" },
        peg$c27 = ".",
        peg$c28 = { type: "literal", value: ".", description: "\".\"" },
        peg$c29 = "asc",
        peg$c30 = { type: "literal", value: "asc", description: "\"asc\"" },
        peg$c31 = "desc",
        peg$c32 = { type: "literal", value: "desc", description: "\"desc\"" },
        peg$c33 = function(table, field, order) { 
             var result = { 
               table: table ? table[0] : undefined, 
               field: field, 
               order: order || 'asc' 
             };  
             return result; 
           },
        peg$c34 = function(table, field, op) { 
           	 var result = {
            		table: table ? table[0] : undefined,
            		field: field,
            		op: op[0],
            		value: op[2]
             };	  
        	    return result;
           },
        peg$c35 = function(table, field) { 
             var result = { 
              table: table ? table[0] : undefined, 
              field: field 
             }; 
             return result; 
           },
        peg$c36 = "*",
        peg$c37 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c38 = { type: "other", description: "operator" },
        peg$c39 = "eq",
        peg$c40 = { type: "literal", value: "eq", description: "\"eq\"" },
        peg$c41 = "ne",
        peg$c42 = { type: "literal", value: "ne", description: "\"ne\"" },
        peg$c43 = "ge",
        peg$c44 = { type: "literal", value: "ge", description: "\"ge\"" },
        peg$c45 = "gt",
        peg$c46 = { type: "literal", value: "gt", description: "\"gt\"" },
        peg$c47 = "le",
        peg$c48 = { type: "literal", value: "le", description: "\"le\"" },
        peg$c49 = "lt",
        peg$c50 = { type: "literal", value: "lt", description: "\"lt\"" },
        peg$c51 = "search",
        peg$c52 = { type: "literal", value: "search", description: "\"search\"" },
        peg$c53 = { type: "other", description: "vector operator" },
        peg$c54 = "in",
        peg$c55 = { type: "literal", value: "in", description: "\"in\"" },
        peg$c56 = "btwn",
        peg$c57 = { type: "literal", value: "btwn", description: "\"btwn\"" },
        peg$c58 = { type: "other", description: "identifier" },
        peg$c59 = /^[a-z]/i,
        peg$c60 = { type: "class", value: "[a-z]i", description: "[a-z]i" },
        peg$c61 = function(first, chars) { return first + chars.join(''); },
        peg$c62 = { type: "other", description: "name char" },
        peg$c63 = /^[a-z0-9_]/i,
        peg$c64 = { type: "class", value: "[a-z0-9_]i", description: "[a-z0-9_]i" },
        peg$c65 = function(value) { return value; },
        peg$c66 = { type: "other", description: "null" },
        peg$c67 = "null",
        peg$c68 = { type: "literal", value: "null", description: "\"null\"" },
        peg$c69 = function() { return null; },
        peg$c70 = { type: "other", description: "whitespace" },
        peg$c71 = /^[ \t\n\r]/,
        peg$c72 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
        peg$c73 = { type: "other", description: "number" },
        peg$c74 = function() { return parseFloat(text()); },
        peg$c75 = /^[1-9]/,
        peg$c76 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c77 = /^[eE]/,
        peg$c78 = { type: "class", value: "[eE]", description: "[eE]" },
        peg$c79 = "-",
        peg$c80 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c81 = "+",
        peg$c82 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c83 = "0",
        peg$c84 = { type: "literal", value: "0", description: "\"0\"" },
        peg$c85 = { type: "other", description: "string" },
        peg$c86 = function(chars) { return chars.join(""); },
        peg$c87 = "'",
        peg$c88 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c89 = "\\",
        peg$c90 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c91 = "/",
        peg$c92 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c93 = "b",
        peg$c94 = { type: "literal", value: "b", description: "\"b\"" },
        peg$c95 = function() { return "\b"; },
        peg$c96 = "f",
        peg$c97 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c98 = function() { return "\f"; },
        peg$c99 = "n",
        peg$c100 = { type: "literal", value: "n", description: "\"n\"" },
        peg$c101 = function() { return "\n"; },
        peg$c102 = "r",
        peg$c103 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c104 = function() { return "\r"; },
        peg$c105 = "t",
        peg$c106 = { type: "literal", value: "t", description: "\"t\"" },
        peg$c107 = function() { return "\t"; },
        peg$c108 = "u",
        peg$c109 = { type: "literal", value: "u", description: "\"u\"" },
        peg$c110 = function(digits) {
                  return String.fromCharCode(parseInt(digits, 16));
                },
        peg$c111 = function(sequence) { return sequence; },
        peg$c112 = /^[ -&(-[\]-\u10FFFF]/,
        peg$c113 = { type: "class", value: "[ -&(-[\\]-\\u10FFFF]", description: "[ -&(-[\\]-\\u10FFFF]" },
        peg$c114 = /^[0-9]/,
        peg$c115 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c116 = /^[0-9a-f]/i,
        peg$c117 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parseparam();

      return s0;
    }

    function peg$parseparam() {
      var s0;

      s0 = peg$parseparamSkip();
      if (s0 === peg$FAILED) {
        s0 = peg$parseparamTop();
        if (s0 === peg$FAILED) {
          s0 = peg$parseparamOrderBy();
          if (s0 === peg$FAILED) {
            s0 = peg$parseparamFilter();
            if (s0 === peg$FAILED) {
              s0 = peg$parseparamSelect();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseparamSkip() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c1) {
        s1 = peg$c1;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c2); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s3 = input.substring(s2, peg$currPos);
        }
        s2 = s3;
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c3(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamTop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c4) {
        s1 = peg$c4;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s3 = input.substring(s2, peg$currPos);
        }
        s2 = s3;
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c6(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamOrderBy() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9) === peg$c7) {
        s1 = peg$c7;
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseorderByExpr();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c9(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamSelect() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c10) {
        s1 = peg$c10;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefieldExpr();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c12(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamFilter() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c13) {
        s1 = peg$c13;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c14); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefilterExpr();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c15(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseorderByExpr() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseorderByTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c17;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c19;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parseorderByTerm();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c20(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c17;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c19;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parseorderByTerm();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c20(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c21(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefilterExpr() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsefilterTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsefilterSep();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsefilterTerm();
          if (s5 !== peg$FAILED) {
            peg$reportedPos = s3;
            s4 = peg$c22(s4, s5);
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsefilterSep();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsefilterTerm();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c22(s4, s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c21(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefilterSep() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsews();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c23) {
          s2 = peg$c23;
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c24); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 9) {
          s1 = peg$c25;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c26); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsews();
          if (s2 === peg$FAILED) {
            s2 = peg$c19;
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parsefieldExpr() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parsefieldTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c17;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c19;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsefieldTerm();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c20(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c17;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c19;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsefieldTerm();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c20(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c21(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseorderByTerm() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c27;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c28); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c19;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 === peg$FAILED) {
            s3 = peg$c19;
          }
          if (s3 !== peg$FAILED) {
            if (input.substr(peg$currPos, 3).toLowerCase() === peg$c29) {
              s4 = input.substr(peg$currPos, 3);
              peg$currPos += 3;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c30); }
            }
            if (s4 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c31) {
                s4 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c32); }
              }
            }
            if (s4 === peg$FAILED) {
              s4 = peg$c19;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c33(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefilterTerm() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c27;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c28); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c19;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            s5 = peg$parseop();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsews();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsevalue();
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$c0;
            }
            if (s4 === peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parsevecop();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsews();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsevalues();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$c0;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c34(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefieldTerm() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c27;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c28); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c19;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c35(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefield() {
      var s0;

      s0 = peg$parseidentifier();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 42) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }
      }

      return s0;
    }

    function peg$parseop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c39) {
        s0 = peg$c39;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c40); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c41) {
          s0 = peg$c41;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c42); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c43) {
            s0 = peg$c43;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c45) {
              s0 = peg$c45;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c46); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c47) {
                s0 = peg$c47;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c48); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c49) {
                  s0 = peg$c49;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c50); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 6) === peg$c51) {
                    s0 = peg$c51;
                    peg$currPos += 6;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c52); }
                  }
                }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }

      return s0;
    }

    function peg$parsevecop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c54) {
        s0 = peg$c54;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c55); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c56) {
          s0 = peg$c56;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c57); }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c53); }
      }

      return s0;
    }

    function peg$parseidentifier() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c59.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefchar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsefchar();
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c61(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }

      return s0;
    }

    function peg$parsefchar() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c63.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }

      return s0;
    }

    function peg$parsevalues() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parsevalue();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c17;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c19;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsevalue();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c65(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c17;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c19;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsevalue();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c65(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c21(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsevalue() {
      var s0;

      s0 = peg$parsenumber();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestring();
        if (s0 === peg$FAILED) {
          s0 = peg$parsenull();
        }
      }

      return s0;
    }

    function peg$parsenull() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c67) {
        s1 = peg$c67;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c68); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c69();
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }

      return s0;
    }

    function peg$parsews() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      if (peg$c71.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c72); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c71.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c72); }
          }
        }
      } else {
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseminus();
      if (s1 === peg$FAILED) {
        s1 = peg$c19;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseint();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefrac();
          if (s3 === peg$FAILED) {
            s3 = peg$c19;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexp();
            if (s4 === peg$FAILED) {
              s4 = peg$c19;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c74();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c73); }
      }

      return s0;
    }

    function peg$parsedecimal_point() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 46) {
        s0 = peg$c27;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c28); }
      }

      return s0;
    }

    function peg$parsedigit1_9() {
      var s0;

      if (peg$c75.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c76); }
      }

      return s0;
    }

    function peg$parsee() {
      var s0;

      if (peg$c77.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c78); }
      }

      return s0;
    }

    function peg$parseexp() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseminus();
        if (s2 === peg$FAILED) {
          s2 = peg$parseplus();
        }
        if (s2 === peg$FAILED) {
          s2 = peg$c19;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseDIGIT();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseDIGIT();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefrac() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsedecimal_point();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDIGIT();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDIGIT();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseint() {
      var s0, s1, s2, s3;

      s0 = peg$parsezero();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsedigit1_9();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseDIGIT();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDIGIT();
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseminus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c79;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }

      return s0;
    }

    function peg$parseplus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 43) {
        s0 = peg$c81;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c82); }
      }

      return s0;
    }

    function peg$parsezero() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 48) {
        s0 = peg$c83;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c84); }
      }

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsequotation_mark();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsechar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsechar();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsequotation_mark();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c86(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c85); }
      }

      return s0;
    }

    function peg$parsechar() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$parseunescaped();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseescape();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c87;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c88); }
          }
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 92) {
              s2 = peg$c89;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c90); }
            }
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s2 = peg$c91;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c92); }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 98) {
                  s3 = peg$c93;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c94); }
                }
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s2;
                  s3 = peg$c95();
                }
                s2 = s3;
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 102) {
                    s3 = peg$c96;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c97); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s2;
                    s3 = peg$c98();
                  }
                  s2 = s3;
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 110) {
                      s3 = peg$c99;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c100); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c101();
                    }
                    s2 = s3;
                    if (s2 === peg$FAILED) {
                      s2 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 114) {
                        s3 = peg$c102;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c103); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c104();
                      }
                      s2 = s3;
                      if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 116) {
                          s3 = peg$c105;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c106); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s2;
                          s3 = peg$c107();
                        }
                        s2 = s3;
                        if (s2 === peg$FAILED) {
                          s2 = peg$currPos;
                          if (input.charCodeAt(peg$currPos) === 117) {
                            s3 = peg$c108;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c109); }
                          }
                          if (s3 !== peg$FAILED) {
                            s4 = peg$currPos;
                            s5 = peg$currPos;
                            s6 = peg$parseHEXDIG();
                            if (s6 !== peg$FAILED) {
                              s7 = peg$parseHEXDIG();
                              if (s7 !== peg$FAILED) {
                                s8 = peg$parseHEXDIG();
                                if (s8 !== peg$FAILED) {
                                  s9 = peg$parseHEXDIG();
                                  if (s9 !== peg$FAILED) {
                                    s6 = [s6, s7, s8, s9];
                                    s5 = s6;
                                  } else {
                                    peg$currPos = s5;
                                    s5 = peg$c0;
                                  }
                                } else {
                                  peg$currPos = s5;
                                  s5 = peg$c0;
                                }
                              } else {
                                peg$currPos = s5;
                                s5 = peg$c0;
                              }
                            } else {
                              peg$currPos = s5;
                              s5 = peg$c0;
                            }
                            if (s5 !== peg$FAILED) {
                              s5 = input.substring(s4, peg$currPos);
                            }
                            s4 = s5;
                            if (s4 !== peg$FAILED) {
                              peg$reportedPos = s2;
                              s3 = peg$c110(s4);
                              s2 = s3;
                            } else {
                              peg$currPos = s2;
                              s2 = peg$c0;
                            }
                          } else {
                            peg$currPos = s2;
                            s2 = peg$c0;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c111(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseescape() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 92) {
        s0 = peg$c89;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c90); }
      }

      return s0;
    }

    function peg$parsequotation_mark() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c87;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }

      return s0;
    }

    function peg$parseunescaped() {
      var s0;

      if (peg$c112.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }

      return s0;
    }

    function peg$parseDIGIT() {
      var s0;

      if (peg$c114.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c115); }
      }

      return s0;
    }

    function peg$parseHEXDIG() {
      var s0;

      if (peg$c116.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c117); }
      }

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();

/*global Donkeylift, Backbone, _ */
//var pegParser = module.exports;

(function () {
	'use strict';

	Donkeylift.RouterData = Backbone.Router.extend({

        routes: {
			"table/:table": "routeGotoTable"
			, "table/:table/:filter": "routeGotoRows"
			, "reset-filter": "routeResetFilter"
			, "reload-table": "routeReloadTable"
			, "data/:schema/:table(/*params)": "routeUrlTableData"
			, "schema/:schema/:table": "routeUrlTableSchema"
        },

		routeUrlTableData: function(schemaName, tableName, paramStr) {
			console.log("routeUrlTableData " 
						+ schemaName + " " + tableName + " " + paramStr);
			/* 
			 * hack to block executing router handlers twice in a row in FF
			 * isBlocked.. will be timeout reset after a short time (100ms). 
			*/
			if (this.isBlockedGotoUrl) return;

			this.gotoTable(tableName, { 
				schema: schemaName,
				params: this.parseParams(paramStr)
			});
		},

		routeGotoTable: function(tableName) {
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		routeGotoRows: function(tableName, filter) {
			var kv = filter.split('=');
			var filterTable;
			if (kv[0].indexOf('.') > 0) {
				filterTable = kv[0].substr(0, kv[0].indexOf('.'));
			} else {
				filterTable = tableName;
			}

			console.log("routeGotoRow " + tableName + " " + filter);
			Donkeylift.app.filters.setFilter({
				table: filterTable,
				field: 'id',
				op: Donkeylift.Filter.OPS.EQUAL,
				value: kv[1]
			});
			
			this.gotoTable(tableName);
		},

		routeResetFilter: function() {
			Donkeylift.app.unsetFilters();
			Donkeylift.app.resetTable();
		},

		routeReloadTable: function() {
			Donkeylift.app.table.reload();
		},


		gotoHash: function(hash, cbAfter) {
			var parts = hash.split('/');
			if (parts.length == 4 && parts[0] == '#data') {
				var opts = 	{ 
						schema: parts[1],
						params: this.parseParams(parts[3])
				}; 
				this.gotoTable(parts[2], opts, cbAfter);
			}
		},

		parseParams: function(paramStr) {
			var params = {};
			_.each(paramStr.split('&'), function(p) {
				var ps = p.split('=');
				var k = decodeURIComponent(ps[0]);
				var v = ps.length > 1 
						? decodeURIComponent(ps[1])
						:  decodeURIComponent(ps[0]);
				if (k[0] == '$') {
					var param = pegParser.parse(k + "=" + v);
					params[param.name] = param.value;
				}
			});
			//console.dir(params);
			return params;
		},

		blockGotoUrl: function(ms) {
			ms = ms || 1000;
			var me = this;
			this.isBlockedGotoUrl = true;
			window.setTimeout(function() {
				me.isBlockedGotoUrl = false;
			}, ms);
		},

		updateNavigation: function(fragment, options) {
			console.log('update nav ' + fragment + ' ' + options); 
			options = options || {};
			if (options.block > 0) {
				this.blockGotoUrl(options.block); //avoid inmediate reolad FF
			}
			this.navigate(fragment, {replace: options.replace});
		},	

		gotoTable: function(tableName, options, cbAfter) {
			options = options || {};

			var setOthers = function() {

				var table = Donkeylift.app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			

				if (options.params) {
					//set filters
					var filters = _.map(options.params.$filter, function(f) {
						return Donkeylift.Filter.Create(f);
					});
					if (_.contains(filters, null)) {
						console.log('error parsing $filter param. no filters added');
					} else {
						Donkeylift.app.setFilters(filters);
					}
				}
				
				//load data			
				Donkeylift.app.setTable(table, options.params);
				if (cbAfter) cbAfter();
			}

			if (options.schema) {
				Donkeylift.app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}

		}

        
	});


})();

/*global AppBase, Backbone, Donkeylift, $ */

function AppData(opts) {
    console.log('AppData ctor');
	Donkeylift.AppBase.call(this, opts);
	
	this.filters = new Donkeylift.Filters();
	this.selectedRows = new Donkeylift.Rows();
	
	this.menuView = new Donkeylift.MenuDataView({ app: this });
	this.router = new Donkeylift.RouterData();
}

AppData.prototype = Object.create(Donkeylift.AppBase.prototype);
AppData.prototype.constructor = AppData; 

AppData.prototype.start = function(opts, cbAfter) {
	Donkeylift.AppBase.prototype.start.call(this, opts, cbAfter);
	$('#nav-data').closest("li").addClass("active");
}

/*** override AppBase methods ***/ 

AppData.prototype.createTableView = function(table, params) {
	return new Donkeylift.DataTableView({
		model: table,
		attributes: { params: params }
	});
}

AppData.prototype.createSchema = function(name) {
	return new Donkeylift.Database({name : name, id : name});
}

	
AppData.prototype.unsetSchema = function() {
	Donkeylift.AppBase.prototype.unsetSchema.call(this);
	this.unsetFilters();
}

AppData.prototype.unsetTable = function() {
	Donkeylift.AppBase.prototype.unsetTable.call(this);
	this.unsetSelection();
}

/**** AppData stuff ****/

AppData.prototype.setFilters = function(filters) {
	this.filters.reset(filters); // = new Donkeylift.Filters(filters);
}

AppData.prototype.unsetFilters = function() {
	this.filters.reset(); // = new Donkeylift.Filters();
}


AppData.prototype.addSelection = function(rows) {
	this.selectedRows.add(rows);
}

AppData.prototype.getSelection = function(opts) {
	return this.selectedRows;
}

AppData.prototype.unsetSelection = function() {
	this.selectedRows.reset();
}

AppData.prototype.setFilterView = function(filter, thElement) {
	if (this.filterView) this.filterView.remove();
	this.filterView = new Donkeylift.FilterView({ model: filter, th: thElement });
	this.filterView.render();
}

AppData.prototype.onAccountLoaded = function(cbAfter) {
	//only data app
	if (window.location.hash.length > 0) {
		console.log("navigate " + window.location.hash);
		Donkeylift.app.router.gotoHash(window.location.hash, cbAfter);
	}
	else if (cbAfter) cbAfter();
}

Donkeylift.AppData = AppData;
