'use strict'

const chai = require('chai')
const chaiSubset = require('chai-subset')
const expect = chai.expect

chai.use(chaiSubset)

const Cls = require('../index')
const lib = require('./_lib')

let cls

describe('copyTo', function () {
  beforeEach(function (done) {
    this.timeout(lib.timeout)
    lib.resetDb(function (err) {
      if (err) throw err
      done()
    })
  })

  afterEach(function (done) {
    cls.client.destroy(function () {
      done()
    })
  })

  it('should return error if collection doesn\'t exist', function (done) {
    cls = new Cls(lib.options)
    const dest = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return dest.createCollection({ name: 'test1' })
      })
      .then(result => {
        return cls.copyTo(dest, { collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
      })
      .then(() => {
        return dest.client.destroy()
      })
      .then(() => {
        done()
      })
  })

  it('should return all values correctly', function (done) {
    cls = new Cls(lib.options)
    const dest = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return dest.createCollection({ name: 'full' })
      })
      .then(result => {
        return dest.client('full').truncate()
      })
      .then(result => {
        return cls.copyTo(dest, { collection: 'test', destCollection: 'full', withDetail: true })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.stat).to.have.property('ok', 3)
        expect(result.stat).to.have.property('fail', 0)
        expect(result.stat).to.have.property('total', 3)
      })
      .then(() => {
        return dest.client.destroy()
      })
      .then(() => {
        done()
      })
  })

  it('should export all values to a file', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.client('test').truncate()
      })
      .then(result => {
        return cls.bulkCreate(require('./_inOut.json'), { collection: 'test' })
      })
      .then(result => {
        return cls.copyTo('/tmp/dab-copy-to.json', { collection: 'test', withDetail: true })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.stat).to.have.property('ok', 5)
        expect(result.stat).to.have.property('fail', 0)
        expect(result.stat).to.have.property('total', 5)
        done()
      })
  })

  it('should export all values to a file with masks', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaMask)
      .then(result => {
        return cls.client('mask').truncate()
      })
      .then(result => {
        return cls.bulkCreate(require('./_inOutMask.json'), { collection: 'mask' })
      })
      .then(result => {
        return cls.copyTo('/tmp/dab-copy-to.json', { collection: 'mask', withDetail: true })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.stat).to.have.property('ok', 5)
        expect(result.stat).to.have.property('fail', 0)
        expect(result.stat).to.have.property('total', 5)
        let io = require('/tmp/dab-copy-to.json')
        let keys = lib._.map(io, '_id')
        expect(keys).to.eql(['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'])
        done()
      })
  })
})
