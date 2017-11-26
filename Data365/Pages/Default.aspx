<%-- The following 4 lines are ASP.NET directives needed when using SharePoint components --%>

<%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" MasterPageFile="~masterurl/default.master" Language="C#" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%-- The markup and script in the following Content element will be placed in the <head> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.js"></script>

    <script src="https://secure.aadcdn.microsoftonline-p.com/lib/1.0.15/js/adal.min.js"></script>

    <script type="text/javascript" src="../Scripts/jquery-1.9.1.min.js"></script>

    <!-- Actual SP App starts inside here -->
    <script type="text/javascript" src="../Scripts/Config.js"></script>
    <script type="text/javascript" src="../Scripts/Settings.js"></script>

</asp:Content>

<%-- The markup in the following Content element will be placed in the TitleArea of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">

</asp:Content>

<%-- The markup and script in the following Content element will be placed in the <body> of the page --%>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">

    <style>
        label {
            display: inline-block;
            width: 5em;
        }
        h3 {
            margin-bottom: 0.8em;
        }
    </style>


<!--    <button type="button" id="SignIn" onclick="signIn()">Sign In</button> -->
    <h3 id="WelcomeMessage"></h3>

    <h3>Database Connection</h3>

    <div>
        <label for="dl_server">API Server</label>
        <input disabled="disabled" type="text" size="25" name="dl_server" value="https://azd365devwuas.azurewebsites.net" />

        <label for="dl_account">Account</label>
        <input disabled="disabled" type="text" name="dl_account" value="test" />
    </div>

    <div>
        <label for="dl_database">Database</label>
        <select name="dl_database">
            <!-- available databases -->
        </select>
    </div>
    
     <ul>
        <li><asp:LinkButton ID="LinkButton1" runat="server" PostBackUrl="DataBrowser.aspx">Data Browser</asp:LinkButton></li>
        <li><asp:LinkButton ID="LinkButton3" runat="server" PostBackUrl="SchemaEditor.aspx">Schema Editor</asp:LinkButton></li>
        <li><asp:LinkButton ID="LinkButton4" runat="server" PostBackUrl="WebApi.aspx">Web API</asp:LinkButton></li>
    </ul>

</asp:Content>
