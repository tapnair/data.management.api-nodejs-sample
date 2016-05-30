/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Augusto Goncalves 2016 - Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

$(document).ready(function () {
    var token = get3LegToken();
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
});

function get3LegToken() {
    var token = makeSyncRequest('/api/get3LegToken');
    if (token != '') console.log('3 legged token (User Authorization): ' + token);
    return token;
}


function get2LegToken() {
    var token = makeSyncRequest('/api/get2LegToken');
    console.log('2 legged token (Developer Authentication): ' + token);
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
        "plugins": ["types", "state", "sort"]
    }).bind(
        "activate_node.jstree", function (evt, data) {
            if (data != null && data.node != null && data.node.data != null) {
                initializeViewer(data.node.data);
            }
        }
    );
}

function showThumbnail(urn) {
    $('#viewer').html('<img src="/api/getThumbnail?urn=' + urn + '"/>');
}

////////
// Based on Autodesk Viewer basic sample
// https://developer.autodesk.com/api/viewerapi/
////////
function initializeViewer(urn) {
    $('#viewer').html(''); // remove previous content...
    console.log("Launching Autodesk Viewer for: " + urn);
    var options = {
        'document': 'urn:' + urn,
        'env': 'AutodeskStaging',
        'getAccessToken': get2LegToken,
        'refreshToken': get2LegToken,
    };
    var viewerElement = document.getElementById('viewer');
    var viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
    Autodesk.Viewing.Initializer(
        options,
        function () {
            viewer.initialize();
            loadDocument(viewer, options.document);
        }
    );
}

function loadDocument(viewer, documentId) {
    // first let's get the 3 leg token (developer & user & autodesk)
    var oauth3legtoken = get3LegToken();
    Autodesk.Viewing.Private.refreshToken(oauth3legtoken); // workaround by Weinan Chen
    Autodesk.Viewing.Document.load(
        documentId,
        function (doc) { // onLoadCallback
            var geometryItems = [];
            geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                'type': 'geometry',
                //'role': '3d' // show 3D or 2D
            }, true);
            if (geometryItems.length > 0)
                viewer.load(doc.getViewablePath(geometryItems[0]), null, null, null, doc.acmSessionId /*session for DM*/);
        },
        function (errorMsg) { // onErrorCallback
            showThumbnail(documentId.substr(4, documentId.length - 1));
        }
        , {
            'oauth2AccessToken': oauth3legtoken,
            'x-ads-acm-namespace': 'WIPDMSTG', // STG for staging,
            'x-ads-acm-check-groups': 'true',
        }
    )
}