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

var request = require('request');
var config = require('./config');

module.exports = {
    getHubs: function (env, token, onsuccess) {
        makeRequest(config.hubs, env, token, function (body) {
            onsuccess(body.data);
        });
    },

    getProjects: function (hubid, env, token, onsuccess) {
        makeRequest(config.projects(hubid), env, token, function (body) {
            onsuccess(body.data);
        });
    },

    getFolders: function (hubid, projectid, env, token, onsuccess) {
        // first we need to project root folder
        makeRequest(config.project(hubid, projectid), env, token, function (project) {
            if (project.errors != null || project.data == null || project.data.relationships == null) {
                onsuccess(null);
                return;
            }

            var rootFolderId = project.data.relationships.rootFolder.data.id;
            module.exports.getFolderContents(projectid, rootFolderId, env, token, onsuccess);
        });
    },

    getFolderContents: function (projectid, folderid, env, token, onsuccess) {
        makeRequest(config.folderContents(projectid, folderid), env, token, function (body) {
            //console.log(JSON.stringify(body.data, null, 4));
            onsuccess(body.data);
        });
    },
    getItemVersions: function (projectid, itemid, env, token, onsuccess) {
        makeRequest(config.itemVersions(projectid, itemid), env, token, function (body) {
            onsuccess(body.data);
        });
    },
    getThumbnail: function (thumbnailUrn, env, token, onsuccess) {
        download(config.thumbail(thumbnailUrn), env, token, onsuccess);
    },

    downloadVersion: function (projectid, versionid, env, token, onsuccess) {
        makeRequest(config.version(projectid, versionid), env, token, function (body) {
            var downloadLink = body.data.relationships.storage.meta.link.href.replace(config.baseURL(env), '');
            download(downloadLink, env, token, onsuccess);
        });
    },

    uploadFile: function (endpoint, file, env, token, onsuccess) {
        // ToDo: need to improve this (resuable requests, error checking, etc)

        // the endpoint should be /projects/v1/hubs/:HubId:/projects/:ProjectId:
        var params = endpoint.split('/');
        var hubId = params[params.length - 3];
        var projectId = params[params.length - 1];

        // ***********************
        // step 1. get the project
        makeRequest(config.project(hubId, projectId), env, token, function (project) {

            // ******************************
            // step 2. create a storage entry
            var rootFolderId = project.data.relationships.rootFolder.data.id;
            var resource = '/data/v1/projects/' + projectId + '/storage';
            console.log('Requesting ' + config.baseURL(env) + resource);
            request({
                url: config.baseURL(env) + resource,
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                },
                body: JSON.stringify(
                    /* this storageSpecData function will create the data we need */
                    storageSpecData(file.originalname, rootFolderId))
            }, function (error, response, body) {

                // ***********************
                // step 3. upload the file
                // parse the response body
                body = JSON.parse(body);
                // and get the ObjectId
                var objectId = body.data.id;
                // then split the ObjectKey: everything after /
                var parameters = objectId.split('/');
                var objectKey = parameters[parameters.length - 1];
                // then split again by :
                parameters = parameters[parameters.length - 2].split(':');
                // and get the BucketKey
                var bucketKey = parameters[parameters.length - 1];

                var minetype = getMineType(file);
                var fs = require('fs');
                fs.readFile(file.path, function (err, filecontent) {
                    var ossresource = '/oss/v2/buckets/' + bucketKey + '/objects/' + objectKey
                    console.log('Uploading ' + minetype + ': ' + config.baseURL(env) + ossresource);
                    request({
                        url: config.baseURL(env) + ossresource,
                        method: "PUT",
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': minetype
                        },
                        body: filecontent
                    }, function (error, response, body) {

                        // *************************
                        // step 4. create a version
                        resource = '/data/v1/projects/' + projectId + '/items';
                        request({
                            url: config.baseURL(env) + resource,
                            method: "POST",
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/vnd.api+json',
                                'Accept': 'application/vnd.api+json'
                            },
                            body: JSON.stringify(
                                /* this versionSpecData function will create the data we need */
                                versionSpecData(file.originalname, rootFolderId, objectId))
                        }, function (error, response, body) {
                            // this final response should be OK
                            onsuccess(body);
                        });
                    });
                });
            });
        });

    }
};

function getMineType(file) {
    var arr = file.originalname.split('.');
    var extension = arr[arr.length - 1];
    var types = {
        'png': 'application/image',
        'jpg': 'application/image',
        'txt': 'application/txt',
        'ipt': 'application/vnd.autodesk.inventor.part',
        'iam': 'application/vnd.autodesk.inventor.assembly',
        'dwf': 'application/vnd.autodesk.autocad.dwf',
        'dwg': 'application/vnd.autodesk.autocad.dwg',
        'f3d': 'application/vnd.autodesk.fusion360',
        'f2d': 'application/vnd.autodesk.fusiondoc',
        'rvt': 'application/vnd.autodesk.revit'
    };
    return (types[extension] != null ? types[extension] : file.mimetype);
}

function storageSpecData(filename, folderId) {
    var storageSpecs =
    {
        data: {
            type: 'object',
            attributes: {
                name: filename
            },
            relationships: {
                target: {
                    data: {
                        type: 'folders',
                        id: folderId
                    }
                }
            }
        }
    };
    return storageSpecs;
}

function versionSpecData(filename, folderId, objectId) {
    var versionSpec =
    {
        jsonapi: {
            version: "1.0"
        },
        data: [
            {
                type: "items",
                attributes: {
                    name: filename,
                    extension: {
                        type: "items:autodesk.core:File",
                        version: "1.0"
                    }
                },
                relationships: {
                    tip: {
                        data: {
                            type: "versions",
                            id: "1"
                        }
                    },
                    parent: {
                        data: {
                            type: "folders",
                            id: folderId
                        }
                    }
                }
            }
        ],
        included: [
            {
                type: "versions",
                id: "1",
                attributes: {
                    name: filename
                },
                relationships: {
                    storage: {
                        data: {
                            type: "objects",
                            id: objectId
                        }
                    }
                }
            }
        ]
    };
    return versionSpec;
}


function download(resource, env, token, onsuccess) {
    console.log('Downloading ' + config.baseURL(env) + resource);
    request({
        url: config.baseURL(env) + resource,
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token,
            'x-ads-acm-namespace': 'WIPDM',
            'x-ads-acm-check-groups': true
        },
        encoding: null
    }, function (error, response, body) {
        onsuccess(new Buffer(body, 'base64'));
    });
}

function makeRequest(resource, env, token, onsuccess) {
    console.log('Requesting ' + config.baseURL(env) + resource);
    request({
        url: config.baseURL(env) + resource,
        method: "GET",
        headers: {'Authorization': 'Bearer ' + token}
    }, function (error, response, body) {
        if (error != null) console.log(error); // connection problems
        body = JSON.parse(body);
        if (body.errors != null)console.log(body.errors);
        onsuccess(body);
    })
}