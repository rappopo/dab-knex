'use strict'

const chai = require('chai')
const chaiSubset = require('chai-subset')
const expect = chai.expect

chai.use(chaiSubset)

const Cls = require('../index')
const lib = require('./_lib')

let cls

describe('bulkUpdate', function () {
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
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.bulkUpdate(lib.docs, { collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
        done()
      })
  })

  it('should return error if body isn\'t an array', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.bulkUpdate('test', { collection: 'test' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Requires an array')
        done()
      })
  })

  it('should return the correct bulk status', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        let docs = lib._.cloneDeep(lib.docs)
        docs[0].name = 'Jackie Bauer'
        return cls.bulkUpdate(docs, { collection: 'test', withDetail: true })
      })
      .then(result => {
        expect(result).to.have.property('stat').that.have.property('ok').equal(2)
        expect(result).to.have.property('stat').that.have.property('fail').equal(1)
        expect(result).to.have.property('stat').that.have.property('total').equal(3)
        expect(result).to.have.property('detail').that.containSubset([{ id: 'jack-bauer', success: true }])
        expect(result).to.have.property('detail').that.containSubset([{ id: 'johnny-english', success: true }])
        done()
      })
  })
})
