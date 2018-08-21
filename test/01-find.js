'use strict'

const chai = require('chai')
const chaiSubset = require('chai-subset')
const expect = chai.expect

chai.use(chaiSubset)

const Cls = require('../index')
const lib = require('./_lib')

let cls

describe('find', function () {
  before(function (done) {
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
    cls = new Cls()
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
        done()
      })
  })

  it('should return empty value', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'test', query: { id: 'no-agent' } })
      })
      .then(result => {
        expect(result.data).to.be.a('array').and.have.length(0)
        done()
      })
  })

  it('should return all values', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'test' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        expect(result.data).to.be.a('array').and.containSubset(lib.docs)
        done()
      })
  })

  it('should return filtered values', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'test', query: { id: 'jack-bauer' } })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(1)
        expect(result.data).to.be.a('array').and.containSubset([lib.docs[0]])
        done()
      })
  })

  it('should return 2nd page', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'test', limit: 1, page: 2 })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        expect(result.data).to.be.a('array').that.have.length(1).and.containSubset([lib.docs[1]])
        done()
      })
  })

  it('should sort in descending order', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.find({ collection: 'test', sort: [{ name: 'desc' }] })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        let keys = lib._.map(result.data, 'name')
        expect(keys).to.eql(['Johnny English', 'Jane Boo', 'Jack Bauer'])
        done()
      })
  })

  it('should return enforced values according to its definitions', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaFull)
      .then(result => {
        return cls.find({ collection: 'full' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        expect(result.data[0]).to.eql({ id: 'jack-bauer', name: 'Jack Bauer', age: null })
        expect(result.data[1]).to.eql({ id: 'johnny-english', name: 'Johnny English', age: null })
        expect(result.data[2]).to.include({ name: 'Jane Boo', age: 20 })
        done()
      })
  })

  it('should return enforced values with hidden columns', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaHidden)
      .then(result => {
        return cls.find({ collection: 'hidden' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        expect(result.data[0]).to.eql({ id: 'jack-bauer', age: null })
        expect(result.data[1]).to.eql({ id: 'johnny-english', age: null })
        expect(result.data[2]).to.include({ age: 20 })
        done()
      })
  })

  it('should return enforced values with masks', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaMask)
      .then(result => {
        return cls.find({ collection: 'mask' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.total).to.equal(3)
        expect(result.data[0]).to.eql({ _id: 'jack-bauer', fullname: 'Jack Bauer', age: null })
        expect(result.data[1]).to.eql({ _id: 'johnny-english', fullname: 'Johnny English', age: null })
        expect(result.data[2]).to.include({ fullname: 'Jane Boo', age: 20 })
        done()
      })
  })
})
