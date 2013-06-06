requirejs.config({
	paths : {
		"dualless" : "."
	}
});

require([ "dualless/views/panel",
          "dualless/directives/bookmarklist",
          "dualless/directives/winbutton",
          "dualless/views/bookmark",
          "dualless/directives/bookmarkeditor",
          "dualless/directives/bookmarkitem",
          "dualless/sys/service"
          ],
          function popup(PanelView,
                            bookmarklist,
                            winbutton,
                            bookmark,
                            bookmarkeditor,
                            bookmarkitem,
                            WindowManagerService
                            ){

/*	
// The main controller for popup
function Controller($scope,$location,$timeout,$rootScope) {
	var bg = chrome.extension.getBackgroundPage();
	var manager = bg.manager();
	
	var win; // The current window
	var tab; // The current tab

	var scr = {};
	$.extend(scr,window.screen); // Make a copy of the screen object
	
	manager.currentWindowTab(function (val1,val2){
		win = val1;
		tab = val2;
	});    

    $rootScope.$watch(function(scope) {
            // Due to CSP problem
            return {
                list : scope.bookmarks.links,
                binding : scope.bookmarks.bindings
            };
        },function() {
        var buttons = {};
        for (var i  in $rootScope.bookmarks.bindings) {
            var binding = $rootScope.bookmarks.bindings[i];
            for (var j in $rootScope.bookmarks.links) {
                var link = $rootScope.bookmarks.links[j];
                if (link.id== binding.id) {
                    var res = {};
                    $.extend(res,binding);
                    $.extend(res,link);
                    if (buttons[binding.key] == undefined) {
                        buttons[binding.key] = [];
                    }
                    buttons[binding.key].push(res);
                    break;
                } 
            }
        }
        $rootScope.bookmarks.buttons = buttons;
    },
    true);   

	//$scope.$on("split",function(event,args) {
		//event.stopPropagation();
		//args.window = win;
		//args.tab = tab;
		
		//// Manager alive in the background page. The screen object is not updated. So it need to pass the screen object from external
        //args.screen = scr;
		
		//manager.split(args,function(windows){
			//win = windows[0]; 
			//// Current window could be changed for some condition
			///* 
			 //* Condition 1. Single Window. 
			 //* The current tab will be moved to a new window. So the current window will be changed , but tab will not 
			 //* be changed.  
			 //* 
			 //*
		//});
	//});
	
	//$scope.$on("merge",function(event) {
		//event.stopPropagation();
		//var args = {};
		//args.window = win;
		//args.tab = tab;
		//args.screen = scr;
		//manager.merge(args);
	//});
	
	$scope.$on("$destroy",function(event) {
		if (localStorage.lastPopupPath === undefined || (
				localStorage.lastPopupPath != $location.path() 
				&& $location.path().indexOf("split") != -1
				)
			)
			localStorage.lastPopupPath = $location.path();
	});
	
    $timeout(function(){
        $(".split-panel-win").each(function() {
            $(this).attr("title","Press middle key may duplicate this page to other window.");
         });  
    });
}

Controller.$inject = ["$scope",
                       "$location",
                       "$timeout",
                       "$rootScope"];
*/

//PopupCtrl = Controller;

	var app = angular.module("popup",[]);
	
	app.config(['$routeProvider', function configRouteProvider($routeProvider) {
        
			$routeProvider.when("/panel/:orientation",PanelView);

/*
			$routeProvider.when("/vsplit",{
				template : "<vsplitpanel ng-model='bookmark'></vsplitpanel>"
				//controller : SplitController
			});
*/
			$routeProvider.when("/bookmark/:orientation/:param1/:param2/:position",bookmark);
			
            /*
			var popupDefaultPath = localStorage.lastPopupPath;
			if (popupDefaultPath == undefined)
				popupDefaultPath = "/split/h";
            */
            // @TODO - Enable to remember the horizontal or vertical mode.
        $routeProvider.otherwise({redirectTo : "/panel/h" });
			
	}]);
	
	//app.directive('hsplitpanel',splitpanel("H"));
	//app.directive('vsplitpanel',splitpanel("V"));
	app.directive('bookmarklist',bookmarklist);
	app.directive('bookmarkeditor',bookmarkeditor);
    app.directive('bookmarkitem',bookmarkitem);
    app.directive('winbutton',winbutton);
	app.directive('onRepeatFinish',function() {
		return {
			restrict: 'A',
			link : function(scope,element,attr) {
				if (scope.$last === true) {
					scope.$evalAsync(attr.onRepeatFinish);
				}
			}
		};
	});
	
    app.factory("WindowManager",WindowManagerService);
    
    app.run(function($rootScope) {
        
        if (localStorage.bookmark === undefined) {
            // Initial data. For testing purpose
            localStorage.bookmark = JSON.stringify({
                // Links for each button
                links : {
                    "H_70_30_1" : [{
                        color : "#f4b400",
                        title : "Google Keep",
                        url : "https://drive.google.com/keep"    
                    }]
                }
            });
        }
        
        $rootScope.bookmark = JSON.parse(localStorage.bookmark);
        
        $rootScope.$watch(function(){ // Save bookmark to localStorage
            return $rootScope.bookmark;   
        } ,function() {
            localStorage.bookmark = JSON.stringify($rootScope.bookmark);
        },true);
    });
	
	$(document).ready(function() {
		angular.bootstrap(document,["popup"]);
	});	
});
          
          
          
