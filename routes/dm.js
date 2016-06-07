var request = require('request');
var config = require('./config');
var trim = require('trim');

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
        makeRequest(config.version(projectid, versionid), env, token, function(body){
            var downloadLink = body.data.relationships.storage.meta.link.href.replace(config.baseURL(env),'');
            download(downloadLink, env, token, onsuccess);
        });
    }
}

function download(resource, env, token, onsuccess) {
    console.log('Downloading ' + config.baseURL(env) + resource);
    request({
        url: config.baseURL(env) + resource,
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token,
            'x-ads-acm-namespace': 'WIPDMSTG',
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