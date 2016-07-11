#!/usr/bin/env node

'use strict'
const fs = require('fs');
const request = require('request');
const prog = require('commander');
const path = require('path');
const H = require('highland');
const _ = require('lodash/fp');

let basePath = '/rest/api/1.0';

prog
    .version(require('./package.json').version)
    .option('-h, --host <path>', 'The Stash path')
    .option('-u, --user <username>', 'Stash user')
    .option('-p, --password <password>', 'Stash user\'s password')
    .option('-o, --outputfile <outputfile>', 'Stash user\'s outputfile')
    .parse(process.argv);

if (!prog.host || !prog.user || !prog.password) {
    console.log('Don\'t forget stash info');
    return;
}

const configFilename = prog.outputfile || 'config.json';
const url = require('url').parse(prog.host);

var opt = {
    baseUrl: url.protocol + '//' + path.join(url.host, basePath),
    method: 'GET',
    auth: {
        'user': prog.user,
        'password': prog.password
    },
    qs: {
        limit: 200
    }
};

opt.uri = '/projects';

let globalArray = [];

const requestStream = H.wrapCallback(request);

const checkBounderies = (htmlBody) => {
    const body = JSON.parse(htmlBody);
    if (!_.get('isLastPage')(body)) {
        throw new Error('Increase project limit');
    }
    return H(_.get('values')(body));
};

const buildRepositoryUrl = (projectPath) => {
    var opt = {
        baseUrl: url.protocol + '//' + path.join(url.host, basePath),
        method: 'GET',
        auth: {
            'user': prog.user,
            'password': prog.password
        },
        qs: {
            limit: 200
        }
    };
    opt.uri = projectPath + '/repos';
    return opt;
};

const getRepositories = (options) => requestStream(options);

const convertToHoundConfigFormat = (repo_info) => {
    let repo_conf = '\n\t\"' + repo_info.project.key + '-' + repo_info.name + '\": {\n';
    repo_conf += '\t\t\"url\": \"' + repo_info.cloneUrl.replace('@', ':' + prog.password + '@') + '\",\n';
    repo_conf += '\t\t\"url-pattern\": {\n'
    repo_conf += '\t\t\t\"base-url\": \"' + repo_info.links.self[0].href + '/{path}/{anchor}\",\n';
    repo_conf += '\t\t\t\"anchor\": \"#{line}\"\n';
    repo_conf += '\t\t}\n\t}';
    globalArray.push(repo_conf);
    return repo_info;
}

const saveConfigFile = () => {
    let textBlock = '{\n'
    textBlock += '\t\"max-concurrent-indexers\": 2,\n'
    textBlock += '\t\"dbpath\": \"data\",\n';
    textBlock += '\t\"repos\": {\n';
    textBlock += globalArray.join(',');
    textBlock += '\n\t}\n}';
    fs.writeFileSync('./' + configFilename, textBlock, {
        encoding: 'utf8'
    });
    console.log(configFilename + ' done');
};

requestStream(opt)
    .pluck('body')
    .map(checkBounderies)
    .flatten()
    .pluck('link')
    .pluck('url')
    .map(buildRepositoryUrl)
    .flatMap(getRepositories)
    .ratelimit(2, 1000)
    .pluck('body')
    .map(checkBounderies)
    .flatten()
    .map(convertToHoundConfigFormat)
    .done(saveConfigFile);
