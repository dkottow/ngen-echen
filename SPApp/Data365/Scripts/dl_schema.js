/*global Backbone, $, _ */


var Donkeylift = {

  env: {
    server: undefined //set on app start
  },

  ajax: function(url, settings) {
    console.log('Donkeylift.ajax...');
    $('#ajax-progress-spinner').show();
    return new Promise(function(resolve, reject) {

      var jqXHR = $.ajax(url, settings);
  
      jqXHR.always(function() {
        $('#ajax-progress-spinner').hide();
      });

      jqXHR.success(function(response, textStatus, jqXHR) {
        console.log(response);
        console.log('jqXHR.success ...Donkeylift.ajax');
        resolve({
          response: response,
          jqXHR: jqXHR, 
          textStatus: textStatus
        })
      });

      jqXHR.error(function(jqXHR, textStatus, errorThrown) {
        console.log('jqXHR.error ...Donkeylift.ajax');
        reject({
          jqXHR: jqXHR, 
          textStatus: textStatus, 
          errorThrown: errorThrown 
        })
      });
    });
  },

	util: {
		/*** implementation details at eof ***/
		removeDiacritics: function(str) {
		  return str.replace(/[^\u0000-\u007e]/g, function(c) {
		    return diacriticsMap[c] || c;
		  });
		}
	}
	
};

function AppBase(params) {
	var me = this;

  Donkeylift.env.server = params.server;
  this.id_token = params.id_token;

  console.log('AppBase ctor');
	
	this.navbarView = new Donkeylift.NavbarView();

	$('#toggle-sidebar').click(function() {
		me.toggleSidebar();
	}); 

	Backbone.history.start();

  //overwrite Backbone.ajax with Donkeylift.ajax 
  //Backbone.ajax = Donkeylift.ajax;

  new Clipboard('.btn'); //attach clipboard option

}

AppBase.prototype.start = function(params, cbAfter) {
	var me = this;

  this.getSiteConfig(params.site, function(err, config) {

    if (err) {
      console.log(err);
      alert(err);
      return;
    }

    me.setAccount({
      user: params.user,
      account: config.account,
      id_token: params.id_token

    }, function() {
      if (config.database != '_d365Master') {
        me.setSchema(config.database);

      } else {
        me.listSchemas(params.user);
      }
    });      
  });
  
}

AppBase.prototype.masterUrl = function() {
  return Donkeylift.env.server + '/test/_d365Master';
}

AppBase.prototype.getSiteConfig = function(siteUrl, cbAfter) {  
  console.log('AppBase.getSiteConfig..');
  var query = '$select=Databases.name,Account.name' + '&'
            + "$filter=SiteUrl eq '" + siteUrl + "'";
  var url = this.masterUrl() + '/Applications.rows' + '?' + query;
  Donkeylift.ajax(url, {

  }).then(function(result) {
    var response = result.response;
    console.log(response);
    if (response.rows.length > 0) {
      var result = {
        account: response.rows[0]['Account$name'],
        database: response.rows[0]['Databases$name']
      };
      cbAfter(null, result);

    } else {
      var err = new Error("Site '" + siteUrl + "' configuration not found on master database.");
      cbAfter(err);
    }

  }).catch(function(result) {
    console.log("Error requesting " + url);
    var err = new Error(result.errThrown + " " + result.textStatus);
    console.log(err);
    alert(err.message);
    cbAfter(err);
  });         
}

AppBase.prototype.setAccount = function(params, cbAfter) {
	var me = this;
  console.log('setAccount...');
  console.log(JSON.stringify(params));

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

AppBase.prototype.onAccountLoaded = function(cbAfter) {
  //overwrite me
  console.log('onAccountLoaded...');
  if (cbAfter) cbAfter();
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

AppBase.prototype.listSchemas = function(userPrincipalName, cbAfter) {
  console.log('listSchemas...');
  var me = this;

  var query = "$filter=UserPrincipalName eq '" + userPrincipalName + "'";
  var url = this.masterUrl() + '/_d365AdminDatabases.view' + '?' + query;
  Donkeylift.ajax(url, {

  }).then(function(result) {
    var response = result.response;
    console.log(response);

    me.schemas = Donkeylift.Schemas.Create(response.rows);
		me.schemaListView = new Donkeylift.SchemaListView({
			collection: me.schemas
		});
    $('#sidebar').append(me.schemaListView.el);
    me.schemaListView.render();
    if (cbAfter) cbAfter();

  }).catch(function(result) {
    console.log("Error requesting " + url);
    var err = new Error(result.errThrown + " " + result.textStatus);
    console.log(err);
    alert(err.message);
  });         
  
}

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

		this.set('name', attrs.account);
		this.set('user', attrs.user);
		this.set('id_token', attrs.id_token);
	},

	url	: function() { 
		return Donkeylift.env.server + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

	principal: function() {
		return this.get('principal') || this.get('user');
	},

	isAdmin : function() {
		return true; ///TODO
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

		} else if (t == Donkeylift.Field.TYPES.float) {
			result = parseFloat(val);
			resultError = isNaN(result); 

		} else if (t == Donkeylift.Field.TYPES.boolean) {
			result = Boolean(JSON.parse(val));
			resultError = false; 
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
			|| t == Donkeylift.Field.TYPES.float
			|| t == Donkeylift.Field.TYPES.boolean) 
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
	},

	setStats: function(stats) {
		this.set('stats', {
			min: this.toFS(stats.min),
			max: this.toFS(stats.max)
		});		
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
	float: 'float',
	boolean: 'boolean'
};

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
		me.bbFetch({
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

    bbFetch: function(options) {
		//minimally adapted from backbone.js
		options = _.extend({parse: true}, options);
		var success = options.success;
		var collection = this;

		var url = options.url || this.url();
		//use Donkeylift.ajax instead of Backbone.sync
		Donkeylift.ajax(this.url(), {

		}).then(function(result) {
			var resp = result.response;

			var method = options.reset ? 'reset' : 'set';
			collection[method](resp, options);
			if (success) success.call(options.context, collection, resp, options);
			collection.trigger('sync', collection, resp, options);

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.errThrown + " " + result.textStatus);
			console.log(err);
			alert(err.message);
			cbResult(err);
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
		Donkeylift.ajax(url, {
			method: 'POST'
			, data: insertData
			, contentType: "application/json"
			, processData: false

		}).then(function(result) {
			var response = result.response;
			console.log("Properties.update POST ok.");			
			//console.log(response);			
			_.each(rows.insert, function(row, idx) {
				row.set('id', response.rows[idx].id);
			});
			if (cbAfter) cbAfter();

		}).catch(function(result) {
			var jqXHR = result.jqXHR;
			console.log("Error requesting " + url);
			console.log(result.errThrown + " " + result.textStatus);
			if (cbAfter) cbAfter(new Error(result.errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});

		Donkeylift.ajax(url, {
			method: 'PUT'
			, data: updateData
			, contentType: "application/json"
			, processData: false

		}).then(function(result) {
			var response = result.response;
			console.log("Properties.update PUT ok.");			
			console.log(response);			
			if (cbAfter) cbAfter();

		}).catch(function(result) {
			var jqXHR = result.jqXHR;
			console.log("Error requesting " + url);
			console.log(result.errThrown + " " + result.textStatus);
			if (cbAfter) cbAfter(new Error(result.errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
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

	url : function(params) {
		var url = Donkeylift.app.account.url() + '/' + this.get('name');
		if (params) {
			url = url + '?' 
				+ _.map(params, function(v, k) { return k + '=' + encodeURI(v) }).join('&');
		}
		return url;
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Schema.fetch...");
		var url = me.url({ reload : 1 });		
		me.bbFetch({
			success: function(model, response, options) {
				me.orgJSON = JSON.parse(JSON.stringify(me.toJSON())); //copy
				me.get('props').setKeyFuncs();
				console.log("Schema.fetch OK");
				me.get('props').fetch(function() {
					cbAfter();
				});					
			},
			error: function(model, response, options) {
				console.log(JSON.stringify(response));
				alert(response.responseText);
			},
			url: url
		});
	},

    bbFetch: function(options) {
		//minimally adapted from backbone.js
		options = _.extend({parse: true}, options);
		var success = options.success;
		var model = this;

		var url = options.url || this.url();
		//use Donkeylift.ajax instead of Backbone.sync
		Donkeylift.ajax(url, {

		}).then(function(result) {
			var resp = result.response;

			var serverAttrs = options.parse ? model.parse(resp, options) : resp;
			if (!model.set(serverAttrs, options)) return false;
			if (success) success.call(options.context, model, resp, options);
			model.trigger('sync', model, resp, options);

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.errThrown + " " + result.textStatus);
			console.log(err);
			alert(err.message);
			cbResult(err);
		});

	  },	
	
	update : function(cbAfter) {
		var me = this;
		if ( ! this.updateDebounced) {
			this.updateDebounced = _.debounce(function(cbAfter) {
				var diff = jsonpatch.compare(me.orgJSON, me.toJSON());
				console.log('Schema.update');		
				console.log(JSON.stringify(diff));		
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
		Donkeylift.ajax(url, {
			method: 'PATCH'
			, data: JSON.stringify(diff)
			, contentType: "application/json"
			, processData: false

		}).then(function(result) {
			var response = result.response;
			console.log(response);
			cbResult(null, response);

		}).catch(function(result) {
			var jqXHR = result.jqXHR;
			console.log("Error requesting " + url);
			console.log(result.errThrown + " " + result.textStatus);
			cbResult(new Error(result.errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
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
	},

	fullName: function() {
		return this.get('account') + '$' + this.get('name');
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
			Donkeylift.ajax(url, {})
			
			.then(function(result) {
				var response = result.response;
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

Donkeylift.Schemas = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Schema,

	initialize : function(schemas) {
	},

});

Donkeylift.Schemas.Create = function(rows) {
    var schemas = _.map(rows, function(row) {
        return {
            account: row.Account,
            name: row.Database
        };
    });
    return new Donkeylift.Schemas(schemas);
}

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

/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
	},

	initialize: function() {
	},

	navUserInfoTemplate: _.template($('#nav-user-info-template').html()),

	render: function() {
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
	}

});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.SchemaListView = Backbone.View.extend({
/*
	id:  'schema-list',
	tagName: 'ul',
	className: 'dropdown-menu',
*/
	events: {
		'change #selectDatabase': 'evSchemaChange',
	},

	initialize: function() {
	},

	template: _.template($('#schema-list-template').html()),

	render: function() {

		this.$el.html(this.template());
		this.renderSchemaList();
		this.renderCurrentSchemaName();

		return this;
	},

	renderSchemaList: function() {
		var accounts = this.collection.groupBy(function(schema) {
			return schema.get('account');
		});
		_.each(accounts, function(schemas, account) {
			$('#selectDatabase').append(
				$('<optgroup></optgroup>')
					.attr('label', account)
			);
			_.each(schemas, function(schema) {
				$('#selectDatabase optgroup').last().append(
					$('<option></option>')
						.attr('value', schema.fullName())
						.text(schema.get('name'))
				);
				console.log(schema.fullName());
			});	
		});
		$('#selectDatabase').selectpicker('refresh');
	},

	renderCurrentSchemaName: function() {
/*
		var $span = this.$el.closest('li').find('a:first span');
		if (Donkeylift.app.schema) {
			$span.html(' DB ' + Donkeylift.app.schema.get('name'));
		} else {
			$span.html(' Choose DB ');
		}		
*/
	},

	evSchemaChange: function(ev) {
		console.log('SchemaListView.evSchemaChange ' + $(ev.target).val());
		var parts = $(ev.target).val().split('$');
		Donkeylift.app.account.set('name', parts[0]);
		Donkeylift.app.setSchema(parts[1], { reload: true });			
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
			table.setProp('visible', $(this).prop('selected'));	
		});
	}
});




/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasEditView = Backbone.View.extend({
	el:  '#modalEditAlias',

	events: {
		'click #modalAliasUpdate': 'evUpdateClick',
		'click #modalAliasRemove': 'evRemoveClick',
	},

	initialize: function() {
		console.log("AliasEditView.init");
	},

	setModel: function(model, alias) {
		this.model = model;
		this.alias = alias;
	},

	render: function() {
		console.log("AliasEditView.render ");

		var el = this.$('#modalInputAliasField');
		el.empty();

		Donkeylift.app.addAncestorFieldsToSelect(el);

		if (this.alias) {
			el.val(this.alias.toString());
		}

		$('#modalEditAlias').modal();
		return this;
	},

	evUpdateClick: function() {
		var newFieldQName = $('#modalInputAliasField').val();
		//console.log(this.model.get('row_alias'));
		var alias = Donkeylift.Alias.parse(
						newFieldQName.split('.')[0],
						newFieldQName.split('.')[1]
		);	

		var i = this.model.get('row_alias').indexOf(this.alias);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1, alias);
		} else {
			this.model.get('row_alias').push(alias);
		}

		this.model.trigger('change:row_alias'); //trigger change
		Donkeylift.app.updateSchema();
		//console.log(this.model.get('row_alias'));
	},

	evRemoveClick: function() {	
		var i = this.model.get('row_alias').indexOf(this.alias);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1);
			this.model.trigger('change:row_alias'); //trigger change
		}
		Donkeylift.app.updateSchema();
		//console.log(this.model.get('row_alias'));
	},


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasView = Backbone.View.extend({

	//el: '#alias',

	events: {
		'click .edit-alias': 'evEditAliasClick',
		'click #add-alias': 'evNewAliasClick'
	},

	initialize: function () {
		console.log("AliasView.init " + this.model.get('row_alias'));
		this.listenTo(this.model, 'change:row_alias', this.render);
	},

	template: _.template($('#alias-field-template').html()),

	render: function() {
		console.log("AliasView.render");

		this.$el.find('tbody').empty();
//console.log(this.model.get('row_alias'));
		_.each(this.model.get('row_alias'), function(a) {
			this.$el.find('tbody').append(this.template({
				table: a.get('table').get('name'),
				field: a.get('field').get('name')
			}));
		}, this);
	},

	evEditAliasClick: function(ev) {				
		console.log("AliasView.evEditAliasClick");
		var table = $(ev.target).parents('tr').find('td:eq(1)').text();
		var field = $(ev.target).parents('tr').find('td:eq(2)').text();

		var alias = _.find(this.model.get('row_alias'), function(a) {
			return a.get('table').get('name') == table 
				&& a.get('field').get('name') == field;
		});
		console.log("Edit alias " + table + "." + field + " = " + alias);

		var editor = Donkeylift.app.getAliasEditor();
		editor.setModel(this.model, alias);
		editor.render();
	},

	evNewAliasClick: function() {
		console.log('AliasView.evNewAliasClick');

		var editor = Donkeylift.app.getAliasEditor();
		editor.setModel(this.model, null);
		editor.render();
	}

});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick',
	},

	initialize: function() {
		console.log("FieldEditView.init");
	},

	render: function() {
		//console.log("FieldEditView.render " + this.model.get('type'));

		$('#modalInputFieldName').val(this.model.get('name'));
		$('#modalInputFieldType').val(this.model.typeName());
		$('#modalInputFieldTypeSuffix').val(this.model.typeSuffix());						

		$('#modalEditField').modal();

		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");

		this.model.set('name', $('#modalInputFieldName').val());
		this.model.setType($('#modalInputFieldType').val(), $('#modalInputFieldTypeSuffix').val());

		if ( ! this.model.collection) {
			Donkeylift.app.table.get('fields').addNew(this.model);
		}
		Donkeylift.app.table.sanitizeFieldOrdering();
		Donkeylift.app.updateSchema();

		//Donkeylift.app.tableView.render();
	},

	removeClick: function() {	
		console.log("FieldEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
		}
		Donkeylift.app.updateSchema();
		Donkeylift.app.tableView.render();
	},

});



/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .btn-field-edit': 'editFieldClick',
	},

	initialize: function () {
		//console.log("TableView.init " + this.model.get('name'));
		this.listenTo(this.model, 'change', this.render);
	},

	template: _.template($('#field-template').html()),

	render: function() {
		//console.log("FieldView.render " + this.model.get("name"));
		var attrs = this.model.attrJSON();
		attrs.props = _.map(attrs.props, function(v, k) {
			return k + ": " + v;
		}).join(' | ');
		
		if (this.model.get('name') == 'id') {
			attrs.pkfk = 'field-primary-key';
		} else if (this.model.get('fk')) {
			attrs.pkfk = 'field-foreign-key';
		}
		attrs.pkfk = attrs.pkfk || 'field-no-key';
		
		this.$el.html(this.template(attrs));
		return this;
	},

	editFieldClick: function(ev) {				
		var editor = Donkeylift.app.getFieldEditor();
		editor.model = this.model;
		editor.render();
	},

	getFieldFromRow: function(tr) {
		var name = tr.find('td:eq(2)').text();
		return Donkeylift.app.table.get('fields').getByName(name);
	},

	swapFieldsOrder: function(f1, f2) {
		var o1 = f1.getProp('order');
		f1.setProp('order', f2.getProp('order'));
		f2.setProp('order', o1);
	},

});



/*global Donkeylift, Backbone, jQuery, $, _ */

Donkeylift.MenuSchemaView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #add-table': 'evAddTableClick'
		, 'click #edit-users': 'evUsersClick'
		, 'click #new-schema': 'evNewSchemaClick'
		, 'click #save-schema': 'evUpdateSchemaClick'
		, 'click #vis-tablegraph': 'evVisTableGraphClick'
		, 'click #downloads': 'evDownloadsClick'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.app.schema, 'change', this.render);
	},

	template: _.template($('#schema-menu-template').html()),

	render: function() {
		console.log('MenuSchemaView.render ' + Donkeylift.app.schema);			
		if (! Donkeylift.app.schema) {
			this.$el.empty();
		} else {
			this.$el.html(this.template());
		}
		return this;
	},

	evAddTableClick: function() {
		if ( ! Donkeylift.app.schema) return;
		var table = Donkeylift.Table.create();
		var editor = Donkeylift.app.getTableEditor();
		editor.model = table;
		editor.render();
	},

	evUsersClick: function() {
		if ( ! Donkeylift.app.schema) return;
		if (this.usersView) this.usersView.remove();
		this.usersView = new Donkeylift.UsersView({
			collection: Donkeylift.app.schema.get('users')
		});
		$('#content').html(this.usersView.render().el);		
	},

	evVisTableGraphClick: function() {
		if ( ! Donkeylift.app.schema) return;
		if ( ! this.graphView) {
			this.graphView = new Donkeylift.SchemaGraphView();
		}
		this.graphView.model = Donkeylift.app.schema;
		this.graphView.render();
	},

});


/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.RelationEditView = Backbone.View.extend({
	el:  '#modalEditRelation',

	events: {
		'click #modalRelationUpdate': 'updateClick',
		'click #modalRelationRemove': 'removeClick',
		'change #modalInputRelationType': 'typeChange'
	},

	initialize: function() {
		console.log("RelationEditView.init");
	},

	render: function() {
		console.log("RelationEditView.render " + this.model);

		var el = $('#modalInputRelationTable')
		el.html('');
		this.schema.get('tables').each(function(table) {
			el.append($('<option></option>')
				.attr('value', table.get('name'))
				.text(table.get('name')));
		});
		
		el.val('');
		if (this.model.get('related'))
			el.val(this.model.get('related').get('name'));

		el = $('#modalInputRelationField')
		el.html('');
		this.model.get('table').get('fields').each(function(field) {
			if (field.get('type') == 'Integer' && field.get('name') != 'id') {
				el.append($('<option></option>')
					.attr('value', field.get('name'))
					.text(field.get('name')));
			}
		});

		el.val('');
		if (this.model.get('field'))
			el.val(this.model.get('field').get('name'));

		$('#modalInputRelationType').val(this.model.get('type'));

		$('#modalEditRelation').modal();
		return this;
	},

	updateClick: function() {
		console.log('RelationEditView.updateClick');
		var newTable = $('#modalInputRelationTable').val();	
		var newType = $('#modalInputRelationType').val();
		var newField = $('#modalInputRelationField').val();
		if (newType == 'one-to-one') newField = 'id';
		else if (_.isEmpty(newField)) {
			//create field as <newTable>_id
			newField = newTable + "_id";
			var f = this.model.get('table').get('fields').addNew();
			f.set('name', newField);
			f.set('type', Donkeylift.Field.TYPES.integer);
		}

		newField = this.model.get('table').get('fields').getByName(newField);
		newTable = this.schema.get('tables').getByName(newTable);
		//console.log('new field ' + fields.getByName(newField).get('name'));
		//console.log('new related table ' + tables.getByName(newTable).get('name'));
		
		this.model.set({
			'type': newType,
			'field': newField,
			'related': newTable
		});	
		if ( ! this.table.get('relations').contains(this.model)) {
			this.table.get('relations').add(this.model);
		}
		Donkeylift.app.updateSchema();
	},

	removeClick: function() {	
		console.log("RelationEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
		}
		Donkeylift.app.updateSchema();
	},

	typeChange: function() {
		var el = $('#modalInputRelationField');	
		if ($('#modalInputRelationType').val() == 'one-to-one') {
			el.val('id'); //doesnt work
			el.prop('disabled', true);
		} else {
			el.prop('disabled', false);
		}
	}

});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.RelationView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .edit-relation': 'editRelationClick',
	},

	initialize: function () {
		//console.log("RelationView.init " + this.model.get('table'));
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'change:field', this.setAttributeListeners);
		this.listenTo(this.model, 'change:related', this.setAttributeListeners);
		this.setAttributeListeners();
	},

	setAttributeListeners: function () {
		if (this.model.get('field')) {
			this.listenTo(this.model.get('field'), 'change:name', this.render);
			this.listenTo(this.model.get('related'), 'change:name', this.render);
		}
	},

	template: _.template($('#relation-template').html()),

	render: function() {
		console.log("RelationView.render ");
		var params = this.model.toJSON();
		if (this.model.get('related')) params.related = this.model.get('related').get('name');
		if (this.model.get('field')) params.field = this.model.get('field').get('name');
		this.$el.html(this.template(params));
		return this;
	},

	editRelationClick: function(ev) {				
		var editor = Donkeylift.app.getRelationEditor();
		editor.model = this.model;
		editor.render();
	},


});



/*global Donkeylift, vis, Backbone, $, _ */

Donkeylift.SchemaGraphView = Backbone.View.extend({

	el:  '#content',
	events: {
		'click .join-tree-item': 'evJoinTreeClick'
	},

	initialize: function() {
		console.log("SchemaGraphView.init");
	},

	template: _.template($('#schema-graph-template').html()),
	drop_template: _.template('<li><a href="#" class="join-tree-item">Tree #{{ id }}</a></li>'),

	render: function() {
		console.log("SchemaGraphView.render " + this.model.get("name"));
		this.$el.html(this.template());
		var elTrees = _.map(this.model.get('join_trees'), function(tree, idx) {
			return this.drop_template({id: idx});
		}, this);
		this.$('ul.dropdown-menu').html(elTrees);
		this.renderGraph();
	},

	evJoinTreeClick: function(ev) {
		var idx = $(ev.target).closest('li').index();
		console.log('evJoinTreeClick ' + idx);

		var tree = this.model.get('join_trees')[idx];
		//console.log(tree);
		var edges = [];
		_.each(tree.joins, function(join) {
			var table = this.model.get('tables').getByName(join.v);
			var fks = table.get('fields').filter(function(f) {
				return f.get('fk_table') == join.w;
			});
			_.each(fks, function(fk) {
				edges.push(table.getFieldQN(fk));
			});
		}, this);
		//console.log(edges);

		Donkeylift.app.visNetwork.setSelection(
			{ 
				nodes: tree.tables, 
				edges: edges	
			}, 
			{ highlightEdges: false }
		);

	},

	renderGraph: function() {
		var nodes = this.model.get("tables").map(function(table) {
			return { 
				id: table.get('name'), 
				label: table.get('name')
			};
		}); 
		var edges = _.flatten(this.model.get('tables').map(function(table) {
			return _.map(table.get('referencing'), function(ref) {
				return { 
					from: table.get('name'), 
					to: ref.fk_table,
					id: table.get('name') + '.' + ref.fk,
					title: ref.fk
				};
			});
		})); 
		console.log(edges);
		
	   // provide the data in the vis format
	    var data = {
	        nodes: new vis.DataSet(nodes),
	        edges: new vis.DataSet(edges)
	    };
	    var options = {
	    	nodes: {
	    		shape: 'box'	
				, color: {
					highlight: {
						background: 'orange'
						, border: 'red'
					}
				}
	    	}
	    	, edges : {
	    		font: {
	    			align: 'horizontal'
	    		}
	    		, arrows: 'to'
	    	}
	    	, layout: {
	    		hierarchical: {
	    			enabled: false
	    			, direction: 'UD'
	    		}
	    	}
	    	, physics: {
	    		barnesHut: {
	    			springConstant: 0.03
	    		}
	    	}
	    	, interaction: {
	    		multiselect: true
	    	}
	    };
	
	    // initialize your network!
	    var network = new vis.Network(this.$("#vis-graph").get(0), data, options);		
		Donkeylift.app.visNetwork = network;
		
		return this;
	}

/*

Donkeylift.app.visNetwork.setSelection({ nodes: ['Player', 'Team', 'Position'], edges: ['Player.Team_id', 'Player.PreferredPosition_id'] }, { highlightEdges: false});

*/


});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.SchemaTableView = Backbone.View.extend({

	//el:  '#content',

	events: {
		'click .edit-table': 'evEditTableClick',
		'click #add-field': 'evNewFieldClick',
		'click #add-relation': 'evNewRelationClick',
	},

	initialize: function () {
		//console.log("TableView.init " + this.model.get('name'));
		this.listenTo(this.model, 'change', this.render);
		//this.listenTo(this.model.get('fields'), 'reset', this.setFields);
		this.listenTo(this.model.get('fields'), 'add', this.addField);
		this.listenTo(this.model.get('fields'), 'remove', this.removeField);
		this.listenTo(this.model.get('relations'), 'add', this.addRelation);
		this.listenTo(this.model.get('relations'), 'remove', this.removeRelation);

		this.fieldViews = {};
		this.relationViews = {};
	},

	template: _.template($('#table-template').html()),

	render: function() {
		console.log("TableView.render " + this.model.get("name"));
		this.$el.html(this.template(this.model.attrJSON()));

		this.setFields();
		this.setRelations();

		this.aliasView = new Donkeylift.AliasView({
			el: this.$('#alias'),
			model: this.model,
		});
		this.aliasView.render();

		this.sortableFieldsTable();
		return this;
	},

	sortableFieldsTable: function() {
		$('.sortable-table').sortable({
		  containerSelector: 'table',
		  itemPath: '> tbody',
		  itemSelector: 'tr',
		  placeholder: '<tr class="placeholder"/>',
		  onDrop: function($item, _super, event) {
		  	var fn = $item.find('td:eq(2)').text();
			var field = Donkeylift.app.table.get('fields').getByName(fn);
			var order = 0;
			fn = $item.prev().find('td:eq(2)').text();
			if (fn) {
				var prevField = Donkeylift.app.table.get('fields').getByName(fn);
				order = prevField.getProp('order') + 1;
			}
			field.setProp('order', order);
			Donkeylift.app.table.sanitizeFieldOrdering();
			Donkeylift.app.updateSchema();
		  }
		});
	},

	elFields: function() {
		return this.$('#fields tbody');
	},

	elRelations: function() {
		return this.$('#relations tbody');
	},

	evEditTableClick: function(ev) {				
		var editor = Donkeylift.app.getTableEditor();
		editor.model = this.model;
		editor.render();
	},

	evNewFieldClick: function() {
		console.log('TableView.evNewFieldClick');
		var field = Donkeylift.Field.create();
		var order = this.model.get('fields').filter(function(f) { 
			return f.visible(); 
		}).length + 1;
		field.setProp('order', order);
		var editor = Donkeylift.app.getFieldEditor();
		editor.model = field;
		editor.render();
	},

	removeField: function(field) {
		console.log('SchemaView.removeField ' + field.get('name'));
		this.fieldViews[field.cid].remove();
	},

	addField: function(field) {
		console.log('TableView.addField ' + field.get("name"));
		var view = new Donkeylift.FieldView({model: field});
		this.elFields().append(view.render().el);
		this.fieldViews[field.cid] = view;
	},

	setFields: function() {
		console.log('TableView.setFields ' + this.model.get('name'));
		_.each(this.fieldViews, function(view) {
			view.remove();
		});
		this.elFields().html('');

		_.each(this.model.get('fields').sortByOrder(), this.addField, this);
	},

	evNewRelationClick: function() {
		console.log('TableView.evNewRelationClick');
		var relation = Donkeylift.Relation.create(this.model);
		var editor = Donkeylift.app.getRelationEditor();
		//console.log(relation.attributes);
		editor.model = relation;
		editor.render();
	},

	removeRelation: function(relation) {
		console.log('SchemaView.removeRelation ' + relation.cid);
		this.relationViews[relation.cid].remove();
	},

	addRelation: function(relation) {
		console.log('SchemaView.addRelation ' + relation.cid);
		var view = new Donkeylift.RelationView({model: relation});
		this.elRelations().append(view.render().el);
		this.relationViews[relation.cid] = view;
	},

	setRelations: function() {
		this.elRelations().html('');
		this.model.get('relations').each(this.addRelation, this);
	},

});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.TableEditView = Backbone.View.extend({
	el:  '#modalEditTable',

	events: {
		'click #modalTableUpdate': 'updateClick',
		'click #modalTableRemove': 'removeClick'
	},

	initialize: function() {
		console.log("TableEditView.init");
	},

	render: function() {
		console.log("TableEditView.render");
		$('#modalInputTableName').val(this.model.get('name'));
		$('#modalEditTable').modal();
		return this;
	},

	updateClick: function() {
		var newName = $('#modalInputTableName').val();
		this.model.set('name', newName);
		if ( ! Donkeylift.app.schema.get('tables').contains(this.model)) {
			Donkeylift.app.schema.get('tables').add(this.model);
		}
		var tableExample = $('#modalInputTableByExample').val();
		this.model.addFieldsByExample(tableExample);

		Donkeylift.app.updateSchema();
	},

	removeClick: function() {	
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.unsetTable();
		}
		Donkeylift.app.updateSchema();
	}

});



/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';

	Donkeylift.RouterSchema = Backbone.Router.extend({

        routes: {
			"table/:table": "routeGotoTable",
			"schema/:schema/:table": "routeUrlTableSchema"
        },

		routeUrlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				schema: schemaName
			});
		},

		routeGotoTable: function(tableName) {
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {
				var table = Donkeylift.app.schema.get('tables').getByName(tableName); 
				Donkeylift.app.setTable(table);
			}

			if (options.schema) {
				Donkeylift.app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}


		}

        
	});


})();

/*global Backbone, Donkeylift, $ */

function AppSchema(opts) {
	
	Donkeylift.AppBase.call(this, opts);

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
	this.editorDialogs = {};
}

AppSchema.prototype = Object.create(Donkeylift.AppBase.prototype);
AppSchema.prototype.constructor=AppSchema; 

AppSchema.prototype.createTableView = function(table, params) {
	return new Donkeylift.SchemaTableView({model: table});
}

AppSchema.prototype.createSchema = function(name) {
	return new Donkeylift.Schema({name : name, id : name});
}

AppSchema.prototype.updateSchema = function(cbAfter) {
	var currentTable = Donkeylift.app.table ? Donkeylift.app.table.get('name') : undefined;
	Donkeylift.app.schema.update(function() {
/*
		Donkeylift.app.resetSchema(function() {
			if (currentTable) {
				var table = Donkeylift.app.schema.get('tables').getByName(currentTable);
				Donkeylift.app.setTable(table);
			}
			if (cbAfter) cbAfter();
		});
*/
	});
}

AppSchema.prototype.getEditorModal = function(name) {
	var editor = this.editorDialogs[name];
	if ( ! editor) {
		switch(name) {
			case 'table':
				editor = new Donkeylift.TableEditView();
				break;
			case 'field':
				editor = new Donkeylift.FieldEditView();
				break;
			case 'relation':
				editor = new Donkeylift.RelationEditView();
				break;
			case 'alias':
				editor = new Donkeylift.AliasEditView();
				break;
		}
		this.editorDialogs[name] = editor;
	}
	return editor;
}

AppSchema.prototype.getTableEditor = function() {
	return this.getEditorModal('table');
}

AppSchema.prototype.getFieldEditor = function() {
	return this.getEditorModal('field');
}

AppSchema.prototype.getRelationEditor = function() {
	var editor = this.getEditorModal('relation');
	editor.schema = this.schema;
	editor.table = this.table;
	return editor;
}

AppSchema.prototype.getAliasEditor = function() {
	return this.getEditorModal('alias');
}

Donkeylift.AppSchema = AppSchema;


