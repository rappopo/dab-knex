# @rappopo/dab-knex

A [Rappopo DAB](https://github.com/rappopo/dab) implementation for [Knex](http://knexjs.org/)

## Installation

Simply invoke this command in your project folder:

```
$ npm install --save @rappopo/dab-knex
```

Don't forget to also install the needed client library, e.g (if you choose to use sqlite3):

```
$ npm install sqlite3
```

And within your script:

```javascript
const DabKnex = require('@rappopo/dab-knex')
const dab = new DabKnex({
  client: 'sqlite3',
  connection: {
    filename: '/tmp/mydb.sqlite3'
  }
})

// prepare collections
dab.createCollection({ name: 'test' })
  .then(result => {
    return dab.bulkCreate(data, { collection: 'test' })
  })
...
// lets dab!
dab.findOne('my-doc', 'test').then(function(doc) { ... })
```

## Options

`client`: your Knex's client database library

`connection`: your Knex's connection settings

## Features

* [x] [find](https://docs.rappopo.com/dab/method/find/)
* [x] [findOne](https://docs.rappopo.com/dab/method/find-one/)
* [x] [create](https://docs.rappopo.com/dab/method/create/)
* [x] [update](https://docs.rappopo.com/dab/method/update/)
* [x] [remove](https://docs.rappopo.com/dab/method/remove/)
* [x] [bulkCreate](https://docs.rappopo.com/dab/method/bulk-create/)
* [x] [bulkUpdate](https://docs.rappopo.com/dab/method/bulk-update/)
* [x] [bulkRemove](https://docs.rappopo.com/dab/method/bulk-remove/)
* [x] [copyFrom](https://docs.rappopo.com/dab/method/copy-from/)
* [x] [copyTo](https://docs.rappopo.com/dab/method/copy-to/)
* [x] [createCollection](https://docs.rappopo.com/dab/method/create-collection/)
* [x] [renameCollection](https://docs.rappopo.com/dab/method/rename-collection/)
* [x] [removeCollection](https://docs.rappopo.com/dab/method/remove-collection/)

## Misc

* [ChangeLog](CHANGELOG.md)
* Donation: Bitcoin **16HVCkdaNMvw3YdBYGHbtt3K5bmpRmH74Y**

## License

(The MIT License)

Copyright © 2017 Ardhi Lukianto <ardhi@lukianto.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.