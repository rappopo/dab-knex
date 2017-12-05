'use strict'

const fs = require('fs'),
  _ = require('lodash')

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
  dummyData: [
    { id: 'jack-bauer', name: 'Jack Bauer' },
    { id: 'james-bond', name: 'James Bond' }
  ],
  timeout: 5000,
  resetDb: function (callback) {
    const knex = require('knex')(this.options)
    knex.schema.createTableIfNotExists(this.options.table, table => {
      table.string('id').notNullable().primary()
      table.string('name').notNullable()
      table.string('gender')
    })
    .then(result => {
      return knex(this.options.table).del()
    })
    .then(result => {
      return knex(this.options.table).insert(this.dummyData)
    })
    .then(result => {
      callback()
    })
    .catch(err => {
      callback(err)
    }) 
  }
}