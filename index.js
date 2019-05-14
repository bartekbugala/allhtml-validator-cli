#!/usr/bin/env node
'use strict'

const path = require('path');
let noExitError;
let fileOrUrl = 'file';

const fs = require('fs');
const validator = require('html-validator');
const getHelpText = require('./lib/getHelpText');
const pkg = require('./package.json');
let query = process.argv[2];
let argv = require('minimist')((process.argv.slice(2)));
const options = {
  format: 'text',
  ignore: argv.ignore
}

let isError = item => item.type === 'error'
let pageNotFound = item => item.type === 'non-document-error'

// Codes for console colors
let colors = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}
// Codes for console background colors
let bgColors = {
  black: '\x1b[40m',
  red: '\x1b[41m',
  green: '\x1b[42m',
  yellow: '\x1b[43m',
  blue: '\x1b[44m',
  magenta: '\x1b[45m',
  cyan: '\x1b[46m',
  white: '\x1b[47m'
}

if (!query || process.argv.indexOf('-h') !== -1 || process.argv.indexOf('--help') !== -1) {
  console.log(getHelpText());
  process.exit(0);
}

if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--version') !== -1) {
  console.log(pkg.version);
  process.exit(0);
}

if (query.indexOf('http') !== -1) {
  options.url = argv._[0];
}

if (argv.format && !argv.ignore) {
  options.format = argv.format;
}

if (argv.url) {
  options.url = argv.url;
  fileOrUrl = 'url';
}

if (argv.validator) {
  options.validator = argv.validator;
}

if (argv.headers) {
  options.headers = JSON.parse(argv.headers);
}

if (argv.file) {
  options.data = fs.readFileSync(argv.file);
  if (isObjectEmpty(options.data)) {
    showEmptyFileMessage(argv.file);
    return;
  }
}

if (argv.data) {
  options.data = argv.data;
}

if (argv.noexiterr) {
  noExitError = 0;
}

// MODIFICATIONS by Bartek Bugała
if (argv.allfiles) {
  function validateMarkupOfAllFilesByExtension(directoryPath, extension, files, result) {

    files = files || fs.readdirSync(directoryPath);
    result = result || [];

    files.forEach(
      function (file) {
        let pathToFile = path.join(directoryPath, file);
        if (fs.statSync(pathToFile).isDirectory() && !pathToFile.includes('node_modules')) {
          result = validateMarkupOfAllFilesByExtension(pathToFile, extension, fs.readdirSync(pathToFile), result);

        }
        else {
          if (file.substr(-1 * (extension.length + 1)) == '.' + extension) {
            let pathSlash = pathToFile.replace(/\\/g, "/");
            options.data = fs.readFileSync(pathSlash);
            if (isObjectEmpty(options.data)) {
              showEmptyFileMessage(pathSlash);
              return;
            }
            runValidator(pathSlash, options);
          }
        }
      }
    )
    return;
  }
  validateMarkupOfAllFilesByExtension('./', 'html');
}
let currentFilePath = argv.url || argv.file;

if (!argv.allfiles) {
  runValidator(currentFilePath, options, fileOrUrl);
}

function isObjectEmpty(object) {
  if ((object.length == 0) || !Object.keys(object).length) {
    return true;
  }
  return false;
}

function showEmptyFileMessage(pathOfFile) {
  colorNodeLog(' ', 'white');
  colorNodeLog('---------', 'white');
  colorNodeLog('file: ' + pathOfFile + ' is empty!', 'red');
  colorNodeLog(' ', 'white');
  colorNodeLog('---------', 'white');
  return
}

function colorNodeLog(msg, color, bgColor) {
  color = color || 'white';
  bgColor = bgColor || 'black';
  let colorCodes = colors[color] + '%s' + bgColors[bgColor];
  console.log(colorCodes, msg);
}

function runValidator(CurrentFilePath, options, fileOrUrl = 'file') {

  if(typeof CurrentFilePath === Object) {
    CurrentFilePath = argv.file;
  }

  validator(options, (error, data) => {
    if (error) {
      console.error(error)
      process.exitCode = noExitError && 0 // CHANGE
    } else {
      let msg
      let validationFailed = false
      let documentNotFound = false

      if (options.format === 'json') {
        let errors = data.messages.filter(isError)
        let notFound = data.messages.filter(pageNotFound)
        msg = JSON.stringify(data, null, 2)
        if (errors.length > 0 || notFound.length > 0) {
          validationFailed = true
          documentNotFound = notFound.length > 0
          if (argv.quiet) {
            msg = JSON.stringify(errors, null, 2)
          }
        }
      } else if (options.ignore) {
        msg = data
        if (data.includes('Error')) {
          validationFailed = true
        }
        if (data.includes('non-document-error')) {
          documentNotFound = true
        }
      } else {
        msg = data
        if (data.includes('There were errors') || data.includes('non-document-error')) {
          validationFailed = true
          documentNotFound = data.includes('non-document-error')
        }
      }
      if (validationFailed) {
        if (!argv.verbose && !argv.quiet) {
          colorNodeLog(fileOrUrl +': ' + CurrentFilePath, 'yellow');
          colorNodeLog(documentNotFound ? 'Page not found' : 'Page is not valid', 'red');
          colorNodeLog('---------', 'white');
        }
        if (argv.verbose || argv.quiet) {
          colorNodeLog(fileOrUrl +': ' + CurrentFilePath, 'yellow');
          colorNodeLog(documentNotFound ? 'Page not found' : 'Page is not valid', 'red');
          colorNodeLog(msg, 'magenta');
          colorNodeLog('---------', 'white');;
        }
        process.exitCode = noExitError && 1 // CHANGE
      } else {
        if (!argv.verbose && !argv.quiet) {
          colorNodeLog(fileOrUrl +': ' + CurrentFilePath, 'yellow');
          colorNodeLog('Page is valid', 'green');
          colorNodeLog('---------', 'white');
        }
        if (argv.verbose) {
          colorNodeLog(fileOrUrl +': ' + CurrentFilePath, 'yellow');
          colorNodeLog(msg, 'green');
          colorNodeLog('---------', 'white');
        }
      }
    }
  })
}
