/// <reference path="../libs/lodash.js" />
Application.startup_log("Service-Helper.js: Starting to load.", true);

var _oldCatchFunc = Promise.prototype.catch;
Promise.prototype.catch = function (funcToCatch) {
    _oldCatchFunc.call(this, function (err) {

        if (err && err.errIdentifier === "SBPromiseReject") {
            return funcToCatch.apply(this, err.errorArgs);
        }
        else {
            return funcToCatch(err);
        }
    });
    return this;
};

Promise.prototype.error = Promise.prototype.catch;

function Url(url, pars) {
    var isStart = true;

    if (url.indexOf('?') > -1) {
        isStart = false;
    }
    var resArr = [url];
    for (var i in pars) {
        if (isStart) {
            resArr.push('?');
            isStart = false;
        }
        else {
            resArr.push('&');
        }

        resArr.push(i);
        resArr.push('=');
        resArr.push(pars[i]);
    }
    var res = resArr.join('');

    return res;
}

ServiceHelper = (function () {
    var res = ServiceHelperTemplate();
    return res;
})();


function ServiceHelperTemplate() {
   
    var serverUrl = "/api";
   
    function setServerUrl(url) {
        serverUrl = url;
    }

    function setClientSupportedApiVersion(apiVersion) {
        clientApiVersion = apiVersion;
    }

    var helper = {
        setServerUrl: setServerUrl,
        convertToServerPath: function (url) {
            return serverUrl + url;
        },
        onAthunticationExpires: function () {
            // This function needs to be overrided.
            return false;
        },
        onUnSupportedApiVersion: undefined,
        onServerUnavailable: function () {
            // This function needs to be overrided.
            return false;
        },
        newPromise: newPromise,
        onSecurityError: function (error) { },
        get: get,
        post: post,
        put: put,
        deletehttp: deletehttp,
        getPromise: getPromise,
        postPromise: postPromise,
        putPromise: putPromise,
        deletePromise: deletePromise
    };

    function errorWrapper(errorCallback) {

        return function (e) {

            app.error("request error: " + (e ? JSON.stringify(e) : "empty exception"), true);

            var isAutonticationError = false;
            var wasHandeled = false;

            switch (e.status) {
                case 401:
                    {
                        isAutonticationError = false;
                        if (app.onUnauthorized) {
                            wasHandeled = app.onUnauthorized(e);
                        }
                        else {
                            app.log("ServiceHelper.js: No app.onUnauthorized method found. Continue execution to fail the callback.", true);
                        }
                        break;
                    }
                case 403:
                    {
                        isAutonticationError = true;
                        wasHandeled = helper.onAthunticationExpires(e);
                        break;
                    }
                case 405:
                    {
                        var errorType;
                        if (e.responseText !== undefined) {
                            var serializedError = JSON.parse(e.responseText);
                            errorType = parseInt(serializedError['errorType']);
                        }
                        if (errorType != null && errorType === ValidationErrorType.DifferentClientVersion) {
                            // This means there were validation error in the service API.
                            var msg = e.statusText || "";
                            app.log("request returned 405: API version is different than the server. statusText: " + msg, true);

                            if (helper.onUnSupportedApiVersion) {
                                helper.onUnSupportedApiVersion(e);
                                wasHandeled = true;
                                return;
                            }
                        }
                        break;
                    }
                case 503:
                    {
                        if (e.statusText && e.statusText.toLowerCase() === "service unavailable") {
                            isAutonticationError = false;
                            wasHandeled = helper.onServerUnavailable(e);
                        }
                        break;
                    }
            }

            var error = undefined;
            var emptyError = {
                errorCode: 0,
                errorMessage: e.responseText,
                values: {},
                parameters: {}
            };

            error = emptyError;

            if (e.responseText !== undefined) {
                try {

                    var serializedError = JSON.parse(e.responseText);
                    error = _.extend(emptyError, serializedError);
                }
                catch (jsonParseException) { }
            }

            error.generateError = function (parametersPrifix, titleMessage, headerPrefix, messagePrifix, formatMessage) {
                var str = this.errorMessage;

                formatMessage = formatMessage || function (msg, lineNumber, totalLines) {
                    if (lineNumber < totalLines - 1) {
                        msg = msg + "<br/>";
                    }

                    return msg;
                };

                if (str === undefined) {
                    str = "";
                }
                else {
                    if (headerPrefix) {
                        str = localize(headerPrefix + ":" + str);
                    }
                    else {
                        str = localize(str);
                    }
                }

                if (titleMessage) {
                    str = titleMessage + "<br/>" + str;
                }

                if (str.length > 0) {
                    str += "<br/>";
                }

                // In case the parameters is null.
                if (this.parameters) {

                    var lineNumber = 0;
                    var totalLineNumber = Object.keys(this.parameters).length;

                    for (var i in this.parameters) {
                        var txt = this.parameters[i];

                        var parameterName = i;
                        var line = "";

                        if (parameterName[0] >= 'A' && parameterName[0] <= 'Z') {
                            parameterName = parameterName[0].toLowerCase() + parameterName.substring(1);
                        }

                        if (parametersPrifix) {
                            parameterName = localize(parametersPrifix + ":" + parameterName);
                        }
                        else {
                            parameterName = localize(parameterName);
                        }

                        if (parameterName) {
                            line += parameterName + " : ";
                        }

                        if (messagePrifix) {
                            line += localize(messagePrifix + ":" + txt);
                        }
                        else {
                            line += localize(txt);
                        }

                        str += formatMessage(line, lineNumber, totalLineNumber);
                        lineNumber++;
                    }
                }

                str = str.format(this.values);
                return str;
            };

            errorCallback(e, {
                isAutonticationError: isAutonticationError,
                isPageNotFoundError: e.status === 404,
                isServerError: e.status === 500,
                isServerUnavailabe: e.status === 503,
                isUnAuthorized: e.status === 401,
                IsApiValidationError: e.status === 409,
                error: error,
                isHandled: wasHandeled
            });
        };
    }

    /// This creates a new Promise object.
    /// The parameter resolveValue is only for Intelisene hints.
    function newPromise(resolveIntelisensHint) {
        var wrappedPromiseResolve;
        var wrappedPromiseReject;
        var returnPromise = new Promise(function (resolve, reject) {
            wrappedPromiseResolve = resolve;
            wrappedPromiseReject = reject;
        });
        returnPromise.resolve = function () {
            return wrappedPromiseResolve.apply(returnPromise, arguments);
        };
        returnPromise.reject = function () {
            return wrappedPromiseReject.call(returnPromise,
                {
                    errIdentifier: "SBPromiseReject",
                    errorArgs: arguments
                });
        };

        return returnPromise;
    }

    // waits for all promises to end before running the resolve.
    // This will fail when it reaches the MaxTimeToWait
    newPromise.waitAll = function (promisesByKey, maxTimeToWait) {
        var p = newPromise();
        var resDic = {};
        var finishedCount = 0;

        _.forEach(promisesByKey, function (promise, id) {
            var createCallback = function (key, promisObj, status) {
                return function (res) {
                    resDic[key] = {
                        status: status,
                        result: res,
                        promise: promisObj
                    };

                    finishedCount++;
                    if (finishedCount >= _.size(promisesByKey)) {
                        p.resolve(resDic);
                    }
                }
            };

            promise.then(createCallback(id, promise, "success"));
            promise.error(createCallback(id, promise, "error"));
        });

        if (maxTimeToWait !== undefined && maxTimeToWait > 0) {
            setTimeout(function () {
                p.reject(resDic);
            }, maxTimeToWait);
        }

        return p;
    }
    newPromise.waitAny = function (args, maxTimeToWait) {
        var p = newPromise();
        var finishedCount = 0;

        for (var i = 0; i < promises.length; i++) {
            var createCallback = function (key, promisObj, status) {
                return function (res) {
                    finishedCount++;
                    if (finishedCount === 1) {
                        p.resolve(res);
                    }
                }
            };

            promises[i].then(createCallback(i, promises[i], "success"));
            promises[i].error(createCallback(i, promises[i], "error"));
        }

        if (maxTimeToWait !== undefined && maxTimeToWait > 0) {
            setTimeout(function () {
                p.reject();
            }, maxTimeToWait);
        }

        return p;
    };
   
    function get(url, isHttpsOrOptions, success, error) {

        var isHttps = true;
        var dataType = "json";

        // Fixing the problems with get and browser cach.
        if (url.indexOf("?") > -1) {
            //url += "&cachFix=" + Date.now();
        }
        else {
            //url += "?cachFix=" + Date.now();
        }

        if (_.isBoolean(isHttpsOrOptions)) {
            isHttps = isHttpsOrOptions;
        }
        else if (isHttpsOrOptions) {
            isHttps = (isHttpsOrOptions.isHttps) ? isHttpsOrOptions.isHttps : isHttps;
            dataType = (isHttpsOrOptions.dataType) ? isHttpsOrOptions.dataType : dataType;
        }

        $.ajax({
            contentType: "application/json",
            dataType: dataType,
            url: (isHttps) ? serverUrl + url : url,
            method: "get",
            success: success,
            error: errorWrapper(error),
        });
    }

    function getPromise(url, isHttpsOrOptions) {
        var res = newPromise();

        get(url, isHttpsOrOptions, function (data) {
            res.resolve(data);
            res = undefined;
        }, function (err, errInfo) {
            res.reject(err, errInfo);
            res = undefined;
        });
        return res;
    }

    function post(url, data, isFormData, isHttps, success, error) {
        isHttps = (isHttps !== undefined) ? isHttps : true;

        // This is just for having id to debug requests.
        if (url.indexOf("?") > -1) {
            url += "&cachFix=" + Date.now();
        }
        else {
            url += "?cachFix=" + Date.now();
        }

        $.ajax({
            contentType: "application/json",
            dataType: "json",
            url: serverUrl + url,
            method: "post",
            success: success,
            error: errorWrapper(error),
            data: (!isFormData) ? JSON.stringify(data) : data
        });
    }

    function postPromise(url, data, isFormData, isHttps) {
        var res = newPromise();

        post(url, data, isFormData, isHttps, function (r) {
            res.resolve(r);
            res = undefined;
        }, function (err, errInfo) {
            res.reject(err, errInfo);
            res = undefined;
        });

        return res;
    }

    function deletehttp(url, data, isFormData, isHttps, success, error) {
        isHttps = (isHttps !== undefined) ? isHttps : true;

        $.ajax({
            contentType: "application/json",
            dataType: "json",
            url: serverUrl + url,
            method: "delete",
            success: success,
            error: errorWrapper(error),
            data: (!isFormData) ? JSON.stringify(data) : data
        });
    }

    function deletePromise(url, data, isFormData, isHttps) {
        var res = newPromise();

        deletehttp(url, data, isFormData, isHttps, function (r) {
            res.resolve(r);
            res = undefined;
        }, function (err, errInfo) {
            res.reject(err, errInfo);
            res = undefined;
        });

        return res;
    }

    function put(url, data, isFormData, isHttps, success, error) {
        isHttps = (isHttps !== undefined) ? isHttps : true;

        $.ajax({
            contentType: "application/json",
            dataType: "json",
            url: serverUrl + url,
            method: "put",
            success: success,
            error: errorWrapper(error),
            data: (!isFormData) ? JSON.stringify(data) : data
        });
    }

    function putPromise(url, data, isFormData, isHttps) {
        var res = newPromise();

        put(url, data, isFormData, isHttps, function (r) {
            res.resolve(r);
            res = undefined;
        }, function (err, errInfo) {
            res.reject(err, errInfo);
            res = undefined;
        });

        return res;
    }

    return helper;
}

Application.startup_log("ServiceHelper.js: finised loading.", true);