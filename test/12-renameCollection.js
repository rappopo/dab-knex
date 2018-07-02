'use strict'

const chai = require('chai'),
  chaiAsPromised = require("chai-as-promised"),
  expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index'),
  lib = require('./_lib')

describe('renameCollection', function () {
  it('should return error if no collection provided', function () {
    const cls = new Cls(lib.options)
    return expect(cls.renameCollection()).to.be.rejectedWith('Require old & new collection names')
  })

  it('should return error if collection doesn\'t exist', function () {
    const cls = new Cls(lib.options)
    return expect(cls.renameCollection('test', 'default' )).to.be.rejectedWith('Collection not found')
  })

  it('should return error if new collection exists', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.renameCollection('test', 'test')
      })
      .catch(err => {
        expect(err).to.be.a('error').that.have.property('message', 'New collection already exists')
        done()
      })
  })

  it('should return success', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.bulkCreate(lib.docs, { collection: 'test' })
      })
      .then(result => {
        return cls.renameCollection('test', 'default')
      })
      .then(result => {
        expect(result).to.be.true
        done()
      })
  })

  it('should forced you to rename associated table', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schemaFull)
      .then(result => {
        return cls.renameCollection('full', 'newtest', { withSchema: true })
      })
      .then(result => {

        expect(result).to.be.true
        done()
      })
  })


})