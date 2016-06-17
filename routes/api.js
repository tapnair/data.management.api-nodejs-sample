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

var express = require('express');
var router = express.Router();

var multer = require('multer')
var upload = multer({dest: './tmp'}) // ToDo: erase after upload to Autodesk

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var config = require('./config');
var OAuth2 = require('oauth').OAuth2;

var dm = require("./dm");
var a360 = require("./a360");

// listen for calls on http://local.host/authenticate endpoint
router.post('/authenticate', jsonParser, function (req, res) {
    var env = req.body.env;
    req.session.env = env;

    // using a NodeJS package for OAuth 2
    // create the object with the information
    var oauth2 = new OAuth2(
        config.credentials.consumerKey(env),
        config.credentials.consumerSecret(env),
        config.baseURL(env),
        config.authenticationUrl,
        config.accessTokenUrl,
        null);

    // this will call /authorize and get the url for user authorization
    var authURL = oauth2.getAuthorizeUrl({
        redirect_uri: config.redirectUrl,
        scope: config.scope,
    });

    // listen for the callback on http://local.host/autodesk/callback (note the endpoint is the same as used above)
    router.get('/autodesk/callback', function (req, res) {
        // this callback will have the 'code'
        // now we finally call /gettoken with this code
        // the NodeJS package handles the call
        oauth2.getOAuthAccessToken(
            req.query.code,
            {
                'grant_type': 'authorization_code',
                'redirect_uri': config.redirectUrl
            },
            function (e, access_token, refresh_token, results) {
                console.log(results);
                // this response will have the access token we need to all
                // calls to ForgeDM endpoints (to read user data), let’s store in session
                req.session.oauthcode = access_token;
                req.session.cookie.maxAge = parseInt(results.expires_in) * 1000 * 60; // same as access_token
                // assuming the login was a popup, let's close it
                res.end('<script>window.opener.location.reload(false);window.close();</script>');
            }
        );
    });

    // respond the original caller with a URL, which can show a popup
    // the user will enter his/her password and Autodesk
    // will redirect to redirectUrl callback (same on Dev Portal)
    res.end(JSON.stringify(authURL + '&response_type=code'));
});

router.post('/logoff', function (req, res) {
    req.session.destroy();
    res.end('ok');
});

router.get('/get3LegToken', function (req, res) {
    res.end(req.session.oauthcode);
});

/// jstree endpoint
router.get('/getTreeNode', function (req, res) {
    var id = req.query.id;

    if (id == '#') {
        // # stands for ROOT
        dm.getHubs(req.session.env, req.session.oauthcode, function (hubs) {
            res.end(makeTree(hubs, true));
        });
    }
    else {
        var params = id.split('/');
        var parentResourceName = params[params.length - 2];
        var parentResourceId = params[params.length - 1];
        switch (parentResourceName) {
            case 'hubs':
                // if the caller is a hub, then show projects
                dm.getProjects(parentResourceId/*hub_id*/, req.session.env, req.session.oauthcode, function (projects) {
                    res.end(makeTree(projects, true));
                });
                break;
            case 'projects':
                // if the caller is a project, then show folders
                var hubId = params[params.length - 3];
                dm.getFolders(hubId, parentResourceId/*project_id*/, req.session.env, req.session.oauthcode, function (folders) {
                    res.end(makeTree(folders, true));
                });
                break;
            case 'folders':
                // if the caller is a folder, then show contents
                var projectId = params[params.length - 3];
                dm.getFolderContents(projectId, parentResourceId/*folder_id*/, req.session.env, req.session.oauthcode, function (folderContents) {
                    res.end(makeTree(folderContents, true));
                });
                break;
            case 'items':
                // if the caller is an item, then show versions
                var projectId = params[params.length - 3];
                dm.getItemVersions(projectId, parentResourceId/*item_id*/, req.session.env, req.session.oauthcode, function (versions) {
                    res.end(makeTree(versions, false));
                });
        }
    }
});

router.get('/getThumbnail', function (req, res) {
    var urn = req.query.urn;
    dm.getThumbnail(urn, req.session.env, req.session.oauthcode, function (thumb) {
        res.setHeader('Content-type', 'image/png');
        res.end(thumb, 'binary');
    });
});

router.get('/download', function (req, res) {
    var fileName = req.query.f;
    var fileExtension = fileName.split('.')[fileName.split('.').length - 1];
    var projectId = req.query.p;
    var versionId = encodeURIComponent(req.query.v);
    dm.downloadVersion(projectId, versionId, req.session.env, req.session.oauthcode, function (file) {
        res.set('Content-Type', 'application/' + fileExtension);
        res.set('Content-Disposition', 'attachment; filename="' + fileName + '"');
        res.end(file);
    });
});

router.post('/upload', upload.single('fileToUpload'), function (req, res) {
    dm.uploadFile(req.body.id, req.file, req.session.env, req.session.oauthcode, function (data) {
        res.end(data);
    });
});

router.get('/comments', function (req, res) {
    var itemUrl = req.query.item;
    var params = itemUrl.split('/');
    var itemId = unescape(params[params.length - 1]); // need to check unescape
    a360.getComments(new Buffer(itemId).toString('base64'), req.session.env, req.session.oauthcode, function (comments) {
        res.end(JSON.stringify(comments));
    });
});

router.post('/addcomment',jsonParser, function (req, res) {
    var versionUrl = req.body.version;
    var comment = req.body.comment;
    var params = versionUrl.split('/');
    var versionId = unescape(params[params.length - 1]); // need to check unescape
    a360.addComment(new Buffer(versionId).toString('base64'), comment, req.session.env, req.session.oauthcode, function (body) {
        res.end(JSON.stringify(body));
    });
});

router.get('/getMembers', function(req, res){
    var id = req.query.id;
    var params = id.split('/');
    var hubId = params[params.length-1];
    a360.getMembers(hubId, req.session.env, req.session.oauthcode, function(members){
        res.end(JSON.stringify(members));
    });
});

module.exports = router;

function makeTree(listOf, canHaveChildren, data) {
    if (listOf == null) return '';
    var treeList = [];
    listOf.forEach(function (item, index) {
        var treeItem = {
            id: item.links.self.href,
            data: (item.relationships != null && item.relationships.derivatives != null ? item.relationships.derivatives.data.id : null),
            text: (item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName),
            type: item.type,
            children: canHaveChildren
        };
        treeList.push(treeItem);
    });
    return JSON.stringify(treeList);
}