'use strict'

const chai = require('chai'),
  chaiAsPromised = require("chai-as-promised"),
  expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index'),
  lib = require('./_lib')

describe('removeCollection', function () {
  it('should return error if no collection provided', function () {
    const cls = new Cls(lib.options)
    return expect(cls.removeCollection()).to.be.rejectedWith('Requires collection name')
  })

  it('should return error if collection doesn\'t exist', function () {
    const cls = new Cls(lib.options)
    return expect(cls.removeCollection('test')).to.be.rejectedWith('Collection not found')
  })

  it('should return success', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.removeCollection('test')
      })
      .then(result => {
        expect(result).to.have.property('success', true)
        done()
      })
  })

})