/* WindowManager 
 * 
 * It is the core of Dualless that manages the split , merge , pairing and all windows related
 * operations. 
 * 
 * */

define(["dualless/sys/viewport"], 
		function sys(Viewport) {

	WindowManager = function() {
		// Detect the current OS
		var os = "unknown";

		if (navigator.appVersion.indexOf("Win")!=-1) os="Windows";
		if (navigator.appVersion.indexOf("Mac")!=-1) os="MacOS";
		if (navigator.appVersion.indexOf("X11")!=-1) os="Unix";
		if (navigator.appVersion.indexOf("Linux")!=-1) os="Linux";

		this._os = os;
		this._viewport = new Viewport({os: os});
		this._windows = []; // Managed windows
		
		var manager = this;
		
		chrome.windows.onRemoved.addListener(function ( winId){
			for (var i = 0 ; i < manager._windows.length;i++) {
				if (manager._windows[i].id  == winId) {
					manager._windows.splice(i,1);
					break;
				}
			}
		});
		
	};
	
	/** Return the detected os
	 * 
	 * @returns {String}
	 */
	
	WindowManager.prototype.os = function() {
		return this._os;
	};
	
	WindowManager.prototype.viewport = function(){
		return this._viewport;
	};
	
	/** Check is a window maximized.
	 * @param win The window returned by chrome.windows.get()
	 * @returns
	 */
	WindowManager.prototype.isMaximized= function(win) {
		var res;
		
		if (win.state != undefined) { // Working method for new version of Chrome
			return win.state == "maximized";
		}

	    // Old version of Chrome do not provide any method to check window status.
		
		if (this._os == "Windows") {
			// Dirty hack for windows
			res = (win.left == -8 && win.top == -8 && win.width == window.screen.availWidth + 16);
		} else if (this._os == "MacOS") {
			res = false; // MacOS do not have the concept of maximize.
		} else {
			// It do not works for Unity
			res = (win.left == 0 && win.width == window.screen.availWidth);
		}
	    return res;
	};
	
	/** Get current window information
	 * 
	 * @param callback The callback parameter should specify a function that looks like this: (function callback(winidw) )
	 */
	
	WindowManager.prototype.currentWindow = function(callback) {

		chrome.windows.getCurrent({populate: true}, function(win){
			callback(win);
		});
	};
	
	/** Get the current window and tab
	 * 
	 * @param callback
	 */
	
	WindowManager.prototype.currentWindowTab = function(callback) {
	    chrome.tabs.getSelected(null,function(tab) {
	        chrome.windows.get(tab.windowId,{populate : true},function(win) {
	        	callback(win,tab);
	         });
	    });
	};
	
	/** Get managed windows list
	 * 
	 * @returns Array of managed windows 
	 */
	
	WindowManager.prototype.windows = function() {
		return this._windows;
	};
	
	/** Return true if the input window is managed by the Window Manager  
	 * 
	 * @param win Either the ID or a Chrome Window object.
	 */
	
	WindowManager.prototype.isManaged = function(win) {
		var id;
		if (typeof win == "number") {
			id = win;
		} else {
			id = win.id;
		}
		
		var res = false;
		$(this._windows).each(function(idx,w) {
			if (w.id == id) {
				res = true;
			}
		});
		return res;
	};
	
	/** Update the managed windows information. May purge record out if the windows is already destroyed.
	 * 
	 * @param options Options for update behaviour
	 * 
	 * options.window - If it is set , it will be always in the beginning of the return window list
	 * 
	 * @param callback It will be called when the operation is completed.
	 */	
	
	WindowManager.prototype.updateWindows = function(options,callback) {
		var manager = this;
		
		var setting = {
			// TRUE if the no. of managed window is not full. It find add another windows randomly
			autoMatching : false,
			// TRUE if the current windows list should be sorted(The focus window in the beginning)
			sort : false
		};
		
		$.extend(setting,options);
		options = setting;
		
		chrome.windows.getAll({populate : true},function(windows) {
			var list = [];
			$(windows).each(function(idx,w){
				if (manager.isManaged(w)){
					list.push(w);
				}
			});
			manager._windows = list;
			
			if (options.window != undefined) {
				var win = options.window;
				if (manager.isManaged(options.window.id)) {
					for (var i = 0 ; i < manager._windows.length;i++) {
						if (manager._windows[i].id == options.window.id) {
							win = manager._windows[i]; // Updated with tabs information
							manager._windows.splice(i,1);
							break;
						}
					}
				}
				manager._windows.unshift(win);
				while (manager._windows.length > 2)
					manager._windows.pop();
			}

			// Find another windows
			if (options.autoMatching
				&& manager._windows.length <2) {
				$(windows).each(function(idx,w) {
					if (!manager.isManaged(w)) {
						manager._windows.push(w);
					}
					if (manager._windows.length >=2)
						return false;
				});
			}
			
			if (setting.sort) {
				if (manager._windows.length >= 2 
					&& manager._windows[1].focused) {
					var tmp = manager._windows[0]; 
					manager._windows[0] = manager._windows[1];
					manager._windows[1] = tmp;
				}
			}
			
			if (callback!=undefined)
				callback(manager._windows);
		});
	};

	/** Reset the WindowManager to initialize state
	 * 
	 */
	
	WindowManager.prototype.reset = function() {
		this._windows = [];
		this._viewport.reset();
	};
		
	/** Split windows
	 * @params options Options for split
	 * 
	 * The basic parameter could be found in trySplit
	 * 
	 * Extra parameter:
	 *   options.window - The current window
	 * 
	 */
	
	WindowManager.prototype.split = function(options,callback) {
		var manager = this;
		this.updateWindows({autoMatching: true,
							  window : options.window},
							  function(list) {
			if (list.length == 1) {
				manager._createAndMove(options,callback);
			} else {
				manager._viewport.layout(options, list, function() {
					if (callback)
						callback(manager._windows);
				});
			}
		});
	};

	/** Create a new window and move the current tab to the new window is needed.
	 * 
	 * @param rects
	 */
	
	WindowManager.prototype._createAndMove = function(options,callback) {
//		console.log("WindowManager._createAndMove",this._windows);
		var manager = this;
		
		function bridge(){
			if (callback!=undefined)
				callback(manager._windows);
		}
		
		function layout() {
//			console.log("WindowManager._createAndMove.layout",manager._windows);
    		if (manager._os == "Linux") {
    			// Extra delay for Linux. Otherwise , the newly created window size may not be correct.
    			setTimeout(function() {
    				manager._viewport.layout(options, manager._windows,bridge);	        				
    			},100);
    		} else {
    			manager._viewport.layout(options, manager._windows,bridge);
    		}
		}
		
		function create(win,tab) {
//			console.log("WindowManager._createAndMove.create",win.tabs);
			if (win.tabs.length == 1) {
				createData = {};
				if (options.duplicate) {
					createData.url = options.tab.url;
					delete options.duplicate;
				}
				
				chrome.windows.create(createData,function(newWin) {
	            	manager._windows = [win,newWin];
	            	layout();
	            });
				
			} else {
				var createData = {};
				createData["tabId"] = tab.id;
	            chrome.windows.create(createData,function(newWin) {
	        		manager._windows = [newWin,win];
	        		layout();
	            });
			
			}
		};
		
		if (options.window != undefined && options.tab != undefined) {
			create(options.window , options.tab);
		} else {
			manager.currentWindowTab(create);			
		}
		
	};

	/** Merge all managed windows into current window.
	 * 
	 * @param current The current window.
	 */
	
	WindowManager.prototype.merge = function(options) {
		var manager = this;
		manager.updateWindows({window:options.window , 
								  autoMatching: true}, 
								  function (windows) {
			manager._viewport.merge({ windows: windows , tab : options.tab});
		});
	};
	
	return WindowManager;
});