Application.startup_log("Starting app-bootstrap.js", true);

var app = ExtendedApplication("1.0", true);
app.showStackTraceOnLogs = false;
app.shouldUseOriginStartPage = true;

function log(msg, onDebugOnly, level) {

    var showStackTraceOnLogs = app.showStackTraceOnLogs;
    var params = undefined;

    if (typeof (msg) === "object") {
        params = msg;
        msg = params.msg;
        onDebugOnly = params.onDebugOnly;
        level = params.level;

        if (params.showStackTraceOnLogs !== undefined) {
            showStackTraceOnLogs = params.showStackTraceOnLogs;
        }
    }

    msg = (onDebugOnly ? "[Debug Info] " : "") + msg;
    var clientType = "[Debug Interview Client] ";
    msg = clientType + msg;

    if (window.console) {
        if (msg) {
            if (showStackTraceOnLogs) {
                var err = new Error();
                if (!err.stack) {
                    err.stack = "Stack trace is not available on this web browser.";
                }

                window.console.log(msg + "\r\nStack Strace:" + err.stack.replace("Error", ""));
            }
            else {
                window.console.log(msg);
            }
        }
    }
}


app.log = (function () {
    return function (msg, onDebugOnly) {
        log(msg, onDebugOnly);
    };
})();

app.error = (function () {
    return function (msg, onDebugOnly) {
        log(msg, onDebugOnly, "error");
    };
})();

app.commitLogin = function (loginData, success, faild) {
    var userName = loginData.userName;
    var password = loginData.password;
    var rememberMe = loginData.rememberMe;
    success();
};

app.commitLogout = function (success, faild) {
    success();
};

app.commitRetriveCurrentLogedInUser = function (success, faild) {
   app.log("We need to retrive user.")
   success({UserName:"Interviewer"});
};

app.onUserIsSet = function (oldUser, newUser) {
    var userInfo = newUser;
    app.log("We got a new logged in user.");
};

app.onAthunticationExpires = function (error) {
   var shouldRebot = true;
    return shouldRebot;
};

app.onApplicationStarting = function(){
    app.log("onApplicationStarting was called.");
}

app.extendRoutes({
    routes: {
        "(/)": "main",
        "examples": "examples",
        "document/new":"newDocument",
        "document/edit/:id":"editDocument",
        "documents":"documents",
        "*url":"pageNotFound"
    },

    main:function(){
        app.moveToPage("main");
    },
    examples:function(){
        app.moveToPage("examples", {
            message:"Hello World"
        });
    },
    editDocument:function(id){
        app.moveToPage("document", {
            actionType: "Edit",
            Id: id,
        });
    },
    newDocument:function(){
        app.moveToPage("document", {
            actionType: "New",
        });
    },
    documents:function(){
        app.moveToPage("documents", {
            
        });

    },    
    pageNotFound:function(url){
        app.error("Page not found for url '" + url + "'");
    }
});

// !! 
app.documentAPI = 'https://5fe443a48bf8af001766edf0.mockapi.io/api';

Application.startup_log("app-bootstrap.js has finished loading.", true);