'use strict'

const chai = require('chai')
const expect = chai.expect
const chaiSubset = require('chai-subset')

chai.use(chaiSubset)

const Cls = require('../index')
let cls

describe('setOptions', function () {
  it('should return the default options', function () {
    cls = new Cls()
    expect(cls.options).to.include({
      client: 'sqlite3',
      limit: 25
    })

    expect(cls.options.connection).to.include({
      filename: '/tmp/default.sqlite3'
    })
  })

  it('should return options with custom client type', function () {
    cls = new Cls({
      client: 'mysql'
    })
    expect(cls.options).to.include({
      client: 'mysql'
    })
  })

  it('should return options with custom connection', function () {
    cls = new Cls({
      client: 'mysql',
      connection: {
        host: 'localhost'
      }
    })
    expect(cls.options).to.include({
      client: 'mysql'
    })
    expect(cls.options.connection).to.include({
      host: 'localhost'
    })
  })
})
