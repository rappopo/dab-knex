'use strict'

const chai = require('chai'),
  chaiSubset = require('chai-subset'),  
  expect = chai.expect

chai.use(chaiSubset)

const Cls = require('../index'),
  lib = require('./_lib')

describe('copyTo', function () {
  beforeEach(function (done) {
    this.timeout(lib.timeout)
    lib.resetDb(function (err) {
      if (err) throw err
      done()
    })
  })

  it('should return error if collection doesn\'t exist', function (done) {
    const cls = new Cls(lib.options),
      dest = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return dest.createCollection({ name: 'test1' })
      })
      .then(result => {
        return cls.copyTo(dest, { collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
        done()
      })
  })

  it('should return all values correctly', function (done) {
    const cls = new Cls(lib.options),
      dest = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return dest.createCollection({ name: 'full' })
      })
      .then(result => {
        return dest.client('full').truncate()
      })
      .then(result => {
        return cls.copyTo(dest, { collectionSrc: 'test', collectionDest: 'full', withDetail: true })
      })
      .then(result => {
        expect(result.success).to.be.true,
        expect(result.stat).to.have.property('ok', 3)
        expect(result.stat).to.have.property('fail', 0)
        expect(result.stat).to.have.property('total', 3)
        done()
      })
  })

  it('should export all values to a file', function (done) {
    const cls = new Cls(lib.options)
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
        expect(result.success).to.be.true,
        expect(result.stat).to.have.property('ok', 5)
        expect(result.stat).to.have.property('fail', 0)
        expect(result.stat).to.have.property('total', 5)
        done()
      })
  })

  it('should export all values to a file with masks', function (done) {
    const cls = new Cls(lib.options)
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
        expect(result.success).to.be.true,
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