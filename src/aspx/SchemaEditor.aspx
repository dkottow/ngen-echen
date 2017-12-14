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
    <link rel="Stylesheet" type="text/css" href="$DATA365_SITEASSETS_DIR/Content/css/dl_3rdparty.css" />
    <link rel="Stylesheet" type="text/css" href="$DATA365_SITEASSETS_DIR/Content/css/dl_common.css" />

<!-- inject:templates:html -->
<!-- endinject -->

    <!-- Donkeylift data app -->
    <script type="text/javascript" src="$DATA365_SITEASSETS_DIR/Scripts/dl_3rdparty.js"></script>
    <script type="text/javascript" src="$DATA365_SITEASSETS_DIR/Scripts/dl_schema.js"></script>
    <!-- Data365 SharePoint - starts Donkeylift app -->
    <script type="text/javascript" src="$DATA365_SITEASSETS_DIR/Scripts/d365_schema.js"></script>

</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderSiteName" runat="server">
    <a class="d365-anchor" href="DataBrowser.aspx">Data Browser</a>
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
		    <img src="$DATA365_SITEASSETS_DIR/Images/progress-spinner.gif" />
	    </div>	

<!-- inject:dialogs:html -->
<!-- endinject -->

    <!-- END DONKEYLIFT HTML elements -->

</asp:Content>
