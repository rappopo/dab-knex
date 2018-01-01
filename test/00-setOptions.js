'use strict'

const chai = require('chai'),
  expect = chai.expect,
  chaiSubset = require('chai-subset')

chai.use(chaiSubset)

const Cls = require('../index'),
  lib = require('./_lib')

describe('setOptions', function () {
  it('should return the default options', function () {
    const cls = new Cls()
    expect(cls.options).to.include({
      client: 'sqlite3',
      limit: 25
    })

    expect(cls.options.connection).to.include({
      filename: '/tmp/default.sqlite3'
    })
  })

  it('should return options with custom client type', function () {
    const cls = new Cls({ 
      client: 'mysql',
    })
    expect(cls.options).to.include({
      client: 'mysql',
    })
  })

  it('should return options with custom connection', function () {
    const cls = new Cls({ 
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


