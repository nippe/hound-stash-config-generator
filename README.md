# Hound Stash Config Generator

Have a [Atlassian Stash](https://www.atlassian.com/software/bitbucket/server) server at work and think the search ain't that awesome? Heard of [Etsy's Hound](https://github.com/etsy/hound) project?

This tool connects to the Stash/Bitbucket Servers REST api and extracts projects and repositories and dumps the info down in a hound config.json file.

## Installation
`git clone git@github.com:nippe/hound-stash-config-generator.git`

## Usage
`node hound-stash-config-generator --help`

```
  Usage: hound-stash-config-generator [options]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -h, --host <path>              The Stash path
    -u, --user <username>          Stash user
    -p, --password <password>      Stash user's password
    -o, --outputfile <outputfile>  Stash user's outputfile
```

When it's done move the config file to your etsy/hound server/container and run it.

## TODO
 - [] Make npm install --global work
