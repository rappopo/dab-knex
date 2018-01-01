'use strict'

const chai = require('chai'),
  expect = chai.expect

const Cls = require('../index'),
  lib = require('./_lib'),
  body = {
    name: 'Johnny English MI-7',
    gender: 'M'
  },
  altBody = {
    gender: 'M'
  }

describe('update', function () {
  beforeEach(function (done) {
    this.timeout(lib.timeout)
    lib.resetDb(function (err) {
      if (err) throw err
      done()
    })
  })

  it('should return error if collection doesn\'t exist', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.update('no-agent', body, { collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
        done()
      })
  })

  it('should return error if doc doesn\'t exist', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.update('no-agent', body, { collection: 'test' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Document not found')
        done()
      })
  })

  it('should return updated value', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.update('jack-bauer', body, { collection: 'test' })
      })
      .then(result => {
        expect(result.success).to.be.true
        expect(result.data).to.have.property('name', body.name)
        expect(result.data).to.have.property('gender', 'M')
        done()
      })
  })

  it('should return updated value and value before updated', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.update('jack-bauer', altBody, { collection: 'test', withSource: true })
      })
      .then(result => {
        expect(result.success).to.be.true
        expect(result.data).to.have.property('gender', 'M')
        expect(result).to.have.property('source').that.include(lib.docs[0])
        done()
      })
  })

  it('should return enforced values according to its definitions', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schemaFull)
      .then(result => {
        return cls.update('johnny-english', body, { collection: 'full' })
      })
      .then(result => {
        expect(result.success).to.be.true
        expect(result.data).to.have.property('id', 'johnny-english')
        expect(result.data).to.have.property('name', 'Johnny English MI-7')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })

  it('should return enforced values with hidden columns', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schemaHidden)
      .then(result => {
        return cls.update('johnny-english', body, { collection: 'hidden' })
      })
      .then(result => {
        expect(result.success).to.be.true
        expect(result.data).to.have.property('id', 'johnny-english')
        expect(result.data).to.not.have.property('name')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })

  it('should return enforced values with masks', function (done) {
    const cls = new Cls(lib.options)
    cls.createCollection(lib.schemaMask)
      .then(result => {
        return cls.update('johnny-english', { fullname: 'Johnny English MI-7', gender: 'M' }, { collection: 'mask' })
      })
      .then(result => {
        expect(result.success).to.be.true
        expect(result.data).to.have.property('_id', 'johnny-english')
        expect(result.data).to.have.property('fullname', 'Johnny English MI-7')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })

})
