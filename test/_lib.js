'use strict'

const fs = require('fs'),
  _ = require('lodash'),
  uuid = require('uuid/v4'),
  async = require('async')

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
    fields: [
      { id: 'id', type: 'string' },
      { id: 'name', type: 'string' },
      { id: 'age', type: 'integer' }
    ]
  },
  schemaHidden: {
    name: 'hidden',
    fields: [
      { id: 'id', type: 'string' },
      { id: 'name', type: 'string', hidden: true },
      { id: 'age', type: 'integer' }
    ]
  },
  schemaMask: {
    name: 'mask',
    fields: [
      { id: 'id', type: 'string', mask: '_id' },
      { id: 'name', type: 'string', mask: 'fullname' },
      { id: 'age', type: 'integer' }
    ]
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
    } catch(e) {}
    async.mapSeries(['schema', 'schemaFull', 'schemaHidden', 'schemaMask'], function(s, callb) {
      let knex = require('knex')(me.options)
      knex.schema.createTableIfNotExists(me[s].name, table => {
        table.string('id').notNullable().primary()
        table.string('name').notNullable()
        table.string('gender')
        table.integer('age').nullable()
      }).asCallback(function(err) {
        knex(me[s].name).del().asCallback(function(err) {
          if (!fillIn) return callb(null, null)
          let docs = _.cloneDeep(me.docs)
          _.each(docs, function(d, i) {
            if (!d.id) docs[i].id = uuid()
          })
          knex(me[s].name).insert(docs).asCallback(callb)
        })
      })
    }, callback)
  }
}