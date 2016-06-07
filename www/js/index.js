$(document).ready(function () {
    var token = get3LegToken();
//    $.getJSON('/api/get3legToken', function (token) {
    var auth = $("#authenticate");
    if (token == '')
        auth.click(authenticate);
    else {
        auth.html('You\'re logged in');
        $("#env").prop('disabled', true);
        auth.click(function () {
            if (confirm('And your token is ' + token + '\nWould you like to logoff?')) {
                $.ajax({
                    url: '/api/logoff',
                    type: 'POST',
                    success: function (url) {
                        window.location.reload();
                    }
                });
            }
        });
        prepareTree();
    }
    //});
});

function get3LegToken() {
    var token = makeSyncRequest('/api/get3LegToken');
    if (token != '') console.log('3 legged token (User Authorization): ' + token);
    return token;
}

function makeSyncRequest(url) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function authenticate() {
    $.ajax({
        url: '/api/authenticate',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'env': $("#env").val()
        }),
        success: function (url) {
            // iframes are not allowed
            PopupCenter(url, "Autodesk Login", 800, 400);
        },
        error: function () {

        }
    });
}


// http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
function PopupCenter(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }

    return newWindow;
}

function prepareTree() {
    $('#myfiles').jstree({
        'core': {
            'themes': {"icons": true},
            'data': {
                "url": '/api/getTreeNode',
                "dataType": "json",
                "data": function (node) {
                    return {"id": node.id};
                }
            }
        },
        'types': {
            'default': {
                'icon': 'glyphicon glyphicon-cloud'
            },
            '#': {
                'icon': 'glyphicon glyphicon-user'
            },
            'hubs': {
                'icon': 'glyphicon glyphicon-inbox'
            },
            'projects': {
                'icon': 'glyphicon glyphicon-list-alt'
            },
            'items': {
                'icon': 'glyphicon glyphicon-briefcase'
            },
            'folders': {
                'icon': 'glyphicon glyphicon-folder-open'
            },
            'versions': {
                'icon': 'glyphicon glyphicon-time'
            }
        },
        "plugins": ["types", "state", "sort", "contextmenu"],
        contextmenu: {items: customMenu}
    }).bind(
        "activate_node.jstree", function (evt, data) {
            if (data != null && data.node != null && data.node.data != null) {
                initializeViewer(data.node.data);
            }
        }
    );
}

function customMenu(node) {
    var items;
    /*
     if (node.type == 'folders' || node.type == 'projects') {
     items = {
     renameItem: {
     label: "Upload",
     action: function () {
     uploadFile(node.id);
     }
     },
     };
     }
     else*/
    if (node.type == 'versions') {
        items = {
            download: {
                label: "Download",
                icon: "/img/download.png",
                action: function () {
                    downloadFile(node.text, node.id)
                }
            },
            sendToDropBox: {
                label: "Send to DropBox",
                icon: "/img/dropbox_icon.png",
                action: function () {
                    sendToDropBox(node.text, node.id)
                }
            }
        };
    }

    return items;
}

function downloadFile(name, id) {
    var params = id.split('/');
    var pId = params[params.length - 3];
    var vId = params[params.length - 1];

    var url = window.location.protocol + "//" + window.location.host +
        "/api/download?" +
        "f=" + name +
        "&p=" + pId +
        "&v=" + vId;

    window.open(url, '_blank');
}

function sendToDropBox(name, id) {
    var token = makeSyncRequest('/api/getDropboxToken');
    if (token === '') {
        $.ajax({
            url: '/api/dropbox',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                'env': $("#env").val(),
                'name': name,
                'id': id,
            }),
            success: function (url) {
                // iframes are not allowed
                PopupCenter(url, "Dropbox Login", 800, 500);
            },
            error: function () {

            }
        });
    }
    else {
        var params = id.split('/');
        var pId = params[params.length - 3];
        var vId = params[params.length - 1];
        $.ajax({
            url: '/api/sentToDropbox',
            type: 'GET',
            data: {f: name, p: pId, v: vId},
            success: function (res) {
                console.log(res);
            }
        });
    }
}


function uploadFile(id) {
    $('#hiddenUploadField').click();
    $('#hiddenUploadField').change(function () {
        var file = this.files[0];
        name = file.name;
        size = file.size;
        type = file.type;


    });
}

function showThumbnail(urn) {
    $('#viewer').html('<img src="/api/getThumbnail?urn=' + urn + '"/>');
}

////////
// Based on Autodesk Viewer basic sample
// https://developer.autodesk.com/api/viewerapi/
////////
var viewer;
var geometryItems = [];

function initializeViewer(urn) {
    $('#viewer').html(''); // remove previous content...
    $('#viewables').html('');
    console.log("Launching Autodesk Viewer for: " + urn);
    var options = {
        'document': 'urn:' + urn,
        'env': 'AutodeskStaging',
        'getAccessToken': get3LegToken,
        'refreshToken': get3LegToken,
    };
    //$('#viewer').css("background-image", "url(/api/getThumbnail?urn=" + urn + ")");

    var viewerElement = document.getElementById('viewer');
    viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
    Autodesk.Viewing.Initializer(
        options,
        function () {
            viewer.initialize();
            loadDocument(options.document);
        }
    );

    //loadDocument(options.document);
}

function loadDocument(documentId) {
    // first let's get the 3 leg token (developer & user & autodesk)
    var oauth3legtoken = get3LegToken();
    //Autodesk.Viewing.Private.refreshToken(oauth3legtoken); // workaround by Weinan Chen
    Autodesk.Viewing.Document.load(
        documentId,
        function (doc) { // onLoadCallback
            //var geometryItems = [];
            geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                'type': 'geometry',
            }, true);
            if (geometryItems.length > 0) {
                geometryItems.forEach(function (item, index) {
                    var v = $('<input type="button" value="' + item.name + '" class="btn btn-primary btn-xs"/>&nbsp;');
                    v.click(function () {
                        viewer.impl.unloadCurrentModel();
                        viewer.load(doc.getViewablePath(geometryItems[index]), null, null, null, doc.acmSessionId /*session for DM*/);
                    });
                    $('#viewables').append(v);
                });
                viewer.load(doc.getViewablePath(geometryItems[0]), null, null, null, doc.acmSessionId /*session for DM*/);
            }
        },
        function (errorMsg) { // onErrorCallback
            // no LMV, show thumbnail instead >> working fine
            showThumbnail(documentId.substr(4, documentId.length - 1));
        }
        , {
            'oauth2AccessToken': oauth3legtoken,
            'x-ads-acm-namespace': 'WIPDMSTG',//'WIPDMSecured',
            'x-ads-acm-check-groups': 'true',
        }
    )
}