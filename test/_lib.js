'use strict'

const fs = require('fs')
const _ = require('lodash')
const uuid = require('uuid/v4')
const async = require('async')

module.exports = {
  _: _,
  options: {
    client: 'sqlite3',
    connection: {
      filename: '/tmp/test.sqlite3'
    },
    useNullAsDefault: true
  },
  schema: {
    name: 'test'
  },
  schemaFull: {
    name: 'full',
    attributes: {
      id: { type: 'string' },
      name: { type: 'string' },
      age: { type: 'integer' }
    }
  },
  schemaHidden: {
    name: 'hidden',
    attributes: {
      id: { type: 'string' },
      name: { type: 'string', hidden: true },
      age: { type: 'integer' }
    }
  },
  schemaMask: {
    name: 'mask',
    attributes: {
      id: { type: 'string', mask: '_id' },
      name: { type: 'string', mask: 'fullname' },
      age: { type: 'integer' }
    }
  },
  docs: [
    { id: 'jack-bauer', name: 'Jack Bauer' },
    { id: 'johnny-english', name: 'Johnny English' },
    { name: 'Jane Boo', age: 20 }
  ],
  timeout: 5000,
  resetDb: function (callback, fillIn = true) {
    let me = this
    try {
      fs.unlinkSync(me.options.connection.filename)
    } catch (e) {}
    async.mapSeries(['schema', 'schemaFull', 'schemaHidden', 'schemaMask'], function (s, callb) {
      let knex = require('knex')(me.options)
      knex.schema.hasTable(me[s].name).asCallback((err, exists) => {
        if (err) return callb(err)
        if (exists) return callb()
        knex.schema.createTable(me[s].name, table => {
          table.string('id').notNullable().primary()
          table.string('name').notNullable()
          table.string('gender')
          table.integer('age').nullable()
        }).asCallback(function (err) {
          if (err) return callb(err)
          knex(me[s].name).del().asCallback(function (err) {
            if (err) return callb(err)
            if (!fillIn) return callb(null, null)
            let docs = _.cloneDeep(me.docs)
            _.each(docs, function (d, i) {
              if (!d.id) docs[i].id = uuid()
            })
            knex(me[s].name).insert(docs).asCallback(callb)
            setTimeout(function () {
              // knex.destroy(function () {
              callb()
              // })
            }, 5000)
          })
        })
      })
    }, callback)
  }
}
