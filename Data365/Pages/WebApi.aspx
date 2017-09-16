
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

  <link rel="icon" type="image/png" href="../Content/api/images/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="../Content/api/images/favicon-16x16.png" sizes="16x16" />

  <link href='../Content/api/css/typography.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='../Content/api/css/reset.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='../Content/api/css/screen.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='../Content/api/css/reset.css' media='print' rel='stylesheet' type='text/css'/>
  <link href='../Content/api/css/print.css' media='print' rel='stylesheet' type='text/css'/>

  <style>

    pre {
    	overflow: auto;
    }
    #login { 
      display: none;
      text-decoration: none;
      font-weight: bold;
      padding: 6px 8px;
      font-size: 0.9em;
      color: white;
      background-color: #7f5400;
      border-radius: 4px;
    }
    #home { 
       display: none; 
      text-decoration: none;
      font-weight: bold;
      padding: 6px 8px;
      font-size: 0.9em;
      color: white;
      background-color: #7f5400;
      border-radius: 4px;
    }
</style>	

  <script src='../Scripts/api/lib/jquery-1.8.0.min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/jquery.slideto.min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/jquery.wiggle.min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/handlebars-2.0.0.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/underscore-min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/backbone-min.js' type='text/javascript'></script>
  <script src='../Scripts/api/swagger-ui.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/highlight.7.3.pack.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/jsoneditor.min.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/marked.js' type='text/javascript'></script>
  <script src='../Scripts/api/lib/swagger-oauth.js' type='text/javascript'></script>

  <script src='../Scripts/api/dl_swagger.js' type='text/javascript'></script>


  <script src='../Scripts/Config.js' type='text/javascript'></script>
  <script src='../Scripts/WebApi.js' type='text/javascript'></script>

  <!-- Some basic translations -->
  <!-- <script src='lang/translator.js' type='text/javascript'></script> -->
  <!-- <script src='lang/ru.js' type='text/javascript'></script> -->
  <!-- <script src='lang/en.js' type='text/javascript'></script> -->

  <script type="text/javascript">

  /*global $, SwaggerUi */

    $(function () {
      var url = window.location.search.match(/url=([^&]+)/);
      if (url && url.length > 1) {
        url = decodeURIComponent(url[1]);
      } else {
          url = "https://azd365testwuas.azurewebsites.net/public/swagger.json";
      }

      // Pre load translate...
      if(window.SwaggerTranslator) {
        window.SwaggerTranslator.translate();
      }
      
      window.swaggerUi = new SwaggerUi({
        url: url,
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function(swaggerApi, swaggerUi){
          if(typeof initOAuth == "function") {
            initOAuth({
              clientId: "your-client-id",
              clientSecret: "your-client-secret-if-required",
              realm: "your-realms",
              appName: "your-app-name", 
              scopeSeparator: ",",
              additionalQueryStringParams: {}
            });
          }

          if(window.SwaggerTranslator) {
            window.SwaggerTranslator.translate();
          }

          $('pre code').each(function(i, e) {
            hljs.highlightBlock(e)
          });

          addApiKeyAuthorization()
          
          //dkottow let us have the last init hook, when everything is loaded
          if (window.doCustomInit) window.doCustomInit();
        },
        onFailure: function(data) {
          log("Unable to Load SwaggerUI");
        },
        docExpansion: "none",
        jsonEditor: false,
        apisSorter: "alpha",
        defaultModelRendering: 'schema',
        showRequestHeaders: false
      });

      function addApiKeyAuthorization(){
        var key = encodeURIComponent($('#input_apiKey')[0].value);
        if(key && key.trim() != "") {
            var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization("Authorization", "Bearer " + key, "header");
            window.swaggerUi.api.clientAuthorizations.add("id_token", apiKeyAuth);
            log("added key " + key);
        }
      }

      $('#input_apiKey').change(addApiKeyAuthorization);

      // if you have an apiKey you would like to pre-populate on the page for demonstration purposes...
      var id_token = sessionStorage.getItem('id_token');
      if (id_token) {
          $('#input_apiKey').val(id_token);
      }

      /*
        var apiKey = "myApiKeyXXXX123456789";
        $('#input_apiKey').val(apiKey);
      */

      window.swaggerUi.load();

      function log() {
        if ('console' in window) {
          console.log.apply(console, arguments);
        }
      }
  });
  </script>

<div class="swagger-section">
    <div id='header'>
      <div class="swagger-ui-wrap">
        <a id="logo" href="http://swagger.io">swagger</a>
        <form id='api_selector'>
          <div class='input'><input placeholder="http://example.com/api" id="input_baseUrl" name="baseUrl" type="text"/></div>
          <div class='input'><input placeholder="api_key" id="input_apiKey" name="apiKey" type="text"/></div>
          <div class='input'><a id="explore" href="#" data-sw-translate>Explore</a></div>
          <div class='input'><a id="login" href="#" data-sw-translate>Login</a></div>
        </form>
      </div>
    </div>

    <div id="message-bar" class="swagger-ui-wrap" data-sw-translate>&nbsp;</div>
    <div style="text-align: right; margin-right: 1em;"><a id="home" href="/" data-sw-translate>DL</a></div>
    <div id="swagger-ui-container" class="swagger-ui-wrap"></div>
</div>

</asp:Content>