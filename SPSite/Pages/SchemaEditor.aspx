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


<script type="text/template" id="alias-field-template">
  <tr>
	<td>
		<button type="button" class="edit-alias btn btn-default">
			<i class="fa fa-pencil"></i>
		</button>
	</td>
	<td>{{ table }}</td>
	<td>{{ field }}</td>
  </tr>
</script>


<script type="text/template" id="field-template">
	<td>
		<button type="button" class="btn-field-edit btn btn-default">
			<i class="fa fa-pencil"></i>
		</button>
	</td>
	<td><i class="fa fa-link {{ pkfk }}" aria-hidden="true"></i></td>
	<td>{{ name }}</td>
	<td>{{ type }}</td>
	<td>{{ disabled }}</td>
</script>


<script type="text/template" id="relation-template">
	<td>
		<button type="button" class="edit-relation btn btn-default">
			<i class="fa fa-pencil"></i>
		</button>
	</td>
	<td>{{ related }}</td>
	<td>{{ type }}</td>
	<td>{{ name }}</td>
</script>


<script type="text/template" id="schema-graph-template">
	<div>
		<div class="panel panel-heading">
			<h3 class="panel-title">
				Diagram
			</h3><br/>
			<div class="btn-group">
				<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Joins<span class="caret"></span>
				</button>
				<ul class="dropdown-menu">
				</ul>
			</div>
		</div>
		<div id="vis-graph"></div>
	</div>
</script>


<script type="text/template" id="schema-menu-template">

	<span class="schema-menu">
		<button id="add-table" type="button" class="btn btn-default navbar-btn">Add Table</button>
		<div class="btn-group">
			<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				View <span class="caret"></span>
			</button>
			<ul class="dropdown-menu">
	    		<li><a id="vis-tablegraph" href="#">Diagram</a></li>		
	    	</ul>
		</div>	    	
	</span>
		
</script>


<script type="text/template" id="table-template">
	<div>
		<div class="panel panel-heading">
			<h3 class="panel-title">
				<span>Table</span> {{ name }} &nbsp;
				<button type="button" class="edit-table btn btn-default">
					<i class="fa fa-pencil"></i>
				</button>
			</h3>
			<br/>
			<ul class="nav nav-tabs">
				<li role="presentation" class="active"><a href="#fields" data-toggle="tab">Fields</a></li>
				<li role="presentation"><a href="#relations" data-toggle="tab">Relations</a></li>
				<li role="presentation"><a href="#alias" data-toggle="tab">Row Alias</a></li>
			</ul>
		</div>
		<div class="tab-content">
			<div role="tabpanel" class="panel tab-pane active" id="fields">
				<table class="table tab-table sortable-table">
					<thead>
					<tr>
						<th></th>
						<th></th>
						<th>Name</th>
						<th>Type</th>
						<th>Disabled</th>
					</tr>
					</thead>
					<tbody></tbody>
				</table>
				<button type="button" id="add-field" class="btn btn-default">Add field</button>
			</div>
			<div role="tabpanel" class="panel tab-pane" id="relations">
				<table class="table tab-table">
					<thead>
					<tr>
						<th></th>
						<th>Referenced Table</th>
						<th>Type</th>
						<th>Foreign Key</th>
					</tr>
					</thead>
					<tbody></tbody>
				</table>
				<button type="button" id="add-relation" class="btn btn-default">Add reference</button>
			</div>

			<div role="tabpanel" class="panel tab-pane" id="alias">
				<table class="table tab-table">
					<thead>
					<tr>
						<th></th>
						<th>Alias Table</th>
						<th>Field</th>
					</tr>
					</thead>
					<tbody></tbody>
				</table>
				<button type="button" id="add-alias" class="btn btn-default">Add field</button>
			</div>

		</div><!-- tabcontent -->

	</div>
</script>


<!-- endinject -->

    <!-- Donkeylift data app -->
    <script type="text/javascript" src="../Scripts/dl_3rdparty.js"></script>
    <script type="text/javascript" src="../Scripts/dl_schema.js"></script>
    <!-- Data365 SharePoint - starts Donkeylift app -->
    <script type="text/javascript" src="../Scripts/d365_schema.js"></script>

</asp:Content>

<%-- The markup in the following Content element will be placed in the TitleArea of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    Schema Editor
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
			<section id="content" class="row"></section>
		</div>		

	</div><!-- main -->

    <!-- end FIXED PAGE ELEMENTS --> 

	    <div id="ajax-progress-spinner">
		    <img src="../Images/progress-spinner.gif" />
	    </div>	

<!-- inject:dialogs:html -->
<div class="modal fade" id="modalEditAlias" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Edit Alias Field</h4>
	  </div>
	  <div class="modal-body">
		<form>
		  <div class="form-group">
			<label for="modalInputAliasField" class="control-label">Alias Field:</label>
			<select class="form-control" id="modalInputAliasField">
			</select>
		  </div>
		</form>
	  </div>
	  <div class="modal-footer">
		<button id="modalAliasRemove" type="button" class="btn btn-danger" data-dismiss="modal">Delete</button>
		<button id="modalAliasUpdate" type="button" data-dismiss="modal" class="btn btn-primary">Update</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalEditField" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
			<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
			<h4 class="modal-title">Edit Field</h4>
	  </div>
	  <div class="modal-body">

		<div id="modalTabDefs">

			<form>
			  <div class="form-group">
				<label for="modalInputFieldName" class="control-label">Name:</label>
				<input type="text" class="form-control" id="modalInputFieldName">
			  </div>
			  <div class="form-group">
				<label for="modalInputFieldType" class="control-label">Type:</label>
				<select class="form-control" id="modalInputFieldType">
					<option value="integer">Integer</option>
					<option value="decimal">Decimal</option>
					<option value="float">Float</option>
					<option value="text">Text</option>
					<option value="date">Date</option>
					<option value="timestamp">Timestamp</option>
				</select>
			  </div>
			  <div class="form-group">
				<label for="modalInputFieldTypeSuffix" class="control-label">Optional Type Modifier (Text length / Decimal precision, scale):</label>
				<input type="text" class="form-control" id="modalInputFieldTypeSuffix">
			  </div>
			</form>

		</div>	

	  </div><!-- modal-body -->
	  <div class="modal-footer">
		<button id="modalFieldRemove" type="button" class="btn btn-danger" data-dismiss="modal">Delete</button>
		<button id="modalFieldUpdate" type="button" data-dismiss="modal" class="btn btn-primary">Update</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalEditRelation" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Edit Relationship</h4>
	  </div>
	  <div class="modal-body">
		<form>
		  <div class="form-group">
			<label for="modalInputRelationTable" class="control-label">Referenced Table:</label>
			<select class="form-control" id="modalInputRelationTable">
				<option value="Date">Date</option>
				<option value="Timestamp">Timestamp</option>
			</select>
		  </div>
		  <div class="form-group">
			<label for="modalInputRelationType" class="control-label">Type:</label>
			<select class="form-control" id="modalInputRelationType">
				<option value="many-to-one">many-to-one</option>
				<!-- <option value="one-to-one">one-to-one</option> -->
			</select>
		  </div>
		  <div class="form-group">
			<label for="modalInputRelationField" class="control-label">Foreign Key:</label>
			<select class="form-control" id="modalInputRelationField">
			</select>
			<span class="help-block">Leave empty for default.</span>
		  </div>
		</form>
	  </div>
	  <div class="modal-footer">
		<button id="modalRelationRemove" type="button" class="btn btn-danger" data-dismiss="modal">Delete</button>
		<button id="modalRelationUpdate" type="button" data-dismiss="modal" class="btn btn-primary">Update</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalEditSchema" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Update Schema on Server</h4>
	  </div>
	  <div class="modal-body">
		<form>
		  <div class="form-group">
			<label for="modalInputSchemaName" class="control-label">Name:</label>
			<input type="text" class="form-control" id="modalInputSchemaName">
		  </div>
		</form>
	  </div>
	  <div id="modalSchemaAction" class="modal-footer">
		<button id="modalSchemaRemove" type="button" class="btn btn-danger">Delete</button>
		<button id="modalSchemaSave" type="button" class="btn btn-success">Save</button>
	  </div>
	  <div id="modalSchemaActionResult" class="modal-footer">
		<span id="modalSchemaResultMessage"></span>
		<button id="modalSchemaResultButton" type="button" data-dismiss="modal" class="btn btn-success">OK</button>
	  </div>
	</div>
  </div>
</div>


<div class="modal fade" id="modalEditTable" tabindex="-1" role="dialog">
  <div class="modal-dialog">
	<div class="modal-content">
	  <div class="modal-header">
		<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
		<h4 class="modal-title">Edit Table</h4>
	  </div>
	  <div class="modal-body">
		<form>
		  <div class="form-group">
			<label for="modalInputTableName" class="control-label">Name:</label>
			<input type="text" class="form-control" id="modalInputTableName">
		  </div>
		  <div class="form-group">
			<label for="modalInputTableByExample" class="control-label">Optional - create fields by example. Paste header and example row here, e.g from Excel:</label>
			<textarea class="form-control" id="modalInputTableByExample"></textarea>
		  </div>
		</form>
	  </div>
	  <div class="modal-footer">
		<button id="modalTableRemove" type="button" class="btn btn-danger" data-dismiss="modal">Delete</button>
		<button id="modalTableUpdate" type="button" data-dismiss="modal" class="btn btn-primary">Update</button>
	  </div>
	</div>
  </div>
</div>


<!-- endinject -->

    <!-- END DONKEYLIFT HTML elements -->

</asp:Content>
