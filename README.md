# allhtml-validator-cli
(MODIFICATION OF THE ORIGINAL html-validator-cli from Geir Gåsodden)
Keeps the original functionality + adds new features

## ADDED - allfiles option
Checks all *.html files in all subfolders except node_modules folder

```
--allfiles (works with --verbose)
```
## Descritpion
CLI for validating html using [validator.w3.org/nu](http://validator.w3.org/nu/)
With new local file validatrion features

Sends ```Page is valid```to ```STDOUT``` and exits with code 0 if page is valid.

Sends ```Page is not valid``` to ```STDOUT``` and exits with code 1 if page is not valid.

Sends ```Page not found``` to ```STDOUT``` and exits with code 1 if page is not found.


## Installation

```
Add dependency to package.json

 "devDependencies": {
    "allhtml-validator-cli": "git+https://github.com/bartekbugala/allhtml-validator-cli"
 }

```

## Usage

### Quick Start:
Add this to package.json:
```
"test:all": "html-validator --allfiles --verbose"
```
Then: for auto-task - REQUIRES ONCHANGE [npm - onchange](https://www.npmjs.com/package/onchange)
```
"watch:validate": "onchange *.html -- npm run test:all"
```
Manual:
```
$ html-validator --allfiles --verbose
```
### More options:
```
$ html-validator <url>
```

With file

```
$ html-validator --file=<path-to-file>
```

With allfiles
 (Validate all *.html files in parent directory and subdirectories except node_modules directory)

```
$ html-validator --allfiles
````

With noexiterr
 (Disable some exit error message for npm scripts)

```
$ html-validator --noexiterr
```


With data

```
$ html-validator --data=data
```

Optional pass in format for returned data.

Valid options: json, html, xhtml, xml, gnu and text (default).

```
$ html-validator <url> --format=gnu
```

Optional pass in another validator.

It needs to expose the same REST interface.

```
$ html-validator <url> --validator='http://html5.validator.nu'
```

Optional pass in strings to ignore

```
$ html-validator <url> --ignore='Error: Stray end tag “div”.' --ignore='Error: Stray end tag “body”.'
```
Optional pass in headers

```
$ html-validator <url> --headers='{"foo":"doo"}'
```

To get full result from validator use --verbose

```
$ html-validator <url> --verbose
```

Optional, only get errors use --quiet

```
$ html-validator <url> --quiet
```

returns array of error messages

```JavaScript
[
  {
    "type": "error",
    "lastLine": 8,
    "lastColumn": 32,
    "firstColumn": 27,
    "message": "Stray end tag “div”.",
    "extract": "aaaad code</div></p>\n<",
    "hiliteStart": 10,
    "hiliteLength": 6
  }
]
```

## Removing

To remove just delete the dependency entry from package.json:
```
DELETE--> "allhtml-validator-cli": "git+https://github.com/bartekbugala/allhtml-validator-cli"
```
Run ``` $ npm install ``` refresh node_modules folder if needed.

## Related

- [html-validator](https://github.com/zrrrzzt/html-validator) API for this module
- [html-validator-cli](https://github.com/zrrrzzt/html-validator-cli) Original CLI !

## License

[MIT](LICENSE)
