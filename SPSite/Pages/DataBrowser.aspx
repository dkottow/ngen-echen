<%-- The following 4 lines are ASP.NET directives needed when using SharePoint components --%>

<%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" MasterPageFile="~masterurl/default.master" Language="C#" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>


<%-- The markup and script in the following Content element will be placed in the <head> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
<!--    <script type="text/javascript" src="../Scripts/jquery-1.9.1.min.js"></script> -->
    <script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.js"></script>
    <meta name="WebPartPageExpansion" content="full" />

    <!-- Add your CSS styles to the following file -->
    <link rel="Stylesheet" type="text/css" href="../Content/css/dl_3rdparty.css" />
    <link rel="Stylesheet" type="text/css" href="../Content/css/dl_common.css" />

<!-- inject:templates:html -->
<script type="text/template" id="downloads-template">
	<div>
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">
				Downloads
			</h3>			
		</div>
		<div class="panel-body">
			<div class="well"><a href="/public/DonkeyExcel.xlsm">Excel spreadsheet</a></div>

			<h4>Database Files</h4>
			<ul id="database-list" class="list-group"></ul>
		</div>
	</div>

<!--
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">
				Database Files
			</h3>
		</div>
		<div class="panel-body">
			<ul id="database-list" class="list-group"></ul>
		</div>
	</div>
-->
	</div>
</script>


<script type="text/template" id="nav-profile-template">
	<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user"></i> {{ account }} <b class="caret"></b></a>
	<ul class="dropdown-menu">
		<li>
			<a id="nav-downloads" href="#"><i class="fa fa-fw fa-cloud-download"></i> Downloads</a>
		</li>
		<li>
			<a id="nav-profile" href="#"><i class="fa fa-fw fa-user"></i> Profile</a>
		</li>
		<li class="divider"></li>
		<li>
			<a id="nav-logout" href="#"><i class="fa fa-fw fa-power-off"></i> Log Out</a>
		</li>
	</ul>
</script>


<script type="text/template" id="nav-schema-template">
	<li>
		<a data-target="{{ name }}" class="schema-option" href="#">
			{{ name }} 
		</a>
	</li>
</script>


<script type="text/template" id="nav-user-info-template">
    <i class="fa fa-user">&nbsp;</i>{{ user }}
</script>


<script type="text/template" id="profile-template">
<div>
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">
				Profile
			</h3>			
		</div>
		<div class="panel-body">
			<dl class="dl-horizontal">
				<dt>Username</dt><dd>{{ user }}</dd>
			</dl>
			<dl class="dl-horizontal">
				<dt>Account</dt><dd>{{ account }}</dd>
			</dl>
		</div>
	</div>
</div>
</script>


<script type="text/template" id="schema-list-template">
    
<div class="row database-select">
    <select id="selectDatabase" title="Databases" class="form-control show-menu-arrow selectpicker" data-width="fit" data-selected-text-format="static" >
    </select>
</div>

</script>
<script type="text/template" id="table-item-template">
	<a data-target="{{ name }}" class="list-group-item table-item" href="{{ href }}"> 
		{{ name }} 
	</a>
</script>


<script type="text/template" id="table-list-template">
	<div class="row database-info"><i class="fa fa-database">&nbsp;</i><span>{{ database }}</span></div>
	<div id="table-list" class="list-group">	  
		<div>
			<select id="selectShowTables" title="Tables" data-header="Check to show" multiple class="form-control show-tick show-menu-arrow selectpicker" data-width="100%" data-selected-text-format="static" >
			</select>
		</div>
		<div id="table-list-items">	  
		</div>	
	</div>	
</script>


<script type="text/template" id="data-menu-template">
	<div class="btn-group" role="group">
		<button id="filter-dropdown" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
			Filters <span class="caret"></span>
		</button>
		<ul class="dropdown-menu" role="menu">
			<li><a id="filter-show" href="#">Show</a></li>
			<li><a href="#reset-filter">Clear</a></li>
		</ul>
	</div>
	<div class="btn-group" role="group">
		<button id="selection-dropdown" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
			<span>Selection</span> <span class="caret"></span>
		</button>
		<ul class="dropdown-menu" role="menu">
			<li><a id="selection-add" href="#">Add</a></li>
			<li role="separator" class="divider"></li>
			<li><a id="selection-filter" href="#">Filter</a></li>
			<li><a id="selection-chown" href="#">Change Owner</a></li>
		</ul>
	</div>
	<div class="btn-group" role="group">
		<button id="csv-dropdown" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
			<span>CSV</span> <span class="caret"></span>
		</button>
		<ul class="dropdown-menu" role="menu">
			<li><a id="csv-copy" href="#">Copy</a></li>
			<li><a id="csv-download" href="#">Download</a></li>
		</ul>
	</div>
	<div class="btn-group" role="group">
		<button id="edit-prefs" type="button" class="btn btn-default">
			Preferences
		</button>
	</div>
</script>


<script type="text/template" id="filter-option-template">
	<button type="button" data-target="{{ value }}" class="{{ name }} list-group-item input-sm">{{ value }}</button>
</script>

<script type="text/template" id="filter-template">
	<div class="filter-column">

	  <!-- Nav tabs -->
	  <ul class="nav nav-tabs">
		<li class="active">
			<a href="#filterRange" data-toggle="tab">Range</a>
		</li>
		<li>
			<a href="#filterSelect" data-toggle="tab">Select</a>
		</li>
	  </ul>

	  <!-- Tab panes -->
	  <div class="tab-content">
		<div class="tab-pane active" id="filterRange">
			<div class="form-inline filter-form">				
				<div class="form-group">
					<label for="inputFilterMin" class="control-label">From</label>
					<input type="text" class="form-control input-sm" id="inputFilterMin">
				</div>
				<div class="form-group">
					<label for="inputFilterMax" class="control-label">To</label>
					<input type="text" class="form-control input-sm" id="inputFilterMax">
				</div>
				<div id="sliderRange">
					<input id="inputSliderRange" type="text" class="span2" value="" data-slider-min="" data-slider-max="" data-slider-step="" data-slider-value=""/>				
				</div>
				<div class="filter-reset">
					<button id="rangeReset" type="button" class="btn btn-primary">Reset</button>
				</div>
			</div>
		</div>
		<div class="tab-pane" id="filterSelect">
			<div class="form-inline filter-form">				
				<div class="pull-left" style="width: 45%">
					<div class="form-group">
						<label for="inputFilterItemsSearch" class="control-label">Search </label>						
						<input type="text" class="form-control input-sm" id="inputFilterItemsSearch">
					</div>
					<div id="filterOptions" class="list-group scrollable-menu">
					</div>						
				</div>
				<div class="pull-right" style="width: 45%">
					<div class="form-group">
						<label class="control-label">Selected </label>
						<input style="visibility: hidden;"><!-- force equal heights -->
					</div>
					<div id="filterSelection" class="list-group scrollable-menu">
					</div>
				</div>
				<div style="clear: both" class="filter-reset">
					<button id="select{{ specialAction }}" type="button" class="btn btn-default">Show {{ specialAction }}</button>
					<button id="selectReset" type="button" class="btn btn-primary">Reset</button>
				</div>
			</div>
		</div>
	  </div>
	</div>
</script>		


<script type="text/template" id="grid-button-wrap-text-template">
	<button type="button" id="grid_wrap_text" class="btn btn-default btn-xs" data-toggle="button" aria-pressed="false" autocomplete="off">
		<span class="glyphicon glyphicon-text-height" aria-hidden="true">
		</span>
	</button>
</script>


<script type="text/template" id="grid-column-template">
	<th id="col-{{ name }}">
		<div class="dropdown">
			{{ name }}
			<button type="button" data-toggle="dropdown" data-column="{{ name }}" class="field-filter btn btn-default btn-xs">
				<i class="fa fa-filter fa-lg"></i>
			</button>
			<div class="dropdown-menu {{ dropalign }}">
			</div>
		</div>
	</th>
</script>


<script type="text/template" id="grid-table-template">
	<table id="grid" class="display table-striped" width="100%" cellspacing="0">
		<thead>
			<tr>
			</tr>
		</thead>
		<tfoot>
		</tfoot>
	</table>
</script>


<script type="text/template" id="show-filter-item-template">
	<tr><td>{{ table }}</td><td>{{ field }}</td><td>{{ op }}</td><td>{{ value }}</td></tr>
</script>


<!-- endinject -->

    <!-- Donkeylift scripts -->
    <script type="text/javascript" src="../Scripts/dl_3rdparty.js"></script>
    <script type="text/javascript" src="../Scripts/dl_data.js"></script>
    <!-- Data365 SharePoint - starts Donkeylift app -->
    <script type="text/javascript" src="../Scripts/d365_data.js"></script>
    
</asp:Content>

<%-- The markup in the following Content element will be placed in the TitleArea of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    Data Browser
</asp:Content>

<%-- The markup and script in the following Content element will be placed in the <body> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">


    <!-- DONKEYLIFT HTML elements -->

	    <div id="main" class="row">

    <!-- Sidebar -->
		    <div id="sidebar" class="col-sm-3 sidebar">
		    </div>        

     <!-- Dynamic Content -->
		    <div id="module" class="col-sm-13">
    			<div id="user-info" class="row user-info"></div>
			    <div id="menu" class="row"></div>
			    <section id="content" class="row">
			    </section>
		    </div>		

	    </div><!-- main -->


    <!-- end FIXED PAGE ELEMENTS --> 

	    <div id="ajax-progress-spinner">
		    <img src="../Images/progress-spinner.gif" />
	    </div>	

<!-- inject:dialogs:html -->
<div class="modal fade" id="modalChangeOwner" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Change Owner</h4>
	  </div>
	  <div class="modal-body">
	    <div class="form-group">
			<label for="modalInputOwner" class="control-label">Owner:</label>
			<input type="text" class="form-control" id="modalInputOwner">
		</div>
	  </div>
	  <div class="modal-footer">
		<button id="modalOwnerUpdate" type="button" data-dismiss="modal" class="btn btn-primary">Update</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalCSVDownload" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Download CSV</h4>
	  </div>
	  <div class="modal-body">
		<form>
		  <div class="form-group">
			<label for="modalCSVSelectFields" class="control-label">Select Fields:</label>
			<select id="modalCSVSelectFields" multiple class="form-control selectpicker" data-actions-box="true">
			</select>
		  </div>
		</form>
	  </div>
	  <div class="modal-footer">
  		<button id="modalCSVGenerate" type="button" class="btn btn-primary">Generate</button>
	  	<a id="modalCSVDownloadLink" href="#" class="btn">Download</a>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalCSVShow" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">CSV Data Table</h4>
	  </div>
	  <div class="modal-body">
		<textarea id="csv-textarea"></textarea>
	  </div>
	  <div class="modal-footer">
		<button id="modalFieldClose" type="button" data-clipboard-target="#csv-textarea" data-dismiss="modal" class="btn btn-primary">Copy</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalEditPrefs" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">User Preferences</h4>
	  </div>
	  <div class="modal-body">
        <div class="checkbox">
					<label><input type="checkbox" id="modalInputShowRowAlias" value=""> Show row alias instead of foreign key
					</label>	
				</div>
        <div class="checkbox">
          <label><input type="checkbox" id="modalInputSkipRowCounts" value =""> Skip pagination count queries
					</label>
        </div>
	  </div>
	  <div class="modal-footer">
			<button id="modalEditPrefsSave" type="button" class="btn btn-default" data-dismiss="modal">Save</button>
			<button id="modalEditPrefsApply" type="button" data-dismiss="modal" class="btn btn-primary">Use</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalShowFilters" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Active Filters</h4>
	  </div>
	  <div class="modal-body">
		<table class="table" id="modalTableFilters">
			<thead><tr>
				<th>Table</th>
				<th>Field</th>
				<th>Action</th>
				<th>Value</th>
			</tr></thead>
			<tbody></tbody>
		</table>
	    <div class="form-group">
			<label for="modalInputDataUrl" class="control-label">Data URL:</label>
			<input type="text" class="form-control" id="modalInputDataUrl">
		</div>
	  </div>
	  <div class="modal-footer">
		<button id="modalFieldClose" type="button" data-dismiss="modal" class="btn btn-primary">Close</button>
	  </div>
	</div>
  </div>
</div>


<!-- endinject -->
    

</asp:Content>
