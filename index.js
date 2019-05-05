#!/usr/bin/env node
'use strict'

const path = require('path');

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

if (!query || process.argv.indexOf('-h') !== -1 || process.argv.indexOf('--help') !== -1) {
  console.log(getHelpText())
  process.exit(0)
}

if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--version') !== -1) {
  console.log(pkg.version)
  process.exit(0)
}

if (query.indexOf('http') !== -1) {
  options.url = argv._[0]
}

if (argv.format && !argv.ignore) {
  options.format = argv.format
}

if (argv.url) {
  options.url = argv.url
}

if (argv.validator) {
  options.validator = argv.validator
}

if (argv.headers) {
  options.headers = JSON.parse(argv.headers)
}

if (argv.file) {
  options.data = fs.readFileSync(argv.file)
}

if (argv.data) {
  options.data = argv.data
}

// MODIFICATIONS by Bartek Bugała
if (argv.allfiles) {
  function findAllFilesByExtension(directoryPath, extension, files, result) {

    files = files || fs.readdirSync(directoryPath)
    result = result || []

    files.forEach(
      function (file) {
        let pathToFile = path.join(directoryPath, file)
        if (fs.statSync(pathToFile).isDirectory() && !pathToFile.includes('node_modules')) {
          result = findAllFilesByExtension(pathToFile, extension, fs.readdirSync(pathToFile), result);

        }
        else {
          if (file.substr(-1 * (extension.length + 1)) == '.' + extension) {
            let pathBackslash = pathToFile;
            let pathSlash = pathBackslash.replace(/\\/g, "/");
            options.data = fs.readFileSync(pathSlash);
            runValidator(pathSlash);


          }
        }
      }
    )
    return;
  }

  findAllFilesByExtension('./', 'html');
}

if (!argv.allfiles) {
  runValidator(options);
}

function colorNodeLog(msg, color = 'white', bgColor) {

  switch (color) {
    case 'black':
    color = '\x1b[30m';
      break;
    case 'red':
    color = '\x1b[31m';
      break;
    case 'green':
    color = '\x1b[32m';
      break;
    case 'yellow':
    color = '\x1b[33m';
      break;
    case 'blue':
    color = '\x1b[34m';
      break;
    case 'magenta':
    color = '\x1b[35m';
      break;
    case 'cyan':
    color = '\x1b[36m';
      break;
    case 'white':
    color = '\x1b[37m';
      break;
    default:
    color = '\x1b[37m';
      break;
  }
  let colorCodes = color;
  if (typeof bgColor !== 'undefined') {
    switch (bgColor) {
      case 'black':
        bgColor = '\x1b[40m';
        break;
      case 'red':
        bgColor = '\x1b[41m';
        break;
      case 'green':
        bgColor = '\x1b[42m';
        break;
      case 'yellow':
        bgColor = '\x1b[43m';
        break;
      case 'blue':
        bgColor = '\x1b[44m';
        break;
      case 'magenta':
        bgColor = '\x1b[45m';
        break;
      case 'cyan':
        bgColor = '\x1b[46m';
        break;
      case 'white':
        bgColor = '\x1b[47m';
        break;
      default:
        bgColor = '\x1b[40m';
        break;
    }
    colorCodes = color + '%s' + bgColor;
  }

  console.log(colorCodes, msg);
}

function runValidator(CurrentFilePath) {

  validator(options, (error, data) => {
    if (error) {
      console.error(error)
      process.exitCode = 1
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
          colorNodeLog('File: ' + CurrentFilePath, 'yellow');
          colorNodeLog(documentNotFound ? 'Page not found' : 'Page is not valid', 'red');
        }
        if (argv.verbose || argv.quiet) {
          colorNodeLog('File: ' + CurrentFilePath, 'yellow');
          colorNodeLog(documentNotFound ? 'Page not found' : 'Page is not valid', 'red');
          colorNodeLog(msg, 'magenta');
        }
        process.exitCode = 1
      } else {
        if (!argv.verbose && !argv.quiet) {
          colorNodeLog('File: ' + CurrentFilePath, 'yellow');
          colorNodeLog('Page is valid','green');
        }
        if (argv.verbose) {
          colorNodeLog('File: ' + CurrentFilePath, 'yellow');
          colorNodeLog(msg, 'green');
        }
      }
    }
  })
}