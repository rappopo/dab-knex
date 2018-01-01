'use strict'

const chai = require('chai'),
  chaiAsPromised = require("chai-as-promised"),
  expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index'),
  lib = require('./_lib')

describe('createCollection', function () {
  it('should return error if no collection provided', function () {
    const cls = new Cls(lib.options)
    return expect(cls.createCollection({ test: 'blah' })).to.be.rejectedWith('Requires a name')
  })

  it('should return error if collection exists', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.createCollection({ name: 'test' })
      })
      .catch(err => {
        expect(err).to.be.a('error').that.have.property('message', 'Collection already exists')
        done()
      })
  })

  it('should return success', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        expect(result).to.have.property('success', true)
        done()
      })
  })

})