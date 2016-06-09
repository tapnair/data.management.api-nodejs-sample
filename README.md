# data.management.api-nodejs-sample

[![Node.js](https://img.shields.io/badge/Node.js-4.4.3-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-2.15.1-blue.svg)](https://www.npmjs.com/)
[![LMV](https://img.shields.io/badge/View%20%26%20Data%20API-v2.8-green.svg)](http://developer-autodesk.github.io/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

<b>Note:</b> For using this sample, you need a valid oAuth credential. Visit this [page](https://developer.autodesk.com) for instructions to get on-board.

# Description

This is a basic sample for Forge Data Management API. It was designed for initial testing on multiple enviroments (DEV, STG and PROD). Alse use Autodesk Viewer  for showing models. Set of consumer key and secret are required (at least on environment), please visit [Forge](http://developer.autodesk.com) for more information.

<b>Important:</b> The "Callback URL" specified when creating a key <b>must match</b> the one used at the [config](config.js) file. As of now (June/2016), http://localhost is not allowed as it doesn't have a . (dot) on it. There are different workarounds for this, but you may use http://local.host on your redirects. To do so, open <b>hosts files</b> and edit it: on Mac OSx, use <b>sudo nano /etc/hosts</b>; on Windows, use Notepad to open C:\Windows\System32\drivers\etc\hosts file; finally add the following line:

    127.0.0.1       local.host

# Setup

Open files Config-(dev, stg, prod).js and include your Forge key & secret. Also, at the config.js, specify the callback URL (same used on Autodes Developer Portal, while creating a key). For Dropbox Integration, see section below.

All required packaged are listed on package.json file. Everything should work with:

    npm install
    node server.js

Open the browser and type: http://local.host:3000 (assuming the above workaround)

# Usage

You must have files under your A360 account. Go to [A360 Staging](https://a360-staging.autodesk.com/) and create a project and upload some files.

Start the sample (see Setup above). Login using your Autodesk Account. Expand the tree view until the <b>Version</b> (small clock icon) and click on it. The Autodesk Viewer should appear on the right with the viewable linked to this specific file version. For each Version it will show a thumbnail and allow <b>Download</b> and <b>Send to DropBox</b> (requires Dropbox user & password, plus developer key and secret - see Dropbox integration below). Each Project allow <b>Upload</b> of files (known issue: uploaded files are not showing on A360 UI).

# DropBox integration

The feature <b>Send to DropBox</b> requires a developer key & secret. Please visit [DropBox Developer](https://www.dropbox.com/developers/apps) and create one.  Update the file /routes/dropbox.js with this information. For this sample, make sure to use http://localhost:3000/api/dropbox/callback as Redirect URI (for OAuth authentication) on Dropbox key creation. This sample code have a workaround to deal with local.host & localhost redirect, see comments at dropbox.js file. Also note that new developer keys on dropbox are created with Status:Development, so it will only work with your account (owner of the key). You must apply for Prodction with Dropbox team so you can use with other users.


## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.


## Written by

Augusto Goncalves (Forge Partner Development)<br />
http://forge.autodesk.com<br />
