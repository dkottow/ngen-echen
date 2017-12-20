window.onload = function() {
    
    login({
        tenant: Data365.config.azureTenant,
        clientId: Data365.config.aadApplicationId        

    }, function(err, auth, token) {
        if (err) {
            alert(err);
        } else {

            console.log('login ok...');  
            console.log(JSON.stringify(auth));
    
            const ui = SwaggerUIBundle({
                url: "$DATA365_SERVER/public/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            })

            ui.authActions.authorize({
                api_key: {
                    name: "api_key", 
                    schema: {
                        type: "apiKey", 
                        in: "header", 
                        name: "Authorization", 
                        description: ""
                    }, 
                    value: "Bearer " + token
                }
            });           

            window.ui = ui
        }
    });
}
