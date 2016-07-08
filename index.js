'use strict'
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
  .parse(process.argv);

if(!prog.host || !prog.user || !prog.password) {
  console.log('Don\'t forget stash info');
  return;
}
const url = require('url').parse(prog.host);

var opt = {
  baseUrl: url.protocol + '//' + path.join(url.host, basePath),
  method: 'GET',
  auth: {
    'user': prog.user,
    'password': prog.password
  },
  qs: {
    limit: 100    
  }
};

opt.uri = '/projects';

//console.log(opt);
const requestStream = H.wrapCallback(request);

const checkBounderies = (htmlBody) => {
  const body = JSON.parse(htmlBody);
  if(!_.get('isLastPage')(body)){
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
      limit: 100    
    }
  };
  opt.uri = projectPath + '/repos';

  return opt;
};


const getRepositories = (options) => { 
  console.log(options);        
  console.log(requestStream(options)); 
  return requestStream(options); 
}

requestStream(opt)
  .pluck('body')
  .map(checkBounderies)
  .flatten()
  .pluck('link')
  .pluck('url')
  .map(buildRepositoryUrl)
  //.tap(H.log)
  .flatMap(getRepositories)
  .pluck('body')
  .tap(H.log)
  .done(() => {});

