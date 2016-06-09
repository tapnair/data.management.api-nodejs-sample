var OAUTH_VERSION = 'v1';
var DM_PROJECT_VERSION = 'v1';

module.exports = {
    // change /etc/hosts file to redirect loca.host as 127.0.0.1
    redirectUrl: 'http://local.host:3000/api/autodesk/callback',

    authenticationUrl: '/authentication/' + OAUTH_VERSION + '/authorize',
    accessTokenUrl: '/authentication/' + OAUTH_VERSION + '/gettoken',

    scope: 'data:read data:create data:write bucket:read',//['data:read', 'data:create', 'data:write', 'bucket:read', 'bucket:create'],

    baseURL: function (env) {
        return require('./config-' + env).baseUrl;
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
        return '/a360/v1/items/' + itemId + '/comments';
    },
    a360addComment: '/a360/v1/comments',
}