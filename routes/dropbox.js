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

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var config = require('./config');
var OAuth2 = require('oauth').OAuth2;

var dm = require("./dm");
var request = require('request');

// Dropbox API Authentication endpoints
router.post('/dropbox', jsonParser, function (req, res) {
    var env = req.body.env;
    var file = req.body.file;
    var id = req.body.id;

    var oauth2 = new OAuth2(
        '<<YOUR DROPBOX KEY>>',
        '<<YOUR DROPBOX KEY>>',
        'https://www.dropbox.com',
        '/oauth2/authorize',
        '/oauth2/token',
        null);

    var authURL = oauth2.getAuthorizeUrl({
        redirect_uri: 'http://localhost:3000/api/dropbox/callback'
    });

    // this will await the callback
    router.get('/dropbox/callback', function (req, res) {

        /////////
        // Workaround: Autodesk Forge don't accept localhost, so we're using local.host
        // but DropBox accepts localhost but don't accept local.host (unless is https)
        // so if we receive a callback on localhost, redirect to local.host
        /////////
        if (req.headers.host == 'localhost:3000') {
            res.writeHead(301,
                {Location: 'http://local.host:3000/api/dropbox/callback?code=' + req.query.code}
            );
            res.end();
            return;
        }
        // end of workaround, please remove on production

        oauth2.getOAuthAccessToken(
            req.query.code,
            {
                'grant_type': 'authorization_code',
                'redirect_uri': 'http://localhost:3000/api/dropbox/callback'
            },
            function (e, access_token, refresh_token, results) {
                req.session.dropbox = access_token;
                res.end('<script>window.close();</script>');
            }
        );
    });

    res.end(JSON.stringify(authURL + '&response_type=code'));
});

router.get('/getDropboxToken', function (req, res) {
    res.end(req.session.dropbox);
});

router.get('/sentToDropbox', function (req, res) {
    var fileName = req.query.f;
    var fileExtension = fileName.split('.')[fileName.split('.').length - 1];
    var projectId = req.query.p;
    var versionId = req.query.v;
    dm.downloadVersion(projectId, versionId, req.session.env, req.session.oauthcode, function (file) {
        request({
            url: 'https://content.dropboxapi.com/2/files/upload',
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + req.session.dropbox,
                'Dropbox-API-Arg': '{"path": "/' + fileName + '","mode": "add","autorename": true,"mute": false}',
                'Content-Type': 'application/octet-stream'
            },
            body: file
        }, function (error, response, body) {
            res.end(body);
        })
    });
});

module.exports = router;
