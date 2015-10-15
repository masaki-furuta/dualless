
var splitpanelcontroller = require("controllers/splitpanelcontroller");

	var uri = self.uri;
	var arr = uri.split("/");
	arr.pop();
	uri = arr.join("/");	
	
	function factory(orientation) {
		var def = {
           replace: false,
	       transclude: true,
			templateUrl : uri + "/splitpanel.html",
			controller: splitpanelcontroller(orientation),
			restrict : 'E',
            scope : {
                bookmark : "=ngModel"
            },
		};
		return def;
	}
	
	module.exports = function(orientation) {
        return function() {
            return factory(orientation);
        };
    }; 
