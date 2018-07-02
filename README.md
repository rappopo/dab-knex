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

* [x] [find](https://books.rappopo.com/dab/method/find/)
* [x] [findOne](https://books.rappopo.com/dab/method/find-one/)
* [x] [create](https://books.rappopo.com/dab/method/create/)
* [x] [update](https://books.rappopo.com/dab/method/update/)
* [x] [remove](https://books.rappopo.com/dab/method/remove/)
* [x] [bulkCreate](https://books.rappopo.com/dab/method/bulk-create/)
* [x] [bulkUpdate](https://books.rappopo.com/dab/method/bulk-update/)
* [x] [bulkRemove](https://books.rappopo.com/dab/method/bulk-remove/)
* [x] [copyFrom](https://books.rappopo.com/dab/method/copy-from/)
* [x] [copyTo](https://books.rappopo.com/dab/method/copy-to/)
* [x] [createCollection](https://books.rappopo.com/dab/method/create-collection/)
* [x] [renameCollection](https://books.rappopo.com/dab/method/rename-collection/)
* [x] [removeCollection](https://books.rappopo.com/dab/method/remove-collection/)

## Donation
* [![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/ardhilukianto)
* Bitcoin **16HVCkdaNMvw3YdBYGHbtt3K5bmpRmH74Y**

## License

[MIT](LICENSE.md)
