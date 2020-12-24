app.rootVM = {
    userInfo:ko.observable(),
    isLoggedIn: ko.observable(),
    numberOfClicks : ko.observable(0),
    
    // The hooks do not work, so improvising
    // And I found why the hools didn't work... 
    currentPage: ko.observable("main"),
    currentPageHandler:  $("body").on("pagechange",  (e, args) => { 
        app.rootVM.currentPage(args.options.targetPage.pageId);
    }),
    // should update this instead on activate:

    crrentNav: ko.observable("main"),

    
    mainVm: (function() {

        var vm = {
        };
        
        vm.activate = function(activationParams){
            app.rootVM.crrentNav("main");
            app.log("Main was activated");
        };

        vm.reactivate = function(){
            app.rootVM.crrentNav("main");
            app.log("Main was activated again.");
        };

        vm.deactivate = function(){
            app.log("Main was deactiveted");
        };        
    })(),

    documentsVm: (function() {
        
        var vm = {
            documentsList: ko.observableArray([])
        };

        ServiceHelper.setServerUrl(app.documentAPI);
        vm.loadDocuments = () => {
            app.rootVM.infoDialogVM.startLoading("Loading documents data");
            ServiceHelper.getPromise("/documents").then( (data) => {
                vm.documentsList(data);
                app.rootVM.infoDialogVM.stopLoading();
            }, (error) => {
                app.rootVM.infoDialogVM.stopLoading();
                app.rootVM.infoDialogVM.openError("Encountered an error loading the decuments", "Error");
            });
        } 

        vm.deleteDocument = function(id) {
            ServiceHelper.deletePromise("/documents/" + (id)).then( (data) => {
                vm.loadDocuments();
            }, (error) => {
                app.rootVM.infoDialogVM.openError("Encountered an error deleting the decument", "Error");
            });
        }

        vm.newDocument = function() {
            
        }


        vm.activate = function(activationParams){
            app.rootVM.crrentNav("documents")
            app.log("Documents was activated");
            vm.loadDocuments();
        };

        vm.reactivate = function(){
            app.log("Documents was activated again.");
            vm.loadDocuments();
        };

        vm.deactivate = function(){
            app.log("Documents was deactiveted");
        };        

        return vm;
    })(),
    
    documentVm: (function() {
        var vm = {
            actionType:ko.observable(),
            saving:ko.observable(false),

            Id: null,
            Title: ko.observable(""),
            TotalAmount: ko.observable(0),

            dirty: false,
        };

        vm.activate = function(activationParams){
            app.rootVM.crrentNav("documents")
            vm.saving(false);
            vm.actionType(activationParams.actionType);
            if (activationParams.actionType == "Edit") {
                vm.Id = activationParams.Id;
                app.rootVM.infoDialogVM.startLoading("Loading document data");
                ServiceHelper.getPromise("/documents/" + vm.Id).then( (data) => {
                    vm.Title(data.Title);
                    vm.TotalAmount(data.TotalAmount);
                    app.rootVM.infoDialogVM.stopLoading();
                    this.dirty(false);
                }, (error) => {
                    app.rootVM.infoDialogVM.stopLoading();
                    app.rootVM.infoDialogVM.openError("Encountered an error loading the decument", "Error");
                });
            }
        };     
        
        vm.save = function(){
            // Validate here
            // If time, bottom: https://knockoutjs.com/documentation/extenders.html
            if (isNaN(vm.TotalAmount()) || !vm.Title() ) {
                app.rootVM.infoDialogVM.openInfo("User filling error..", "Error");
                return;
            }

            vm.saving(true);
            if (vm.actionType() == "Edit") {
                ServiceHelper.putPromise("/documents/" + vm.Id, { 
                    Id: vm.Id,
                    Title: vm.Title(), 
                    TotalAmount: vm.TotalAmount(),
                    }).then( () => {
                        location.hash = "documents"
                }, (error) => {
                    app.rootVM.infoDialogVM.openError("Encountered an error saving the decument", "Error");
                    vm.saving(false);
                });
            }
            if (vm.actionType() == "New") {
                ServiceHelper.postPromise("/documents", { 
                    Title: vm.Title(), 
                    TotalAmount: vm.TotalAmount(),
                    }).then( () => {
                        location.hash = "documents"
                }, (error) => {
                    app.rootVM.infoDialogVM.openError("Encountered an error saving the decument", "Error");
                    vm.saving(false);
                });
            }

        };      
        
        vm.canDeactivate = function(canDeactivateParam){
            
            // Should be done via dirty flag, if data wasn't changed no need to confirm.
           (app.rootVM.infoDialogVM.confirm("Are you sure?", "Don't go please")).then( () => canDeactivateParam.confirmDeactivate() );
        };
        return vm;


    })(),
    examplesVm: (function(){
        var vm = {
            someText:ko.observable(),
        };

        vm.activate = function(activationParams){
            app.rootVM.crrentNav("examples")
            app.log("Examples? was activated");
            vm.someText(activationParams.message);
        };

        vm.reactivate = function(){
            app.log("Examples? was activated again.");
        };

        vm.deactivate = function(){
            app.log("Examples? was deactiveted");
        };

        vm.canDeactivate = function(canDeactivateParam){
            canDeactivateParam.confirmDeactivate();
        };

        vm.clicked = function(){
            app.log("Examples? you clicked me.")
            location.hash = "document/new/" + vm.someText();
        };

        vm.openPopup = function(){
            app.log("openPopup was clicked.")
            app.rootVM.infoDialogVM.openInfo("This is what you wrote: " + vm.someText());
        };

        vm.showLoading = function(){
            app.log("showLoading was clicked.")
            app.rootVM.infoDialogVM.startLoading("Loading for 5 sec");
            setTimeout(function(){
                app.rootVM.infoDialogVM.stopLoading("Loading for 5 sec");
            }, 5000);
        };

        return vm;
    })(),
    
    gridVm: (function() {

        var vm = {
            page: ko.observable(1),
            pageSplit: ko.observable(10),
            maxPages: ko.observable(0),

        };

        vm.paginate = function( dataObs ) {
            var data = dataObs();
            var length = data.length;
            vm.maxPages(Math.ceil(length / vm.pageSplit()));
            return data.slice((vm.page() - 1) * vm.pageSplit(), vm.page() * vm.pageSplit());
            
        }

        return vm;


    })(),

    infoDialogVM: (function () {
        var loadingCount = ko.observable(0);
        var loadingParams = ko.observableArray([]);
        var currInfo = ko.observable(undefined);
        var shouldBeClosedByBackButton = ko.observable(false);
        var lastLoadingText = undefined;
        var onClose = undefined;
        var startLoadingDeley = 1500;

        var res = {
            isDefaultCloseButtonEnabled: ko.observable(true),
            isTitleCloseButtonEnabled: ko.observable(true),
            isOpen: ko.observable(false),
            type: ko.observable("info"),
            content: ko.observable("test"),
            title: ko.observable(undefined),
            commands: ko.observableArray(),

            loadingText: ko.computed(function () {
                var params = loadingParams();
                var info = ko.unwrap(currInfo);

                return (info !== undefined) ? info.text : lastLoadingText;
            }),
            isLoading: ko.computed(function () {
                return ko.unwrap(currInfo) !== undefined;
            }),
            startLoading: function (text, isAsync) {

                if (isAsync === undefined) {
                    isAsync = false;
                }

                if (!text) {
                    text = localize("loading");
                }
                
                var loadingObject = {
                    text: text,
                };

                if (startLoadingDeley > 0 && isAsync) {
                    loadingObject.show = false;
                    var handler = setTimeout(function () {

                        loadingObject.handler = undefined;
                        currInfo(loadingObject);
                    }, startLoadingDeley);

                    loadingObject.handler = handler;
                }
                else {
                    currInfo(loadingObject);
                }

                loadingParams.push(loadingObject);
            },
            closeDialog: function () {
                this.isOpen(false);
            },
            stopLoading: function (text) {
                var removedObject = undefined;
                var params = loadingParams();

                if (params.length) {

                    lastLoadingText = params[0].text;

                    if (!text) {
                        removedObject = loadingParams.pop();
                    }
                    else {
                        var foundItem = undefined;

                        for (var i = 0; i < params.length; i++) {
                            if (params[i].text == text) {
                                foundItem = params[i];
                                break;
                            }
                        }

                        if (foundItem) {
                            removedObject = foundItem;
                            loadingParams.remove(foundItem);
                        }
                        else {
                            removedObject = loadingParams.pop();
                        }
                    }

                    if (removedObject && removedObject.handler) {
                        clearTimeout(removedObject.handler);
                        removedObject.handler = undefined;
                    }

                    currInfo(params[params.length - 1]);
                }
                else {
                    currInfo(undefined);
                }
            },
            stopAllLoading: function () {
                if (loadingParams().length) {
                    var params = loadingParams();
                    for (var i = 0; i < params.length; i++) {
                        if (params[i].handler) {
                            clearTimeout(params[i].handler);
                            params[i].handler = undefined;
                        }
                    }
                    lastLoadingText = loadingParams()[0].text;
                }                
                loadingParams([]);
                currInfo(undefined);
            },
            confirm: function (text, title) {
                var that = this;
                var p = ServiceHelper.newPromise();
                this.openInfo(text, title, [{ text: localize("ok"), autoClose: true, action: function () { p.resolve(); } }, { isDanger: true, text: localize("main:cancel"), autoClose: true, action: function () { p.reject(); } }], undefined, false, false)
                return p;
            },
            open: function (content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                this.isOpen(true);
                this.content(content);
                this.title(title);

                _.forEach(commands, function (c) {
                    if (!_.has(c, 'autoClose'))
                        c.autoClose = true;
                });

                this.commands(commands);

                if (isDefaultCloseButtonEnabled === false) {
                    this.isDefaultCloseButtonEnabled(false);
                }
                else {
                    this.isDefaultCloseButtonEnabled(true);
                }

                this.isTitleCloseButtonEnabled(isTitleCloseButtonEnabled);
            },           
            openType: function (type, content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {

                var args = {
                    type: type,
                    content: content,
                    title: title,
                    commands: commands,
                    onCloseFunction: onCloseFunction,
                    isDefaultCloseButtonEnabled: isDefaultCloseButtonEnabled,
                    isTitleCloseButtonEnabled: isTitleCloseButtonEnabled
                };

                // This will allow to have overload when we get 1 params object or all the parameters.
                if (arguments.length === 1 && typeof(type) === "object") {
                    args = type;
                }

                onClose = args.onCloseFunction;
                this.type(args.type);

                if (args.isTitleCloseButtonEnabled == undefined) {
                    args.isTitleCloseButtonEnabled = true;
                }

                this.open(args.content, args.title, args.commands, args.isDefaultCloseButtonEnabled, args.isTitleCloseButtonEnabled);
            },

            openSync: function (content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled, type) {
                onClose = onCloseFunction;
                var p = ServiceHelper.newPromise();

                var rejectCommand = { isDanger: true, text: localize("main:cancel"), autoClose: true, action: function () { p.reject(); } };

                var promiseCommands = _.map(commands, function (c) {
                    if (!_.has(c, 'action'))
                        c.action = function () {
                            p.resolve(c.action);
                        };
                    return c;
                });
                if (isDefaultCloseButtonEnabled) {
                    promiseCommands = _.isArray(promiseCommands) ? promiseCommands.concat(rejectCommand) : [rejectCommand];
                }
                if (type === 'info')
                    this.openInfo(content, title, promiseCommands, onClose, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
                else if (type === 'error')
                    this.openError(content, title, promiseCommands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled, onClose);
                else
                    this.open(content, title, promiseCommands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
                return p;
            },

            openInfoSync: function (content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                return this.openSync(content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled, 'info');
            },
            openInfo: function (content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                onClose = onCloseFunction;
                this.type("info");
                this.open(content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
            },
            openErrorSync: function (content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                return this.openSync(content, title, commands, onCloseFunction, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled, 'error');
            },
            openError: function (content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled, onCloseFunction) {
                onClose = onCloseFunction;
                this.type("error");
                this.open(content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
            },
            openInfoWithOkDialog: function (content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                if (commands === undefined)
                    commands = [];
                commands.push({
                    text: localize('ok'),
                    action: function () { }
                }
                );
                this.openInfo(content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
            },
            openErrorWithOkDialog: function (content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled) {
                if (commands === undefined)
                    commands = [];
                commands.push({
                    text: localize('ok'),
                    action: function () { }
                }
                );
                this.openError(content, title, commands, isDefaultCloseButtonEnabled, isTitleCloseButtonEnabled);
            },
        };

        res.isOpen.subscribe(function (isOpened) {

            // Call On Close
            if (isOpened === false && onClose) {
                onClose();
                onClose = undefined;
            }
        });

        return res;
    })(),
    
    moduleDeactivated: function () { },
    moduleActivated: function () { }
};