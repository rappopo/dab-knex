'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index')
const lib = require('./_lib')

let cls

describe('renameCollection', function () {
  afterEach(function (done) {
    if (!cls.client) return done()
    cls.client.destroy(function () {
      done()
    })
  })

  it('should return error if no collection provided', function () {
    cls = new Cls(lib.options)
    return expect(cls.renameCollection()).to.be.rejectedWith('Require old & new collection names')
  })

  it('should return error if collection doesn\'t exist', function () {
    cls = new Cls(lib.options)
    return expect(cls.renameCollection('test', 'default')).to.be.rejectedWith('Collection not found')
  })

  it('should return error if new collection exists', function (done) {
    cls = new Cls(lib.options)
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
    cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.bulkCreate(lib.docs, { collection: 'test' })
      })
      .then(result => {
        return cls.renameCollection('test', 'default')
      })
      .then(result => {
        expect(result).to.equal(true)
        done()
      })
  })

  it('should forced you to rename associated table', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaFull)
      .then(result => {
        return cls.renameCollection('full', 'newtest', { withSchema: true })
      })
      .then(result => {
        expect(result).to.equal(true)
        done()
      })
  })
})
