
/* Information of known site
 */

            
    var uri = "data/site";
    var arr = uri.split("/");
    arr.pop();
    uri = arr.join("/");	    
    
    $.getJSON(uri + "/site.json",function(data) {
       sites = data;
    });

    module.exports = {
        
      find : function(url) {
          var ret;
          for (var i in sites) {
              var s = sites[i];
              if (url.match(s.pattern)) {
                  ret = s;
                  break;
              }
          }
          return ret;
      }
      
        
    };
    
