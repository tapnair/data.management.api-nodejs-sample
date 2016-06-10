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

// for tooltips
var mouse_x = 0;
var mouse_y = 0;

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

    $(document).mousemove(function (event) {
        mouse_x = event.pageX;
        mouse_y = event.pageY;
    });
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
                'multiple': false,
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
    }).bind("activate_node.jstree", function (evt, data) {
            if (data != null && data.node != null && data.node.data != null) {
                initializeViewer(data.node.data);
                showComments(data.node);
            }
        }
    ).on('hover_node.jstree', function (e, data) {
        if (data.node.type === 'versions') {
            $('#thumbnail_tooltip').find('img').attr('src', '/api/getThumbnail?urn=' + data.node.data);
            $('#thumbnail_tooltip')
                .css('position', 'absolute')
                .css('top', mouse_y)
                .css('left', mouse_x)
                .show();
        }
    }).on('dehover_node.jstree', function () {
        $('#thumbnail_tooltip').hide();
    });
}

function customMenu(node) {
    var items;

    if (node.type == 'projects' /*|| node.type == 'projects'*/) {
        items = {
            renameItem: {
                label: "Upload",
                icon: "/img/upload.png",
                action: function () {
                    uploadFile(node);
                }
            },
        };
    }
    else if (node.type == 'versions') {
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


function uploadFile(node) {
    $('#hiddenUploadField').click();
    $('#hiddenUploadField').change(function () {
        var file = this.files[0];
        //size = file.size;
        //type = file.type;
        switch (node.type) {
            // case 'projects' // ToDo
            case 'projects':
                var formData = new FormData();
                formData.append('fileToUpload', file);
                formData.append('id', node.id);

                $.ajax({
                    url: '/api/upload',
                    data: formData,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function (data) {
                        $('#myfiles').jstree(true).refresh_node(node);
                    }
                });

                /*
                 // upload with progress bar ToDo
                 var xhr = new XMLHttpRequest();
                 xhr.open('post', '/api/upload', true);
                 xhr.upload.onprogress = function (e) {
                 if (e.lengthComputable) {
                 //var percentage = (e.loaded / e.total) * 100;
                 //$('div.progress div.bar').css('width', percentage + '%');
                 }
                 };
                 xhr.onload = function () {
                 }
                 xhr.send(formData);
                 */
                break;
        }
    });
}

function showComments(node) {
    // the version node only have the URN, but the comments are stored on the item
    var parentNodeId = node.parent;
    $.ajax({
        url: '/api/comments',
        type: 'GET',
        data: {item: parentNodeId},
        success: function (comments) {
            comments = JSON.parse(comments);
            //$("#comments").html('<div class="panel-group">');
            var commentsHTML = [];
            commentsHTML.push('<div class="panel panel-default"><div class="panel-heading">Comments</div><div class="panel-body">');
            commentsHTML.push('<textarea id="newComment" class="form-control" placeholder="Enter a new comment..." rows="3"></textarea><br /><button class="btn btn-primary btn-sm pull-right" onclick="postComment()">Post</button><div class="clearfix"></div><hr />');
            commentsHTML.push('<ul class="media-list">');
            comments.forEach(function (item, index) {
                var date = moment(item.date);
                commentsHTML.push(
                    '<li class="media">' +
                    '<span class="pull-left glyphicon glyphicon-user"></span>' +
                    '<div class="media-body">' +
                    '<span class="text-muted pull-right"><small class="text-muted" title="' +
                    date.format('MMMM Do YYYY, h:mm:ss a') + '">' + date.fromNow() + '</small></span>' +
                    '<strong class="text-success">' + item.author + '</strong>' +
                    '<p>' + item.comment + '</p></div></li>'
                );
            })
            commentsHTML.push('</ul></div></div>')
            $("#comments").html(commentsHTML.join(''));
        }
    });
}

function postComment() {
    var currentNode = $('#myfiles').jstree(true).get_selected(true)[0]
    var currentNodeId = currentNode.id;

    $.ajax({
        url: '/api/addcomment',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({version: currentNodeId, comment: $('#newComment').val()}),
        success: function (comments) {
            showComments(currentNode);
        }
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
        'env': 'AutodeskProduction',
        'getAccessToken': get3LegToken,
        'refreshToken': get3LegToken,
    };

    var viewerElement = document.getElementById('viewer');
    viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
    Autodesk.Viewing.Initializer(
        options,
        function () {
            viewer.initialize();
            loadDocument(options.document);
        }
    );
}

function loadDocument(documentId) {
    // first let's get the 3 leg token (developer & user & autodesk)
    var oauth3legtoken = get3LegToken();
    Autodesk.Viewing.Document.load(
        documentId,
        function (doc) { // onLoadCallback
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
            showThumbnail(documentId.substr(4, documentId.length - 1));
        }
        , {
            'oauth2AccessToken': oauth3legtoken,
            'x-ads-acm-namespace': 'WIPDM',//'WIPDMSecured',
            'x-ads-acm-check-groups': 'true',
        }
    )
}