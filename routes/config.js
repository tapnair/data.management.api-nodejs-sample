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

var OAUTH_VERSION = 'v1';
var DM_PROJECT_VERSION = 'v1';

module.exports = {
    // change /etc/hosts file to redirect loca.host as 127.0.0.1
    // redirectUrl:  'http://local.host:3000/api/autodesk/callback',
    redirectUrl: 'https://forgeconnectortester.herokuapp.com/api/autodesk/callback',

    authenticationUrl: '/authentication/' + OAUTH_VERSION + '/authorize',
    accessTokenUrl: '/authentication/' + OAUTH_VERSION + '/gettoken',

    scope: 'data:read data:create data:write bucket:read',

    baseURL: function (env) {
        if (env == "undefined") {
          return require('./config-' + 'prod').baseUrl;
        }
        else {
          return require('./config-' + env).baseUrl;
        }

    },
    credentials: {
        consumerKey: function (env) {
            return require('./config-' + env).credentials.consumerKey;
        },
        consumerSecret: function (env) {
            return require('./config-' + env).credentials.consumerSecret;
        }
    },

    hubs: '/project/' + DM_PROJECT_VERSION + '/hubs',
    projects: function (hubId) {
        return '/project/' + DM_PROJECT_VERSION + '/hubs/' + hubId + '/projects';
    },
    project: function (hubId, projectId) {
        return '/project/' + DM_PROJECT_VERSION + '/hubs/' + hubId + '/projects/' + projectId;
    },
    folderContents: function (projectId, folderId) {
        return '/data/' + DM_PROJECT_VERSION + '/projects/' + projectId + '/folders/' + folderId + '/contents';
    },
    itemVersions: function (projectId, itemId) {
        return '/data/' + DM_PROJECT_VERSION + '/projects/' + projectId + '/items/' + itemId + '/versions';
    },
    thumbail: function (urn) {
        return '/viewingservice/' + DM_PROJECT_VERSION + '/thumbnails/' + urn;
    },
    version: function (projectId, versionId) {
        return '/data/' + DM_PROJECT_VERSION + '/projects/' + projectId + '/versions/' + versionId;
    },

    a360comments: function (itemId) {
        return 'COMMING SOON';
    },
    a360addComment: 'COMMING SOON',
    a360hubMembers : function (hubId){
        return 'COMMING SOON';
    }
}
