'use strict'

const fs = require('fs'),
  _ = require('lodash'),
  async = require('async')

module.exports = {
  _: _,
  options: {
    client: 'sqlite3',
    connection: {
      filename: '/tmp/test.sqlite3'
    },
    table: 'test',
    useNullAsDefault: true
  },
  options1: {
    client: 'sqlite3',
    connection: {
      filename: '/tmp/test1.sqlite3'
    },
    table: 'test',
    useNullAsDefault: true
  },
  dummyData: [
    { id: 'jack-bauer', name: 'Jack Bauer' },
    { id: 'james-bond', name: 'James Bond' }
  ],
  bulkDocs: [
    { id: 'jack-bauer', name: 'Jack Bauer' },
    { id: 'johnny-english', name: 'Johnny English' },
    { name: 'Jane Boo' }
  ],
  timeout: 5000,
  resetDb: function (callback) {
    let me = this
    async.mapSeries(['options', 'options1'], function(o, callb) {
      let knex = require('knex')(me[o])
      knex.schema.createTableIfNotExists(me[o].table, table => {
        table.string('id').notNullable().primary()
        table.string('name').notNullable()
        table.string('gender')
      }).asCallback(function(err) {
        knex(me[o].table).del().asCallback(function(err) {
          knex(me[o].table).insert(me.dummyData).asCallback(callb)
        })
      })
    }, callback)
  }
}